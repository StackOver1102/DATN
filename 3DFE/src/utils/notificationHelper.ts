import { Notification } from "@/lib/types";

/**
 * Helper function to check if an item has a matching notification
 * @param notifications Array of notifications to check against
 * @param itemId The ID of the item to check
 * @param type The type of the item (refund, support, order, transaction)
 * @returns The matching notification or null if no match is found
 */
export const getMatchingNotification = (
  notifications: Notification[] | undefined,
  itemId: string,
  type: 'refund' | 'support' | 'order' | 'transaction'
): Notification | null => {

  if (!notifications || notifications.length === 0) return null;

  // First try to find a notification where originalId matches itemId
  const directMatch = notifications.find(
    notification => notification.originalId === itemId && notification.originType === type
  );

  if (directMatch) return directMatch;

  // If no direct match, for support tickets, check if there's a notification where originalId is the ID of a support ticket
  if (type === 'support') {
    return notifications.find(
      notification => notification.originType === 'support' && !notification.isWatching && notification.originalId === itemId
    ) || null;
  }

  return null;
};

/**
 * Helper function to get notification status
 * @param notification The notification to check
 * @returns Object containing notification status information
 */
export const getNotificationStatus = (notification: Notification | null) => {
  const hasNotification = !!notification;
  const isUnread = hasNotification && !notification.isWatching;

  return {
    hasNotification,
    isUnread
  };
};
