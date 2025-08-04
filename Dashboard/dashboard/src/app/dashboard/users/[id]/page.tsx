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
import { IconHome } from "@tabler/icons-react";
import { Loading, PageLoading } from "@/components/ui/loading";

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
  createdAt: string;
  updatedAt: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const pageTitle = "Chỉnh sửa người dùng";

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data
  const {
    data: userData,
    isLoading,
    error,
  } = useApiQuery<{ data: User }>(["user", id as string], `/users/${id}`);

  const user = userData?.data;

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

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        fullName: user.fullName || "",
        role: user.role || "user",
        balance: user.balance || 0,
        isActive: user.isActive ?? true,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  // Update user mutation
  const { mutate: updateUser, isPending: isUpdating } = useApiMutation<
    { data: User },
    Partial<User>
  >("users", `/users/${id}`, "put");

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

    updateUser(formData, {
      onSuccess: () => {
        userToasts.updated();
        router.push("/dashboard/users");
      },
      onError: (error) => {
        userToasts.error(error.message);
      },
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Don't render anything until component is mounted
  if (!mounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return <PageLoading text="Đang tải thông tin người dùng..." />;
  }

  // Error state
  if (error || !user) {
    return (
      <div className="px-4 lg:px-6">
        <div className="flex justify-center p-8">
          {error ? `Lỗi: ${error.message}` : "Không tìm thấy người dùng"}
        </div>
      </div>
    );
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
          <BreadcrumbLink href={`/dashboard/users/${user._id}/view`}>
            {user.fullName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>
        <BreadcrumbItem>
          <BreadcrumbLink>{pageTitle}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">
            Chỉnh sửa thông tin người dùng {user.fullName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/users/${user._id}/view`)}
          >
            Xem chi tiết
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value="details">Thông tin chi tiết</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            <TabsTrigger value="info">Thông tin hệ thống</TabsTrigger>
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
                    <Label htmlFor="balance">Số dư (coin)</Label>
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
                  <Label htmlFor="password">Đặt lại mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Để trống nếu không muốn thay đổi"
                  />
                  <p className="text-sm text-muted-foreground">
                    Chỉ điền nếu muốn đặt lại mật khẩu cho người dùng
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendNotification">Gửi thông báo</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendNotification" />
                    <Label htmlFor="sendNotification">
                      Gửi email thông báo về thay đổi thông tin
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID người dùng</Label>
                    <div className="p-2 bg-muted rounded-md font-mono text-sm">
                      {user._id}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ngày tạo</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cập nhật lần cuối</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {formatDate(user.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/users/${user._id}/view`)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2"
          >
            {isUpdating && <Loading size="sm" variant="spinner" />}
            {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
