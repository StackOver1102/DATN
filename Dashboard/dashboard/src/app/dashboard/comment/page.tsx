"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import {
  IconDotsVertical,
  IconEye,
  IconTrash,
  IconCheck,
  IconX,
  IconBell,
} from "@tabler/icons-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { format } from "date-fns";
import { ApiResponse } from "@/interface/pagination";
import { useNotifications } from "@/lib/hooks/useNotifications";


interface Comment {
  _id: string;
  id?: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  productId: {
    _id: string;
    name: string;
    images?: string;
  };
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CommentsPage() {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  // Fetch comments with populated user and product data
  const { data, isLoading, error, refetch } = useApiQuery<ApiResponse<Comment[]>>(
    "comments",
    "/comments",
    {
      refetchOnMount: true,
      staleTime: 0, // Consider data always stale
    }
  );

  const {commentNoti, handleMarkAsRead} = useNotifications();

  // Helper function to check if comment has notification
  const hasNotification = (commentId: string) => {
    return commentNoti.some(notification => 
      notification.originalId === commentId && !notification.isRead
    );
  };

  // Helper function to get notification for comment
  const getNotificationForComment = (commentId: string) => {
    return commentNoti.find(notification => 
      notification.originalId === commentId && !notification.isRead
    );
  };

  // Delete mutation
  const { mutate: deleteComment, isPending: isDeleting } = useApiMutation<
    { success: boolean; message: string },
    { id: string }
  >("comments", `/comments/${selectedComment?._id}`, "delete");

  // Approve comment mutation
  const { mutate: approveComment, isPending: isApproving } = useApiMutation<
    Comment,
    {}
  >("comments", `/comments/approve/${selectedComment?._id}`, "patch");

  // Handle delete confirmation
  const handleDeleteClick = (comment: Comment) => {
    setSelectedComment(comment);
    setDeleteModalOpen(true);
  };

  // Handle view comment
  const handleViewClick = async (comment: Comment) => {
    setSelectedComment(comment);
    setViewModalOpen(true);
    
    // Mark notification as read if it exists
    const notification = getNotificationForComment(comment._id);
    if (notification) {
      await handleMarkAsRead(notification._id);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!selectedComment) return;

    deleteComment(
      { id: selectedComment._id },
      {
        onSuccess: () => {
          showSuccessToast("Bình luận đã được xóa thành công");
          setDeleteModalOpen(false);
          setSelectedComment(null);
          refetch();
        },
        onError: (error) => {
          showErrorToast(error.message || "Lỗi khi xóa bình luận");
        },
      }
    );
  };

  // Handle approve comment
  const handleApproveComment = () => {
    if (!selectedComment) return;

    approveComment(
      {},
      {
        onSuccess: () => {
          showSuccessToast("Bình luận đã được phê duyệt thành công");
          refetch();
          setViewModalOpen(false);
        },
        onError: (error) => {
          showErrorToast(error.message || "Lỗi khi phê duyệt bình luận");
        },
      }
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-xs text-gray-500">{rating}/5</span>
      </div>
    );
  };

  const columns: ColumnDef<Comment>[] = [
    {
      accessorKey: "userId.fullName",
      header: "Người dùng",
      cell: ({ row }) => {
        const user = row.original.userId;
        const comment = row.original;
        const hasNewNotification = hasNotification(comment._id);
        
        return (
          <div className={`relative ${hasNewNotification ? 'bg-yellow-50 p-2 rounded border-l-4 border-yellow-400' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="font-medium">{user?.fullName || "N/A"}</div>
                <div className="text-xs text-gray-500">{user?.email || "N/A"}</div>
              </div>
              {hasNewNotification && (
                <div 
                  className="flex items-center cursor-pointer hover:bg-yellow-200 p-1 rounded transition-colors"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const notification = getNotificationForComment(comment._id);
                    if (notification) {
                      await handleMarkAsRead(notification._id);
                    }
                  }}
                  title="Click để đánh dấu đã đọc"
                >
                  <IconBell className="w-4 h-4 text-yellow-500" />
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    New
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "productId.name",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const product = row.original.productId;
        return (
          <div className="max-w-[200px] truncate">
            {product?.name || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "content",
      header: "Nội dung",
      cell: ({ row }) => {
        const content = row.getValue("content") as string;
        return (
          <div className="max-w-[200px] truncate" title={content}>
            {content}
          </div>
        );
      },
    },
    {
      accessorKey: "rating",
      header: "Đánh giá",
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number;
        return renderRating(rating);
      },
    },
    {
      accessorKey: "isApproved",
      header: "Trạng thái",
      cell: ({ row }) => {
        const isApproved = row.getValue("isApproved") as boolean;
        return (
          <Badge
            variant={isApproved ? "default" : "secondary"}
            className={isApproved ? "bg-green-500" : ""}
          >
            {isApproved ? "Đã duyệt" : "Chờ duyệt"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return <div className="text-sm">{formatDate(date)}</div>;
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const comment = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewClick(comment)}>
                <IconEye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              {!comment.isApproved && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedComment(comment);
                    handleApproveComment();
                  }}
                >
                  <IconCheck className="mr-2 h-4 w-4" />
                  Phê duyệt
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(comment)}
                className="text-red-600"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return <PageLoading text="Đang tải danh sách bình luận..." />;
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Lỗi khi tải dữ liệu
          </div>
          <div className="text-muted-foreground">{error?.message}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Quản lý bình luận</h1>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tất cả bình luận</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data?.data || []}
              searchKey="content"
              searchPlaceholder="Tìm kiếm bình luận..."
              filters={[
                {
                  columnId: "isApproved",
                  title: "Trạng thái",
                  options: [
                    { label: "Đã duyệt", value: "true" },
                    { label: "Chờ duyệt", value: "false" },
                  ],
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bình luận</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Comment Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết bình luận</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">
                  Người dùng
                </div>
                <div className="font-medium">
                  {selectedComment.userId?.fullName || "N/A"}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedComment.userId?.email || "N/A"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">
                  Sản phẩm
                </div>
                <div>{selectedComment.productId?.name || "N/A"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">
                  Đánh giá
                </div>
                <div>{renderRating(selectedComment.rating)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">
                  Nội dung
                </div>
                <div className="p-3 bg-gray-50 rounded-md border">
                  {selectedComment.content}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">
                  Trạng thái
                </div>
                <Badge
                  variant={selectedComment.isApproved ? "default" : "secondary"}
                  className={selectedComment.isApproved ? "bg-green-500" : ""}
                >
                  {selectedComment.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">
                  Thời gian
                </div>
                <div className="text-sm">
                  {formatDate(selectedComment.createdAt)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setViewModalOpen(false)}
            >
              Đóng
            </Button>
            {selectedComment && !selectedComment.isApproved && (
              <Button
                onClick={handleApproveComment}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  "Đang phê duyệt..."
                ) : (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Phê duyệt
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
