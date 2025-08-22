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
  IconClock,
  IconCoin,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "../users/page";
import { formatNumber } from "@/lib/formatMoney";
import Image from "next/image";
import { toast } from "sonner";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { CircleDollarSign } from "lucide-react";

// Import RefundStatus enum from backend
enum RefundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

interface Refund {
  _id: string;
  userId: User;
  orderId: {
    _id: string;
    productId: {
      _id: string;
      name: string;
    };
  };
  transactionId?: string;
  amount: number;
  status: RefundStatus;
  description: string;
  images?: string[];
  adminNotes?: string;
  processedAt?: string;
  processedBy?: User;
  createdAt: string;
  updatedAt: string;
  isUnread?: boolean; // Added to track if the refund request has unread notifications
}

export default function RefundsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingTab, setProcessingTab] = useState<"approve" | "reject">(
    "approve"
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { refundNoti, handleMarkAsRead } = useNotifications();
  const { data, isLoading, error, refetch } = useApiQuery<{
    data: Refund[];
  }>(
    ["refunds", activeTab],
    activeTab === "all" ? "/refunds" : `/refunds?status=${activeTab}`
  );

  // Mutation for updating refund status
  const { mutate: updateRefundStatus, isPending: isUpdating } = useApiMutation<
    { data: Refund },
    { status: RefundStatus; adminNotes?: string }
  >("refund", selectedRefund ? `/refunds/${selectedRefund._id}` : "", "patch");

  // Map refunds to include id field for DataTable
  // Map refunds to include id field for DataTable and check if it's unread
  const refunds =
    data?.data?.map((refund) => {
      // Check if this refund request has an unread notification
      const isUnread = refundNoti?.some(
        (noti) => noti.originalId === refund._id && !noti.isRead
      );

      return {
        ...refund,
        id: refund._id,
        isUnread: isUnread || false,
      };
    }) || [];

  // Define columns for the data table
  const columns: ColumnDef<Refund>[] = [
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
      accessorKey: "userId",
      header: "Khách hàng",
      cell: ({ row }) => {
        const user = row.original.userId;
        return (
          <Link
            href={`/dashboard/users/${user._id}`}
            className="text-blue-500 hover:underline"
          >
            {user.fullName || user.email}
          </Link>
        );
      },
    },
    {
      accessorKey: "orderId",
      header: "Đơn hàng",
      cell: ({ row }) => {
        const order = row.original.orderId;
        const isUnread = row.original.isUnread;
        return (
          <div className={`${isUnread ? "font-bold" : ""}`}>
            {isUnread && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            )}
            <Link
              href={`/dashboard/orders/${order._id}/view`}
              className="text-blue-500 hover:underline"
            >
              {order.productId?.name || order._id}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Số tiền
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return (
          <div className="font-mono font-semibold flex items-center gap-1">
            {formatNumber(amount)}
            <CircleDollarSign className="w-5 h-5 text-yellow-500" />
          </div>
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
        const status = row.getValue("status") as RefundStatus;

        switch (status) {
          case RefundStatus.PENDING:
            return (
              <Badge variant="outline" className="flex items-center gap-1">
                <IconClock className="h-3 w-3" /> Chờ xử lý
              </Badge>
            );
          case RefundStatus.APPROVED:
            return (
              <Badge
                variant="default"
                className="bg-blue-500 flex items-center gap-1"
              >
                <IconCheck className="h-3 w-3" /> Đã duyệt
              </Badge>
            );
          case RefundStatus.COMPLETED:
            return (
              <Badge variant="success" className="flex items-center gap-1">
                <IconCoin className="h-3 w-3" /> Đã hoàn tiền
              </Badge>
            );
          case RefundStatus.REJECTED:
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
          Ngày yêu cầu
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
        const refund = row.original;
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
                  // Mark as read if unread
                  if (refund.isUnread) {
                    const notification = refundNoti?.find(
                      (noti) => noti.originalId === refund._id && !noti.isRead
                    );
                    if (notification) {
                      handleMarkAsRead(notification._id);
                    }
                  }
                  setSelectedRefund(refund);
                  setIsDetailModalOpen(true);
                  setAdminNotes("");
                  setProcessingTab("approve");
                }}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
                {refund.isUnread && (
                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </DropdownMenuItem>
              {refund.status === RefundStatus.PENDING && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // Mark as read if unread
                      if (refund.isUnread) {
                        const notification = refundNoti?.find(
                          (noti) =>
                            noti.originalId === refund._id && !noti.isRead
                        );
                        if (notification) {
                          handleMarkAsRead(notification._id);
                        }
                      }
                      setSelectedRefund(refund);
                      setIsDetailModalOpen(true);
                      setAdminNotes("");
                      setProcessingTab("approve");
                    }}
                    className="text-green-600"
                  >
                    <IconCheck className="mr-2 h-4 w-4" />
                    Xử lý yêu cầu
                    {refund.isUnread && (
                      <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
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
          <BreadcrumbLink>Hoàn tiền</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-6">Quản lý hoàn tiền</h1>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu hoàn tiền</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading text="Đang tải dữ liệu hoàn tiền..." />
          ) : error ? (
            <div className="text-red-500 p-4">
              Lỗi khi tải dữ liệu hoàn tiền
            </div>
          ) : (
            <DataTable
              data={refunds}
              columns={columns}
              searchKey="userId"
              searchPlaceholder="Tìm kiếm theo khách hàng..."
              filters={[
                {
                  columnId: "status",
                  title: "Trạng thái",
                  options: [
                    { label: "Chờ xử lý", value: RefundStatus.PENDING },
                    { label: "Đã duyệt", value: RefundStatus.APPROVED },
                    { label: "Đã hoàn tiền", value: RefundStatus.COMPLETED },
                    { label: "Từ chối", value: RefundStatus.REJECTED },
                  ],
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Refund Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu hoàn tiền</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về yêu cầu hoàn tiền
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Trạng thái</p>
                      {(() => {
                        const status = selectedRefund.status;
                        switch (status) {
                          case RefundStatus.PENDING:
                            return (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 w-fit"
                              >
                                <IconClock className="h-3 w-3" /> Chờ xử lý
                              </Badge>
                            );
                          case RefundStatus.APPROVED:
                            return (
                              <Badge
                                variant="default"
                                className="bg-blue-500 flex items-center gap-1 w-fit"
                              >
                                <IconCheck className="h-3 w-3" /> Đã duyệt
                              </Badge>
                            );
                          case RefundStatus.COMPLETED:
                            return (
                              <Badge
                                variant="success"
                                className="flex items-center gap-1 w-fit"
                              >
                                <IconCoin className="h-3 w-3" /> Đã hoàn tiền
                              </Badge>
                            );
                          case RefundStatus.REJECTED:
                            return (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 w-fit"
                              >
                                <IconX className="h-3 w-3" /> Từ chối
                              </Badge>
                            );
                          default:
                            return status;
                        }
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mã yêu cầu</p>
                      <p className="font-mono text-xs break-all">
                        {selectedRefund._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số tiền hoàn trả</p>
                      <p className="font-semibold text-green-600">
                        {formatNumber(selectedRefund.amount)} coin
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày yêu cầu</p>
                      <p className="font-medium">
                        {formatDate(selectedRefund.createdAt)}
                      </p>
                    </div>
                    {selectedRefund.processedAt && (
                      <div>
                        <p className="text-sm text-gray-500">Ngày xử lý</p>
                        <p className="font-medium">
                          {formatDate(selectedRefund.processedAt)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Thông tin người dùng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Khách hàng</p>
                      <Link
                        href={`/dashboard/users/${selectedRefund.userId._id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {selectedRefund.userId.fullName ||
                          selectedRefund.userId.email}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">
                        {selectedRefund.userId.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID khách hàng</p>
                      <p className="font-mono text-xs break-all">
                        {selectedRefund.userId._id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Đơn hàng</p>
                      <Link
                        href={`/dashboard/orders/${selectedRefund.orderId._id}/view`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {selectedRefund.orderId.productId?.name ||
                          selectedRefund.orderId._id}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description and Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Mô tả yêu cầu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {selectedRefund.description}
                  </p>
                </CardContent>
              </Card>

              {/* Admin Notes if available */}
              {selectedRefund.adminNotes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Ghi chú của Admin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">
                      {selectedRefund.adminNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Images if available */}
              {selectedRefund.images && selectedRefund.images.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Hình ảnh đính kèm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedRefund.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative h-48 border rounded-md overflow-hidden"
                        >
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

          {selectedRefund && selectedRefund.status === RefundStatus.PENDING ? (
            <div className="mt-6">
              <Tabs
                value={processingTab}
                onValueChange={(v) =>
                  setProcessingTab(v as "approve" | "reject")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="approve">Chấp nhận</TabsTrigger>
                  <TabsTrigger value="reject">Từ chối</TabsTrigger>
                </TabsList>
                <TabsContent value="approve" className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Ghi chú (không bắt buộc)
                    </h4>
                    <Textarea
                      placeholder="Nhập ghi chú cho việc chấp nhận yêu cầu hoàn tiền..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={() => {
                        setIsProcessing(true);
                        updateRefundStatus(
                          {
                            status: RefundStatus.APPROVED,
                            adminNotes: adminNotes.trim() || undefined,
                          },
                          {
                            onSuccess: () => {
                              toast.success(
                                "Yêu cầu hoàn tiền đã được chấp nhận"
                              );
                              setIsDetailModalOpen(false);
                              setAdminNotes("");
                              refetch();
                            },
                            onError: (error) => {
                              toast.error(`Lỗi: ${error.message}`);
                              setIsProcessing(false);
                            },
                            onSettled: () => {
                              setIsProcessing(false);
                            },
                          }
                        );
                      }}
                      disabled={isProcessing || isUpdating}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      {isProcessing || isUpdating ? (
                        <>
                          <Loading size="sm" variant="spinner" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <IconThumbUp className="h-4 w-4" />
                          Chấp nhận yêu cầu
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="reject" className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Lý do từ chối <span className="text-red-500">*</span>
                    </h4>
                    <Textarea
                      placeholder="Nhập lý do từ chối yêu cầu hoàn tiền..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!adminNotes.trim()) {
                          toast.error("Vui lòng nhập lý do từ chối");
                          return;
                        }

                        setIsProcessing(true);
                        updateRefundStatus(
                          {
                            status: RefundStatus.REJECTED,
                            adminNotes: adminNotes,
                          },
                          {
                            onSuccess: () => {
                              toast.success("Yêu cầu hoàn tiền đã bị từ chối");
                              setIsDetailModalOpen(false);
                              setAdminNotes("");
                              refetch();
                            },
                            onError: (error) => {
                              toast.error(`Lỗi: ${error.message}`);
                              setIsProcessing(false);
                            },
                            onSettled: () => {
                              setIsProcessing(false);
                            },
                          }
                        );
                      }}
                      disabled={isProcessing || isUpdating}
                      className="flex items-center gap-2"
                    >
                      {isProcessing || isUpdating ? (
                        <>
                          <Loading size="sm" variant="spinner" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <IconThumbDown className="h-4 w-4" />
                          Từ chối yêu cầu
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Đóng
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
