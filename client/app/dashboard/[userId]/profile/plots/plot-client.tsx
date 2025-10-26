"use client";

import { useUser } from "@clerk/nextjs";
import NewPlotSheet from "./new-plot-sheet";
import { Loader2, Plus } from "lucide-react";
import EditPlotSheet from "./edit-plot-sheet";
import { Button } from "@/components/ui/button";
import { columns, PlotTableType } from "./columns";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewPlot } from "@/hooks/use-plot-store";
import { useDeletePlot } from "@/hooks/plots-api-hook";
import { useFetchPlotsByFarmer } from "@/hooks/plots-api-hook";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const PlotsClientPage = () => {
  const { user } = useUser();
  const { data: plots, isLoading } = useFetchPlotsByFarmer(user?.id);
  const deletePlot = useDeletePlot();
  const { onOpen } = useNewPlot();

  const isDisabled = isLoading || deletePlot.isPending;

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-12 text-slate-300 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tableData: PlotTableType[] = (plots || []).map((plot) => ({
    id: plot.id,
    plotName: plot.plotName || "Unnamed Plot",
    area: plot.area,
    soilType: plot.soilType || "Not specified",
    irrigationType: plot.irrigationType || "Not specified",
    waterSource: plot.waterSource || "Not specified",
    isOwned: plot.isOwned,
    createdAt: plot.createdAt,
  }));

  return (
    <div className="w-full">
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border mb-3">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Farm Plot
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your plots information
            </p>
          </div>

          <Button
            onClick={() => onOpen()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Plot
          </Button>
          <NewPlotSheet />
          <EditPlotSheet />
        </div>
        <CardContent>
          <DataTable
            columns={columns}
            data={tableData}
            filterKey="plotName"
            onDelete={(rows) => {
              const ids = rows.map((r) => r.original.id);
              ids.forEach((id) => {
                deletePlot.mutate(id);
              });
            }}
            disabled={isDisabled}
          />
        </CardContent>
      </div>
    </div>
  );
};
