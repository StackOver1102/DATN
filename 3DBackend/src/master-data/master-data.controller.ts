import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { CreateMasterDataDto } from './dto/create-master-data.dto';
import { UpdateMasterDataDto } from './dto/update-master-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../enum/user.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('master-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createMasterDataDto: CreateMasterDataDto) {
    return this.masterDataService.create(createMasterDataDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.masterDataService.findAll();
  }

  @Get('type/:type')
  @Public()
  findByType(@Param('type') type: string) {
    return this.masterDataService.findByType(type);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.masterDataService.findOne(id);
  }

  @Get('type/:type/code/:code')
  @Public()
  findByTypeAndCode(@Param('type') type: string, @Param('code') code: string) {
    return this.masterDataService.findByTypeAndCode(type, code);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateMasterDataDto: UpdateMasterDataDto,
  ) {
    return this.masterDataService.update(id, updateMasterDataDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.masterDataService.remove(id);
  }
}
