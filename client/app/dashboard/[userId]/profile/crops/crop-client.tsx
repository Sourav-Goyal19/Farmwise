"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import NewCropSheet from "./new-crop-sheet";
import { Loader2, Plus } from "lucide-react";
import EditCropSheet from "./edit-crop-sheet";
import { Button } from "@/components/ui/button";
import { columns, CropTableType } from "./columns";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewCrop } from "@/hooks/use-crop-store";
import { useDeleteCrop } from "@/hooks/plot-crops-api-hook";
import { useFetchPlotsByFarmer } from "@/hooks/plots-api-hook";
import { useFetchCropsByPlot } from "@/hooks/plot-crops-api-hook";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CropClient: React.FC = () => {
  const { user } = useUser();
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");

  const { data: plots, isLoading: plotsLoading } = useFetchPlotsByFarmer(
    user?.id
  );
  const { data: crops, isLoading: cropsLoading } = useFetchCropsByPlot(
    selectedPlotId,
    !!selectedPlotId
  );

  const deleteCrop = useDeleteCrop();
  const { onOpen } = useNewCrop();

  const isDisabled = plotsLoading || cropsLoading || deleteCrop.isPending;

  const selectedPlot = plots?.find((plot) => plot.id === selectedPlotId);
  const selectedPlotName = selectedPlot?.plotName || "Unnamed Plot";

  if (plotsLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-12 text-primary animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tableData: CropTableType[] = (crops || []).map((crop) => ({
    id: crop.id,
    cropName: crop.cropName,
    variety: crop.variety,
    season: crop.season,
    sowingDate: crop.sowingDate,
    expectedHarvestDate: crop.expectedHarvestDate,
    currentStage: crop.currentStage,
    estimatedYieldKg: crop.estimatedYieldKg,
    plotId: crop.plotId,
    createdAt: crop.createdAt,
    updatedAt: crop.updatedAt,
  }));

  console.log(crops);

  return (
    <div className="w-full">
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-border mb-3 gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-card-foreground">
              Crop Management
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage crops across your farm plots
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={selectedPlotId} onValueChange={setSelectedPlotId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a plot" />
              </SelectTrigger>
              <SelectContent>
                {plots?.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.plotName || `Plot ${plot.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
                {(!plots || plots.length === 0) && (
                  <SelectItem value="no-plots" disabled>
                    No plots available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedPlotId && (
              <Button
                onClick={() => onOpen()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Crop
              </Button>
            )}
          </div>
        </div>

        <CardContent>
          {!selectedPlotId ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No Plot Selected</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Please select a plot from the dropdown above to view and
                  manage crops.
                </p>
              </div>
            </div>
          ) : cropsLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium">
                  Crops in {selectedPlotName}
                </h3>
                {selectedPlot?.area && (
                  <p className="text-sm text-muted-foreground">
                    Plot Area: {selectedPlot.area} acres
                  </p>
                )}
              </div>

              <DataTable
                columns={columns}
                data={tableData}
                filterKey="crop by name"
                onDelete={(rows) => {
                  const ids = rows.map((r) => r.original.id);
                  ids.forEach((id) => {
                    deleteCrop.mutate(id);
                  });
                }}
                disabled={isDisabled}
              />
            </>
          )}
        </CardContent>
      </div>

      {selectedPlotId && (
        <>
          <NewCropSheet plotId={selectedPlotId} />
          <EditCropSheet />
        </>
      )}
    </div>
  );
};
