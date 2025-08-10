"use client";

import { useState } from "react";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading, Loading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  IconHome,
  IconEye,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconArrowsUpDown,
  IconFlag,
  IconPhoto,
  IconThumbUp,
  IconThumbDown,
} from "@tabler/icons-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Textarea
} from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "../users/page";
import { Product } from "@/interface/product";
import Image from "next/image";
import { toast } from "sonner";

interface Report {
  _id: string;
  userId: User;
  productId: Product;
  title: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  images?: string[];
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingTab, setProcessingTab] = useState<"resolve" | "reject">("resolve");
  const [adminResponse, setAdminResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery<{
    data: Report[];
  }>(
    ["reports", activeTab],
    activeTab === "all" ? "/reports" : `/reports?status=${activeTab}`
  );
  
  // Mutation for updating report status
  const { mutate: updateReportStatus, isPending: isUpdating } = useApiMutation<
    { data: Report },
    { status: "resolved" | "rejected"; adminResponse?: string }
  >("report", selectedReport ? `/reports/${selectedReport?._id}` : "", "patch");

  // Map reports to include id field for DataTable
  const reports =
    data?.data?.map((report) => ({
      ...report,
      id: report?._id, 
    })) || [];

  // Define columns for the data table
  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          ID
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("_id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Tiêu đề
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "userId",
      header: "Người báo cáo",
      cell: ({ row }) => {
        const user = row.original.userId;
        return (
          <Link
            href={`/dashboard/users/${user?._id}`}
            className="text-blue-500 hover:underline"
          >
            {user.fullName || user.email}
          </Link>
        );
      },
    },
    {
      accessorKey: "productId",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const product = row.original.productId;
        return (
          <Link
            href={`/dashboard/products/${product?._id}`}
            className="text-blue-500 hover:underline"
          >
            {product.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Trạng thái
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        switch (status) {
          case "pending":
            return (
              <Badge variant="outline" className="flex items-center gap-1">
                <IconFlag className="h-3 w-3" /> Chờ xử lý
              </Badge>
            );
          case "resolved":
            return (
              <Badge variant="success" className="flex items-center gap-1">
                <IconCheck className="h-3 w-3" /> Đã giải quyết
              </Badge>
            );
          case "rejected":
            return (
              <Badge variant="destructive" className="flex items-center gap-1">
                <IconX className="h-3 w-3" /> Từ chối
              </Badge>
            );
          default:
            return status;
        }
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Ngày tạo
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedReport(report);
                  setIsDetailModalOpen(true);
                  setAdminResponse("");
                  setProcessingTab("resolve");
                }}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              {report.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedReport(report);
                      setIsDetailModalOpen(true);
                      setAdminResponse("");
                      setProcessingTab("resolve");
                    }}
                    className="text-green-600"
                  >
                    <IconCheck className="mr-2 h-4 w-4" />
                    Xử lý báo cáo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Format date helper function
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
          <BreadcrumbLink>Báo cáo</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-6">Quản lý báo cáo</h1>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading text="Đang tải dữ liệu báo cáo..." />
          ) : error ? (
            <div className="text-red-500 p-4">
              Lỗi khi tải dữ liệu báo cáo
            </div>
          ) : (
            <DataTable
              data={reports}
              columns={columns}
              searchKey="title"
              searchPlaceholder="Tìm kiếm báo cáo..."
              filters={[
                {
                  columnId: "status",
                  title: "Trạng thái",
                  options: [
                    { label: "Chờ xử lý", value: "pending" },
                    { label: "Đã giải quyết", value: "resolved" },
                    { label: "Từ chối", value: "rejected" },
                  ],
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về báo cáo
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Title and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Thông tin báo cáo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Tiêu đề</p>
                      <p className="font-medium">{selectedReport.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trạng thái</p>
                      {(() => {
                        const status = selectedReport.status;
                        switch (status) {
                          case "pending":
                            return (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <IconFlag className="h-3 w-3" /> Chờ xử lý
                              </Badge>
                            );
                          case "resolved":
                            return (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <IconCheck className="h-3 w-3" /> Đã giải quyết
                              </Badge>
                            );
                          case "rejected":
                            return (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <IconX className="h-3 w-3" /> Từ chối
                              </Badge>
                            );
                          default:
                            return status;
                        }
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mã báo cáo</p>
                      <p className="font-mono text-xs break-all">{selectedReport?._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày tạo</p>
                      <p className="font-medium">
                        {formatDate(selectedReport?.createdAt)}  
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                      <p className="font-medium">
                        {formatDate(selectedReport?.updatedAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Thông tin liên quan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Người báo cáo</p>
                      <Link
                        href={`/dashboard/users/${selectedReport?.userId?._id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {selectedReport?.userId?.fullName || selectedReport?.userId?.email}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedReport?.userId?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sản phẩm được báo cáo</p>
                      <Link
                        href={`/dashboard/products/${selectedReport?.productId?._id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {selectedReport?.productId?.name}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Danh mục</p>
                      <p className="font-medium">{selectedReport?.productId?.categoryName}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nội dung báo cáo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{selectedReport?.description}</p>
                </CardContent>
              </Card>

              {/* Admin Response if available */}
              {selectedReport.adminResponse && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Phản hồi của Admin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{selectedReport?.adminResponse}</p>
                  </CardContent>
                </Card>
              )}

              {/* Images if available */}
              {selectedReport?.images && selectedReport?.images?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hình ảnh đính kèm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedReport?.images?.map((image, index) => (
                        <div key={index} className="relative h-48 border rounded-md overflow-hidden">
                          <Image
                            src={image}
                            alt={`Hình ảnh ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <a
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded-full"
                          >
                            <IconPhoto className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {selectedReport && selectedReport?.status === "pending" ? (
            <div className="mt-6">
              <Tabs value={processingTab} onValueChange={(v) => setProcessingTab(v as "resolve" | "reject")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="resolve">Giải quyết</TabsTrigger>
                  <TabsTrigger value="reject">Từ chối</TabsTrigger>
                </TabsList>
                <TabsContent value="resolve" className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Phản hồi (không bắt buộc)</h4>
                    <Textarea
                      placeholder="Nhập phản hồi cho báo cáo này..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsProcessing(true);
                        updateReportStatus(
                          { 
                            status: "resolved",
                            adminResponse: adminResponse.trim() || undefined
                          },
                          {
                            onSuccess: () => {
                              toast.success("Báo cáo đã được giải quyết");
                              setIsDetailModalOpen(false);
                              setAdminResponse("");
                              refetch();
                            },
                            onError: (error) => {
                              toast.error(`Lỗi: ${error.message}`);
                              setIsProcessing(false);
                            },
                            onSettled: () => {
                              setIsProcessing(false);
                            }
                          }
                        );
                      }}
                      disabled={isProcessing || isUpdating}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      {(isProcessing || isUpdating) ? (
                        <>
                          <Loading size="sm" variant="spinner" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <IconThumbUp className="h-4 w-4" />
                          Giải quyết báo cáo
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="reject" className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Lý do từ chối <span className="text-red-500">*</span></h4>
                    <Textarea
                      placeholder="Nhập lý do từ chối báo cáo này..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                      Hủy
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (!adminResponse.trim()) {
                          toast.error("Vui lòng nhập lý do từ chối");
                          return;
                        }
                        
                        setIsProcessing(true);
                        updateReportStatus(
                          { 
                            status: "rejected",
                            adminResponse: adminResponse
                          },
                          {
                            onSuccess: () => {
                              toast.success("Báo cáo đã bị từ chối");
                              setIsDetailModalOpen(false);
                              setAdminResponse("");
                              refetch();
                            },
                            onError: (error) => {
                              toast.error(`Lỗi: ${error.message}`);
                              setIsProcessing(false);
                            },
                            onSettled: () => {
                              setIsProcessing(false);
                            }
                          }
                        );
                      }}
                      disabled={isProcessing || isUpdating}
                      className="flex items-center gap-2"
                    >
                      {(isProcessing || isUpdating) ? (
                        <>
                          <Loading size="sm" variant="spinner" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <IconThumbDown className="h-4 w-4" />
                          Từ chối báo cáo
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Đóng
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}