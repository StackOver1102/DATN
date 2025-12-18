import { Controller, Post, Get, Logger } from '@nestjs/common';
import { ProductMigrationService } from './product-migration.service';
import { ImageSearchService } from './image-search.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('products/migration')
@Public()
export class ProductMigrationController {
    private readonly logger = new Logger(ProductMigrationController.name);

    constructor(
        private readonly migrationService: ProductMigrationService,
        private readonly imageSearchService: ImageSearchService,
    ) { }

    /**
     * Sync tất cả products sang image search service
     * POST /products/migration/sync-all
     */
    @Post('sync-all')
    async syncAll() {
        this.logger.log('Starting full product sync...');
        const result = await this.migrationService.syncAllProducts();
        return {
            success: true,
            message: 'Product sync completed',
            ...result,
        };
    }

    /**
     * Rebuild toàn bộ index
     * POST /products/migration/rebuild
     */
    @Post('rebuild')
    async rebuild() {
        this.logger.log('Starting index rebuild...');
        const result = await this.migrationService.rebuildIndex();
        return {
            success: true,
            message: 'Index rebuild completed',
            ...result,
        };
    }

    /**
     * Kiểm tra trạng thái search service
     * GET /products/migration/status
     */
    @Get('status')
    async getStatus() {
        const status = await this.imageSearchService.getStatus();
        return {
            success: true,
            searchService: status,
        };
    }
}
