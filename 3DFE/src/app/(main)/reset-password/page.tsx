"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loading } from "@/components/ui/loading";
import { LoadingButton } from "@/components/ui/loading-button";

// Define validation schema with Zod
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

// Define form data type from schema
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get token from URL query parameter
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Không tìm thấy token đặt lại mật khẩu. Vui lòng yêu cầu đặt lại mật khẩu mới.");
    }
  }, [searchParams]);

  // Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError("Không tìm thấy token đặt lại mật khẩu. Vui lòng yêu cầu đặt lại mật khẩu mới.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the API to reset password
      const { authApi } = await import('@/lib/api');
      const response = await authApi.resetPassword(token, data.password);
      
      if (response.success) {
        setSuccess("Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/signin');
        }, 3000);
      } else {
        setError(response.message || "Có lỗi xảy ra khi đặt lại mật khẩu.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Loading
        variant="spinner"
        size="lg"
        text="Đang đặt lại mật khẩu..."
        fullScreen
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Centered Form */}
      <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 py-12 px-6 sm:px-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-medium mb-2">Reset Password</h1>
            <p className="text-base text-gray-700">
              Enter your new password below
            </p>
          </div>

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!token ? (
            <div className="text-center mt-6">
              <p className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-yellow-400 hover:underline"
                >
                  Request a new password reset
                </Link>
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm`}
                    placeholder="Enter your new password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm`}
                    placeholder="Confirm your new password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Reset Password button */}
              <div>
                <LoadingButton
                  type="submit"
                  isLoading={loading}
                  className="w-full py-2 px-4 border border-transparent text-sm font-bold rounded-lg text-yellow-400 bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22]"
                >
                  Reset Password
                </LoadingButton>
              </div>
            </form>
          )}

          <div className="text-center mt-6">
            <p className="text-sm">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="font-medium text-yellow-400 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center mt-6">
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loading variant="spinner" size="lg" text="Đang tải..." />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
