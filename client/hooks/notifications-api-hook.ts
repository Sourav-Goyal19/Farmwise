import { axiosIns } from "@/lib/axios";
import { NotificationType } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const fetchNotifications = (userId: string) => {
  return useQuery<NotificationType[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await axiosIns.get(`/api/notifications/farmer/${userId}`);
      return res.data.notifications;
    },
    enabled: !!userId,
  });
};

const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await axiosIns.put(
        `/api/notifications/mark/${notificationId}`
      );
      return res.data;
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueriesData<NotificationType[]>(
        { queryKey: ["notifications"] },
        (old) =>
          old?.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          ) || []
      );
    },
  });
};

const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await axiosIns.put(`/api/notifications/markall/${userId}`);
      return res.data;
    },
    onSuccess: (_, userId) => {
      queryClient.setQueriesData<NotificationType[]>(
        { queryKey: ["notifications"] },
        (old) =>
          old?.map((notification) => ({ ...notification, isRead: true })) || []
      );
    },
  });
};

export {
  fetchNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
};
