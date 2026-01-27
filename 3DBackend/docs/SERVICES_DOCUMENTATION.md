# Mô tả chi tiết các Services - Hệ thống 3D Models Platform

## 1. Nhóm Services Quản lý Người dùng

### 1.1 Auth Service (Xác thực)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích xác thực và phân quyền người dùng trong hệ thống. Service bao gồm các chức năng đăng ký tài khoản mới với xác thực email, đăng nhập và cấp phát JWT token, làm mới access token thông qua refresh token, khôi phục mật khẩu qua email, và xác minh địa chỉ email người dùng. Service này đảm bảo an toàn bảo mật cho toàn bộ hệ thống thông qua cơ chế JWT và mã hóa mật khẩu bằng bcrypt.

### 1.2 Users Service (Người dùng)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý thông tin cá nhân người dùng. Service bao gồm các chức năng tạo mới, cập nhật, xóa thông tin người dùng, quản lý số dư ví điện tử, thay đổi mật khẩu, và cập nhật ảnh đại diện. Service này là trung tâm lưu trữ thông tin tài khoản và được sử dụng bởi nhiều service khác trong hệ thống.

---

## 2. Nhóm Services Thanh toán

### 2.1 Transactions Service (Giao dịch)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý tất cả giao dịch tài chính trong hệ thống. Service xử lý 4 loại giao dịch chính: nạp tiền (Deposit), thanh toán mua sản phẩm (Payment), rút tiền (Withdrawal), và hoàn tiền (Refund). Service tích hợp với PayPal để xử lý thanh toán quốc tế, bao gồm tạo đơn hàng PayPal, xác nhận thanh toán, và xử lý webhook tự động. Ngoài ra, service còn cung cấp thống kê giao dịch theo thời gian phục vụ cho dashboard quản trị.

### 2.2 VNPay Service (Thanh toán VNPay)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích tích hợp cổng thanh toán VNPay cho người dùng Việt Nam. Service bao gồm các chức năng tạo URL thanh toán, xử lý callback sau khi người dùng thanh toán thành công, xử lý IPN (Instant Payment Notification) từ VNPay, và tự động cộng tiền vào ví người dùng. Service hỗ trợ nhiều phương thức thanh toán như thẻ ATM nội địa, Visa/Mastercard, QR Code, và Internet Banking.

### 2.3 VQR Service (Mã QR chuyển khoản)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích tạo mã QR chuyển khoản ngân hàng theo chuẩn VietQR. Service cho phép người dùng thanh toán bằng cách quét mã QR và chuyển khoản trực tiếp qua ứng dụng ngân hàng.

---

## 3. Nhóm Services Nghiệp vụ Chính

### 3.1 Products Service (Sản phẩm)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý thông tin sản phẩm mô hình 3D. Service bao gồm các chức năng thêm mới, sửa, xóa và cập nhật thông tin sản phẩm. Ngoài ra, service cung cấp chức năng tìm kiếm sản phẩm theo từ khóa, lọc theo danh mục, giá cả, định dạng file, và sắp xếp theo nhiều tiêu chí. Service cũng theo dõi số lượt tải xuống và cung cấp thống kê sản phẩm cho quản trị viên.

### 3.2 Orders Service (Đơn hàng)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích xử lý quy trình mua sản phẩm. Service thực hiện luồng mua hàng hoàn chỉnh bao gồm: kiểm tra số dư người dùng, lấy thông tin sản phẩm, tính toán giá sau giảm giá, trừ tiền từ ví, tạo giao dịch thanh toán, lưu đơn hàng, và tạo link tải file có thời hạn. Service có cơ chế rollback tự động để hoàn tiền cho người dùng nếu có lỗi xảy ra trong quá trình xử lý.

### 3.3 Categories Service (Danh mục)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý danh mục sản phẩm theo cấu trúc phân cấp (cây). Service bao gồm các chức năng tạo, sửa, xóa danh mục, lấy danh mục con, và hiển thị cây danh mục. Mỗi sản phẩm sẽ thuộc về một hoặc nhiều danh mục để người dùng dễ dàng tìm kiếm.

### 3.4 Comment Service (Bình luận)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý bình luận và đánh giá sản phẩm. Service bao gồm các chức năng tạo bình luận mới, trả lời bình luận, like/unlike bình luận, và xóa bình luận. Service giúp tăng tương tác giữa người dùng và tạo độ tin cậy cho sản phẩm thông qua đánh giá của cộng đồng.

---

## 4. Nhóm Services Lưu trữ

### 4.1 Google Drive Service (Lưu trữ file)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích tích hợp với Google Drive để lưu trữ file sản phẩm. Service bao gồm các chức năng upload file lên Drive, tạo link tải có thời hạn (signed URL), quản lý quyền truy cập file, và thu hồi quyền sau khi hết hạn. Service sử dụng Service Account để đảm bảo bảo mật và tự động dọn dẹp permission hết hạn thông qua cron job.

### 4.2 Upload Service (Upload file)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích upload file lên Cloudflare R2. Service xử lý việc upload ảnh thumbnail sản phẩm, ảnh đại diện người dùng, và các file media khác. Service hỗ trợ upload đơn lẻ và upload nhiều file cùng lúc.

---

## 5. Nhóm Services Tìm kiếm

### 5.1 Image Search Service (Tìm kiếm bằng ảnh)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích tìm kiếm sản phẩm tương tự bằng hình ảnh. Service sử dụng mô hình CLIP (Contrastive Language-Image Pre-Training) của OpenAI để trích xuất đặc trưng ảnh, kết hợp với FAISS (Facebook AI Similarity Search) để tìm kiếm nhanh các sản phẩm có độ tương đồng cao. Đây là tính năng nổi bật giúp người dùng tìm kiếm sản phẩm một cách trực quan.

---

## 6. Nhóm Services Hỗ trợ Khách hàng

### 6.1 Support Service (Ticket hỗ trợ)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý hệ thống ticket hỗ trợ khách hàng. Service bao gồm các chức năng tạo ticket mới, nhân viên trả lời ticket, theo dõi trạng thái ticket (Mở, Đang xử lý, Đã giải quyết, Đóng), và thông báo cho người dùng khi có phản hồi mới.

### 6.2 Refund Service (Hoàn tiền)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích xử lý yêu cầu hoàn tiền từ người dùng. Service bao gồm các chức năng tạo yêu cầu hoàn tiền, quản trị viên duyệt hoặc từ chối yêu cầu, tự động hoàn tiền vào ví người dùng khi được duyệt, và thu hồi quyền truy cập file khi hoàn tiền.

---

## 7. Nhóm Services Thông báo

### 7.1 Notifications Service (Thông báo)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý thông báo trong ứng dụng. Service bao gồm các chức năng tạo thông báo mới, lấy danh sách thông báo của người dùng, đánh dấu thông báo đã đọc, và đếm số thông báo chưa đọc. Thông báo được sử dụng để thông tin cho người dùng về đơn hàng, bình luận, hoàn tiền, và các sự kiện quan trọng khác.

### 7.2 Mail Service (Email)
Nhiệm vụ của service này là cung cấp các chức năng gửi email cho người dùng. Service xử lý việc gửi email xác thực tài khoản, email khôi phục mật khẩu, email xác nhận đơn hàng thành công, và email thông báo hoàn tiền. Service sử dụng Nodemailer với SMTP để gửi email.

---

## 8. Nhóm Services Tiện ích

### 8.1 Filter Service (Lọc dữ liệu)
Nhiệm vụ của service này là cung cấp các chức năng xử lý phân trang, lọc, và sắp xếp dữ liệu. Service được sử dụng chung bởi tất cả các module cần hiển thị danh sách có phân trang, hỗ trợ các tham số page, limit, sortBy, sortOrder, và search.

### 8.2 Captcha Service (Xác thực CAPTCHA)
Nhiệm vụ của service này là cung cấp các chức năng xác thực Google reCAPTCHA. Service được sử dụng để bảo vệ các form nhạy cảm như đăng ký, đăng nhập, và quên mật khẩu khỏi bot tự động.

### 8.3 Schedule Service (Tác vụ định kỳ)
Nhiệm vụ của service này là cung cấp các cron job chạy định kỳ. Service bao gồm các tác vụ như dọn dẹp permission Google Drive hết hạn (mỗi 5 phút), xóa session hết hạn, và gửi thông báo định kỳ.

---

## 9. Nhóm Services Nội dung

### 9.1 Banner Service (Banner quảng cáo)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý banner quảng cáo hiển thị trên trang chủ. Service bao gồm các chức năng tạo, sửa, xóa banner, và lấy danh sách banner đang hoạt động theo thứ tự sắp xếp.

### 9.2 Master Data Service (Dữ liệu tĩnh)
Nhiệm vụ của service này là cung cấp các API nhằm mục đích quản lý dữ liệu tĩnh của hệ thống. Service lưu trữ các thông tin như danh sách màu sắc, chất liệu, phong cách, và các thuộc tính khác dùng để phân loại sản phẩm. Dữ liệu này được sử dụng cho các dropdown lọc sản phẩm trên giao diện.

---

## Sơ đồ kiến trúc hệ thống

Hệ thống 3D Models Platform sử dụng kiến trúc **Monolith** (đơn khối), trong đó tất cả các services được đóng gói trong một ứng dụng NestJS duy nhất và chia sẻ chung một cơ sở dữ liệu MongoDB.

![Sơ đồ kiến trúc hệ thống](./images/architecture.png)

**Giải thích sơ đồ:**
- **API Layer**: 6 API endpoints chính (Auth, Product, Order, Transaction, Support, Notification) tiếp nhận request từ client.
- **Service Layer**: Các business logic services được tổ chức trong NestJS Backend.
- **Database**: MongoDB duy nhất lưu trữ tất cả dữ liệu của hệ thống.
- **External Integrations**: Tích hợp bên ngoài bao gồm Google Drive (lưu trữ file), VNPay/PayPal (thanh toán), và CLIP Service (tìm kiếm ảnh AI).

---

## Tổng kết

Hệ thống 3D Models Platform được thiết kế với kiến trúc module hóa, bao gồm **21 services chính** được phân chia thành 9 nhóm chức năng. Các service được thiết kế theo nguyên tắc Single Responsibility, mỗi service chỉ đảm nhiệm một nhiệm vụ cụ thể và có thể tái sử dụng trong nhiều ngữ cảnh khác nhau. Việc phân chia rõ ràng này giúp hệ thống dễ bảo trì, mở rộng và kiểm thử.
