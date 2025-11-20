"use client";

import { LifeBuoy, Bell } from "lucide-react";
import { Notification } from "@/lib/types";
import {
  getMatchingNotification,
  getNotificationStatus,
} from "@/utils/notificationHelper";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";

interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketsListProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
  onCreateTicket: () => void;
}

export default function SupportTicketsList({
  tickets,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  notifications,
  onMarkAsRead,
  formatDate,
  onCreateTicket,
}: SupportTicketsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loading />
      </div>
    );
  }

  if (!tickets?.length) {
    return (
      <div className="text-center py-10">
        <div className="mb-4">
          <LifeBuoy className="w-12 h-12 mx-auto text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">
          No support tickets
        </h3>
        <p className="text-gray-500 mt-2">
          You haven&apos;t created any support tickets yet.
        </p>
        <Button className="mt-4 text-yellow-400" onClick={onCreateTicket}>
          Create Support Ticket
        </Button>
      </div>
    );
  }

  return (
    <>
      {tickets.map((ticket, index) => {
        // Check if this support ticket has a matching notification
        const matchingNotification = getMatchingNotification(
          notifications,
          ticket._id,
          "support"
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
                  ticket.status === "open"
                    ? "bg-blue-100"
                    : ticket.status === "in_progress"
                    ? "bg-yellow-100"
                    : "bg-green-100"
                }`}
              >
                <LifeBuoy
                  className={`w-6 h-6 
                  ${
                    ticket.status === "open"
                      ? "text-blue-600"
                      : ticket.status === "in_progress"
                      ? "text-yellow-600"
                      : "text-green-600"
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
                  {ticket.subject}
                  {isUnread && (
                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      New
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  #{ticket._id} • {formatDate(ticket.createdAt)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {ticket.message.length > 80
                    ? ticket.message.substring(0, 80) + "..."
                    : ticket.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${
                        ticket.status === "open"
                          ? "text-blue-600 bg-blue-100"
                          : ticket.status === "in_progress"
                          ? "text-yellow-600 bg-yellow-100"
                          : "text-green-600 bg-green-100"
                      }`}
                  >
                    {ticket.status === "open"
                      ? "Open"
                      : ticket.status === "in_progress"
                      ? "In Progress"
                      : "Closed"}
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
