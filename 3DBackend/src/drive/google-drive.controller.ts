// drive/google-drive.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import {
  GoogleDriveService,
  TreeNode,
  FolderInfo,
} from './google-drive.service';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('drive')
@ApiTags('drive')
export class GoogleDriveController {
  constructor(private readonly driveService: GoogleDriveService) {}

  @Get('tree')
  async getTree(): Promise<TreeNode[]> {
    const ROOT_ID = 'YOUR_ROOT_FOLDER_ID';
    return this.driveService.buildTree(ROOT_ID);
  }

  @Public()
  @Get('folder-info')
  async getFolderInfo(
    @Query('folderId') folderId: string,
    @Query('name') name?: string,
  ): Promise<FolderInfo> {
    const res = await this.driveService.getFolderInfo(folderId, name);
    return res;
  }

  @Public()
  @Get('add-permission')
  async addDrivePermission(
    @Query('fileId') fileId: string,
    @Query('email') email: string,
  ) {
    return this.driveService.addDrivePermission(fileId, email);
  }
}
