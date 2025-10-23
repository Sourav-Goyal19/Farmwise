import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, Search, Menu } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
}) => {
  const { user, isLoaded } = useUser();
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-lg">
          <Bell size={20} />
        </Button>
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
