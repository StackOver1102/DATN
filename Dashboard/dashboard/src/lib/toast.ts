import { toast } from "sonner";

// Success toasts
export const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
  });
};

// Error toasts
export const showErrorToast = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 6000,
  });
};

// Info toasts
export const showInfoToast = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 4000,
  });
};

// Warning toasts
export const showWarningToast = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 5000,
  });
};

// Promise toasts
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};

// Custom toast with action
export const showActionToast = (
  message: string,
  description?: string,
  action?: {
    label: string;
    onClick: () => void;
  }
) => {
  toast(message, {
    description,
    action,
    duration: 5000,
  });
};

// Product-specific toasts
export const productToasts = {
  created: () => showSuccessToast("Sản phẩm đã được tạo thành công"),
  updated: () => showSuccessToast("Sản phẩm đã được cập nhật thành công"),
  deleted: () => showSuccessToast("Sản phẩm đã được xóa thành công"),
  error: (message: string) => showErrorToast("Lỗi sản phẩm", message),
  batchCreated: (count: number) => 
    showSuccessToast(`Đã tạo thành công ${count} sản phẩm`),
};

// User-specific toasts
export const userToasts = {
  loginSuccess: () => showSuccessToast("Đăng nhập thành công"),
  loginError: () => showErrorToast("Đăng nhập thất bại", "Vui lòng kiểm tra thông tin đăng nhập"),
  logoutSuccess: () => showInfoToast("Đã đăng xuất"),
  profileUpdated: () => showSuccessToast("Thông tin cá nhân đã được cập nhật"),
  created: () => showSuccessToast("Người dùng đã được tạo thành công"),
  updated: () => showSuccessToast("Người dùng đã được cập nhật thành công"),
  deleted: () => showSuccessToast("Người dùng đã được xóa thành công"),
  success: (message: string) => showSuccessToast(message),
  error: (message: string) => showErrorToast("Lỗi người dùng", message),
};

// Order-specific toasts
export const orderToasts = {
  created: () => showSuccessToast("Đơn hàng đã được tạo thành công"),
  updated: () => showSuccessToast("Đơn hàng đã được cập nhật thành công"),
  deleted: () => showSuccessToast("Đơn hàng đã được xóa thành công"),
  statusUpdated: () => showSuccessToast("Trạng thái đơn hàng đã được cập nhật"),
  error: (message: string) => showErrorToast("Lỗi đơn hàng", message),
};

// Form-specific toasts
export const formToasts = {
  validationError: () => showErrorToast("Lỗi xác thực", "Vui lòng kiểm tra lại thông tin"),
  saveSuccess: () => showSuccessToast("Lưu thành công"),
  saveError: (message?: string) => showErrorToast("Lỗi khi lưu", message),
};

// Network-specific toasts
export const networkToasts = {
  connectionError: () => showErrorToast("Lỗi kết nối", "Vui lòng kiểm tra kết nối mạng"),
  serverError: () => showErrorToast("Lỗi máy chủ", "Vui lòng thử lại sau"),
  timeoutError: () => showErrorToast("Hết thời gian chờ", "Vui lòng thử lại"),
}; 