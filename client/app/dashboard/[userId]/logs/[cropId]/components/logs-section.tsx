import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EditLogSheet } from "./edit-log-sheet";
import { VoiceLogForm } from "./voice-log-form";
import { Room, RoomEvent } from "livekit-client";
import { VoiceLogModal } from "./voice-log-modal";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";
import { logsColumns, LogTableType } from "./columns";
import { DataChannelLogHandler } from "./data-channel-handler";
import { RoomAudioRenderer, RoomContext } from "@livekit/components-react";
import {
  useDeleteActivityLog,
  useFetchActivityLogsByCrop,
} from "@/hooks/logs-api-hook";
import { ViewLogSheet } from "./view-details-sheet";

interface LogsSectionProps {
  userId: string;
  cropId: string;
}

export const LogsSection: React.FC<LogsSectionProps> = ({ cropId }) => {
  const [roomKey, setRoomKey] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [roomInstance] = useState(
    () =>
      new Room({
        disconnectOnPageLeave: true,
        adaptiveStream: true,
        dynacast: true,
      })
  );

  const { data: logs, isLoading } = useFetchActivityLogsByCrop(cropId);
  const deleteLog = useDeleteActivityLog();

  useEffect(() => {
    const onConnected = () => setRoomKey((prev) => prev + 1);
    roomInstance.on(RoomEvent.Connected, onConnected);
    return () => {
      roomInstance.off(RoomEvent.Connected, onConnected);
    };
  }, [roomInstance]);

  const handleEndLogCall = () => {
    setSessionStarted(false);
    roomInstance.disconnect();
  };

  const isDisabled = isLoading || deleteLog.isPending;

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Your Logs
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Your all logs</p>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <CardContent className="p-6">
          <div className="h-[300px] w-full flex items-center justify-center">
            <Loader2 className="size-8 text-slate-300 animate-spin" />
          </div>
        </CardContent>
      </div>
    );
  }

  console.log("Logs:", logs);

  const tableData: LogTableType[] = (logs || []).map((log) => {
    // console.log("Processing log:", log);

    return {
      id: log.activeLog.id,
      cropName: log.crop.cropName,
      activityType: log.activeLog.activityType,
      summary: log.activeLog.summary,
      details: log.activeLog.details,
      createdAt: log.activeLog.createdAt.toString(),
      suggestions: log.activeLog.suggestions || [],
    };
  });

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">
            Your Logs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Your all logs</p>
        </div>

        <RoomContext.Provider value={roomInstance}>
          <RoomAudioRenderer key={roomKey} />
          <VoiceLogForm
            cropId={cropId}
            setSessionStarted={setSessionStarted}
            roomInstance={roomInstance}
          />
          <VoiceLogModal
            isAgentSpeaking={isAgentSpeaking}
            sessionStarted={sessionStarted}
            handleEndLogCall={handleEndLogCall}
          />
          <DataChannelLogHandler setAgentSpeaking={setIsAgentSpeaking} />
        </RoomContext.Provider>
      </div>

      <CardContent className="p-6">
        <DataTable
          columns={logsColumns}
          data={tableData}
          filterKey="cropName"
          onDelete={(rows) => {
            const ids = rows.map((r) => r.original.id);
            ids.forEach((id) => {
              deleteLog.mutate(id);
            });
          }}
          disabled={isDisabled}
        />
        <EditLogSheet />
        <ViewLogSheet />
      </CardContent>
    </div>
  );
};
