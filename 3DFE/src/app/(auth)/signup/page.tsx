"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/lib/hooks/useAuth";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";

// Định nghĩa schema validation với Zod
const signupSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "Bạn phải đồng ý với điều khoản và chính sách",
  }),
});

// Định nghĩa kiểu dữ liệu từ schema
type SignupFormValues = z.infer<typeof signupSchema>;

function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Khởi tạo React Hook Form với Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      agreeToTerms: false,
    },
  });

  const { mutate: registerAccount, isSuccess, isPending } = useRegister();
  // Xử lý đăng ký
  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);

    registerAccount(data, {
      onSuccess: () => {
        router.push("/signin");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

    setLoading(false);
  };

  if (isPending) {
    return (
      <Loading variant="spinner" size="lg" text="Đang xử lý..." fullScreen />
    );
  }

  if (isSuccess) {
    toast.success("Tạo tài khoản thành công, vui lòng đăng nhập");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-medium mb-2">Get Started Now</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name field */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium">
                Name
              </label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="fullName"
                  placeholder="Nhập tên của bạn"
                  className={`h-12 w-full rounded-lg border px-4 ${
                    errors.fullName ? "border-red-500" : ""
                  }`}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className={`h-12 w-full rounded-lg border px-4 ${
                    errors.email ? "border-red-500" : ""
                  }`}
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
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`h-12 w-full rounded-lg border px-4 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  className={`w-4 h-4 border rounded ${
                    errors.agreeToTerms ? "border-red-500" : "border-gray-300"
                  }`}
                  {...register("agreeToTerms")}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-xs font-medium">
                  I agree to the terms & policy
                </label>
                {errors.agreeToTerms && (
                  <p className="text-xs text-red-500">
                    {errors.agreeToTerms.message}
                  </p>
                )}
              </div>
            </div>

            {/* Signup button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#3A5B22] hover:bg-[#2A4A12] text-white rounded-lg font-bold"
            >
              {loading ? "Creating account..." : "Signup"}
            </Button>
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

          <div className="flex items-center justify-between">
            <Link
              href="/signin"
              className="text-sm font-medium text-[#3A5B22] hover:underline"
            >
              Have an account? Sign In
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-2 border border-[#3A5B22] rounded-md shadow-sm text-sm font-medium text-[#3A5B22] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A5B22]"
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

export default function SignUp() {
  return (
    <Suspense fallback={<Loading variant="spinner" size="lg" fullScreen />}>
      <SignUpForm />
    </Suspense>
  );
}
