import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { ImageSearchService } from './image-search.service';

@Injectable()
export class ProductMigrationService {
    private readonly logger = new Logger(ProductMigrationService.name);

    constructor(
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>,
        private readonly imageSearchService: ImageSearchService,
    ) { }

    /**
     * Sync tất cả products từ MongoDB sang Flask search service
     */
    async syncAllProducts(): Promise<{
        total: number;
        synced: number;
        failed: number;
        errors: string[];
    }> {
        this.logger.log('🔄 Starting product sync to image search service...');

        const errors: string[] = [];
        let synced = 0;
        let failed = 0;

        try {
            // Lấy tất cả products có ảnh
            const products = await this.productModel
                .find({
                    images: { $exists: true, $ne: '' },
                    isActive: true,
                })
                .exec();

            const total = products.length;
            this.logger.log(`📊 Found ${total} products to sync`);

            // Sync theo batch để tránh quá tải

            const batchSize = 200;  // Tăng lên 100 để sync nhanh hơn (21,503 products = ~215 batches)
            for (let i = 0; i < products.length; i += batchSize) {
                const batch = products.slice(i, i + batchSize);

                const batchData = batch.map((product) => ({
                    productId: (product._id as any).toString(),
                    name: product.name,
                    category: product.categoryName || 'Uncategorized',
                    imageUrl: product.images,
                    metadata: {
                        materials: product.materials,
                        style: product.style,
                        render: product.render,
                        form: product.form,
                        color: product.color,
                        platform: product.platform,
                        price: product.price,
                        discount: product.discount,
                        isPro: product.isPro,
                        isNew: product.isNew,
                    },
                }));

                try {
                    await this.imageSearchService.addProductsBatch(batchData);
                    synced += batch.length;
                    this.logger.log(
                        `✅ Synced batch ${i / batchSize + 1}: ${synced}/${total}`,
                    );
                } catch (error) {
                    failed += batch.length;
                    const errorMsg = `Batch ${i / batchSize + 1} failed: ${error.message}`;
                    errors.push(errorMsg);
                    this.logger.error(errorMsg);
                }

                // Delay giữa các batch để tránh quá tải
                if (i + batchSize < products.length) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            this.logger.log(
                `✅ Sync completed: ${synced}/${total} synced, ${failed} failed`,
            );

            return {
                total,
                synced,
                failed,
                errors,
            };
        } catch (error) {
            this.logger.error('❌ Failed to sync products', error.message);
            throw error;
        }
    }

    /**
     * Sync một sản phẩm cụ thể
     */
    async syncProduct(productId: string): Promise<void> {
        try {
            const product = await this.productModel.findById(productId).exec();

            if (!product) {
                throw new Error(`Product ${productId} not found`);
            }

            if (!product.images) {
                throw new Error(`Product ${productId} has no image`);
            }

            await this.imageSearchService.addProduct({
                productId: (product._id as any).toString(),
                name: product.name,
                category: product.categoryName || 'Uncategorized',
                imageUrl: product.images,
                metadata: {
                    materials: product.materials,
                    style: product.style,
                    render: product.render,
                    form: product.form,
                    color: product.color,
                    platform: product.platform,
                    price: product.price,
                    discount: product.discount,
                    isPro: product.isPro,
                    isNew: product.isNew,
                },
            });

            this.logger.log(`✅ Synced product ${productId}`);
        } catch (error) {
            this.logger.error(`❌ Failed to sync product ${productId}`, error.message);
            throw error;
        }
    }

    /**
     * Xóa và rebuild toàn bộ index
     */
    async rebuildIndex(): Promise<{
        total: number;
        synced: number;
        failed: number;
    }> {
        this.logger.log('🔄 Rebuilding search index...');

        // Reset index
        await this.imageSearchService.resetIndex();
        this.logger.log('🗑️ Index reset completed');

        // Sync lại tất cả
        return await this.syncAllProducts();
    }
}
