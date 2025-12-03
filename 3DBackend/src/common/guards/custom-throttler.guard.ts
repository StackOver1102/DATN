import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // Ưu tiên 1: Lấy IP từ Cloudflare header (quan trọng nhất)
        const cfConnectingIp = req.headers['cf-connecting-ip'];
        if (cfConnectingIp) {
            return cfConnectingIp;
        }

        // Ưu tiên 2: Lấy IP từ x-forwarded-for (cho các reverse proxy khác)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            // x-forwarded-for có thể chứa nhiều IP, lấy IP đầu tiên (IP của client)
            const ips = forwarded.split(',');
            return ips[0].trim();
        }

        // Ưu tiên 3: x-real-ip
        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return realIp;
        }

        // Fallback: IP mặc định (thường là IP của proxy/container)
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
}
