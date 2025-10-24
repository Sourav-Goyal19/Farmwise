// components/sidebar.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  User,
  Mic,
  TrendingUp,
  FileText,
  Building2,
  ArrowLeftToLine,
} from "lucide-react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/theme-button";
import { useAuth, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile = false,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = React.useState("");
  const { signOut } = useAuth();
  const { user } = useUser();

  const navItems = [
    { id: "", icon: Home, label: "Home" },
    { id: "profile", icon: User, label: "Profile Builder" },
    { id: "voice", icon: Mic, label: "Voice Logs" },
    { id: "market", icon: TrendingUp, label: "Market Insights" },
    { id: "schemes", icon: Building2, label: "Gov Schemes" },
    { id: "chat", icon: FileText, label: "AI Assistant" },
  ];

  const handleItemClick = (itemId: string) => {
    setActiveTab(itemId);
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
      <Link href="dashboard" onClick={isMobile ? onNavigate : undefined}>
        <Image
          src="/logo.png"
          alt="logo"
          height={200}
          width={200}
          className="size-8"
        />
      </Link>

      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Link href={`/dashboard/${user?.id}/${item.id}`}>
                <Button
                  onClick={() => {
                    handleItemClick(item.id);
                  }}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-12 h-12 rounded-xl",
                    activeTab === item.id ? "shadow-lg" : ""
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
        ))}
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
