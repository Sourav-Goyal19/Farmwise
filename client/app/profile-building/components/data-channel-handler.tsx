import { toast } from "sonner";
import { useEffect } from "react";
import { Room } from "livekit-client";
import { useDataChannel } from "@livekit/components-react";

interface DataChannelHandlerProps {
  roomInstance: Room;
  handleEndCall: () => void;
  onAgentSpeakingChange: (isSpeaking: boolean) => void;
}

export const DataChannelHandler: React.FC<DataChannelHandlerProps> = ({
  roomInstance,
  handleEndCall,
  onAgentSpeakingChange,
}) => {
  const { message, send } = useDataChannel("core-profile-topic", (data) => {
    try {
      const decoded = new TextDecoder().decode(data.payload);
      const parsed = JSON.parse(decoded);
      // console.log(parsed);
      if (parsed.event == "profile_completed") {
        handleEndCall();
      } else if (parsed.event == "agent_started_speaking") {
        // toast.message("Agent is speaking");
        onAgentSpeakingChange(true);
      } else if (parsed.event == "agent_stopped_speaking") {
        // toast.message("Agent is not speaking");
        onAgentSpeakingChange(false);
      }
    } catch (e) {
      console.error("Error decoding message from agent:", e);
    }
  });

  useEffect(() => {
    if (!roomInstance) return;

    const participant = roomInstance.localParticipant;
    console.log(participant);
  }, [roomInstance]);

  return null;
};
