import {
  Controller,
  Get,
  Param,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { google } from 'googleapis';
// import * as mime from 'mime-types';

@Controller('media')
export class MediaController {
  private drive = google.drive({
    version: 'v3',
    auth: new google.auth.GoogleAuth({
      keyFile: 'service-account.json',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    }),
  });

  @Get(':fileId')
  async streamFile(@Param('fileId') fileId: string, @Res() res: Response) {
    try {
      // Lấy metadata trước (để biết loại file, tên, v.v.)
      const metadata = await this.drive.files.get({
        fileId,
        fields: 'name, mimeType',
      });

      const mimeType = metadata.data.mimeType || 'application/octet-stream';
      const fileName = metadata.data.name || 'file';

      // Set header
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

      // Stream nội dung file
      const file = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      file.data.pipe(res);
    } catch {
      // console.error('Drive fetch error:', err?.message || err);
      // if (err?.code === 404) throw new NotFoundException('File not found');
      throw new InternalServerErrorException('Cannot stream file from Drive');
    }
  }

  @Get('download/:fileId')
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const file = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="model.rar"`);
    file.data.pipe(res);
  }
}
