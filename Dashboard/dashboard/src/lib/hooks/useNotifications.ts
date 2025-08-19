import { useApiMutation, useApiQuery } from './useApi';

export interface Notification {
  _id: string;
  type: 'support' | 'refund';
  isRead: boolean;
  createdAt: string;
}

interface NotificationCounts {
  support: number | null;
  refund: number | null;
  total: number | null;
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
    {
      // Mock data for demonstration
      enabled: false, // Disable actual API call for now
      refetchInterval: 60000, // Refetch every minute in a real app
    }
  );

  // Calculate notification counts
  const counts: NotificationCounts = {
    support: data?.data?.support || null, // Hardcoded for demo
    refund: data?.data?.refund || null, // Hardcoded for demo
    total: data?.data?.total || null, // Hardcoded for demo
  };
  

   const {mutate: notification} = useApiMutation<{data: Notification}, {id: string}>(
    'notifications-mark-as-read',
    '/notifications/mark-as-read',
    'patch'
  );
  
  const handleMarkAsRead = async (id: string) => {
    await notification({id});
    refetch();
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
  };
}