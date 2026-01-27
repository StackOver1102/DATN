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
    // Khởi tạo Google Auth và Drive Client với Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: 'service-account.json', // Đường dẫn đến file credential
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Lấy danh sách thư mục con trong một thư mục cha.
   * @param parentId ID của thư mục cha.
   */
  async listFolders(parentId: string): Promise<DriveFile[]> {
    const res = await this.drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`, // Query lọc folder và không nằm trong thùng rác
      fields: 'files(id, name)',
    });
    return (res.data.files || []) as DriveFile[];
  }

  /**
   * Lấy danh sách file trong một thư mục.
   * - Hỗ trợ phân trang để lấy tất cả file.
   * - Có thể lọc theo tiền tố tên file (namePrefix).
   * - Chỉ lấy các định dạng ảnh, rar, zip nếu có namePrefix.
   */
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
        pageSize: 1000, // Lấy tối đa 1000 file mỗi trang
        pageToken,
      });

      const response = res.data as {
        files?: DriveFile[];
        nextPageToken?: string;
      };

      const files = response.files || [];

      if (namePrefix) {
        // Filter thủ công thêm để đảm bảo chính xác các extension mong muốn
        const filtered = files.filter((file) => {
          const fileName = file.name.toLowerCase();
          return (
            fileName.startsWith(namePrefix.toLowerCase()) &&
            (fileName.endsWith('.jpg') ||
              fileName.endsWith('.jpeg') ||
              fileName.endsWith('.png') ||
              fileName.endsWith('.rar') ||
              fileName.endsWith('.zip'))
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

  /**
   * Xây dựng cấu trúc cây thư mục (Recursive).
   * - Dùng để hiển thị danh sách Categories/Subcategories từ Drive lên Frontend.
   * - Cấu trúc: Category -> SubCategories -> Folders (Leaf).
   */
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

  /**
   * Lấy thông tin chi tiết của một thư mục (Folder chứa sản phẩm).
   * - Phân tích tên thư mục để lấy STT và Title (Ví dụ: "1. Tên Sản Phẩm").
   * - Tìm file RAR/ZIP (file model).
   * - Tìm file ảnh (ảnh thumbnail).
   */
  async getFolderInfo(folderId: string, name?: string): Promise<FolderInfo> {
    const files = await this.listFiles(folderId, name);
    console.debug(files);
    const result: FolderInfo = {
      stt: null,
      title: null,
      rar: null,
      image: null,
    };

    // Parse tên thư mục (Nếu name được truyền vào) để lấy số thứ tự
    const folderName = files[0]?.name;
    const nameMatch = folderName?.match(/^(\d+)\.\s*(.+)/);
    if (nameMatch) {
      result.stt = parseInt(nameMatch[1]);
      result.title = nameMatch[2];
    }

    // Phân loại file
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      console.log('ext', ext);
      if (ext === '.rar' || ext === '.zip') {
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

  /**
   * Cấp quyền truy cập (Reader) cho một email cụ thể vào một file.
   * - Thường dùng khi user mua hàng xong -> Add permission vào file RAR.
   */
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

  /**
   * Tạo link tải xuống trực tiếp có thời hạn (Signed URL).
   * - Cơ chế: Tạo permission "anyone" tạm thời, sau đó xóa đi (hoặc dùng cơ chế khác nếu có).
   * - Ở đây: Tạo permission "anyone" -> Trả về link -> Permission sẽ cần được xóa thủ công hoặc qua cron job sau thời gian hết hạn.
   * @param fileId ID của file.
   * @param expirationMinutes Thời gian hết hạn (phút).
   */
  async generateSignedDownloadUrl(
    fileId: string,
    expirationMinutes: number = 60,
  ): Promise<{
    downloadUrl: string;
    filename: string;
    mimeType: string;
    permissionId: string;
  }> {
    try {
      // Get file metadata
      const fileMetadata = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType',
      });

      if (!fileMetadata.data) {
        throw new Error('File not found');
      }

      const { name, mimeType } = fileMetadata.data;

      // Temporarily add public permission (anyone with link can read)
      const permission = await this.drive.permissions.create({
        fileId,
        requestBody: {
          type: 'anyone',
          role: 'reader',
        },
        fields: 'id',
      });

      const permissionId = permission.data.id;

      if (!permissionId) {
        throw new Error('Failed to create permission');
      }

      // Generate download URL
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      console.log(
        `Created temporary permission ${permissionId} for file ${fileId}, expires in ${expirationMinutes} minutes`,
      );

      return {
        downloadUrl,
        filename: name || 'download',
        mimeType: mimeType || 'application/octet-stream',
        permissionId,
      };
    } catch (error) {
      console.error('Error generating signed download URL:', error);
      throw new Error(
        `Cannot generate signed download URL: ${error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Xóa một permission cụ thể theo ID.
   */
  async removePermissionById(
    fileId: string,
    permissionId: string,
  ): Promise<boolean> {
    try {
      await this.drive.permissions.delete({
        fileId,
        permissionId,
      });
      console.log(`Removed permission ${permissionId} from file ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error removing permission:', error);
      return false;
    }
  }

  /**
   * Xóa quyền truy cập của một email cụ thể khỏi file.
   * - Tìm permission ID tương ứng với email rồi xóa.
   */
  async removeDrivePermission(
    fileUrl: string,
    email: string,
    // orderId?: string,
  ) {
    try {
      if (!fileUrl) return false;
      const fileId = this.getIdByUrl(fileUrl);
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
        // console.log(`Đã xóa quyền truy cập cho file ${fileUrl} và email ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing drive permission:', error);
      return false;
    }
  }

  /**
   * Tự động hủy quyền truy cập của một email cho TẤT CẢ các file trong một thư mục (quét đệ quy).
   * - Dùng để dọn dẹp quyền truy cập định kỳ hoặc thu hồi quyền.
   */
  async autoRevokePermission(
    folderId: string,
    email: string,
    recursive: boolean = false,
  ): Promise<{
    success: boolean;
    totalFiles: number;
    revokedCount: number;
    failedFiles: { id: string; name: string }[];
  }> {
    try {
      // Lấy danh sách tất cả các file trong thư mục
      const allFiles: DriveFile[] = await this.listFiles(folderId);

      // Kết quả xóa quyền
      const result = {
        success: true,
        totalFiles: allFiles.length,
        revokedCount: 0,
        failedFiles: [] as { id: string; name: string }[],
      };

      // Xóa quyền cho từng file
      for (const file of allFiles) {
        try {
          const removed = await this.removeDrivePermission(file.id, email);
          if (removed) {
            result.revokedCount++;
          }
        } catch (error) {
          console.error(
            `Lỗi khi xóa quyền cho file ${file.name} (${file.id}):`,
            error,
          );
          result.failedFiles.push({ id: file.id, name: file.name });
        }
      }

      // Nếu recursive = true, xử lý các thư mục con
      if (recursive) {
        const subFolders = await this.listFolders(folderId);

        for (const folder of subFolders) {
          try {
            const subResult = await this.autoRevokePermission(
              folder.id,
              email,
              true,
            );

            // Cập nhật kết quả tổng
            result.totalFiles += subResult.totalFiles;
            result.revokedCount += subResult.revokedCount;
            result.failedFiles = [
              ...result.failedFiles,
              ...subResult.failedFiles,
            ];
          } catch (error) {
            console.error(
              `Lỗi khi xử lý thư mục con ${folder.name} (${folder.id}):`,
              error,
            );
          }
        }
      }

      result.success = result.failedFiles.length === 0;
      return result;
    } catch (error) {
      console.error('Lỗi khi tự động hủy quyền truy cập:', error);
      throw new HttpException(
        `Không thể hủy quyền truy cập: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Trích xuất File ID từ URL Google Drive.
   * - Hỗ trợ nhiều định dạng URL khác nhau.
   */
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

  /**
   * Tạo URL xem ảnh trực tiếp từ File ID.
   */
  getImageUrl(fileId: string, name: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=view&name=${name}`;
  }

  /**
   * Đảm bảo thư mục local tồn tại, nếu không thì tạo mới.
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
   * Kiểm tra xem file đã có quyền public chưa.
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
   * Thêm quyền public cho file (để ai cũng xem được - thường dùng cho ảnh).
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
        `Không thể thêm quyền public: ${error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Tìm kiếm file ảnh theo tên trong thư mục Drive, make public và tải về Local.
   * - Dùng khi cần copy ảnh từ Drive về server mình để serve nhanh hơn.
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
        localPath: relativePath.replace(/\\/g, '/'), // Đường dẫn local
        name: imageFile.name,
        id: imageFile.id,
      };
    } catch (error) {
      console.error('Lỗi khi tìm kiếm file hoặc tải về local:', error);
      throw new HttpException(
        `Không thể tìm kiếm file hoặc tải về local: ${error instanceof Error ? error.message : 'Unknown error'
        }`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
