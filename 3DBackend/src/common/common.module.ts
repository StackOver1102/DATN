import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FilterService } from './services/filter.service';
import { CaptchaService } from './services/captcha.service';

@Module({
  imports: [HttpModule],
  providers: [FilterService, CaptchaService],
  exports: [FilterService, CaptchaService],
})
export class CommonModule { }
