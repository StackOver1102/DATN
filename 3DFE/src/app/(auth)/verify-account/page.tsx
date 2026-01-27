"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyAccount = async () => {
      if (!token) {
        setIsVerifying(false);
        setErrorMessage(
          "Không tìm thấy mã xác thực. Vui lòng kiểm tra liên kết trong email của bạn."
        );
        return;
      }

      try {
        const response = await authApi.verifyAccount(token);

        if (response.success) {
          setIsSuccess(true);
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push("/signin");
          }, 3000);
        } else {
          setErrorMessage(
            response.message || "Xác thực tài khoản thất bại. Vui lòng thử lại."
          );
        }
      } catch (error) {
        setErrorMessage(
          "Đã xảy ra lỗi trong quá trình xác thực tài khoản. Vui lòng thử lại sau."
        );
        console.error("Verification error:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAccount();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Xác thực tài khoản
          </CardTitle>
          <CardDescription>
            {isVerifying
              ? "Đang xác thực tài khoản của bạn..."
              : isSuccess
                ? "Tài khoản của bạn đã được xác thực thành công!"
                : "Xác thực tài khoản thất bại"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center p-6">
          {isVerifying ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-center text-gray-600">
                Vui lòng đợi trong khi chúng tôi xác thực tài khoản của bạn...
              </p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-gray-600">
                Tài khoản của bạn đã được xác thực thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-center text-red-600">{errorMessage}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {!isVerifying &&
            (isSuccess ? (
              <Button asChild>
                <Link href="/signin">Đăng nhập ngay</Link>
              </Button>
            ) : (
              <div className="flex flex-col space-y-2 w-full">
                <Button asChild variant="outline">
                  <Link href="/signin">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Đăng ký tài khoản mới</Link>
                </Button>
              </div>
            ))}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Xác thực tài khoản
              </CardTitle>
              <CardDescription>Đang tải trang xác thực...</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-center text-gray-600 mt-4">Vui lòng đợi...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyAccountContent />
    </Suspense>
  );
}
