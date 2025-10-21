import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useLocalParticipant } from "@livekit/components-react";

export const CustomControlBar: React.FC<{ onCallEnd: () => void }> = ({
  onCallEnd,
}) => {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

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

  const handleEndCall = () => {
    onCallEnd();
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

      <Button
        onClick={handleEndCall}
        variant="destructive"
        size="lg"
        className="flex items-center gap-2"
      >
        <PhoneOff className="h-5 w-5" />
        <span>End Call</span>
      </Button>
    </div>
  );
};
