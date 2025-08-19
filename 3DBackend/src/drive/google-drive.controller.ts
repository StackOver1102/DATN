// drive/google-drive.controller.ts
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  GoogleDriveService,
  TreeNode,
  FolderInfo,
} from './google-drive.service';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { BaseController } from 'src/common/base/base.controller';

@Controller('drive')
@ApiTags('drive')
export class GoogleDriveController extends BaseController {
  constructor(private readonly driveService: GoogleDriveService) {
    super();
  }

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

  @Public()
  @Post('search-image')
  @HttpCode(HttpStatus.OK)
  async searchImageByName(
    @Query('searchTerm') searchTerm: string,
    @Query('folderId') folderId: string,
  ) {
    try {
      const result = await this.driveService.searchImageByName(
        searchTerm,
        folderId,
      );
      // Đặt status code là 200 OK cho kết quả thành công
      return this.success(result, 'Tìm kiếm hình ảnh thành công');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return this.error('Lỗi khi tìm kiếm hình ảnh', HttpStatus.BAD_REQUEST, [
        msg,
      ]);
    }
  }
}
