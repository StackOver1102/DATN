import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
const FormData = require('form-data');

@Injectable()
export class ImageSearchService {
    private readonly logger = new Logger(ImageSearchService.name);
    private readonly searchServiceUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.searchServiceUrl =
            this.configService.get<string>('IMAGE_SEARCH_SERVICE_URL') ||
            'http://localhost:5000';
    }

    /**
     * Thêm sản phẩm vào image search index
     */
    async addProduct(productData: {
        productId: string;
        name: string;
        category: string;
        imageUrl: string;
        metadata?: {
            materials?: string;
            style?: string;
            render?: string;
            form?: string;
            color?: string;
            platform?: string;
            [key: string]: any;
        };
    }): Promise<void> {
        try {
            const formData = new FormData();

            // Download ảnh từ URL hoặc đọc từ local
            let imageBuffer: Buffer;
            if (productData.imageUrl.startsWith('http')) {
                // Download từ URL
                const response = await axios.get(productData.imageUrl, {
                    responseType: 'arraybuffer',
                });
                imageBuffer = Buffer.from(response.data);
            } else {
                // Đọc từ local file
                imageBuffer = fs.readFileSync(productData.imageUrl);
            }

            // Tạo filename từ product ID
            const ext = path.extname(productData.imageUrl) || '.jpg';
            const filename = `${productData.productId}${ext}`;

            formData.append('image', imageBuffer, {
                filename,
                contentType: 'image/jpeg',
            });
            formData.append('product_id', productData.productId);
            formData.append('name', productData.name);
            formData.append('category', productData.category);

            if (productData.metadata) {
                formData.append('metadata', JSON.stringify(productData.metadata));
            }

            await axios.post(`${this.searchServiceUrl}/add`, formData, {
                headers: formData.getHeaders(),
                timeout: 30000,
            });

            this.logger.log(`Added product ${productData.productId} to search index`);
        } catch (error) {
            this.logger.error(
                `Failed to add product ${productData.productId} to search index`,
                error.message,
            );
            // Không throw error để không block việc tạo product
        }
    }

    /**
     * Thêm nhiều sản phẩm cùng lúc (batch)
     */
    async addProductsBatch(
        products: Array<{
            productId: string;
            name: string;
            category: string;
            imageUrl: string;
            metadata?: any;
        }>,
    ): Promise<void> {
        try {
            const formData = new FormData();

            // Download và thêm tất cả ảnh
            for (const product of products) {
                try {
                    let imageBuffer: Buffer;
                    if (product.imageUrl.startsWith('http')) {
                        const response = await axios.get(product.imageUrl, {
                            responseType: 'arraybuffer',
                        });
                        imageBuffer = Buffer.from(response.data);
                    } else {
                        imageBuffer = fs.readFileSync(product.imageUrl);
                    }

                    const ext = path.extname(product.imageUrl) || '.jpg';
                    const filename = `${product.productId}${ext}`;

                    formData.append('images', imageBuffer, {
                        filename,
                        contentType: 'image/jpeg',
                    });
                } catch (error) {
                    this.logger.warn(
                        `Failed to process image for product ${product.productId}`,
                        error.message,
                    );
                }
            }

            // Tạo metadata mapping
            const metadataMapping = {};
            products.forEach((product) => {
                const ext = path.extname(product.imageUrl) || '.jpg';
                const filename = `${product.productId}${ext}`;
                metadataMapping[filename] = {
                    product_id: product.productId,
                    name: product.name,
                    category: product.category,
                    ...product.metadata,
                };
            });

            formData.append('metadata', JSON.stringify(metadataMapping));

            await axios.post(`${this.searchServiceUrl}/add-batch`, formData, {
                headers: formData.getHeaders(),
                timeout: 120000, // 2 minutes for batch
            });

            this.logger.log(`Added ${products.length} products to search index`);
        } catch (error) {
            this.logger.error('Failed to add products batch', error.message);
        }
    }

    /**
     * Tìm kiếm sản phẩm tương tự bằng ảnh
     */
    async searchSimilar(
        imageUrl: string,
        options?: {
            topK?: number;
            threshold?: number;
            filters?: {
                category?: string;
                materials?: string;
                style?: string;
                [key: string]: any;
            };
        },
    ): Promise<
        Array<{
            path: string;
            score: number;
            rank: number;
            metadata: any;
        }>
    > {
        try {
            const formData = new FormData();

            // Download ảnh
            let imageBuffer: Buffer;
            if (imageUrl.startsWith('http')) {
                const response = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                });
                imageBuffer = Buffer.from(response.data);
            } else {
                imageBuffer = fs.readFileSync(imageUrl);
            }

            formData.append('image', imageBuffer, {
                filename: 'query.jpg',
                contentType: 'image/jpeg',
            });

            if (options?.topK) {
                formData.append('top_k', options.topK.toString());
            }

            if (options?.threshold) {
                formData.append('threshold', options.threshold.toString());
            }

            if (options?.filters) {
                formData.append('filters', JSON.stringify(options.filters));
            }

            const response = await axios.post(
                `${this.searchServiceUrl}/search`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 30000,
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error('Failed to search similar products', error.message);
            return [];
        }
    }

    /**
     * Xóa sản phẩm khỏi search index
     */
    async deleteProduct(productId: string): Promise<void> {
        try {
            // Tìm filename từ productId
            // Giả sử filename = productId + extension
            const filename = `${productId}.jpg`; // Hoặc lấy từ database

            await axios.post(
                `${this.searchServiceUrl}/delete`,
                { filename },
                { timeout: 10000 },
            );

            this.logger.log(`Deleted product ${productId} from search index`);
        } catch (error) {
            this.logger.error(
                `Failed to delete product ${productId} from search index`,
                error.message,
            );
        }
    }

    /**
     * Reload toàn bộ index
     */
    async reloadIndex(): Promise<void> {
        try {
            await axios.post(`${this.searchServiceUrl}/reload`, {}, { timeout: 300000 });
            this.logger.log('Reloaded search index');
        } catch (error) {
            this.logger.error('Failed to reload search index', error.message);
            throw error;
        }
    }

    /**
     * Reset toàn bộ index
     */
    async resetIndex(): Promise<void> {
        try {
            await axios.post(`${this.searchServiceUrl}/reset`, {}, { timeout: 10000 });
            this.logger.log('Reset search index');
        } catch (error) {
            this.logger.error('Failed to reset search index', error.message);
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái service
     */
    async getStatus(): Promise<any> {
        try {
            const response = await axios.get(`${this.searchServiceUrl}/`, {
                timeout: 5000,
            });
            return response.data;
        } catch (error) {
            this.logger.error('Failed to get search service status', error.message);
            throw error;
        }
    }
}
