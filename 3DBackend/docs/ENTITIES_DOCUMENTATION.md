# Mô tả các Entity (Thực thể) - Hệ thống 3D Models Platform

Tài liệu này mô tả chi tiết cấu trúc dữ liệu của các thực thể trong hệ thống, sử dụng MongoDB làm cơ sở dữ liệu.

---

## 1. User (Người dùng)

Thực thể lưu trữ thông tin tài khoản người dùng.

```
fullName: string;
email: string;
password: string;
role: enum (USER, ADMIN);
address: string;
phone: string;
avatar: string;
isDeleted: boolean;
isVerified: boolean;
balance: number;
productLike: ObjectId[];
createdAt: Date;
updatedAt: Date;
```

---

## 2. Product (Sản phẩm)

Thực thể lưu trữ thông tin sản phẩm mô hình 3D.

```
name: string;
description: string;
price: number;
discount: number;
folderId: string;
images: string;
sold: number;
isActive: boolean;
rating: number;
views: number;
likes: number;
isPro: boolean;
isNew: boolean;
size: number;
categoryId: ObjectId;
categoryName: string;
rootCategoryId: ObjectId;
categoryPath: string;
materials: enum (PBR, NON_PBR, MIXED);
style: enum (REALISTIC, STYLIZED, CARTOON, LOWPOLY);
render: enum (VRAY, CORONA, ARNOLD, OCTANE, CYCLES);
form: enum (SINGLE, SET, COLLECTION);
color: string;
urlDownload: string;
nameFolder: string;
stt: number;
platform: string;
quantityCommand: number;
createdAt: Date;
updatedAt: Date;
```

---

## 3. Order (Đơn hàng)

Thực thể lưu trữ thông tin đơn hàng khi người dùng mua sản phẩm.

```
userId: ObjectId;
productId: ObjectId;
totalAmount: number;
status: enum (PENDING, PROCESSING, COMPLETED, CANCELLED, REFUNDED);
transactionId: ObjectId;
isPaid: boolean;
paidAt: Date;
fileId: string;
isRemoveGoogleDrive: boolean;
tempPermissionId: string;
permissionExpiresAt: Date;
createdAt: Date;
updatedAt: Date;
```

---

## 4. Transaction (Giao dịch)

Thực thể lưu trữ thông tin giao dịch tài chính.

```
userId: ObjectId;
method: enum (PAYPAL, VNPAY, BANK_TRANSFER, WALLET);
amount: number;
type: enum (DEPOSIT, PAYMENT, WITHDRAWAL, REFUND);
description: string;
status: enum (PENDING, SUCCESS, FAILED, CANCELLED);
transactionCode: string;
orderId: ObjectId;
balanceBefore: number;
balanceAfter: number;
createdAt: Date;
updatedAt: Date;
```

---

## 5. Category (Danh mục)

Thực thể lưu trữ danh mục sản phẩm theo cấu trúc cây.

```
name: string;
parentId: ObjectId;
isActive: boolean;
image: string;
icon: string;
createdAt: Date;
updatedAt: Date;
```

---

## 6. Comment (Bình luận)

Thực thể lưu trữ bình luận và đánh giá sản phẩm.

```
userId: ObjectId;
productId: ObjectId;
content: string;
rating: number;
isApproved: boolean;
createdAt: Date;
updatedAt: Date;
```

---

## 7. Notification (Thông báo)

Thực thể lưu trữ thông báo cho người dùng.

```
message: string;
isRead: boolean;
isWatching: boolean;
originalId: string;
originType: enum (ORDER, REFUND, SUPPORT, COMMENT);
userId: ObjectId;
createdAt: Date;
updatedAt: Date;
```

---

## 8. Banner (Banner quảng cáo)

Thực thể lưu trữ banner hiển thị trên trang web.

```
title: string;
description: string;
imageUrl: string;
isActive: boolean;
position: enum (HOME, PRODUCT_DETAIL, ABOUT);
url: string;
createdAt: Date;
updatedAt: Date;
```

---

## 9. Refund (Yêu cầu hoàn tiền)

Thực thể lưu trữ yêu cầu hoàn tiền từ người dùng.

```
userId: ObjectId;
orderId: ObjectId;
transactionId: ObjectId;
amount: number;
status: enum (PENDING, APPROVED, REJECTED, COMPLETED);
description: string;
imagesByAdmin: string[];
adminNotes: string;
processedAt: Date;
processedBy: ObjectId;
isWatchingByAdmin: boolean;
isWatchingByUser: boolean;
attachments: string[];
createdAt: Date;
updatedAt: Date;
```

---

## 10. SupportRequest (Yêu cầu hỗ trợ)

Thực thể lưu trữ ticket hỗ trợ khách hàng.

```
name: string;
phone: string;
email: string;
message: string;
attachments: string[];
imagesByAdmin: string[];
status: enum (PENDING, IN_PROGRESS, RESOLVED, CLOSED);
response: string;
respondedAt: Date;
respondedBy: ObjectId;
userId: ObjectId;
adminResponse: string;
isWatchingByAdmin: boolean;
isWatchingByUser: boolean;
createdAt: Date;
updatedAt: Date;
```

---

## 11. MasterData (Dữ liệu tĩnh)

Thực thể lưu trữ dữ liệu tĩnh của hệ thống (màu sắc, chất liệu, phong cách...).

```
type: string;
code: string;
name: string;
content: string;
isActive: boolean;
order: number;
createdAt: Date;
updatedAt: Date;
```

---

## 12. VnpaySession (Phiên thanh toán VNPay)

Thực thể lưu trữ phiên thanh toán VNPay.

```
txnRef: string;
userId: ObjectId;
amount: number;
description: string;
paymentStatus: enum (PENDING, COMPLETED, FAILED, CANCELLED);
platform: enum (WEB, MOBILE, APP);
appScheme: string;
expiresAt: Date;
vnpayResponse: Object;
transactionCode: string;
createdAt: Date;
updatedAt: Date;
```

