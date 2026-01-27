import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GoogleDriveService } from 'src/drive/google-drive.service';
import { Product, ProductDocument } from './entities/product.entity';
import { Model } from 'mongoose';
import { UploadService } from 'src/upload/upload.service';
import { FilterService } from 'src/common/services/filter.service';
import { FilterDto } from 'src/common/dto/filter.dto';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { ImageSearchService } from './image-search.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly uploadService: UploadService,
    private readonly filterService: FilterService,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly imageSearchService: ImageSearchService,
  ) { }

  /**
   * Tạo nhiều sản phẩm mới từ danh sách DTO.
   * Hàm này tự động thêm timestamps (createdAt, updatedAt) cho mỗi sản phẩm.
   * 
   * @param {CreateProductDto[]} createProductDto - Mảng các object chứa thông tin sản phẩm cần tạo.
   * @returns {Promise<Product[]>} - Mảng các sản phẩm đã được tạo trong database.
   * 
   * @example
   * // Đầu vào:
   * const products = [
   *   { name: "Sofa 3D", price: 100, categoryId: "abc123", images: "sofa.jpg" },
   *   { name: "Chair 3D", price: 50, categoryId: "abc123", images: "chair.jpg" }
   * ];
   * 
   * // Gọi hàm:
   * const created = await productsService.create(products);
   * 
   * // Đầu ra:
   * // [{ _id: "...", name: "Sofa 3D", createdAt: "...", ... }, {...}]
   */
  async create(createProductDto: CreateProductDto[]): Promise<Product[]> {
    // Add createdAt and updatedAt explicitly for each product
    const productsWithTimestamps = createProductDto.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return this.productModel.insertMany(productsWithTimestamps) as unknown as Promise<
      Product[]
    >;
  }

  /**
   * Tạo sản phẩm và tự động xử lý thông tin từ Google Drive.
   * - Hỗ trợ input là 1 sản phẩm hoặc 1 mảng sản phẩm.
   * - Lấy thông tin thư mục từ Drive (link tải, size file rar).
   * - Upload ảnh lên R2 nều cần.
   * 
   * @param {CreateProductDto | CreateProductDto[]} createProductDto - Một object hoặc mảng object chứa thông tin sản phẩm.
   * @returns {Promise<Product | Product[]>} - Sản phẩm đã tạo (hoặc mảng sản phẩm).
   * 
   * @example
   * // Đầu vào (single):
   * const product = {
   *   name: "Bedroom Modern",
   *   folderId: "1abc...",  // ID thư mục trên Google Drive
   *   stt: 5,               // Số thứ tự trong folder
   *   images: "C:/uploads/bedroom.jpg",  // Đường dẫn ảnh local
   *   price: 200
   * };
   * 
   * // Gọi hàm:
   * const created = await productsService.createProductAndAddURL(product);
   * 
   * // Đầu ra:
   * // {
   * //   _id: "...",
   * //   name: "05. Model Bedroom Modern 3dsmax",
   * //   urlDownload: "https://drive.google.com/uc?id=xxx",
   * //   size: 150.5,
   * //   images: "https://r2.example.com/products/123-uuid.jpg",
   * //   isPro: true,
   * //   ...
   * // }
   */
  async createProductAndAddURL(
    createProductDto: CreateProductDto | CreateProductDto[],
  ): Promise<Product | Product[]> {
    // Handle array of products (Xử lý đệ quy nếu đầu vào là mảng)
    if (Array.isArray(createProductDto)) {
      const productData = await Promise.all(
        createProductDto.map(async (product) => {
          return await this.createProductAndAddURL(product);
        }),
      );
      return productData.flat();
    }

    // Handle single product (Xử lý sản phẩm đơn lẻ)
    const { name, folderId, stt, images, price } = createProductDto;

    // Validate các trường bắt buộc
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!folderId) {
      throw new BadRequestException('Folder ID is required');
    }

    if (!stt) {
      throw new BadRequestException('STT is required');
    }

    if (!images) {
      throw new BadRequestException('Images is required');
    }

    // Upload ảnh lên R2 storage
    const imageUrl = this.uploadService.uploadLocalToR2(images);

    // Format số thứ tự (STT) thành dạng 2 chữ số (vd: 01, 02)
    const updateStt = Number(stt) < 10 ? `0${stt}` : stt;

    // Lấy thông tin folder từ Google Drive dựa trên folderId và tên folder
    const folderInfo = await this.googleDriveService.getFolderInfo(
      folderId,
      `${updateStt}. ${name}`,
    );

    console.log('updateStt', updateStt)
    console.log('name', name)
    console.log('folderId', folderId)
    console.log('folderInfo', folderInfo)

    const isPro = Number(price) > 0;

    // Chuẩn bị data để lưu vào DB
    const productData = {
      ...createProductDto,
      stt: Number(stt),
      images: (await imageUrl).url,
      isPro: isPro,
      name: `${updateStt}. Model ${createProductDto.name} 3dsmax`,
      // Nếu tìm thấy file RAR trên Drive thì lấy link, ngược lại dùng link dự phòng hoặc rỗng
      urlDownload: folderInfo?.rar?.id
        ? `https://drive.google.com/uc?id=${folderInfo.rar.id}`
        : createProductDto.urlDownload || '',
      size: folderInfo?.rar?.size_mb || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  /**
   * Tạo sản phẩm với file ảnh được upload trực tiếp từ client (Multipart form).
   * - Xử lý upload ảnh lên R2.
   * - Nếu tạo sản phẩm thất bại, tự động xóa ảnh đã upload để tránh rác.
   * 
   * @param {CreateProductDto} createProductDto - Thông tin sản phẩm.
   * @param {Object} file - Object chứa thông tin file đã upload.
   * @param {string} [file.imageUrl] - URL ảnh (nếu có).
   * @param {string} [file.location] - Location trả về từ S3/R2.
   * @param {string} [file.filename] - Tên file.
   * @param {string} [file.key] - Key trên R2 storage.
   * @returns {Promise<Product>} - Sản phẩm đã tạo.
   * 
   * @example
   * // Đầu vào:
   * const productDto = { name: "Product A", price: 100, categoryId: "cat123" };
   * const file = { key: "products/1234-uuid.jpg" };
   * 
   * // Gọi hàm:
   * const created = await productsService.createProductWithImageUpload(productDto, file);
   */
  async createProductWithImageUpload(
    createProductDto: CreateProductDto,
    file: {
      imageUrl?: string;
      location?: string;
      filename?: string;
      key?: string;
    },
  ): Promise<Product> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Ưu tiên sử dụng URL từ Cloudflare R2 (lấy từ uploadService)
    const imageUrl = file.key
      ? this.uploadService.getFileUrl(file.key)
      : 'default.jpg';

    const productData = {
      ...createProductDto,
      images: imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Try to create product
      const createdProduct = await this.createProductAndAddURL(productData);
      return createdProduct as Product;
    } catch (error) {
      // If there's an error and we have a file key, delete the uploaded image
      // (Rollback: xóa ảnh nếu lưu DB lỗi)
      if (file.key) {
        try {
          await this.uploadService.deleteFile(file.key);
        } catch (deleteError) {
          console.error(
            `Failed to delete uploaded file: ${file.key}`,
            deleteError,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Helper: Lấy URL hình ảnh từ object file upload.
   * Ưu tiên key R2 -> location -> imageUrl -> default.
   * 
   * @param {Object} file - Object chứa thông tin file.
   * @returns {string} - URL của hình ảnh.
   * 
   * @example
   * // Đầu vào:
   * const file = { key: "products/abc.jpg", location: "https://...", imageUrl: "https://..." };
   * 
   * // Gọi hàm:
   * const url = productsService.getImageUrl(file);
   * // => "https://r2.example.com/products/abc.jpg"
   */
  getImageUrl(file: {
    imageUrl?: string;
    location?: string;
    filename?: string;
    key?: string;
  }): string {
    if (!file) {
      return 'default.jpg';
    }

    // Ưu tiên sử dụng URL từ Cloudflare R2
    return file.key
      ? this.uploadService.getFileUrl(file.key)
      : file.location || file.imageUrl || 'default.jpg';
  }

  /**
   * Helper: Xóa danh sách các file đã upload (dùng khi cần rollback batch upload).
   * 
   * @param {string[]} fileKeys - Mảng các key file trên R2.
   * @returns {Promise<void>}
   * 
   * @example
   * await this.cleanupUploadedFiles(["products/a.jpg", "products/b.jpg"]);
   */
  private async cleanupUploadedFiles(fileKeys: string[]): Promise<void> {
    if (fileKeys.length === 0) return;

    for (const fileKey of fileKeys) {
      try {
        await this.uploadService.deleteFile(fileKey);
      } catch (error) {
        console.error(`Failed to delete file: ${fileKey}`, error);
      }
    }
  }

  /**
   * Tạo hàng loạt sản phẩm kèm theo upload ảnh cho từng sản phẩm.
   * - Map file upload với sản phẩm tương ứng theo index.
   * - Có cơ chế Commit/Rollback: Nếu bất kỳ sản phẩm nào lỗi hoặc lưu DB lỗi, 
   *   sẽ cố gắng xóa các ảnh đã upload.
   * 
   * @param {CreateProductDto[]} products - Mảng thông tin sản phẩm.
   * @param {Express.Multer.File[]} files - Mảng các file ảnh được upload (fieldname: "file-0", "file-1"...).
   * @returns {Promise<Object>} - Kết quả với success, message, data, errors.
   * 
   * @example
   * // Đầu vào:
   * const products = [
   *   { name: "Product 1", price: 100 },
   *   { name: "Product 2", price: 200 }
   * ];
   * const files = [
   *   { fieldname: "file-0", buffer: Buffer, originalname: "img1.jpg" },
   *   { fieldname: "file-1", buffer: Buffer, originalname: "img2.jpg" }
   * ];
   * 
   * // Gọi hàm:
   * const result = await productsService.createBatchWithImages(products, files);
   * 
   * // Đầu ra:
   * // { success: true, message: "Successfully created 2 products", data: [...] }
   */
  async createBatchWithImages(
    products: CreateProductDto[],
    files: Express.Multer.File[],
  ): Promise<{
    success: boolean;
    message: string;
    data?: Product[];
    errors?: any[];
  }> {
    const uploadedFileKeys: string[] = []; // Theo dõi các file đã upload để cleanup nếu lỗi

    try {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return {
          success: false,
          message: 'No products provided or invalid format',
        };
      }

      if (!files || files.length === 0) {
        return {
          success: false,
          message: 'No files uploaded',
        };
      }

      // Create a map of files by their field name (e.g., "file-0", "file-1")
      const fileMap = new Map<string, Express.Multer.File>();
      files.forEach((file) => {
        fileMap.set(file.fieldname, file);
      });

      // Process each product with its corresponding image
      const productsWithImages: CreateProductDto[] = [];
      const errors: string[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const file = fileMap.get(`file-${i}`);

        if (!file) {
          errors.push(`No image found for product at index ${i}`);
          continue;
        }

        // Upload image to storage
        try {
          // Use Buffer.from to convert file buffer to Buffer
          const buffer = Buffer.from(file.buffer);
          const uploadedFile = await this.uploadService.uploadFile(
            buffer,
            'products',
            file.originalname,
          );
          uploadedFileKeys.push(uploadedFile.key);
          const imageUrl = this.uploadService.getFileUrl(uploadedFile.key);

          // Add image URL to product data
          const productWithImage = {
            ...product,
          };
          // Add image URL using interface with optional images property
          interface ProductWithImage extends CreateProductDto {
            images?: string;
          }
          (productWithImage as ProductWithImage).images = imageUrl;
          productsWithImages.push(productWithImage);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to upload image for product at index ${i}: ${errorMessage}`,
          );
        }
      }

      if (productsWithImages.length === 0) {
        // Clean up uploaded files if no products were processed (Rollback toàn bộ)
        await this.cleanupUploadedFiles(uploadedFileKeys);
        return {
          success: false,
          message: 'Failed to process any products',
          errors,
        };
      }

      try {
        // Create all products in the database
        const createdProducts =
          await this.productModel.insertMany(productsWithImages);

        return {
          success: true,
          message: `Successfully created ${createdProducts.length} products`,
          data: createdProducts as unknown as Product[],
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error: unknown) {
        // If database insertion fails, clean up uploaded files (Rollback vì lỗi DB)
        await this.cleanupUploadedFiles(uploadedFileKeys);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          message: 'Failed to create products in database',
          errors: [errorMessage],
        };
      }
    } catch (error: unknown) {
      // Clean up any uploaded files on any global error (Safeguard)
      await this.cleanupUploadedFiles(uploadedFileKeys);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to create products',
        errors: [errorMessage],
      };
    }
  }

  /**
   * Lấy tất cả sản phẩm (không phân trang).
   * 
   * @returns {Promise<Product[]>} - Mảng tất cả sản phẩm.
   * 
   * @example
   * const allProducts = await productsService.findAll();
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  /**
   * Lấy sản phẩm có áp dụng bộ lọc (search, filter) và phân trang.
   * 
   * @param {FilterDto} filterDto - Object chứa các tham số lọc và phân trang.
   * @param {number} filterDto.page - Trang hiện tại (bắt đầu từ 1).
   * @param {number} filterDto.limit - Số lượng item mỗi trang.
   * @param {string} [filterDto.search] - Từ khóa tìm kiếm.
   * @param {string} [filterDto.sortBy] - Trường sắp xếp.
   * @param {string} [filterDto.sortOrder] - Thứ tự sắp xếp ('asc' | 'desc').
   * @returns {Promise<PaginatedResult<ProductDocument>>} - Kết quả phân trang.
   * 
   * @example
   * // Đầu vào:
   * const filter = { page: 1, limit: 10, search: "sofa", sortBy: "price", sortOrder: "desc" };
   * 
   * // Gọi hàm:
   * const result = await productsService.findAllWithFilters(filter);
   * 
   * // Đầu ra:
   * // {
   * //   items: [...],
   * //   meta: { totalItems: 100, itemCount: 10, itemsPerPage: 10, totalPages: 10, currentPage: 1 }
   * // }
   */
  async findAllWithFilters(
    filterDto: FilterDto,
  ): Promise<PaginatedResult<ProductDocument>> {

    console.log("filterDto", filterDto);
    return this.filterService.applyFilters(this.productModel, filterDto, {}, [
      'name',
      'description',
      'categoryName',
      'categoryPath',
      'style',
      'materials',
      'render',
      'form',
      'color',
      // Remove isPro from searchable fields as it's a boolean
    ]);
  }

  /**
   * Lấy chi tiết 1 sản phẩm theo ID.
   * 
   * @param {string} id - MongoDB ObjectId của sản phẩm.
   * @returns {Promise<Product | null>} - Sản phẩm hoặc null nếu không tìm thấy.
   * 
   * @example
   * const product = await productsService.findOne("507f1f77bcf86cd799439011");
   */
  async findOne(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  /**
   * Tìm các sản phẩm tương tự (Logic cơ bản/cũ).
   * Dựa trên:
   * 1. Cùng category (ưu tiên cao nhất).
   * 2. Các thuộc tính giống nhau (materials, style, render).
   * 3. Giá tiền xấp xỉ (+- 30%).
   * 
   * Nếu không đủ số lượng limit, sẽ lấy thêm các sản phẩm mới nhất để lấp đầy.
   * 
   * @param {string} id - ID của sản phẩm gốc cần tìm sản phẩm tương tự.
   * @param {number} [limit=10] - Số lượng sản phẩm tối đa trả về.
   * @returns {Promise<Product[]>} - Mảng các sản phẩm tương tự.
   * 
   * @example
   * const similar = await productsService.findSimilarByCategory("507f1f77bcf86cd799439011", 5);
   * // => [{ name: "Chair A", ... }, { name: "Chair B", ... }, ...]
   */
  async findSimilarByCategory(
    id: string,
    limit: number = 10,
  ): Promise<Product[]> {
    // Find the current product
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Build a query to find similar products
    const query: Record<string, any> = {
      _id: { $ne: id }, // Exclude current product (loại trừ chính nó)
      isActive: true, // Only include active products
    };

    // Match criteria based on available product attributes
    const matchCriteria: Record<string, any>[] = [];

    // Primary match: same category (Tiêu chí 1: Cùng danh mục)
    if (product.categoryId) {
      matchCriteria.push({ categoryId: product.categoryId });
    }

    // Secondary matches: similar attributes (Tiêu chí 2: Cùng thuộc tính)
    const secondaryMatches: Record<string, any>[] = [];

    if (product.materials) {
      secondaryMatches.push({ materials: product.materials });
    }

    if (product.style) {
      secondaryMatches.push({ style: product.style });
    }

    if (product.render) {
      secondaryMatches.push({ render: product.render });
    }

    // Price range (products within 30% of the original price) (Tiêu chí 3: Giá xấp xỉ)
    if (product.price) {
      const minPrice = product.price * 0.7;
      const maxPrice = product.price * 1.3;
      secondaryMatches.push({ price: { $gte: minPrice, $lte: maxPrice } });
    }

    // Combined query construction (Tạo query tổng hợp)
    // If we have secondary matches, add them to the query
    if (secondaryMatches.length > 0) {
      if (matchCriteria.length > 0) {
        // If we have primary category match, use that plus at least one secondary match
        query.$and = [{ $or: matchCriteria }, { $or: secondaryMatches }];
      } else {
        // If no category, just use secondary matches
        query.$or = secondaryMatches;
      }
    } else if (matchCriteria.length > 0) {
      // If only category matches are available
      query.$or = matchCriteria;
    }

    // Execute Find similar products
    const similarProducts = await this.productModel
      .find(query)
      .limit(limit)
      .sort({ createdAt: -1 }) // Get the newest products first
      .exec();

    // Strategy 2: Fill remaining slots if not enough matches found
    // (Lấp đầy nếu chưa đủ số lượng)
    if (similarProducts.length < limit) {
      const remainingLimit = limit - similarProducts.length;
      const existingIds = similarProducts.map((p) => p._id);

      // Broader query to find more products (Lấy sản phẩm bất kỳ mới nhất khác)
      const additionalProducts = await this.productModel
        .find({
          _id: {
            $ne: id,
            $nin: existingIds,
          },
          isActive: true,
        })
        .limit(remainingLimit)
        .sort({ createdAt: -1 })
        .exec();

      return [...similarProducts, ...additionalProducts];
    }

    return similarProducts;
  }

  /**
   * Cập nhật thông tin sản phẩm.
   * 
   * @param {string} id - ID của sản phẩm cần cập nhật.
   * @param {UpdateProductDto} updateProductDto - Object chứa các trường cần cập nhật.
   * @returns {Promise<Product | null>} - Sản phẩm đã cập nhật hoặc null.
   * 
   * @example
   * const updated = await productsService.update("507f...", { price: 150, name: "New Name" });
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
  }

  /**
   * Xóa sản phẩm.
   * - Tự động xóa file ảnh trên R2 storage nếu tồn tại để tiết kiệm bộ nhớ.
   * 
   * @param {string} id - ID của sản phẩm cần xóa.
   * @returns {Promise<Product | null>} - Sản phẩm đã xóa hoặc null.
   * @throws {NotFoundException} - Nếu không tìm thấy sản phẩm.
   * 
   * @example
   * const deleted = await productsService.remove("507f1f77bcf86cd799439011");
   */
  async remove(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Xóa ảnh trên storage nếu có
    if (product.images) {
      const imageKey = this.uploadService.getKeyFromUrl(product.images);
      // console.log('imageKey', imageKey);
      if (imageKey) {
        await this.uploadService.deleteFile(`products/${imageKey}`);
      }
    }

    return this.productModel.findByIdAndDelete(id).exec();
  }

  /**
   * Lấy chi tiết sản phẩm theo ID với các trường select cụ thể (tối ưu hóa).
   * 
   * @param {string} id - ID sản phẩm.
   * @returns {Promise<Product | null>} - Sản phẩm với các trường được chọn.
   * 
   * @example
   * const product = await productsService.findById("507f...");
   * // => { urlDownload, price, discount, images, name, categoryName, isPro, quantityCommand, format }
   */
  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).select('urlDownload price discount images name categoryName isPro quantityCommand format');
  }

  /**
   * Lấy số thứ tự (STT) cuối cùng trong một danh mục để sinh STT tiếp theo.
   * 
   * @param {string} rootCategoryId - ID danh mục gốc (Root Category).
   * @param {string} categoryId - ID danh mục con.
   * @returns {Promise<number>} - Số thứ tự lớn nhất hiện tại (0 nếu chưa có).
   * 
   * @example
   * const lastStt = await productsService.getLastSttFromCategory("rootId", "catId");
   * // => 15 (sản phẩm tiếp theo sẽ là 16)
   */
  async getLastSttFromCategory(
    rootCategoryId: string,
    categoryId: string,
  ): Promise<number> {
    const rootCategory = await this.productModel
      .findOne({
        rootCategoryId: rootCategoryId,
        categoryId: categoryId,
        isActive: true,
      })
      .sort({ stt: -1 })
      .exec();

    return rootCategory?.stt || 0;
  }

  /**
   * Tìm kiếm file hình ảnh theo tên và trả về URL trực tiếp.
   * (Sử dụng Google Drive Service)
   * 
   * @param {string} searchTerm - Từ khóa tìm kiếm (tên file).
   * @param {string} folderId - ID thư mục Google Drive cần tìm.
   * @returns {Promise<Object>} - Object chứa url, name, id của file ảnh.
   * 
   * @example
   * const image = await productsService.searchImageByName("bedroom", "folderId123");
   * // => { url: "https://drive.google.com/...", name: "bedroom.jpg", id: "fileId" }
   */
  async searchImageByName(
    searchTerm: string,
    folderId: string,
  ): Promise<{ url: string; name: string; id: string }> {
    try {
      // Sử dụng phương thức searchImageByName từ GoogleDriveService
      const result = await this.googleDriveService.searchImageByName(
        searchTerm,
        folderId,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Không thể tìm kiếm hình ảnh: ${errorMessage}`,
      );
    }
  }

  /**
   * Lấy danh sách sản phẩm gợi ý dựa trên hình ảnh (Visual Recommendation).
   * Đây là tính năng nâng cao sử dụng AI (CLIP).
   * 
   * Quy trình:
   * 1. Xác định sản phẩm gốc từ ID.
   * 2. Gọi sang Service Python (CLIP) để tìm các vector ảnh tương tự.
   * 3. Lấy danh sách ProductID từ kết quả trả về của CLIP.
   * 4. Query DB để lấy thông tin chi tiết các sản phẩm đó.
   * 5. Sắp xếp lại đúng theo độ tương đồng mà AI trả về.
   * 6. Fallback: Nếu AI lỗi hoặc không có kết quả, dùng logic `findSimilarByCategory` cũ.
   * 
   * @param {string} id - ID của sản phẩm gốc.
   * @param {number} [limit=10] - Số lượng sản phẩm gợi ý tối đa.
   * @returns {Promise<Product[]>} - Mảng sản phẩm gợi ý.
   * 
   * @example
   * const recommendations = await productsService.getRecommendedProducts("507f...", 8);
   * // => [{ name: "Similar Product 1", score: 0.95, ... }, ...]
   */
  async getRecommendedProducts(id: string, limit: number = 10): Promise<Product[]> {
    try {
      // 1. Lấy thông tin sản phẩm gốc
      const product = await this.productModel.findById(id).exec();
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // 2. Gọi service CLIP để lấy danh sách gợi ý
      // Lưu ý: ImageSearchService.getRecommendations trả về { source_product, recommendations: [...] }
      const searchResult = await this.imageSearchService.getRecommendations(id, limit);

      if (!searchResult || !searchResult.recommendations || searchResult.recommendations.length === 0) {
        // Fallback: Nếu không có kết quả từ CLIP, dùng logic tìm kiếm cũ (theo category/attribute)
        return this.findSimilarByCategory(id, limit);
      }

      // 3. Map từ kết quả search (path/metadata) về Product entity của backend
      // CLIP service trả về metadata chứa product_id, ta dùng nó để query DB

      const productIds = searchResult.recommendations
        .map(item => item.metadata?.product_id).filter(id => id);

      if (productIds.length === 0) {
        return this.findSimilarByCategory(id, limit);
      }

      // Fetch products từ DB theo list ID để đảm bảo data mới nhất (price, name...)
      // Dùng $in để lấy tất cả 1 lượt
      const recommendedProducts = await this.productModel.find({
        _id: { $in: productIds },
        isActive: true
      }).exec();

      // Sắp xếp lại theo thứ tự score từ CLIP (vì $in không giữ thứ tự)
      const sortedProducts = productIds
        .map(id => recommendedProducts.find(p => (p as any)._id.toString() === id))
        .filter(p => p !== undefined); // Lọc bỏ nếu không tìm thấy trong DB

      // Nếu số lượng ít hơn limit, bổ sung thêm bằng thuật toán cũ (Hybrid approach)
      if (sortedProducts.length < limit) {
        const moreProducts = await this.findSimilarByCategory(id, limit - sortedProducts.length);

        // Filter duplicates (Loại bỏ trùng lặp)
        const existingIds = new Set(sortedProducts.map(p => (p as any)._id.toString()));
        for (const p of moreProducts) {
          if (!existingIds.has((p as any)._id.toString())) {
            sortedProducts.push(p);
          }
        }
      }

      return sortedProducts;

    } catch (error) {
      console.error(`Error getting recommendations for product ${id}:`, error);
      // Fallback gracefully (Vẫn trả về kết quả cũ nếu hệ thống AI gặp sự cố)
      return this.findSimilarByCategory(id, limit);
    }
  }

  /**
   * Xóa nhiều sản phẩm cùng lúc theo danh sách ID.
   * 
   * @param {string[]} ids - Mảng các ID sản phẩm cần xóa.
   * @returns {Promise<void>}
   * 
   * @example
   * await productsService.removeProducts(["id1", "id2", "id3"]);
   */
  async removeProducts(ids: string[]): Promise<void> {
    // console.log(ids)
    for (const id of ids) {
      await this.remove(id);
    }
    return;
  }

  /**
   * Lấy tất cả sản phẩm, populate category và sort theo STT.
   * Thường dùng cho trang Admin.
   * 
   * @returns {Promise<Product[]>} - Mảng sản phẩm với thông tin category đầy đủ.
   * 
   * @example
   * const products = await productsService.getAllProductGroupByCategory();
   */
  async getAllProductGroupByCategory(): Promise<Product[]> {
    return await this.productModel.find().populate('categoryId').sort({ stt: -1 }).exec();
  }

  /**
   * Cập nhật số lượng đã bán/order (quantityCommand).
   * 
   * @param {string} id - ID sản phẩm.
   * @param {number} quantityCommand - Số lượng mới.
   * @returns {Promise<Product | null>}
   * 
   * @example
   * await productsService.updateQuantityCommand("productId", 50);
   */
  async updateQuantityCommand(id: string, quantityCommand: number): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, { quantityCommand }, { new: true }).exec();
  }

  /**
   * Tăng số lượng đã bán/order lên 1.
   * 
   * @param {string} id - ID sản phẩm.
   * @returns {Promise<Product | null>}
   * 
   * @example
   * await productsService.incrementQuantityCommand("productId");
   * // quantityCommand: 10 -> 11
   */
  async incrementQuantityCommand(id: string): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(
      id,
      { $inc: { quantityCommand: 1 } },
      { new: true }
    ).exec();
  }
}
