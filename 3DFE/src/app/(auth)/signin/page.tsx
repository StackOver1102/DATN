"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loading } from "@/components/ui/loading";
import { LoadingButton } from "@/components/ui/loading-button";

// Định nghĩa schema validation với Zod
const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
  rememberMe: z.boolean().optional(),
});

// Định nghĩa kiểu dữ liệu từ schema
type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  // Khởi tạo React Hook Form với Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Xử lý đăng nhập
  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setAuthError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false, // Ngăn chặn chuyển hướng tự động
      });

      if (result?.error) {
        // Xử lý lỗi từ NextAuth
        setAuthError(result.error);
      } else if (result?.ok) {
        // Chuyển hướng thủ công nếu đăng nhập thành công
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setAuthError("Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Loading
        variant="spinner"
        size="lg"
        text="Đang đăng nhập..."
        fullScreen
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-medium mb-2">Welcome back!</h1>
            <p className="text-base text-gray-700">
              Enter your credentials to access your account
            </p>
          </div>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{message}</span>
            </div>
          )}

          {(error || authError) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">
                {"Authentication failed. Please try again."}
              </span>
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

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#0C2A92] hover:underline"
                >
                  forgot password
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-[#3A5B22] focus:border-[#3A5B22] focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 border-gray-300 rounded focus:ring-[#3A5B22]"
                {...register("rememberMe")}
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-xs text-gray-900"
              >
                Remember for 30 days
              </label>
            </div>

            {/* Login button */}
            <div>
              <LoadingButton
                type="submit"
                isLoading={false} // Không cần isLoading ở đây vì chúng ta đã sử dụng Loading fullScreen
                className="w-full py-2 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#3A5B22] hover:bg-[#2A4A12] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22]"
              >
                Login
              </LoadingButton>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#3A5B22] hover:underline"
              >
                Sign Up
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

      {/* Right side - Image */}
      <div
        className="hidden md:block md:w-1/2 lg:w-1/2 bg-cover bg-center rounded-l-[45px]"
        style={{ backgroundImage: "url('/assets/signup-background.jpg')" }}
      ></div>
    </div>
  );
}
