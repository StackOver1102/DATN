// drive/google-drive.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';

// Chuyển đổi các hàm callback của fs thành Promise
const writeFileAsync = util.promisify(fs.writeFile);
const mkdirAsync = util.promisify(fs.mkdir);

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
}

export interface TreeNode {
  title: string;
  value: string;
  children?: TreeNode[];
  isLeaf?: boolean;
}

export interface FolderInfo {
  stt: number | null;
  title: string | null;
  rar: {
    id: string;
    name: string;
    size_mb: number;
  } | null;
  image: {
    id: string;
    name: string;
    url: string;
  } | null;
}

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'service-account.json',
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async listFolders(parentId: string): Promise<DriveFile[]> {
    const res = await this.drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    return (res.data.files || []) as DriveFile[];
  }

  async listFiles(folderId: string, namePrefix?: string): Promise<DriveFile[]> {
    const allFiles: DriveFile[] = [];
    let pageToken: string | undefined = undefined;

    // Xây dựng query
    const q = namePrefix
      ? `'${folderId}' in parents and trashed = false and name contains '${namePrefix}'`
      : `'${folderId}' in parents and trashed = false`;

    do {
      const res = await this.drive.files.list({
        q,
        fields: 'nextPageToken, files(id, name, mimeType, size)',
        pageSize: 1000,
        pageToken,
      });

      const response = res.data as {
        files?: DriveFile[];
        nextPageToken?: string;
      };

      const files = response.files || [];

      if (namePrefix) {
        const filtered = files.filter((file) => {
          const fileName = file.name.toLowerCase();
          return (
            fileName.startsWith(namePrefix.toLowerCase()) &&
            (fileName.endsWith('.jpg') ||
              fileName.endsWith('.jpeg') ||
              fileName.endsWith('.png') ||
              fileName.endsWith('.rar'))
          );
        });
        allFiles.push(...filtered);
      } else {
        allFiles.push(...files);
      }

      pageToken = response.nextPageToken;
    } while (pageToken);

    return allFiles;
  }

  async buildTree(rootId: string): Promise<TreeNode[]> {
    const categories = await this.listFolders(rootId);

    const tree = await Promise.all(
      categories.map(async (cat) => {
        const subCats = await this.listFolders(cat.id);
        const subTree = await Promise.all(
          subCats.map(async (sub) => {
            const folders = await this.listFolders(sub.id);
            return {
              title: sub.name,
              value: sub.id,
              children: folders.map((f) => ({
                title: f.name,
                value: f.id,
                isLeaf: true,
              })),
            };
          }),
        );
        return {
          title: cat.name,
          value: cat.id,
          children: subTree,
        };
      }),
    );

    return tree;
  }

  async getFolderInfo(folderId: string, name?: string): Promise<FolderInfo> {
    const files = await this.listFiles(folderId, name);
    const result: FolderInfo = {
      stt: null,
      title: null,
      rar: null,
      image: null,
    };

    const folderName = files[0]?.name;
    const nameMatch = folderName?.match(/^(\d+)\.\s*(.+)/);
    if (nameMatch) {
      result.stt = parseInt(nameMatch[1]);
      result.title = nameMatch[2];
    }

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (ext === '.rar') {
        result.rar = {
          id: file.id,
          name: file.name,
          size_mb: file.size ? +(+file.size / 1024 / 1024).toFixed(2) : 0,
        };
      } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        result.image = {
          id: file.id,
          name: file.name,
          url: `https://drive.google.com/uc?id=${file.id}`,
        };
      }
    }

    return result;
  }

  async addDrivePermission(fileId: string, email: string) {
    await this.drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role: 'reader',
        emailAddress: email,
      },
      sendNotificationEmail: true,
    });
  }

  async removeDrivePermission(fileId: string, email: string) {
    try {
      // First, list permissions to find the permission ID for the email
      const response = await this.drive.permissions.list({
        fileId,
        fields: 'permissions(id,emailAddress)',
      });
      const permissions = response.data.permissions || [];
      const permission = permissions.find((p) => p.emailAddress === email);
      if (permission && permission.id) {
        // Delete the permission using its ID
        await this.drive.permissions.delete({
          fileId,
          permissionId: permission.id,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing drive permission:', error);
      return false;
    }
  }

  getIdByUrl(url: string): string {
    // Extract ID from URL like https://drive.google.com/uc?id=1RaRoIhSHk4JJgZ2m_rAx8QesKTPSZkEx
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has('id')) {
        const id = urlObj.searchParams.get('id');
        if (id) return id;
      }

      // Handle other URL formats like /file/d/ID/view
      const pathParts = urlObj.pathname.split('/');
      const idIndex = pathParts.indexOf('d');
      if (idIndex !== -1 && idIndex + 1 < pathParts.length) {
        return pathParts[idIndex + 1];
      }

      throw new Error('Could not extract ID from URL');
    } catch {
      throw new Error(`Invalid Google Drive URL: ${url}`);
    }
  }

  getImageUrl(fileId: string, name: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=view&name=${name}`;
  }

  /**
   * Đảm bảo thư mục tồn tại, nếu không thì tạo mới
   * @param dirPath Đường dẫn thư mục cần kiểm tra/tạo
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      // Thư mục không tồn tại, tạo mới
      await mkdirAsync(dirPath, { recursive: true });
    }
  }

  /**
   * Kiểm tra xem file đã có quyền public chưa
   * @param fileId ID của file cần kiểm tra
   * @returns true nếu file đã có quyền public, false nếu chưa
   */
  async hasPublicPermission(fileId: string): Promise<boolean> {
    try {
      const response = await this.drive.permissions.list({
        fileId,
        fields: 'permissions(id,type,role)',
      });

      const permissions = response.data.permissions || [];
      return permissions.some(
        (p) => p.type === 'anyone' && p.role === 'reader',
      );
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền truy cập:', error);
      return false;
    }
  }

  /**
   * Thêm quyền truy cập public cho file nếu chưa có
   * @param fileId ID của file cần thêm quyền
   */
  async makeFilePublic(fileId: string): Promise<void> {
    try {
      // Kiểm tra xem file đã có quyền public chưa
      const isPublic = await this.hasPublicPermission(fileId);
      if (isPublic) {
        console.log(`File ${fileId} đã có quyền public.`);
        return;
      }

      // Thêm quyền truy cập public cho file
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        fields: 'id',
      });

      console.log(`Đã thêm quyền public cho file ${fileId}`);
    } catch (error) {
      console.error('Lỗi khi thêm quyền public:', error);
      throw new Error(
        `Không thể thêm quyền public: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Tìm kiếm file theo tên, tải về thư mục local và trả về đường dẫn
   * @param searchTerm Từ khóa tìm kiếm
   * @param folderId ID của thư mục cần tìm kiếm
   * @param localDir Thư mục local để lưu file (mặc định là 'uploads/images')
   * @returns Thông tin về file đã tìm thấy và đường dẫn local
   */
  async searchImageByName(
    searchTerm: string,
    folderId: string,
    localDir: string = 'uploads/images',
  ): Promise<{ url: string; localPath: string; name: string; id: string }> {
    // Tìm kiếm file theo tên
    const files = await this.listFiles(folderId, searchTerm);

    // Lọc ra các file hình ảnh
    const imageFiles = files.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
      );
    });

    if (imageFiles.length === 0) {
      throw new Error(
        `Không tìm thấy file hình ảnh nào với từ khóa: ${searchTerm}`,
      );
    }

    // Lấy file đầu tiên tìm thấy
    const imageFile = imageFiles[0];

    try {
      // Thêm quyền truy cập public cho file
      await this.makeFilePublic(imageFile.id);

      // Tạo URL trực tiếp từ Google Drive
      const url = this.getImageUrl(imageFile.id, imageFile.name);

      // Tạo tên file duy nhất để tránh trùng lặp
      const fileExtension = path.extname(imageFile.name);
      const fileName = `${uuidv4()}${fileExtension}`;

      // Đảm bảo thư mục tồn tại
      const fullDirPath = path.resolve(process.cwd(), localDir);
      await this.ensureDirectoryExists(fullDirPath);

      // Đường dẫn đầy đủ đến file
      const localFilePath = path.join(fullDirPath, fileName);

      // Tải file từ Google Drive
      const response = await this.drive.files.get(
        { fileId: imageFile.id, alt: 'media' },
        { responseType: 'arraybuffer' },
      );

      // Lưu file vào thư mục local
      await writeFileAsync(
        localFilePath,
        Buffer.from(response.data as ArrayBuffer),
      );

      // Tạo đường dẫn tương đối để trả về
      const relativePath = path.join(localDir, fileName);

      console.log(`Đã tải file ${imageFile.name} về ${localFilePath}`);

      return {
        url, // URL Google Drive (vẫn giữ để tương thích ngược)
        localPath: relativePath.replace(/\\/g, '/'), // Đường dẫn local (thêm mới)
        name: imageFile.name,
        id: imageFile.id,
      };
    } catch (error) {
      console.error('Lỗi khi tìm kiếm file hoặc tải về local:', error);
      throw new HttpException(
        `Không thể tìm kiếm file hoặc tải về local: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
