import { CustomControlBar } from "./control-bar";
import { VoiceVisualizer } from "./voice-visualizer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const SessionView: React.FC<{
  sessionStarted: boolean;
  isAgentSpeaking: boolean;
}> = ({ sessionStarted, isAgentSpeaking }) => {
  if (!sessionStarted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Profile Building Session
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Get ready to start your profile building session. Make sure your
            microphone is working properly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Voice Session Active</h2>
        <p className="text-muted-foreground">
          Your profile building session is in progress
        </p>
      </div>
      <VoiceVisualizer isAgentSpeaking={isAgentSpeaking} />
      <CustomControlBar />
    </div>
  );
};
