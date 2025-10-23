"use client";

import {
  User,
  Mic,
  TrendingUp,
  FileText,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchUser } from "@/hooks/use-fetch-user";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useUserStore } from "@/zustand/store";

export default function FarmerDashboard() {
  const { user, isLoaded } = useUser();
  const { setUser } = useUserStore();
  const stats = [
    { label: "Active Crops", value: "3", icon: "🌾", color: "bg-amber-100" },
    { label: "Voice Logs", value: "24", icon: "🎤", color: "bg-blue-100" },
    { label: "Market Alerts", value: "5", icon: "📊", color: "bg-green-100" },
  ];

  const { data } = useFetchUser(user?.id, isLoaded);

  useEffect(() => {
    if (!data) return;
    setUser(data);
  }, [data, user?.id]);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <div className="bg-gradient-to-br from-card to-muted rounded-3xl p-8 mb-8 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Hi Farmer.
              </h1>
              <p className="text-muted-foreground mb-6 max-w-md">
                Welcome back. Track your crops, log activities, and discover
                market opportunities to maximize your harvest.
              </p>
              <Button className="rounded-xl">View Details</Button>
            </div>
            <div className="w-64 h-48 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl"></div>
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🧑‍🌾
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-2xl`}
                    >
                      {stat.icon}
                    </div>
                    <ChevronRight
                      className="text-muted-foreground group-hover:text-foreground transition-colors"
                      size={20}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button
                    variant="link"
                    className="text-primary text-sm p-0 h-auto"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Pesticide applied to Field 1",
                  "Market price updated",
                  "Voice log recorded",
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText size={16} className="text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{activity}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Add Log", icon: Mic },
                    { label: "Check Prices", icon: TrendingUp },
                    { label: "Update Profile", icon: User },
                    { label: "Apply Scheme", icon: Building2 },
                  ].map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="h-auto p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground"
                    >
                      <action.icon size={24} />
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
