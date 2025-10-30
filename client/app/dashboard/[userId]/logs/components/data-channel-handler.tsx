import { useDataChannel } from "@livekit/components-react";
import { toast } from "sonner";

interface DataChannelLogHandlerProps {
  setAgentSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DataChannelLogHandler: React.FC<DataChannelLogHandlerProps> = ({
  setAgentSpeaking,
}) => {
  const { message, send } = useDataChannel(
    "log-automation-topic",
    ({ payload }) => {
      const decoded = new TextDecoder().decode(payload);
      const parsed = JSON.parse(decoded);

      if (parsed.event == "agent_started_speaking") {
        toast.message("Agent is speaking");
        setAgentSpeaking(true);
      } else if (parsed.event == "agent_stopped_speaking") {
        toast.message("Agent is not speaking");
        setAgentSpeaking(false);
      }
    }
  );
  return null;
};
