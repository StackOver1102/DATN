# PayPal Integration Setup Guide

## 🚀 Cài đặt PayPal cho 3DS Blue

### 1. Cài đặt thư viện
```bash
npm install @paypal/react-paypal-js
npm install sonner  # For toast notifications
```

### 2. Cấu hình Environment Variables

Tạo file `.env.local` trong root directory:

```env
# PayPal Configuration
# For development - use sandbox client ID
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id_here

# For production - replace with live client ID
# NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id_here
```

### 3. Lấy PayPal Client ID

#### Sandbox (Development):
1. Đăng nhập vào [PayPal Developer Console](https://developer.paypal.com/)
2. Tạo ứng dụng mới trong sandbox
3. Copy **Client ID** từ sandbox app
4. Paste vào `.env.local`

#### Production (Live):
1. Chuyển app từ sandbox sang live mode
2. Lấy live Client ID
3. Thay thế trong `.env.local`

### 4. Features đã implement

✅ **PayPal Button Component** (`/src/components/PayPalButton.tsx`)
- Tích hợp PayPal SDK
- Chuyển đổi VND → USD (1 USD = 24,000 VND)
- Xử lý thanh toán và errors
- Loading states

✅ **Buy Page Integration** (`/src/app/buy/page.tsx`)
- Conditional rendering PayPal button
- Toast notifications với Sonner
- Payment success/error handling

✅ **Toast Notifications** (`/src/app/layout.tsx`)
- Sonner toaster cho notifications
- Success/error messages

### 5. Payment Flow

1. **User chọn PayPal** → PayPal button hiển thị
2. **Click PayPal button** → Mở PayPal popup
3. **User login PayPal** → Xác nhận payment
4. **Payment success** → Toast notification + cập nhật database
5. **Payment error** → Error toast + retry option

### 6. Sandbox Testing

#### Test Accounts (PayPal Sandbox):
- **Buyer Account**: 
  - Email: `sb-buyer@business.example.com`
  - Password: `test1234`

- **Seller Account**: 
  - Email: `sb-seller@business.example.com`
  - Password: `test1234`

### 7. Backend Integration (Cần implement)

```typescript
// API endpoint để xử lý payment success
// /api/paypal/success
export async function POST(request: Request) {
  const { orderID, payerID, amount, diamonds } = await request.json();
  
  // 1. Verify payment với PayPal API
  // 2. Update user's diamond balance
  // 3. Save transaction record
  // 4. Send confirmation email
  
  return Response.json({ success: true });
}
```

### 8. Security Notes

⚠️ **Important**:
- Client ID có thể public (frontend)
- Client Secret phải giữ bí mật (backend only)
- Luôn verify payments ở backend
- Không trust frontend payment data

### 9. Troubleshooting

**Common Issues**:
- ❌ Client ID sai → Check `.env.local`
- ❌ Network error → Check PayPal sandbox status
- ❌ Currency conversion → Verify VND→USD rate
- ❌ CORS issues → Check PayPal domain settings

### 10. Next Steps

- [ ] Setup backend payment verification
- [ ] Add webhook handling
- [ ] Implement diamond balance updates
- [ ] Add transaction history
- [ ] Setup email confirmations 