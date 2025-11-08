import { VoiceLogsClient } from "./components/voice-logs-client";

interface CropLogsPageProps {
  params: Promise<{
    userId: string;
    cropId: string;
  }>;
}

const CropLogsPage = async ({ params }: CropLogsPageProps) => {
  const { cropId, userId } = await params;
  return (
    <div className="flex bg-background">
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <VoiceLogsClient userId={userId} cropId={cropId} />
        </main>
      </div>
    </div>
  );
};

export default CropLogsPage;
