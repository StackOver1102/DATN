import { useApiQuery } from './useApi';
import { api } from '../api';
import { useQueryClient } from '@tanstack/react-query';

export interface Notification {
  _id: string;
  type: 'support' | 'refund';
  isRead: boolean;
  createdAt: string;
  originalId?: string; // ID of the original item (support request, refund, etc.)
}

interface NotificationCounts {
  support: number | null;
  refund: number | null;
  total: number | null;
  supportNoti?: Notification[];
  refundNoti?: Notification[];
}

/**
 * Hook to fetch and manage notification counts
 */
export function useNotifications() {
  // In a real application, you would fetch this data from an API endpoint
  // For now, we'll use mock data
  const { data, isLoading, error, refetch } = useApiQuery<{ data: NotificationCounts }>(
    'notifications',
    '/notifications/unread/count',

  );


  // Calculate notification counts
  const counts: NotificationCounts = {
    support: data?.data?.support || null, // Hardcoded for demo
    refund: data?.data?.refund || null, // Hardcoded for demo
    total: data?.data?.total || null, // Hardcoded for demo

  };

  const supportNoti = data?.data?.supportNoti || [];
  const refundNoti = data?.data?.refundNoti || [];


  // We don't need this mutation anymore since we're using api.patch directly
  // Keeping the query invalidation though
  const queryClient = useQueryClient();

  const handleMarkAsRead = async (id: string) => {
    try {
      // Use the API utility from api.ts
      await api.patch(`/notifications/mark-as-read/${id}`, {});
      
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // In a real application, you would calculate these from the API response:
  // const counts = useMemo(() => {
  //   if (!data?.data) return { support: 0, refund: 0, total: 0 };
  //   
  //   const supportCount = data.data.filter(n => n.type === 'support' && !n.isRead).length;
  //   const refundCount = data.data.filter(n => n.type === 'refund' && !n.isRead).length;
  //   
  //   return {
  //     support: supportCount,
  //     refund: refundCount,
  //     total: supportCount + refundCount
  //   };
  // }, [data?.data]);

  return {
    counts,
    isLoading,
    error,
    refetch,
    handleMarkAsRead,
    supportNoti,
    refundNoti,
  };
}