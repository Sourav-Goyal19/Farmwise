import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalParticipant } from "@livekit/components-react";

export const CustomControlBar = ({}) => {
  const [isMuted, setIsMuted] = useState(false);
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (localParticipant) {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
    }
  }, [localParticipant]);

  const toggleMute = async () => {
    if (!localParticipant) return;

    try {
      if (isMuted) {
        await localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } else {
        await localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  return (
    <div className="flex items-center gap-4 p-6 bg-card border rounded-lg shadow-sm w-fit mx-auto">
      <Button
        onClick={toggleMute}
        variant={isMuted ? "destructive" : "outline"}
        size="lg"
        className="flex items-center gap-2"
      >
        {isMuted ? (
          <>
            <MicOff className="h-5 w-5" />
            <span>Unmute</span>
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            <span>Mute</span>
          </>
        )}
      </Button>
    </div>
  );
};
