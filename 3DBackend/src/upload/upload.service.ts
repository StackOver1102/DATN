import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { imageFileFilter } from './r2-config.provider';
import * as fs from 'fs';
interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  /**
   * Khởi tạo service Upload (sử dụng Cloudflare R2 - tương thích S3 API).
   * - Cấu hình R2 credential từ biến môi trường.
   * - Tạo S3 Client để giao tiếp với R2.
   */
  constructor(private configService: ConfigService) {
    // Get config from .env
    const accessKeyId =
      this.configService.get<string>('R2_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '';
    const endpoint = this.configService.get<string>('R2_ENDPOINT') || '';

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      console.warn('Cloudflare R2 credentials not configured properly');
    }

    this.bucketName =
      this.configService.get<string>('R2_BUCKET') || 'my-bucket';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';


    // Create S3 client
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload file từ buffer lên R2 (Thường dùng khi tải ảnh từ Drive về rồi upload lên R2).
   * @param buffer Buffer chứa dữ liệu file.
   * @param originalname Tên file gốc.
   * @param mimetype Loại MIME của file.
   * @param folder Thư mục đích trên R2 (tùy chọn).
   * @returns Kết quả upload bao gồm key, url, size...
   */
  async uploadFile(
    buffer: Buffer,
    originalname: string,
    mimetype: string,
    folder?: string,
  ): Promise<UploadResult> {
    const fileExt = path.extname(originalname);
    // Tao unique filename
    const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
    const key = folder ? `${folder}/${fileName}` : fileName;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read' as ObjectCannedACL, // Set quyền public
    };

    await this.s3Client.send(new PutObjectCommand(params));

    return {
      key,
      url: `${this.publicUrl}/${key}`,
      contentType: mimetype,
      size: buffer.length,
    };
  }

  /**
   * Cấu hình Storage engine cho Multer (Upload trực tiếp từ Form data).
   * - Tự động tạo unique filename.
   * - Tự động set Content type.
   */
  getR2Storage() {
    return multerS3({
      s3: this.s3Client,
      bucket: this.bucketName,
      acl: 'public-read',
      contentType: (req, file, cb) => multerS3.AUTO_CONTENT_TYPE(req, file, cb),
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
        cb(null, fileName);
      },
      ...(this.publicUrl && {
        location: (req, file, filename) => {
          return `${this.publicUrl}/${filename}`;
        },
      }),
    });
  }

  /**
   * Helper tạo FileInterceptor cho NestJS Controller.
   * - Tích hợp sẵn storage config, giới hạn file size (10MB) và filter ảnh.
   */
  getR2FileInterceptor(fieldName: string) {
    const storage = multerS3({
      s3: this.s3Client,
      bucket: this.bucketName,
      acl: 'public-read',
      contentType: (req, file, cb) => multerS3.AUTO_CONTENT_TYPE(req, file, cb),
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
        cb(null, fileName);
      },
      ...(this.publicUrl && {
        location: (req, file, filename) => {
          return `${this.publicUrl}/${filename}`;
        },
      }),
    });

    return FileInterceptor(fieldName, {
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: imageFileFilter,
    });
  }

  /**
   * Helper lấy Full URL từ tên file (Key).
   */
  getFileUrl(fileName: string): string {
    return `${this.publicUrl}/${fileName}`;
  }

  /**
   * Xóa file từ Cloudflare R2 bucket.
   * @param key Key của file (thường là filename).
   * @returns true nếu xóa thành công, false nếu có lỗi.
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      // Check if the file exists
      const headParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      try {
        await this.s3Client.send(new HeadObjectCommand(headParams));
      } catch {
        console.warn(`File not found on R2: ${key}`);
        return false;
      }

      // Delete the file
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log(`Successfully deleted file from R2: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error deleting file from R2: ${key}`, error);
      return false;
    }
  }

  /**
   * Helper trích xuất Key file từ Full URL.
   */
  getKeyFromUrl(url: string): string | null {
    try {
      if (!url) return null;

      // Extract the filename/key from the URL
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];

      if (!filename) return null;

      return filename;
    } catch (error) {
      console.error('Error extracting key from URL:', error);
      return null;
    }
  }

  /**
   * Upload file từ đường dẫn Local lên R2.
   * - Sau khi upload thành công sẽ tự động xóa file local để dọn dẹp.
   */
  async uploadLocalToR2(localPath: string) {
    try {
      // Read the file
      const buffer = fs.readFileSync(localPath);
      const generateKey = `${Date.now()}-${uuidv4()}`;

      // Upload to R2 (vào folder products)
      const result = await this.uploadFile(buffer, generateKey, 'image/jpeg', 'products');

      // Delete the local file after successful upload (Dọn dẹp)
      try {
        fs.unlinkSync(localPath);
        console.log(`Successfully deleted local file: ${localPath}`);
      } catch (deleteError) {
        console.error(`Error deleting local file: ${localPath}`, deleteError);
      }

      return result;
    } catch (error) {
      console.error(`Error uploading file ${localPath} to R2:`, error);
      throw error;
    }
  }
}
