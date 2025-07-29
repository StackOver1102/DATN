// drive/google-drive.service.ts
import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as path from 'path';

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
}
