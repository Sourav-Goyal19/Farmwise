"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sidebar } from "./components/sidebar";
import { DashboardHeader } from "./components/dashboard-header";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-20 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar isMobile={true} onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1">
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
