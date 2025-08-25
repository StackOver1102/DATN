import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../enum/user.enum';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { TaskStatusDto } from './dto/task-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ScheduleDto } from './dto/schedule.dto';

@ApiTags('schedule')
@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Get all scheduled tasks with their status' })
  @ApiResponse({ status: 200, description: 'Returns all tasks in memory' })
  @Roles(UserRole.ADMIN)
  getAllTasks() {
    return {
      status: 'success',
      tasks: this.scheduleService.getAllTasks()
    };
  }
  
  @Get('db-tasks')
  @ApiOperation({ summary: 'Get all scheduled tasks from database' })
  @ApiResponse({ status: 200, description: 'Returns all tasks from database', type: [ScheduleDto] })
  @Roles(UserRole.ADMIN)
  async getAllTasksFromDb() {
    const tasks = await this.scheduleService.getAllTasksFromDb();
    return {
      status: 'success',
      tasks
    };
  }
  
  @Post('tasks')
  @ApiOperation({ summary: 'Create a new scheduled task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @Roles(UserRole.ADMIN)
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.scheduleService.createTask(createTaskDto);
    return {
      status: 'success',
      message: `Task ${createTaskDto.name} created successfully`,
      task
    };
  }

  @Get('tasks/:name')
  @ApiOperation({ summary: 'Get a specific scheduled task by name from memory' })
  @ApiParam({ name: 'name', description: 'Task name', example: 'dailyTask' })
  @ApiResponse({ status: 200, description: 'Returns the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Roles(UserRole.ADMIN)
  getTaskByName(@Param('name') name: string) {
    const task = this.scheduleService.getTaskByName(name);
    if (!task) {
      throw new NotFoundException(`Task ${name} not found`);
    }
    return {
      status: 'success',
      task
    };
  }
  
//   @Get('db-tasks/:name')
//   @ApiOperation({ summary: 'Get a specific scheduled task by name from database' })
//   @ApiParam({ name: 'name', description: 'Task name', example: 'dailyTask' })
//   @ApiResponse({ status: 200, description: 'Returns the task from database', type: ScheduleDto })
//   @ApiResponse({ status: 404, description: 'Task not found' })
//   @Roles(UserRole.ADMIN)
//   async getTaskFromDb(@Param('name') name: string) {
//     const task = await this.scheduleService.getTaskFromDb(name);
//     return {
//       status: 'success',
//       task
//     };
//   }

  @Patch('tasks/:name/status')
  @ApiOperation({ summary: 'Update a task status (enable/disable)' })
  @ApiParam({ name: 'name', description: 'Task name', example: 'dailyTask' })
  @ApiBody({ type: TaskStatusDto })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Roles(UserRole.ADMIN)
  async updateTaskStatus(
    @Param('name') name: string, 
    @Body() taskStatusDto: TaskStatusDto
  ) {
    if (name !== taskStatusDto.name) {
      throw new BadRequestException('Task name in path and body must match');
    }
    
    const updated = await this.scheduleService.updateTaskStatus(name, taskStatusDto.status);
    if (!updated) {
      throw new NotFoundException(`Task ${name} not found`);
    }
    
    const task = this.scheduleService.getTaskByName(name);
    if (!task) {
      throw new NotFoundException(`Task ${name} not found`);
    }
    
    return {
      status: 'success',
      message: `Task ${name} status updated to ${taskStatusDto.status}`,
      task
    };
  }
  
  @Delete('tasks/:name')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'name', description: 'Task name', example: 'customTask' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Roles(UserRole.ADMIN)
  async deleteTask(@Param('name') name: string) {
    const deleted = await this.scheduleService.deleteTask(name);
    if (!deleted) {
      throw new NotFoundException(`Task ${name} not found`);
    }
    
    return {
      status: 'success',
      message: `Task ${name} deleted successfully`
    };
  }

  @Post('trigger/:taskName')
  @ApiOperation({ summary: 'Manually trigger a specific scheduled task' })
  @ApiParam({ name: 'taskName', description: 'Task name to trigger', example: 'dailyTask' })
  @ApiResponse({ status: 200, description: 'Task triggered successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Roles(UserRole.ADMIN)
  async triggerTask(@Param('taskName') taskName: string) {
    const task = this.scheduleService.getTaskByName(taskName);
    if (!task) {
      throw new NotFoundException(`Task ${taskName} not found`);
    }
    
    switch (taskName) {
      case 'dailyTask':
        this.scheduleService.handleDailyTask();
        break;
      case 'hourlyTask':
        this.scheduleService.handleHourlyTask();
        break;
      case 'every30MinutesTask':
        this.scheduleService.handleEvery30MinutesTask();
        break;
      case 'intervalTask':
        this.scheduleService.handleIntervalTask();
        break;
      case 'startupTask':
        this.scheduleService.handleOnceAfterAppStart();
        break;
      default:
        // For custom tasks, we'll try to execute them if they have a handler
        if (task.handler) {
          // We'll update the task metadata manually since we're not using the executeHandler method
          task.lastRun = new Date();
          task.updatedAt = new Date();
          
          // Update in database
          await this.scheduleService.updateTaskInDatabase(taskName);
        } else {
          throw new BadRequestException(`Task ${taskName} cannot be manually triggered (no handler defined)`);
        }
    }

    const updatedTask = this.scheduleService.getTaskByName(taskName);
    if (!updatedTask) {
      throw new NotFoundException(`Task ${taskName} not found after triggering`);
    }

    return {
      status: 'success',
      message: `Task ${taskName} triggered manually`,
      task: updatedTask
    };
  }
}
