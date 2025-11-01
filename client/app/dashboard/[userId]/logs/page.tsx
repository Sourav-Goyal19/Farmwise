import { VoiceLogsClient } from "./components/voice-logs-client";

const VoiceLogsPage = () => {
  return (
    <div className="flex bg-background">
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <VoiceLogsClient />
        </main>
      </div>
    </div>
  );
};

export default VoiceLogsPage;
