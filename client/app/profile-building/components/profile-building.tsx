"use client";

import axiosIns from "@/lib/axios";
import { AxiosResponse } from "axios";
import { Room } from "livekit-client";
import { StartAudio } from "./start-audio";
import { useEffect, useState } from "react";
import { ConnectionDetails } from "@/types";
import { SessionView } from "./session-view";
import { Card, CardContent } from "@/components/ui/card";
import { DataChannelHandler } from "./data-channel-handler";
import { RoomAudioRenderer, RoomContext } from "@livekit/components-react";

interface ProfileBuildingProps {
  userId: string;
  primaryLanguage: string;
  onCallEnd?: () => void;
}

export const ProfileBuilding: React.FC<ProfileBuildingProps> = ({
  userId,
  primaryLanguage,
  onCallEnd = () => {},
}) => {
  const [token, setToken] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [roomInstance] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      })
  );

  const handleCallEnd = () => {
    roomInstance.disconnect();
    onCallEnd();
  };

  useEffect(() => {
    let mounted = true;
    const roomName = `profile-building-${userId}_${Date.now()}`;

    (async () => {
      try {
        const res: AxiosResponse<{ message: string; data: ConnectionDetails }> =
          await axiosIns.post("/api/profile/token", {
            userId,
            primaryLanguage,
            roomName,
          });

        if (!mounted) return;

        if (res.data.data.participantToken) {
          await roomInstance.connect(
            res.data.data.livekitServerUrl,
            res.data.data.participantToken
          );
          setToken(res.data.data.participantToken);
          setSessionStarted(true);
        }
      } catch (error) {
        console.error("Error connecting to room:", error);
      }
    })();

    return () => {
      mounted = false;
      if (roomInstance) {
        roomInstance.disconnect();
      }
    };
  }, [roomInstance, userId, primaryLanguage]);

  if (token === "") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <div className="h-2 w-2 bg-primary rounded-full"></div>
              </div>
              <p className="text-lg font-medium text-center">
                Preparing voice agent...
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Setting up your profile building session
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div
        data-lk-theme="default"
        className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4"
      >
        <RoomAudioRenderer />
        <StartAudio label="Enable Audio" />
        <DataChannelHandler
          roomInstance={roomInstance}
          handleEndCall={handleCallEnd}
        />
        <SessionView sessionStarted={sessionStarted} />
      </div>
    </RoomContext.Provider>
  );
};
