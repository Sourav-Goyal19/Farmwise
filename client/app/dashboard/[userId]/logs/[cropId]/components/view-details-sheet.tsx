import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useViewLog } from "@/hooks/use-log-store";
import { useFetchActivityLog } from "@/hooks/logs-api-hook";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const ViewLogSheet = () => {
  const { isViewOpen, onViewClose, viewId } = useViewLog();
  const logQuery = useFetchActivityLog(viewId, isViewOpen);

  if (!logQuery.data) return null;

  const log = logQuery.data.activeLog;
  const crop = logQuery.data.crop;

  return (
    <Sheet open={isViewOpen} onOpenChange={onViewClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Activity Log Details</SheetTitle>
          <SheetDescription>View activity log information.</SheetDescription>
        </SheetHeader>

        {logQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logQuery.data ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Crop Information
                    </h3>
                    <p className="text-sm font-semibold">{crop.cropName}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Activity Type</h3>
                    <Badge variant="secondary" className="capitalize">
                      {log.activityType}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      {log.summary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {log.details && log.details.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3 w-full">
                    Activity Details
                  </h3>
                  <div className="flex flex-col gap-2 w-full">
                    {log.details.map((detail, index) => (
                      <Badge key={index} className="w-full">
                        {detail}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {log.notes && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
                  <p className="text-sm text-muted-foreground">{log.notes}</p>
                </CardContent>
              </Card>
            )}

            {log.suggestions && log.suggestions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Suggestions</h3>
                  <div className="space-y-2">
                    {log.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Created{" "}
                  {format(new Date(log.createdAt), "dd MMM, yyyy 'at' hh:mm a")}
                </p>
                {log.updatedAt && log.updatedAt !== log.createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated{" "}
                    {format(
                      new Date(log.updatedAt),
                      "dd MMM, yyyy 'at' hh:mm a"
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Failed to load log data</p>
            </CardContent>
          </Card>
        )}
      </SheetContent>
    </Sheet>
  );
};
