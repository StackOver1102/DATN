# 2.3.3. Đặc tả usecase "Đặt hàng"

*Bảng 2.5 Đặc tả usecase "Đặt hàng"*

| Thành phần | Mô tả |
|------------|-------|
| **Tên UC** | Đặt hàng |
| **Điều kiện bắt đầu** | Người dùng đã đăng nhập vào hệ thống.<br>Người dùng có đủ số dư trong ví để thanh toán.<br>Sản phẩm tồn tại và có file tải về trên hệ thống. |
| **Tác nhân** | Người dùng (khách hàng) |
| **Luồng chính** | 1. Người dùng chọn sản phẩm muốn mua trên trang chi tiết sản phẩm.<br><br>2. Hệ thống hiển thị thông tin sản phẩm bao gồm: tên, giá, giảm giá (nếu có), và nút "Mua ngay".<br><br>3. Người dùng xác nhận thông tin và nhấn nút "Mua ngay".<br><br>4. Hệ thống kiểm tra số dư ví của người dùng có đủ để thanh toán hay không.<br><br>5. Hệ thống tính toán tổng tiền thanh toán (sau khi trừ giảm giá nếu có).<br><br>6. Hệ thống tạo giao dịch thanh toán (Transaction) và trừ tiền từ ví người dùng.<br><br>7. Hệ thống tạo đơn hàng mới với trạng thái "Hoàn thành" và lưu vào cơ sở dữ liệu.<br><br>8. Hệ thống tạo link tải file có thời hạn (5 phút) từ Google Drive.<br><br>9. Hệ thống trả về link tải và tự động mở trong tab mới để người dùng tải file.<br><br>10. Người dùng nhận thông báo đặt hàng thành công và bắt đầu tải file. |
| **Luồng ngoại lệ** | 3.1. Người dùng không đủ số dư trong ví.<br>&emsp;3.1.1. Hệ thống thông báo lỗi "Số dư không đủ để hoàn tất thanh toán".<br>&emsp;3.1.2. Usecase kết thúc, người dùng được gợi ý nạp thêm tiền.<br><br>4.1. Sản phẩm không tồn tại hoặc đã bị xóa.<br>&emsp;4.1.1. Hệ thống thông báo lỗi "Không tìm thấy sản phẩm".<br>&emsp;4.1.2. Usecase kết thúc.<br><br>5.1. File sản phẩm không tồn tại trên Google Drive.<br>&emsp;5.1.1. Hệ thống thông báo lỗi "Không tìm thấy file".<br>&emsp;5.1.2. Usecase kết thúc.<br><br>6.1. Lỗi xảy ra trong quá trình tạo giao dịch hoặc đơn hàng.<br>&emsp;6.1.1. Hệ thống tự động rollback: xóa giao dịch đã tạo và khôi phục số dư ban đầu cho người dùng.<br>&emsp;6.1.2. Hệ thống thông báo lỗi "Đặt hàng thất bại". Usecase kết thúc. |
| **Hậu điều kiện** | Đơn hàng được tạo thành công và lưu trữ trong hệ thống với trạng thái "Hoàn thành".<br>Số dư ví của người dùng được trừ tương ứng với giá trị đơn hàng.<br>Người dùng nhận được link tải file sản phẩm (có hiệu lực 5 phút).<br>Giao dịch thanh toán được ghi nhận trong lịch sử giao dịch. |

---

# 2.3.4. Đặc tả usecase "Tải lại file đã mua"

*Bảng 2.6 Đặc tả usecase "Tải lại file đã mua"*

| Thành phần | Mô tả |
|------------|-------|
| **Tên UC** | Tải lại file đã mua |
| **Điều kiện bắt đầu** | Người dùng đã đăng nhập vào hệ thống.<br>Người dùng đã mua sản phẩm trước đó và đơn hàng ở trạng thái "Hoàn thành". |
| **Tác nhân** | Người dùng (khách hàng) |
| **Luồng chính** | 1. Người dùng truy cập vào trang "Lịch sử đơn hàng".<br><br>2. Hệ thống hiển thị danh sách các đơn hàng đã mua.<br><br>3. Người dùng chọn đơn hàng cần tải lại và nhấn nút "Tải xuống".<br><br>4. Hệ thống xác thực quyền sở hữu đơn hàng của người dùng.<br><br>5. Hệ thống kiểm tra trạng thái đơn hàng là "Hoàn thành".<br><br>6. Hệ thống tạo link tải file mới có thời hạn (60 phút).<br><br>7. Hệ thống trả về link tải và mở trong tab mới.<br><br>8. Người dùng tải file thành công. |
| **Luồng ngoại lệ** | 4.1. Đơn hàng không thuộc quyền sở hữu của người dùng.<br>&emsp;4.1.1. Hệ thống thông báo lỗi "Bạn không có quyền tải file này".<br>&emsp;4.1.2. Usecase kết thúc.<br><br>5.1. Đơn hàng chưa hoàn thành hoặc đã bị hủy.<br>&emsp;5.1.1. Hệ thống thông báo lỗi "Đơn hàng chưa hoàn thành".<br>&emsp;5.1.2. Usecase kết thúc. |
| **Hậu điều kiện** | Người dùng nhận được link tải file mới (có hiệu lực 60 phút).<br>Không ảnh hưởng đến số dư ví hay trạng thái đơn hàng. |
