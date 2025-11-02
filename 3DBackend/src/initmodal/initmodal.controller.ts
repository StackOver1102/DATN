import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InitmodalService } from './initmodal.service';
import { CreateInitmodalDto } from './dto/create-initmodal.dto';
import { UpdateInitmodalDto } from './dto/update-initmodal.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('initmodal')
@Controller('initmodal')
export class InitmodalController {
  constructor(private readonly initmodalService: InitmodalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new initmodal' })
  @ApiResponse({ status: 201, description: 'The initmodal has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createInitmodalDto: CreateInitmodalDto) {
    return this.initmodalService.create(createInitmodalDto);
  }

  @Public()
  @Get('get-initmodal')
  @ApiOperation({ summary: 'Get the initmodal' })
  @ApiResponse({ status: 200, description: 'Return the initmodal.' })
  @ApiResponse({ status: 404, description: 'Initmodal not found.' })
  getInitmodal() {
    return this.initmodalService.getInitmodal();
  }
 
  @Get()
  @ApiOperation({ summary: 'Get all initmodals' })
  @ApiResponse({ status: 200, description: 'Return all initmodals.' })
  findAll() {
    return this.initmodalService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an initmodal by id' })
  @ApiParam({ name: 'id', description: 'Initmodal ID' })
  @ApiResponse({ status: 200, description: 'Return the initmodal.' })
  @ApiResponse({ status: 404, description: 'Initmodal not found.' })
  findOne(@Param('id') id: string) {
    return this.initmodalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an initmodal' })
  @ApiParam({ name: 'id', description: 'Initmodal ID' })
  @ApiResponse({ status: 200, description: 'The initmodal has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Initmodal not found.' })
  update(@Param('id') id: string, @Body() updateInitmodalDto: UpdateInitmodalDto) {
    return this.initmodalService.update(id, updateInitmodalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an initmodal' })
  @ApiParam({ name: 'id', description: 'Initmodal ID' })
  @ApiResponse({ status: 200, description: 'The initmodal has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Initmodal not found.' })
  remove(@Param('id') id: string) {
    return this.initmodalService.remove(id);
  }

}
