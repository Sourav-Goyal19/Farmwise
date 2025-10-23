import { toast } from "sonner";
import { Room } from "livekit-client";
import { useDataChannel } from "@livekit/components-react";
import { useEffect } from "react";

interface DataChannelHandlerProps {
  roomInstance: Room;
  handleEndCall: () => void;
}

export const DataChannelHandler: React.FC<DataChannelHandlerProps> = ({
  roomInstance,
  handleEndCall,
}) => {
  const { message, send } = useDataChannel("core-profile-topic", (data) => {
    try {
      const decoded = new TextDecoder().decode(data.payload);
      const parsed = JSON.parse(decoded);
      console.log(parsed);
      if (parsed.event == "name_updated") {
        toast.message(parsed.msg);
      } else if (parsed.event == "profile_completed") {
        handleEndCall();
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
