"use client";

import { RefreshCcw, Bell } from "lucide-react";
import { Notification } from "@/lib/types";
import {
  getMatchingNotification,
  getNotificationStatus,
} from "@/utils/notificationHelper";
import { Loading } from "@/components/ui/loading";
import Pagination from "@/components/Pagination";

interface RefundRequest {
  _id: string;
  orderId: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  order?: {
    productId: {
      name: string;
    };
  };
}

interface RefundRequestsListProps {
  refunds: RefundRequest[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

export default function RefundRequestsList({
  refunds,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  notifications,
  onMarkAsRead,
  formatDate,
}: RefundRequestsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loading />
      </div>
    );
  }

  if (!refunds?.length) {
    return (
      <div className="text-center py-10">
        <div className="mb-4">
          <RefreshCcw className="w-12 h-12 mx-auto text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          No refund requests
        </h3>
        <p className="text-gray-500 mt-2">
          You haven&apos;t made any refund requests yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {refunds.map((refund, index) => {
        // Check if this refund has a matching notification
        const matchingNotification = getMatchingNotification(
          notifications,
          refund._id,
          "refund"
        );
        const { hasNotification, isUnread } =
          getNotificationStatus(matchingNotification);

        return (
          <div
            key={index}
            className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between
              ${isUnread ? "border-l-4 border-yellow-400" : ""}
              ${
                hasNotification
                  ? "cursor-pointer transform transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-md"
                  : ""
              }`}
            onClick={() => {
              if (matchingNotification && isUnread) {
                onMarkAsRead(matchingNotification._id);
              }
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center relative
                ${
                  refund.status === "pending"
                    ? "bg-yellow-100"
                    : refund.status === "approved"
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                <RefreshCcw
                  className={`w-6 h-6 
                  ${
                    refund.status === "pending"
                      ? "text-yellow-600"
                      : refund.status === "approved"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
                {isUnread && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  Refund Request{" "}
                  {refund.order && `for ${refund.order.productId.name}`}
                  {isUnread && (
                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      New
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  #{refund._id} • {formatDate(refund.createdAt)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {refund.description.length > 80
                    ? refund.description.substring(0, 80) + "..."
                    : refund.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${
                        refund.status === "pending"
                          ? "text-yellow-600 bg-yellow-100"
                          : refund.status === "approved"
                          ? "text-green-600 bg-green-100"
                          : "text-red-600 bg-red-100"
                      }`}
                  >
                    {refund.status === "pending"
                      ? "Pending"
                      : refund.status === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </span>
                </div>
              </div>
            </div>
            {isUnread && (
              <div className="text-right">
                <Bell className="w-5 h-5 text-yellow-500" fill="#eab308" />
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
}
