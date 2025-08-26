"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loading } from "@/components/ui/loading";
import { LoadingButton } from "@/components/ui/loading-button";

// Define validation schema with Zod
const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

// Define form data type from schema
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the API to request password reset
      const { authApi } = await import('@/lib/api');
      const response = await authApi.forgotPassword(data.email);
      
      if (response.success) {
        setSuccess("Một email đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn.");
      } else {
        setError(response.message || "Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Loading
        variant="spinner"
        size="lg"
        text="Đang gửi yêu cầu..."
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
            <h1 className="text-3xl font-medium mb-2">Forgot Password</h1>
            <p className="text-base text-gray-700">
              Enter your email address to reset your password
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

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm`}
                  placeholder="Enter your email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
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

          <div className="text-center mt-6">
            <p className="text-sm">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="font-medium text-black hover:underline"
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

export default function ForgotPassword() {
  return (
    <Suspense fallback={<Loading variant="spinner" size="lg" fullScreen />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}