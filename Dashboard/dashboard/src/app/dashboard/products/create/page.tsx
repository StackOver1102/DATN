"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { IconHome, IconPlus } from "@tabler/icons-react";

export default function CreateProductPage() {
  const router = useRouter();

  // Redirect to the dynamic product page with "create" as the ID
  // This is a simple redirect page to maintain consistent URL structure
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
          <BreadcrumbLink href="/dashboard/products">Sản phẩm</BreadcrumbLink>
        </BreadcrumbItem>
        <span className="mx-2 text-gray-400">&gt;</span>

        <BreadcrumbItem>
          <BreadcrumbLink>Thêm sản phẩm mới</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>Đang chuyển hướng...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Đang chuyển hướng đến trang tạo sản phẩm mới...
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard/products/create")}>
              Tiếp tục
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/products/batch-create")}
            >
              <IconPlus className="h-4 w-4 mr-1" />
              Tạo nhiều sản phẩm
            </Button>
          </div>
        </CardContent>
      </Card>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.location.href = "/dashboard/products/create";
          `,
        }}
      />
    </div>
  );
}
