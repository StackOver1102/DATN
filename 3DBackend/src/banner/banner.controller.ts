import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerPosition } from './entities/banner.entity';
import { FilterDto } from 'src/common/dto/filter.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new banner' })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannerService.create(createBannerDto);
  }

  @Public()
  @Post('with-image')
  @ApiOperation({ summary: 'Create a banner with image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Banner created successfully with image' })
  @ApiResponse({ status: 400, description: 'Bad request - image file required' })
  @UseInterceptors(FileInterceptor('file'))
  createWithImage(
    @Body() createBannerDto: CreateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerService.createBannerWithImageUpload(createBannerDto, file);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all banners with optional filters' })
  @ApiResponse({ status: 200, description: 'Banners retrieved successfully' })
  findAll(@Query() filterDto?: FilterDto) {
    if (filterDto && Object.keys(filterDto).length > 0) {
      return this.bannerService.findAllWithFilters(filterDto);
    }
    return this.bannerService.findAll();
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get all active banners' })
  @ApiResponse({ status: 200, description: 'Active banners retrieved successfully' })
  findActive() {
    return this.bannerService.findActive();
  }

  @Public()
  @Get('position/:position')
  @ApiOperation({ summary: 'Get banners by position' })
  @ApiParam({ name: 'position', enum: BannerPosition, description: 'Banner position' })
  @ApiResponse({ status: 200, description: 'Banners retrieved successfully' })
  findByPosition(@Param('position') position: BannerPosition) {
    return this.bannerService.findByPosition(position);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a banner by ID' })
  @ApiParam({ name: 'id', description: 'Banner ID' })
  @ApiResponse({ status: 200, description: 'Banner retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a banner' })
  @ApiParam({ name: 'id', description: 'Banner ID' })
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannerService.update(id, updateBannerDto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle banner active status' })
  @ApiParam({ name: 'id', description: 'Banner ID' })
  @ApiResponse({ status: 200, description: 'Banner status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  toggleStatus(@Param('id') id: string) {
    return this.bannerService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiParam({ name: 'id', description: 'Banner ID' })
  @ApiResponse({ status: 204, description: 'Banner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
