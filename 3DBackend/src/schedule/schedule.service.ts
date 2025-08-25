import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout, SchedulerRegistry } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduledTask } from './interfaces/scheduled-task.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { Schedule, ScheduleDocument } from './entities/schedule.entity';
import { ScheduleDto } from './dto/schedule.dto';
import { CronJob } from 'cron';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private tasks: Map<string, ScheduledTask> = new Map();

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>
  ) {
    // Initialize tasks map
    this.initializeTasksMap();
    // Load tasks from database
    this.loadTasksFromDatabase();
  }
  
  /**
   * Load tasks from database and register them with the scheduler
   */
  private async loadTasksFromDatabase() {
    try {
      const dbTasks = await this.scheduleModel.find({ status: 'active' }).exec();
      
      this.logger.log(`Loading ${dbTasks.length} tasks from database`);
      
      for (const dbTask of dbTasks) {
        try {
          // Convert database task to CreateTaskDto
          const taskDto: CreateTaskDto = {
            name: dbTask.name,
            description: dbTask.description,
            type: dbTask.type as 'cron' | 'interval' | 'timeout',
            cronExpression: dbTask.cronExpression,
            interval: dbTask.interval,
            timeout: dbTask.timeout,
            handler: dbTask.handler,
            status: dbTask.status as 'active' | 'inactive',
          };
          
          // Create the task (this will register it with the scheduler)
          this.createTask(taskDto, false); // false = don't save to DB (it's already there)
          
          this.logger.debug(`Loaded task ${dbTask.name} from database`);
        } catch (error) {
          this.logger.error(`Failed to load task ${dbTask.name} from database: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to load tasks from database: ${error.message}`);
    }
  }

  private initializeTasksMap() {
    // Define all scheduled tasks with metadata
    this.tasks.set('dailyTask', {
      name: 'dailyTask',
      description: 'Runs every day at midnight',
      cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
      status: 'active',
      lastRun: undefined,
      nextRun: this.calculateNextMidnight(),
    });

    this.tasks.set('hourlyTask', {
      name: 'hourlyTask',
      description: 'Runs every hour',
      cronExpression: CronExpression.EVERY_HOUR,
      status: 'active',
      lastRun: undefined,
      nextRun: this.calculateNextHour(),
    });

    this.tasks.set('every30MinutesTask', {
      name: 'every30MinutesTask',
      description: 'Runs every 30 minutes',
      cronExpression: '0 */30 * * * *',
      status: 'active',
      lastRun: undefined,
      nextRun: this.calculateNext30Minutes(),
    });

    this.tasks.set('intervalTask', {
      name: 'intervalTask',
      description: 'Runs every 5 minutes',
      interval: 300000,
      status: 'active',
      lastRun: undefined,
      nextRun: new Date(Date.now() + 300000),
    });

    this.tasks.set('startupTask', {
      name: 'startupTask',
      description: 'Runs once after application starts with 10 second delay',
      timeout: 10000,
      status: 'active',
      lastRun: undefined,
      nextRun: new Date(Date.now() + 10000),
    });
  }

  /**
   * This cronjob runs every day at midnight
   * Format: * * * * * *
   * second (0-59)
   * minute (0-59)
   * hour (0-23)
   * day of month (1-31)
   * month (1-12)
   * day of week (0-6) (Sunday to Saturday)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleDailyTask() {
    this.logger.debug('Daily task executed at midnight');
    // Update task metadata
    const task = this.tasks.get('dailyTask');
    if (task) {
      task.lastRun = new Date();
      task.nextRun = this.calculateNextMidnight();
    }
    
    // Add your daily task logic here
    // For example: clean up old data, generate reports, etc.
  }

  /**
   * This cronjob runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  handleHourlyTask() {
    this.logger.debug('Hourly task executed');
    // Update task metadata
    const task = this.tasks.get('hourlyTask');
    if (task) {
      task.lastRun = new Date();
      task.nextRun = this.calculateNextHour();
    }
    
    // Add your hourly task logic here
    // For example: update cache, check for pending operations, etc.
  }

  /**
   * This cronjob runs every 30 minutes
   */
  @Cron('0 */30 * * * *')
  handleEvery30MinutesTask() {
    this.logger.debug('Task executed every 30 minutes');
    // Update task metadata
    const task = this.tasks.get('every30MinutesTask');
    if (task) {
      task.lastRun = new Date();
      task.nextRun = this.calculateNext30Minutes();
    }
    
    // Add your task logic here
    // For example: check for new notifications, sync data, etc.
  }

  /**
   * This method runs once after the application starts with a 10 second delay
   */
  @Timeout(10000)
  handleOnceAfterAppStart() {
    this.logger.debug('Task executed once after application start (10s delay)');
    // Update task metadata
    const task = this.tasks.get('startupTask');
    if (task) {
      task.lastRun = new Date();
      task.status = 'inactive'; // One-time task is now inactive
    }
    
    // Add your startup task logic here
    // For example: initialize caches, check system status, etc.
  }

  /**
   * This method runs every 5 minutes (300000ms)
   */
  @Interval(300000)
  handleIntervalTask() {
    this.logger.debug('Task executed every 5 minutes');
    // Update task metadata
    const task = this.tasks.get('intervalTask');
    if (task) {
      task.lastRun = new Date();
      task.nextRun = new Date(Date.now() + 300000);
    }
    
    // Add your interval task logic here
    // For example: check for stale data, cleanup temporary files, etc.
  }

  /**
   * Get all scheduled tasks with their metadata
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get a specific task by name
   */
  getTaskByName(name: string): ScheduledTask | undefined {
    return this.tasks.get(name);
  }

  /**
   * Update task status (enable/disable)
   */
  async updateTaskStatus(name: string, status: 'active' | 'inactive'): Promise<boolean> {
    const task = this.tasks.get(name);
    if (!task) {
      return false;
    }
    
    task.status = status;
    task.updatedAt = new Date();
    
    // If the task is a dynamic task (created at runtime), update the actual cron job
    if (task.type === 'cron' && task.handler) {
      try {
        const job = this.schedulerRegistry.getCronJob(name);
        if (status === 'active') {
          job.start();
        } else {
          job.stop();
        }
      } catch (error) {
        this.logger.error(`Failed to update cron job status for ${name}: ${error.message}`);
      }
    }
    
    // Update in database
    await this.updateTaskInDatabase(name);
    
    return true;
  }
  
  /**
   * Create a new custom task
   * @param createTaskDto The task data
   * @param saveToDb Whether to save the task to the database (default: true)
   * @returns The created task
   */
  async createTask(createTaskDto: CreateTaskDto, saveToDb: boolean = true): Promise<ScheduledTask> {
    // Check if task with this name already exists in memory
    if (this.tasks.has(createTaskDto.name)) {
      throw new BadRequestException(`Task with name ${createTaskDto.name} already exists in memory`);
    }
    
    // Check if task exists in database
    if (saveToDb) {
      const existingTask = await this.scheduleModel.findOne({ name: createTaskDto.name }).exec();
      if (existingTask) {
        throw new BadRequestException(`Task with name ${createTaskDto.name} already exists in database`);
      }
    }
    
    const now = new Date();
    let nextRun: Date | undefined;
    
    // Create the task metadata
    const newTask: ScheduledTask = {
      name: createTaskDto.name,
      description: createTaskDto.description,
      type: createTaskDto.type,
      status: createTaskDto.status || 'active',
      handler: createTaskDto.handler,
      createdAt: now,
      updatedAt: now,
    };
    
    // Set up the task based on its type
    switch (createTaskDto.type) {
      case 'cron':
        if (!createTaskDto.cronExpression) {
          throw new BadRequestException('Cron expression is required for cron tasks');
        }
        
        newTask.cronExpression = createTaskDto.cronExpression;
        
        try {
          // Create a new cron job
          const job = new CronJob(createTaskDto.cronExpression, () => {
            this.executeHandler(createTaskDto.name, createTaskDto.handler);
          });
          
          // Register the job with the scheduler
          this.schedulerRegistry.addCronJob(createTaskDto.name, job);
          
          // Start the job if the task is active
          if (newTask.status === 'active') {
            job.start();
          }
          
          // Calculate next run time
          nextRun = job.nextDate().toJSDate();
          newTask.nextRun = nextRun;
        } catch (error) {
          throw new BadRequestException(`Invalid cron expression: ${error.message}`);
        }
        break;
        
      case 'interval':
        if (!createTaskDto.interval) {
          throw new BadRequestException('Interval is required for interval tasks');
        }
        
        newTask.interval = createTaskDto.interval;
        
        try {
          // Create an interval
          const callback = () => {
            this.executeHandler(createTaskDto.name, createTaskDto.handler);
          };
          
          const intervalId = setInterval(callback, createTaskDto.interval);
          
          // Register the interval with the scheduler
          this.schedulerRegistry.addInterval(createTaskDto.name, intervalId);
          
          // Calculate next run time
          nextRun = new Date(now.getTime() + createTaskDto.interval);
          newTask.nextRun = nextRun;
        } catch (error) {
          throw new BadRequestException(`Failed to create interval: ${error.message}`);
        }
        break;
        
      case 'timeout':
        if (!createTaskDto.timeout) {
          throw new BadRequestException('Timeout is required for timeout tasks');
        }
        
        newTask.timeout = createTaskDto.timeout;
        
        try {
          // Create a timeout
          const callback = () => {
            this.executeHandler(createTaskDto.name, createTaskDto.handler);
            // Update task status to inactive after execution
            const task = this.tasks.get(createTaskDto.name);
            if (task) {
              task.status = 'inactive';
              task.lastRun = new Date();
              task.updatedAt = new Date();
              
              // Update in database if needed
              if (saveToDb) {
                this.updateTaskInDatabase(createTaskDto.name);
              }
            }
          };
          
          const timeoutId = setTimeout(callback, createTaskDto.timeout);
          
          // Register the timeout with the scheduler
          this.schedulerRegistry.addTimeout(createTaskDto.name, timeoutId);
          
          // Calculate next run time
          nextRun = new Date(now.getTime() + createTaskDto.timeout);
          newTask.nextRun = nextRun;
        } catch (error) {
          throw new BadRequestException(`Failed to create timeout: ${error.message}`);
        }
        break;
        
      default:
        throw new BadRequestException('Invalid task type');
    }
    
    // Add the task to our map
    this.tasks.set(createTaskDto.name, newTask);
    
    // Save to database if requested
    if (saveToDb) {
      await this.saveTaskToDatabase(newTask);
    }
    
    return newTask;
  }
  
  /**
   * Save a task to the database
   */
  private async saveTaskToDatabase(task: ScheduledTask): Promise<void> {
    try {
      const scheduleDto: Partial<ScheduleDto> = {
        name: task.name,
        description: task.description,
        type: task.type,
        cronExpression: task.cronExpression,
        interval: task.interval,
        timeout: task.timeout,
        handler: task.handler,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        status: task.status,
      };
      
      const newSchedule = new this.scheduleModel(scheduleDto);
      await newSchedule.save();
      
      this.logger.debug(`Task ${task.name} saved to database`);
    } catch (error) {
      this.logger.error(`Failed to save task ${task.name} to database: ${error.message}`);
      throw new BadRequestException(`Failed to save task to database: ${error.message}`);
    }
  }
  
  /**
   * Update a task in the database
   */
  async updateTaskInDatabase(name: string): Promise<void> {
    try {
      const task = this.tasks.get(name);
      if (!task) {
        return;
      }
      
      const scheduleDto: Partial<ScheduleDto> = {
        name: task.name,
        description: task.description,
        type: task.type,
        cronExpression: task.cronExpression,
        interval: task.interval,
        timeout: task.timeout,
        handler: task.handler,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        status: task.status,
        updatedAt: new Date(),
      };
      
      await this.scheduleModel.updateOne({ name }, scheduleDto).exec();
      
      this.logger.debug(`Task ${name} updated in database`);
    } catch (error) {
      this.logger.error(`Failed to update task ${name} in database: ${error.message}`);
    }
  }
  
  /**
   * Delete a task
   */
  async deleteTask(name: string): Promise<boolean> {
    const task = this.tasks.get(name);
    if (!task) {
      return false;
    }
    
    // Remove the task from the scheduler based on its type
    try {
      switch (task.type) {
        case 'cron':
          this.schedulerRegistry.deleteCronJob(name);
          break;
        case 'interval':
          this.schedulerRegistry.deleteInterval(name);
          break;
        case 'timeout':
          this.schedulerRegistry.deleteTimeout(name);
          break;
      }
      
      // Remove the task from our map
      this.tasks.delete(name);
      
      // Remove from database
      await this.scheduleModel.deleteOne({ name }).exec();
      
      this.logger.debug(`Task ${name} deleted from memory and database`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete task ${name}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get all tasks from database
   */
  async getAllTasksFromDb(): Promise<ScheduleDto[]> {
    try {
      const dbTasks = await this.scheduleModel.find().exec();
      return dbTasks.map(task => ({
        _id: task._id ? task._id.toString() : undefined,
        name: task.name,
        description: task.description,
        type: task.type,
        cronExpression: task.cronExpression,
        interval: task.interval,
        timeout: task.timeout,
        handler: task.handler,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get tasks from database: ${error.message}`);
      throw new BadRequestException(`Failed to get tasks from database: ${error.message}`);
    }
  }
  
  /**
   * Get a task from database by name
   */
  // async getTaskFromDb(name: string): Promise<ScheduleDto> {
  //   try {
  //     const task = await this.scheduleModel.findOne({ name }).exec();
  //     if (!task) {
  //       throw new NotFoundException(`Task ${name} not found in database`);
  //     }
      
  //     return {
  //       _id: task._id.toString(),
  //       name: task.name,
  //       description: task.description,
  //       type: task.type,
  //       cronExpression: task.cronExpression,
  //       interval: task.interval,
  //       timeout: task.timeout,
  //       handler: task.handler,
  //       lastRun: task.lastRun,
  //       nextRun: task.nextRun,
  //       status: task.status,
  //       createdAt: task.createdAt,
  //       updatedAt: task.updatedAt,
  //     };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     this.logger.error(`Failed to get task ${name} from database: ${error.message}`);
  //     throw new BadRequestException(`Failed to get task from database: ${error.message}`);
  //   }
  // }
  
  /**
   * Execute a handler function by name
   * This is a simple implementation that supports a few predefined handlers
   */
  private async executeHandler(taskName: string, handlerName: string): Promise<void> {
    this.logger.debug(`Executing handler ${handlerName} for task ${taskName}`);
    
    // Update task metadata
    const task = this.tasks.get(taskName);
    if (task) {
      task.lastRun = new Date();
      
      // Update next run time based on task type
      if (task.type === 'cron' && task.cronExpression) {
        try {
          const job = this.schedulerRegistry.getCronJob(taskName);
          task.nextRun = job.nextDate().toJSDate();
        } catch (error) {
          this.logger.error(`Failed to get next run time for ${taskName}: ${error.message}`);
        }
      } else if (task.type === 'interval' && task.interval) {
        task.nextRun = new Date(Date.now() + task.interval);
      }
      
      task.updatedAt = new Date();
      
      // Update task in database
      await this.updateTaskInDatabase(taskName);
    }
    
    // Execute the handler based on its name
    switch (handlerName) {
      case 'handleDailyTask':
        this.handleDailyTask();
        break;
      case 'handleHourlyTask':
        this.handleHourlyTask();
        break;
      case 'handleEvery30MinutesTask':
        this.handleEvery30MinutesTask();
        break;
      case 'handleIntervalTask':
        this.handleIntervalTask();
        break;
      case 'handleOnceAfterAppStart':
        this.handleOnceAfterAppStart();
        break;
      case 'handleCustomTask':
        this.handleCustomTask(taskName);
        break;
      default:
        this.logger.warn(`Unknown handler: ${handlerName}`);
    }
  }
  
  /**
   * Example custom task handler
   */
  private handleCustomTask(taskName: string): void {
    this.logger.debug(`Custom task ${taskName} executed`);
    // Add your custom task logic here
  }

  /**
   * Helper methods to calculate next run times
   */
  private calculateNextMidnight(): Date {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    return nextMidnight;
  }

  private calculateNextHour(): Date {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour;
  }

  private calculateNext30Minutes(): Date {
    const now = new Date();
    const minutes = now.getMinutes();
    const next30Min = new Date(now);
    
    if (minutes < 30) {
      next30Min.setMinutes(30, 0, 0);
    } else {
      next30Min.setHours(now.getHours() + 1, 0, 0, 0);
    }
    
    return next30Min;
  }
}
