import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const StartAudio: React.FC<{ label: string }> = ({ label }) => {
  const [audioAllowed, setAudioAllowed] = useState(false);

  const requestAudio = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAllowed(true);
    } catch (error) {
      console.error("Error requesting audio permission:", error);
      alert("Audio permission is required for this feature.");
    }
  };

  if (audioAllowed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">
            Audio Permission Required
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground">
            Please allow microphone access to use the voice features.
          </p>
          <Button onClick={requestAudio} size="lg" className="w-full">
            {label}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
