import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { z } from "zod";
import { PlotForm } from "./plot-form";
import { useOpenPlot } from "@/hooks/use-plot-store";
import { useFetchPlot } from "@/hooks/plots-api-hook";
import { Loader2 } from "lucide-react";
import { useUpdatePlot, useDeletePlot } from "@/hooks/plots-api-hook";
import { useConfirm } from "@/hooks/use-confirm";

const plotFormSchema = z.object({
  plotName: z.string().optional(),
  area: z.string().min(1, "Area is required"),
  soilType: z.enum(["clay", "loamy", "sandy", "laterite", "black"]).optional(),
  irrigationType: z.enum(["drip", "canal", "rain-fed", "sprinkler"]).optional(),
  waterSource: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  isOwned: z.boolean().default(true),
  ownershipProofUrl: z.string().optional(),
});

type FormValues = z.input<typeof plotFormSchema>;

const EditPlotSheet = () => {
  const { isOpen, onClose, id } = useOpenPlot();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this plot and all its associated data"
  );

  const plotQuery = useFetchPlot(id);
  const updateMutation = useUpdatePlot();
  const deleteMutation = useDeletePlot();

  const onSubmit = (data: FormValues) => {
    if (!id) return;

    updateMutation.mutate(
      {
        plotId: id,
        data,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  const onDelete = async () => {
    if (!id) return;

    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  if (!plotQuery.data) return null;

  const defaultValues = plotQuery.data && {
    plotName: plotQuery.data.plotName || "",
    area: plotQuery.data.area,
    soilType: plotQuery.data.soilType,
    irrigationType: plotQuery.data.irrigationType,
    waterSource: plotQuery.data.waterSource || "",
    latitude: plotQuery.data.latitude || "",
    longitude: plotQuery.data.longitude || "",
    isOwned: plotQuery.data.isOwned,
    ownershipProofUrl: plotQuery.data.ownershipProofUrl || "",
  };

  return (
    <Sheet open={isOpen && plotQuery.data != undefined} onOpenChange={onClose}>
      <ConfirmDialog />
      <SheetContent className="space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Plot</SheetTitle>
          <SheetDescription>
            Update plot information and details.
          </SheetDescription>
        </SheetHeader>

        {plotQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PlotForm
            id={id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            disabled={isPending}
            onDelete={onDelete}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditPlotSheet;
