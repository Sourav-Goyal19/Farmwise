import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { CropForm } from "./crop-form";
import { useConfirm } from "@/hooks/use-confirm";
import { useOpenCrop } from "@/hooks/use-crop-store";
import { useFetchCrop } from "@/hooks/plot-crops-api-hook";
import { useUpdateCrop, useDeleteCrop } from "@/hooks/plot-crops-api-hook";

const cropFormSchema = z.object({
  cropName: z.string().min(1, "Crop name is required"),
  variety: z.string().optional(),
  season: z.string().optional(),
  sowingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  currentStage: z.string().optional(),
  estimatedYieldKg: z.string().optional(),
});

type FormValues = z.input<typeof cropFormSchema>;

const EditCropSheet = () => {
  const { isOpen, onClose, id } = useOpenCrop();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this crop record"
  );

  const cropQuery = useFetchCrop(id);
  const updateMutation = useUpdateCrop();
  const deleteMutation = useDeleteCrop();

  const onSubmit = (data: FormValues) => {
    if (!id) return;

    updateMutation.mutate(
      {
        cropId: id,
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

  if (!cropQuery.data) return null;

  const defaultValues = cropQuery.data && {
    cropName: cropQuery.data.cropName,
    variety: cropQuery.data.variety || "",
    season: cropQuery.data.season || "",
    sowingDate: cropQuery.data.sowingDate || "",
    expectedHarvestDate: cropQuery.data.expectedHarvestDate || "",
    currentStage: cropQuery.data.currentStage || "",
    estimatedYieldKg: cropQuery.data.estimatedYieldKg || "",
  };

  return (
    <Sheet open={isOpen && cropQuery.data != undefined} onOpenChange={onClose}>
      <ConfirmDialog />
      <SheetContent className="space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Crop</SheetTitle>
          <SheetDescription>
            Update crop information and details.
          </SheetDescription>
        </SheetHeader>

        {cropQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CropForm
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

export default EditCropSheet;
