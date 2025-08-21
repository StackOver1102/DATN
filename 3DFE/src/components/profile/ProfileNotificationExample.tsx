"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFetchData } from "@/lib/hooks/useApi";
import { PaginatedResult } from "@/interface/pagination";
import { Notification } from "@/lib/types";
import RefundRequestsList from "./RefundRequestsList";
import SupportTicketsList from "./SupportTicketsList";

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
    }
  };
}

interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string;
  updatedAt: string;
}

export default function ProfileNotificationExample() {
  const router = useRouter();
  const [refundsPage, setRefundsPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);
  const itemsPerPage = 5;
  
  // Fetch refund requests
  const { data: refundsData, isLoading: isLoadingRefundRequests } = useFetchData<
    PaginatedResult<RefundRequest>
  >(
    `refunds/my-refunds?page=${refundsPage}&limit=${itemsPerPage}`,
    ["refunds", refundsPage.toString()]
  );
  
  // Fetch support tickets
  const { data: supportData, isLoading: isLoadingSupportTickets } = useFetchData<
    PaginatedResult<SupportTicket>
  >(
    `support/my-requests?page=${supportPage}&limit=${itemsPerPage}`,
    ["support", supportPage.toString()]
  );
  
  // Fetch all notifications
  const { data: notificationData, isLoading: isLoadingNotifications, refetch: refetchNotifications } = useFetchData<{
    pendingCount: number;
    hasNewUpdates: boolean;
    notifications: Notification[];
  }>(
    `notifications/byUser`,
    ["notifications"],
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );
  
  // Extract data
  const refunds = refundsData?.items || [];
  const refundsTotalPages = refundsData?.meta.totalPages || 1;
  
  const supportTickets = supportData?.items || [];
  const supportTotalPages = supportData?.meta.totalPages || 1;
  
  const notifications = notificationData?.notifications || [];
  
  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Call your API to mark notification as read
      // Example:
      // const response = await put(`notifications/${notificationId}/read`, {});
      
      // Refresh notification data
      refetchNotifications();
      
      console.log(`Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Example of how to use the components
  return (
    <div className="space-y-8">
      {/* Refunds Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Refund Requests</h2>
        <RefundRequestsList
          refunds={refunds}
          isLoading={isLoadingRefundRequests}
          totalPages={refundsTotalPages}
          currentPage={refundsPage}
          onPageChange={setRefundsPage}
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
          formatDate={formatDate}
        />
      </div>
      
      {/* Support Tickets Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Support Tickets</h2>
        </div>
        <SupportTicketsList
          tickets={supportTickets}
          isLoading={isLoadingSupportTickets}
          totalPages={supportTotalPages}
          currentPage={supportPage}
          onPageChange={setSupportPage}
          notifications={notifications}
          onMarkAsRead={markNotificationAsRead}
          formatDate={formatDate}
          onCreateTicket={() => router.push("/support")}
        />
      </div>
    </div>
  );
}
