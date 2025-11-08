"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ui/theme-button";
import {
  Home,
  User,
  Mic,
  TrendingUp,
  FileText,
  Building2,
  ArrowLeftToLine,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile = false,
  onNavigate,
}) => {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { user } = useUser();

  const navItems = [
    { id: "", path: "", icon: Home, label: "Home" },
    { id: "profile", path: "profile", icon: User, label: "Profile Builder" },
    { id: "logs", path: "logs", icon: Mic, label: "Voice Logs" },
    {
      id: "market",
      path: "market",
      icon: TrendingUp,
      label: "Market Insights",
    },
    { id: "schemes", path: "schemes", icon: Building2, label: "Gov Schemes" },
    { id: "chat", path: "chat", icon: FileText, label: "AI Assistant" },
  ];

  const handleItemClick = (itemId: string) => {
    if (isMobile && onNavigate) {
      onNavigate();
    }
  };

  return (
    <div
      className={`w-20 bg-card ${
        !isMobile ? "sticky inset-y-0 left-0 border-r border-border" : ""
      } flex flex-col items-center py-6 gap-8 justify-between h-svh`}
    >
      <Link href="/dashboard" onClick={isMobile ? onNavigate : undefined}>
        <Image
          src="/logo.png"
          alt="logo"
          height={200}
          width={200}
          className="size-8"
        />
      </Link>

      <nav className="flex flex-col gap-4">
        {navItems.map((item) => {
          const href = user?.id
            ? `/dashboard/${user.id}/${item.path}`
            : `/dashboard/${item.path}`;
          const active = pathname.startsWith(href);

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Link href={href} onClick={() => handleItemClick(item.id)}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={cn(
                      "w-12 h-12 rounded-xl",
                      active ? "shadow-lg" : ""
                    )}
                  >
                    <item.icon size={20} />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4">
        <ModeToggle />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => {
                signOut();
                window.location.replace("/");
              }}
              size="icon"
              className="w-12 h-12 rounded-xl"
            >
              <ArrowLeftToLine size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Logout</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
