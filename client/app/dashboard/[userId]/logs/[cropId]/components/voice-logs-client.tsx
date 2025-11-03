"use client";
import React from "react";
import { LogsSection } from "./logs-section";
import { useUserStore } from "@/zustand/store";
import { Heading } from "@/components/heading";

interface VoiceLogsClientProps {
  userId: string;
  cropId: string;
}

export const VoiceLogsClient: React.FC<VoiceLogsClientProps> = ({
  userId,
  cropId,
}) => {
  const { user } = useUserStore();

  if (!user) {
    return (
      <div className="flex bg-background min-h-screen">
        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-8">
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <Heading
        title="Daily Logs"
        subheading="Manage your personal logs and suggestions."
      />
      <div className="space-y-8">
        <LogsSection userId={userId} cropId={cropId} />
      </div>
    </>
  );
};
