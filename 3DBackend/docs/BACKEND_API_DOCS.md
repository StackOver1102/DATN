# 3D Models Platform - Backend API Documentation

> Tài liệu API cho hệ thống bán mô hình 3D  
> Ngôn ngữ: TypeScript | Framework: NestJS | Database: MongoDB

---

## 📋 Mục lục

- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Core Services](#1-core-services)
- [Integration Services](#2-integration-services)
- [Feature Services](#3-feature-services)
- [Scheduled Services](#4-scheduled-services)
- [Data Models](#data-models)
- [Environment Variables](#environment-variables)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NestJS Backend                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Auth      │ │   Users     │ │  Products   │ │   Orders    │ │
│  │   Service   │ │   Service   │ │   Service   │ │   Service   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │Transactions │ │  Comments   │ │   Support   │ │   Refund    │ │
│  │   Service   │ │   Service   │ │   Service   │ │   Service   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│    MongoDB    │      │ Google Drive  │      │ Cloudflare R2 │
│   Database    │      │    Storage    │      │   (S3/CDN)    │
└───────────────┘      └───────────────┘      └───────────────┘
```

---

## 1. Core Services

### 1.1 AuthService
**File:** `src/auth/auth.service.ts`

Xử lý xác thực, đăng ký, đăng nhập, và quản lý JWT.

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `login(loginDto)` | Đăng nhập user | `{email, password, captchaToken?}` | `{access_token, user}` |
| `registerUser(createUserDto)` | Đăng ký tài khoản | `{email, password, fullName}` | `UserDocument` |
| `verifyAccount(token)` | Xác thực email | `token: string` | `{message}` |
| `forgotPassword(dto)` | Yêu cầu reset password | `{email, captchaToken}` | `{message}` |
| `resetPassword(dto)` | Đặt lại password | `{token, password, captchaToken}` | `{message}` |
| `loginByAdmin(loginDto)` | Đăng nhập Admin | `{email, password}` | `{access_token, user}` |

---

### 1.2 UsersService
**File:** `src/users/users.service.ts`

Quản lý người dùng, số dư, và thông tin cá nhân.

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `create(createUserDto)` | Tạo user mới | `{email, password, fullName?}` | `UserDocument` |
| `findByEmail(email)` | Tìm theo email | `email: string` | `UserDocument \| null` |
| `findOne(id)` | Lấy chi tiết user | `id: string` | `UserDocument` |
| `updateBalance(id, balance)` | Cập nhật số dư | `id, newBalance` | `UserDocument` |
| `changePassword(old, new, userId)` | Đổi mật khẩu | `oldPass, newPass, userId` | `void` |

---

### 1.3 ProductsService
**File:** `src/products/products.service.ts`

Quản lý sản phẩm, tìm kiếm, gợi ý.

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `create(dtos)` | Tạo sản phẩm | `CreateProductDto[]` | `Product[]` |
| `findAllWithFilters(filterDto)` | Lấy SP có filter | `{page, limit, search}` | `PaginatedResult` |
| `findOne(id)` | Chi tiết SP | `id: string` | `Product` |
| `getRecommendedProducts(id)` | Gợi ý SP (AI) | `id, limit?` | `Product[]` |
| `findSimilarByCategory(id)` | SP tương tự (rule) | `id, limit?` | `Product[]` |
| `remove(id)` | Xóa SP + ảnh R2 | `id: string` | `Product` |

---

### 1.4 OrdersService
**File:** `src/orders/orders.service.ts`

Xử lý đơn hàng, tải file, quản lý quyền truy cập.

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `create(dto, userId)` | Tạo đơn hàng | `{productId}` | `{orderId, downloadUrl, filename}` |
| `downloadOrderFile(orderId, userId)` | Tải lại file | `orderId, userId` | `{downloadUrl, filename, mimeType}` |
| `findByUserId(userId, filter)` | Đơn hàng của user | `userId, filterDto` | `PaginatedResult` |
| `update(id, dto)` | Cập nhật (Admin) | `id, updateDto` | `Order` |
| `getOrdersWithExpiredPermissions()` | Lấy đơn hết hạn | - | `OrderDocument[]` |

---

### 1.5 TransactionsService
**File:** `src/transactions/transactions.service.ts`

Quản lý giao dịch, tích hợp PayPal, VQR.

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `create(dto, userId)` | Tạo giao dịch | `{amount, type}` | `TransactionDocument` |
| `createPayPalOrder(dto, userId)` | Tạo order PayPal | `{amount, currency}` | `{paypalOrderId, approveUrl}` |
| `approvePayPalOrder(orderId, userId)` | Xác nhận PayPal | `orderId, userId` | `{success, balance}` |
| `processPayPalWebhook(payload, headers)` | Xử lý webhook | `payload, headers` | `{status}` |
| `getTransactionStats(period)` | Thống kê (Chart) | `'7d' \| '30d' \| '90d'` | `{data: [...]}` |
| `getTotalSpentByUser(userId)` | Tổng tiền đã tiêu | `userId` | `number` |

---

## 2. Integration Services

### 2.1 GoogleDriveService
**File:** `src/drive/google-drive.service.ts`

Tích hợp Google Drive API.

| Method | Description |
|--------|-------------|
| `listFilesAndFolders(folderId)` | Liệt kê files/folders |
| `generateSignedDownloadUrl(fileId, minutes)` | Tạo link tải tạm |
| `addDrivePermission(fileId, email)` | Cấp quyền truy cập |
| `removeDrivePermission(fileId, email)` | Thu hồi quyền |
| `revokePermission(permissionId, fileId)` | Xóa permission ID |

---

### 2.2 UploadService
**File:** `src/upload/upload.service.ts`

Upload file lên Cloudflare R2.

| Method | Description |
|--------|-------------|
| `uploadFile(buffer, folder, filename)` | Upload buffer |
| `uploadLocalToR2(localPath)` | Upload file local |
| `deleteFile(key)` | Xóa file |
| `getFileUrl(key)` | Lấy URL public |

---

### 2.3 MailService
**File:** `src/mail/mail.service.ts`

Gửi email qua Nodemailer/Mailer.

| Method | Description |
|--------|-------------|
| `sendWelcomeEmail(user)` | Email chào mừng |
| `sendResetPasswordEmail(user, token)` | Email reset password |
| `sendAccountVerificationEmail(user, token)` | Email xác thực |
| `sendSupportRequestConfirmation(request)` | Xác nhận yêu cầu hỗ trợ |
| `sendSupportResponse(request)` | Phản hồi hỗ trợ |

---

### 2.4 VqrService
**File:** `src/vqr/vqr.service.ts`

Tích hợp VietQR (QR chuyển khoản).

| Method | Description |
|--------|-------------|
| `userLogin(email, password)` | Đăng nhập VQR |
| `syncTransaction(payload)` | Đồng bộ giao dịch |
| `generateQRCode(transactionId, amount)` | Tạo mã QR |

---

## 3. Feature Services

### 3.1 CategoriesService
**File:** `src/categories/categories.service.ts`

| Method | Description |
|--------|-------------|
| `create(dto)` | Tạo danh mục |
| `findAll()` | Lấy tất cả |
| `findChildren(parentId)` | Danh mục con |
| `getAllCategoriesGroupByParentId()` | Cây danh mục (Mega Menu) |

---

### 3.2 CommentService
**File:** `src/comment/comment.service.ts`

| Method | Description |
|--------|-------------|
| `create(dto, userId)` | Tạo bình luận (chờ duyệt) |
| `findByProductId(productId)` | Bình luận của SP (đã duyệt) |
| `approveComment(id)` | Duyệt bình luận (Admin) |

---

### 3.3 SupportService
**File:** `src/support/support.service.ts`

| Method | Description |
|--------|-------------|
| `create(dto, userId?)` | Tạo ticket hỗ trợ |
| `findByStatus(status)` | Lọc theo trạng thái |
| `respond(id, dto, adminId)` | Phản hồi (Admin) |

---

### 3.4 RefundService
**File:** `src/refund/refund.service.ts`

| Method | Description |
|--------|-------------|
| `create(dto, userId)` | Yêu cầu hoàn tiền |
| `update(id, dto)` | Duyệt/Từ chối (Admin) |
| `processRefund(refund)` | Logic hoàn tiền vào ví |

---

### 3.5 NotificationsService
**File:** `src/notifications/notifications.service.ts`

| Method | Description |
|--------|-------------|
| `create(dto)` | Tạo thông báo |
| `getUnreadCount()` | Đếm chưa đọc (by type) |
| `markAsRead(id)` | Đánh dấu đã đọc |

---

## 4. Scheduled Services

### ScheduleService
**File:** `src/schedule/schedule.service.ts`

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| `handleCleanupExpiredPermissions` | Every 10 mins | Thu hồi quyền Google Drive hết hạn |
| `handleDailyTask` | Daily 00:00 | Dọn dẹp dữ liệu cũ |
| `handleHourlyTask` | Every hour | Backup/Sync data |

---

## Data Models

### User
```typescript
{
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  balance: number;       // Số dư ví
  role: 'user' | 'admin';
  isVerified: boolean;
}
```

### Product
```typescript
{
  name: string;
  stt: number;           // Số thứ tự
  price: number;
  discount?: number;
  images: string;        // URL ảnh (R2)
  urlDownload: string;   // URL file (Google Drive)
  categoryId: ObjectId;
  isPro: boolean;        // Có trả phí không
  quantityCommand: number; // Số lượt mua
}
```

### Order
```typescript
{
  userId: ObjectId;
  productId: ObjectId;
  transactionId: ObjectId;
  fileId: string;        // Google Drive file ID
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  tempPermissionId?: string;
  permissionExpiresAt?: Date;
}
```

### Transaction
```typescript
{
  userId: ObjectId;
  amount: number;
  type: 'DEPOSIT' | 'PAYMENT' | 'WITHDRAWAL' | 'REFUND';
  method?: 'PAYPAL' | 'BANK_TRANSFER' | 'WALLET';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  balanceBefore: number;
  balanceAfter: number;
  transactionCode: string; // TX20231025000001
}
```

---

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/3dmodels

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=7d

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx

# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
R2_PUBLIC_URL=https://xxx.r2.dev

# VQR
VQR_API_URL=https://api.vietqr.io
VQR_CLIENT_ID=xxx
VQR_CLIENT_SECRET=xxx

# Mail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=xxx@gmail.com
MAIL_PASSWORD=xxx

# Frontend
FRONTEND_URL=https://example.com
```

---

## 📝 Notes

- Tất cả các service đều có comments **tiếng Việt** chi tiết với format JSDoc
- Mỗi method có `@param`, `@returns`, và `@example`
- Permission Google Drive tự động được thu hồi sau thời gian quy định
- Hệ thống có rollback khi tạo đơn hàng thất bại
