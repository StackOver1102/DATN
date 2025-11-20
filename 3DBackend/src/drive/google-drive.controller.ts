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

  @Public()
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
  @Get('remove-permission')
  async removeDrivePermission(
    @Query('fileId') fileId: string,
    @Query('email') email: string,
  ) {
    const result = await this.driveService.removeDrivePermission(fileId, email);
    if (result) {
      return this.success(result, 'Quyền truy cập đã được xóa thành công');
    } else {
      return this.error('Không thể xóa quyền truy cập', HttpStatus.BAD_REQUEST);
    }
  }
  
  @Public()
  @Get('auto-revoke-permission')
  async autoRevokePermission(
    @Query('folderId') folderId: string,
    @Query('email') email: string,
    @Query('recursive') recursive?: string,
  ) {
    try {
      const isRecursive = recursive === 'true';
      const result = await this.driveService.autoRevokePermission(folderId, email, isRecursive);
      
      return this.success(
        result,
        `Đã xóa quyền truy cập cho ${result.revokedCount}/${result.totalFiles} file`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.error(`Lỗi khi tự động hủy quyền: ${message}`, HttpStatus.BAD_REQUEST);
    }
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
      console.log('error', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return this.error('Lỗi khi tìm kiếm hình ảnh', HttpStatus.BAD_REQUEST, [
        msg,
      ]);
    }
  }
}
