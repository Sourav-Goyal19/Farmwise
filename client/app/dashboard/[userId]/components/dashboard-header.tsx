import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Search, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSocketStore } from "@/zustand/store";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationBell } from "./notification-bell";
import { fetchNotifications } from "@/hooks/notifications-api-hook";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
}) => {
  const { user, isLoaded } = useUser();
  const { socket, initializeSocket, isConnected } = useSocketStore();
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const userId = user?.id;

  const {
    data: notifications,
    isLoading,
    refetch,
  } = fetchNotifications(userId!);

  useEffect(() => {
    if (userId && !socket) {
      const newSocket = initializeSocket();

      newSocket.on("connect", () => {
        console.log("Connected to server for real-time notifications");
      });
    }
  }, [userId, socket, initializeSocket]);

  useEffect(() => {
    if (socket && userId) {
      const handleNewNotification = (data: {
        type: string;
        message: string;
        farmerId: string;
      }) => {
        // console.log("New notification received:", data);
        refetch();
        setHasNewNotification(true);
        setTimeout(() => {
          setHasNewNotification(false);
        }, 3000);
      };

      socket.on(`notification:${userId}`, handleNewNotification);

      return () => {
        socket.off(`notification:${userId}`, handleNewNotification);
      };
    }
  }, [socket, userId, refetch]);

  return (
    <header className="bg-card border-b border-border px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        className={cn("w-10 h-10 rounded-lg", "lg:hidden")}
        onClick={onMenuClick}
      >
        <Menu size={20} />
      </Button>

      <div
        className={cn(
          "flex items-center gap-4 flex-1 max-w-xl",
          "lg:ml-0 ml-4"
        )}
      >
        <Search className="text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground flex-1"
        />
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell
          notifications={notifications}
          isLoading={isLoading}
          userId={userId}
          hasNewNotification={hasNewNotification}
          onNotificationClick={() => setHasNewNotification(false)}
        />

        {isLoaded ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.firstName}
            </span>
            {user?.imageUrl ? (
              <Image
                src={user?.imageUrl}
                alt="profile-picture"
                height={200}
                width={200}
                className="size-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent"></div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        )}
      </div>
    </header>
  );
};
