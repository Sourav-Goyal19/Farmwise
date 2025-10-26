import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { z } from "zod";
import { CropForm } from "./crop-form";
import { useNewCrop } from "@/hooks/use-crop-store";
import { useCreateCrop } from "@/hooks/plot-crops-api-hook";

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

interface NewCropSheetProps {
  plotId: string;
}

const NewCropSheet: React.FC<NewCropSheetProps> = ({ plotId }) => {
  const { isOpen, onClose } = useNewCrop();
  const mutation = useCreateCrop();

  const onSubmit = (data: FormValues) => {
    if (!plotId) {
      console.error("No plot selected");
      return;
    }

    mutation.mutate(
      {
        plotId,
        ...data,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Crop</SheetTitle>
          <SheetDescription>
            Add a new crop to track planting and harvesting details.
          </SheetDescription>
        </SheetHeader>
        <CropForm onSubmit={onSubmit} disabled={mutation.isPending} />
      </SheetContent>
    </Sheet>
  );
};

export default NewCropSheet;
