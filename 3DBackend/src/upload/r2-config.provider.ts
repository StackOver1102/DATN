import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image file filter for Multer
 */
export const imageFileFilter = (
  req: any,
  file: { originalname: string; mimetype: string },
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

/**
 * Cloudflare R2 Multer configuration provider
 */
export const r2ConfigFactory = {
  provide: 'MULTER_R2_CONFIG',
  useFactory: (configService: ConfigService) => {
    const accessKeyId = configService.get<string>('R2_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      configService.get<string>('R2_SECRET_ACCESS_KEY') || '';
    const endpoint = configService.get<string>('R2_ENDPOINT') || '';
    const bucketName = configService.get<string>('R2_BUCKET') || 'my-bucket';
    const publicUrl = configService.get<string>('R2_PUBLIC_URL') || '';
    console.log('Public URL js.35', publicUrl);
    if (!accessKeyId || !secretAccessKey || !endpoint) {
      console.warn('Cloudflare R2 credentials not configured properly');
      return null;
    }

    // Create S3 client
    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Configure MulterModule with S3 storage
    return MulterModule.register({
      storage: multerS3({
        s3,
        bucket: bucketName,
        acl: 'public-read',
        contentType: (req, file, cb) =>
          multerS3.AUTO_CONTENT_TYPE(req, file, cb),
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          const fileExt = path.extname(file.originalname);
          const fileName = `${Date.now()}-${uuidv4()}${fileExt}`;
          cb(null, fileName);
        },
        // Customize URL format if needed
        ...(publicUrl && {
          // Override the generated S3 URL with our custom URL pattern
          // This will make S3 still upload to the correct location but return our custom URL
          location: function (req, file, filename) {
            return `${publicUrl}/${filename}`;
          },
        }),
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: imageFileFilter,
    });
  },
  inject: [ConfigService],
};

/**
 * Provider for R2 storage options for multer
 */
export const r2StorageProvider: Provider = {
  provide: 'R2_STORAGE',
  useFactory: (configService: ConfigService) => {
    const accessKeyId = configService.get<string>('R2_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      configService.get<string>('R2_SECRET_ACCESS_KEY') || '';
    const endpoint = configService.get<string>('R2_ENDPOINT') || '';
    const bucketName = configService.get<string>('R2_BUCKET') || 'my-bucket';
    const publicUrl = configService.get<string>('R2_PUBLIC_URL') || '';
    console.log('Public URL', publicUrl);
    if (!accessKeyId || !secretAccessKey || !endpoint) {
      console.warn('Cloudflare R2 credentials not configured properly');
      return null;
    }

    // Create S3 client
    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Return multerS3 storage configuration
    return multerS3({
      s3,
      bucket: bucketName,
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
      // Customize URL format if needed
      ...(publicUrl && {
        // Override the generated S3 URL with our custom URL pattern
        // This will make S3 still upload to the correct location but return our custom URL
        location: function (req, file, filename) {
          return `${publicUrl}/${filename}`;
        },
      }),
    });
  },
  inject: [ConfigService],
};
