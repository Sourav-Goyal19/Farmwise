import { CropsClient } from "./components/crop-client";

const VoiceLogsPage = () => {
  return (
    <div className="flex bg-background">
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <CropsClient />
        </main>
      </div>
    </div>
  );
};

export default VoiceLogsPage;
