import { useEffect, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { VoiceLogForm } from "./voice-log-form";
import { VoiceLogModal } from "./voice-log-modal";
import { DataChannelLogHandler } from "./data-channel-handler";
import { RoomAudioRenderer, RoomContext } from "@livekit/components-react";

export const LogsSection = () => {
  const [roomKey, setRoomKey] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [roomInstance] = useState(
    () =>
      new Room({
        disconnectOnPageLeave: true,
        adaptiveStream: true,
        dynacast: true,
      })
  );

  useEffect(() => {
    const onConnected = () => setRoomKey((prev) => prev + 1);
    roomInstance.on(RoomEvent.Connected, onConnected);
    return () => {
      roomInstance.off(RoomEvent.Connected, onConnected);
    };
  }, [roomInstance]);

  const handleEndLogCall = () => {
    setSessionStarted(false);
    roomInstance.disconnect();
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">
            Your Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Your all logs</p>
        </div>

        <RoomContext.Provider value={roomInstance}>
          <RoomAudioRenderer key={roomKey} />
          <VoiceLogForm
            setSessionStarted={setSessionStarted}
            roomInstance={roomInstance}
          />
          <VoiceLogModal
            isAgentSpeaking={isAgentSpeaking}
            sessionStarted={sessionStarted}
            handleEndLogCall={handleEndLogCall}
          />
          <DataChannelLogHandler setAgentSpeaking={setIsAgentSpeaking} />
        </RoomContext.Provider>
      </div>
      <div className="p-6"></div>
    </div>
  );
};
