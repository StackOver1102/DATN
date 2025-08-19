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
import { User } from "../users/page";
import Image from "next/image";
import { toast } from "sonner";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface Support {
  _id: string;
  userId: User;
  title: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  images?: string[];
  attachments?: string[];
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  message: string;
  name?: string;
  email?: string; 
  phone?: string;
  isUnread?: boolean; // Added to track if the support request has unread notifications
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedSupport, setSelectedSupport] = useState<Support | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingTab, setProcessingTab] = useState<"resolve" | "reject">("resolve");
  const [adminResponse, setAdminResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {supportNoti, handleMarkAsRead} = useNotifications();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useApiQuery<{
    data: Support[];
  }>(
    ["support", activeTab],
    activeTab === "all" ? "/support" : `/support?status=${activeTab}`
  );
  
  // Mutation for updating support status
  const { mutate: updateSupportStatus, isPending: isUpdating } = useApiMutation<
    { data: Support },
    { status: "resolved" | "rejected"; response?: string }
  >("support", selectedSupport ? `/support/${selectedSupport?._id}` : "", "patch");

  // Map support requests to include id field for DataTable and check if it's unread
  const supportRequests =
    data?.data?.map((support) => {
      // Check if this support request has an unread notification
      const isUnread = supportNoti?.some(noti => noti.originalId === support._id && !noti.isRead);
      
      return {
        ...support,
        id: support?._id,
        isUnread: isUnread || false,
      };
    }) || [];

  // Define columns for the data table
  const columns: ColumnDef<Support>[] = [
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
      accessorKey: "message",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Nội dung
          <IconArrowsUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const isUnread = row.original.isUnread;
        return (
          <div className={`font-medium ${isUnread ? "font-bold" : ""}`}>
            {isUnread && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            )}
            {row.getValue("message")}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Người gửi",
      cell: ({ row }) => {
        return (
          <span>{row.getValue("name")}</span>
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
        const support = row.original;
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
                  if (support.isUnread) {
                    const notification = supportNoti?.find(noti => noti.originalId === support._id && !noti.isRead);
                    if (notification) {
                      handleMarkAsRead(notification._id);
                    }
                  }
                  router.push(`/dashboard/support/${support._id}/view`);
                }}
              >
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
                {support.isUnread && (
                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </DropdownMenuItem>
              {support.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // Mark as read if unread
                      if (support.isUnread) {
                        const notification = supportNoti?.find(noti => noti.originalId === support._id && !noti.isRead);
                        if (notification) {
                          handleMarkAsRead(notification._id);
                        }
                      }
                      router.push(`/dashboard/support/${support._id}`);
                    }}
                    className="text-green-600"
                  >
                    <IconCheck className="mr-2 h-4 w-4" />
                    Xử lý yêu cầu
                    {support.isUnread && (
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
          <BreadcrumbLink>Hỗ trợ</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-6">Quản lý hỗ trợ</h1>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu hỗ trợ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading text="Đang tải dữ liệu hỗ trợ..." />
          ) : error ? (
            <div className="text-red-500 p-4">
              Lỗi khi tải dữ liệu hỗ trợ
            </div>
          ) : (
            <DataTable
              data={supportRequests}
              columns={columns}
              searchKey="status"
              searchPlaceholder="Tìm kiếm trạng thái..."
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

      {/* Support Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu hỗ trợ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về yêu cầu hỗ trợ
            </DialogDescription>
          </DialogHeader>

          {selectedSupport && (
            <div className="space-y-6">
              {/* Title and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Thông tin yêu cầu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div>
                      <p className="text-sm text-gray-500">Trạng thái</p>
                      {(() => {
                        const status = selectedSupport?.status;
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
                      <p className="text-sm text-gray-500">Mã yêu cầu</p>
                      <p className="font-mono text-xs break-all">{selectedSupport?._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ngày tạo</p>
                      <p className="font-medium">
                        {formatDate(selectedSupport?.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                      <p className="font-medium">
                        {formatDate(selectedSupport?.updatedAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Thông tin người dùng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Người gửi</p>
                      <span className="font-medium">
                        {selectedSupport?.name}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedSupport?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-mono text-xs break-all">{selectedSupport?.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nội dung yêu cầu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{selectedSupport?.message}</p>
                </CardContent>
              </Card>

              {/* Admin Response if available */}
              {selectedSupport?.adminResponse && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Phản hồi của Admin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{selectedSupport?.adminResponse}</p>
                  </CardContent>
                </Card>
              )}

              {/* Attachments if available */}
              {selectedSupport?.attachments && selectedSupport?.attachments?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tệp đính kèm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedSupport?.attachments?.map((attachment, index) => (
                        <div key={index} className="relative h-48 border rounded-md overflow-hidden">
                          {attachment.toLowerCase().endsWith('.jpg') || 
                           attachment.toLowerCase().endsWith('.jpeg') || 
                           attachment.toLowerCase().endsWith('.png') || 
                           attachment.toLowerCase().endsWith('.gif') ? (
                            <Image
                              src={attachment}
                              alt={`Hình ảnh ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100">
                              <div className="text-center">
                                <IconPhoto className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Tệp đính kèm</p>
                              </div>
                            </div>
                          )}
                          <a
                            href={attachment}
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

          {selectedSupport && selectedSupport?.status === "pending" ? (
            <div className="mt-6">
              <Tabs value={processingTab} onValueChange={(v) => setProcessingTab(v as "resolve" | "reject")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="resolve">Giải quyết</TabsTrigger>
                  <TabsTrigger value="reject">Từ chối</TabsTrigger>
                </TabsList>
                <TabsContent value="resolve" className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Phản hồi <span className="text-red-500">*</span></h4>
                    <Textarea
                      placeholder="Nhập phản hồi cho yêu cầu này..."
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
                      onClick={() => {
                        if (!adminResponse.trim()) {
                          toast.error("Vui lòng nhập phản hồi");
                          return;
                        }
                        
                        setIsProcessing(true);
                        updateSupportStatus(
                          { 
                            status: "resolved",
                            response: adminResponse
                          },
                          {
                            onSuccess: () => {
                              toast.success("Yêu cầu hỗ trợ đã được giải quyết");
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
                          Giải quyết yêu cầu
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="reject" className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Lý do từ chối <span className="text-red-500">*</span></h4>
                    <Textarea
                      placeholder="Nhập lý do từ chối yêu cầu này..."
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
                        updateSupportStatus(
                          { 
                            status: "rejected",
                            response: adminResponse
                          },
                          {
                            onSuccess: () => {
                              toast.success("Yêu cầu hỗ trợ đã bị từ chối");
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