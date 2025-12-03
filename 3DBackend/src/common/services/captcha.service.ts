import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CloudflareTurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

@Injectable()
export class CaptchaService {
  constructor(private httpService: HttpService) {}

  async verifyCaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY is not configured');
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<CloudflareTurnstileResponse>(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            secret: secretKey,
            response: token,
          },
        ),
      );

      return response.data.success === true;
    } catch (error: unknown) {
      console.error(
        'CAPTCHA verification failed:',
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }
}
