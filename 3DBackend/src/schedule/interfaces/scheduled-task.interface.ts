export interface ScheduledTask {
  name: string;
  description: string;
  type?: 'cron' | 'interval' | 'timeout';
  cronExpression?: string;
  interval?: number;
  timeout?: number;
  handler?: string;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
