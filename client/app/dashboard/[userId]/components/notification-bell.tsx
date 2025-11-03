"use client";

import { cn } from "@/lib/utils";
import { NotificationType } from "@/types";
import { Button } from "@/components/ui/button";
import { Bell, X, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef, useEffect } from "react";
import {
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/notifications-api-hook";

interface NotificationBellProps {
  notifications?: NotificationType[];
  isLoading?: boolean;
  userId?: string;
  hasNewNotification?: boolean;
  onNotificationClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications = [],
  isLoading = false,
  userId,
  hasNewNotification = false,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (userId) {
      markAllAsReadMutation.mutate(userId);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    onNotificationClick?.();
  };

  const getNotificationTypeStyles = (type: NotificationType["type"]) => {
    const baseStyles = "text-xs px-2 py-1 rounded-full font-medium";

    switch (type) {
      case "alert":
        return cn(
          baseStyles,
          "bg-red-100 text-red-800 border border-red-200",
          "dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"
        );
      case "reminder":
        return cn(
          baseStyles,
          "bg-yellow-100 text-yellow-800 border border-yellow-200",
          "dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30"
        );
      case "message":
      default:
        return cn(
          baseStyles,
          "bg-blue-100 text-blue-800 border border-blue-200",
          "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30"
        );
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={popupRef}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "w-10 h-10 rounded-lg relative transition-all duration-300",
          isOpen && "bg-accent text-accent-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          hasNewNotification && "animate-pulse ring-2 ring-primary/50"
        )}
        onClick={handleBellClick}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-medium text-white border-2 border-card",
              hasNewNotification && "animate-bounce"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {notifications.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {unreadCount} unread{" "}
                  {unreadCount === 1 ? "message" : "messages"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2 text-xs text-muted-foreground hover:text-foreground",
                    markAllAsReadMutation.isPending &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckCheck size={14} className="mr-1" />
                  {markAllAsReadMutation.isPending ? "Marking..." : "Mark all"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X size={14} />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80 custom-scroll">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors cursor-pointer group",
                      "hover:bg-accent/50",
                      !notification.isRead && "bg-blue-50 dark:bg-blue-950/10",
                      markAsReadMutation.isPending &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() =>
                      !notification.isRead && handleMarkAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors",
                          notification.isRead
                            ? "bg-muted-foreground/30"
                            : "bg-primary ring-2 ring-primary/20"
                        )}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed group-hover:text-foreground/90">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={getNotificationTypeStyles(
                              notification.type
                            )}
                          >
                            {notification.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(
                              notification.scheduledFor ||
                                notification.createdAt
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Bell size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We'll notify you when something arrives
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
