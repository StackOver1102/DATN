"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userToasts } from "@/lib/toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome, IconUser } from "@tabler/icons-react";
import { Loading } from "@/components/ui/loading";

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  balance: number;
  isActive: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const pageTitle = "Thêm người dùng mới";

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // State for form
  const [formData, setFormData] = useState<Partial<User>>({
    email: "",
    fullName: "",
    role: "user",
    balance: 0,
    isActive: true,
    phone: "",
    address: "",
    avatar: "",
  });

  // Create user mutation
  const { mutate: createUser, isPending: isCreating } = useApiMutation<
    { data: User },
    Partial<User>
  >("users", "/users", "post");

  // Handle form change
  const handleChange = (field: keyof User, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.fullName) {
      userToasts.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      userToasts.error("Email không hợp lệ");
      return;
    }

    createUser(formData, {
      onSuccess: () => {
        userToasts.created();
        router.push("/dashboard/users");
      },
      onError: (error) => {
        userToasts.error(error.message);
      },
    });
  };

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="px-4 lg:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <IconHome className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/users">Người dùng</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>{pageTitle}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/users")}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? "Đang tạo..." : "Tạo người dùng"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value="details">Thông tin chi tiết</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin người dùng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ""}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="0123456789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">URL Avatar</Label>
                    <Input
                      id="avatar"
                      value={formData.avatar || ""}
                      onChange={(e) => handleChange("avatar", e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Vai trò</Label>
                    <Select
                      value={formData.role || "user"}
                      onValueChange={(value) => handleChange("role", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Người dùng</SelectItem>
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balance">Số dư ban đầu (coin)</Label>
                    <Input
                      id="balance"
                      type="number"
                      min="0"
                      value={formData.balance || 0}
                      onChange={(e) =>
                        handleChange("balance", Number(e.target.value))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Ghi chú về người dùng..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        handleChange("isActive", !!checked)
                      }
                    />
                    <Label htmlFor="isActive">Tài khoản hoạt động</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Để trống để tạo mật khẩu mặc định"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Mật khẩu mặc định sẽ được gửi qua email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendWelcomeEmail">Gửi email chào mừng</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendWelcomeEmail" defaultChecked />
                    <Label htmlFor="sendWelcomeEmail">
                      Gửi email chào mừng và hướng dẫn sử dụng
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/users")}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-2"
          >
            {isCreating && <Loading size="sm" variant="spinner" />}
            {isCreating ? "Đang tạo..." : "Tạo người dùng"}
          </Button>
        </div>
      </form>
    </div>
  );
}
