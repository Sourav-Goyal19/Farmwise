import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { z } from "zod";
import { PlotForm } from "./plot-form";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";
import { useOpenPlot } from "@/hooks/use-plot-store";
import {
  useUpdatePlot,
  useDeletePlot,
  useFetchPlot,
} from "@/hooks/plots-api-hook";

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
        onSuccess: (res) => {
          toast.success("Plot Edited Successfully");
          onClose();
        },
        onError: (err) => {
          console.log(err);
          toast.error("Error while editting plot");
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
    latitude: plotQuery.data.latitude?.toString() || "",
    longitude: plotQuery.data.longitude?.toString() || "",
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
            disabled={isPending}
            onDelete={onDelete}
            defaultValues={defaultValues}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default EditPlotSheet;
