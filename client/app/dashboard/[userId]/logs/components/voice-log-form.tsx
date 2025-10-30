"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Room } from "livekit-client";
import { AxiosResponse } from "axios";
import { axiosIns } from "@/lib/axios";
import { useUser } from "@clerk/nextjs";
import { ConnectionDetails } from "@/types";
import { Button } from "@/components/ui/button";

interface VoiceLogFormProps {
  setSessionStarted: React.Dispatch<React.SetStateAction<boolean>>;
  roomInstance: Room;
}

export const VoiceLogForm: React.FC<VoiceLogFormProps> = ({
  setSessionStarted,
  roomInstance,
}) => {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAddLogClick = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    const roomName = `log-automation-room_${Date.now()}`;
    try {
      const res: AxiosResponse<{ data: ConnectionDetails; msg: string }> =
        await axiosIns.post("/api/logs/create/token", {
          roomName,
          userId: user?.id,
          // cropId: "5d26aad9-293b-4361-9296-7e01aec29e47",
          primaryLanguage: "hindi",
        });

      const { livekitServerUrl, participantToken } = res.data.data;

      if (participantToken) {
        await roomInstance.connect(livekitServerUrl, participantToken);
        await roomInstance.localParticipant.setMicrophoneEnabled(true);
        setSessionStarted(true);
      }
    } catch (error) {
      console.error("Error connecting to room:", error);
      toast.error("Something went wrong in connecting room.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button onClick={handleAddLogClick} disabled={isConnecting}>
      <Plus className="size-4 mr-2" />
      {isConnecting ? "Connecting..." : "Add Log"}
    </Button>
  );
};
