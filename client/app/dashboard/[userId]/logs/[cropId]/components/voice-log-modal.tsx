import { Modal } from "@/components/modal";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomControlBar } from "./control-bar";
import { VoiceVisualizer } from "@/components/voice-visualizer";

interface VoiceLogModalProps {
  isAgentSpeaking: boolean;
  sessionStarted: boolean;
  handleEndLogCall: () => void;
}

export const VoiceLogModal: React.FC<VoiceLogModalProps> = ({
  sessionStarted,
  isAgentSpeaking,
  handleEndLogCall,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      isOpen={sessionStarted}
      onClose={() => {
        handleEndLogCall();
      }}
      title="Log"
      description=""
    >
      <VoiceVisualizer isAgentSpeaking={isAgentSpeaking} />
      <CustomControlBar />
      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={() => handleEndLogCall()}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
