import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useNewPlot } from "@/hooks/use-plot-store";
import { PlotForm } from "./plot-form";
import { z } from "zod";
import { useCreatePlot } from "@/hooks/plots-api-hook";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const plotFormSchema = z.object({
    plotName: z.string().optional(),
    area: z.string().min(1, "Area is required"),
    soilType: z
        .enum(["clay", "loamy", "sandy", "laterite", "black"])
        .optional(),
    irrigationType: z
        .enum(["drip", "canal", "rain-fed", "sprinkler"])
        .optional(),
    waterSource: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    isOwned: z.boolean().default(true),
    ownershipProofUrl: z.string().optional(),
});

type FormValues = z.input<typeof plotFormSchema>;

const NewPlotSheet = () => {
    const { isOpen, onClose } = useNewPlot();
    const mutation = useCreatePlot();
    const { user } = useUser();
    const farmerId = user?.id;

    const onSubmit = (data: FormValues) => {
        if (!farmerId) return;

        mutation.mutate(
            {
                farmerId,
                ...data,
            },
            {
                onSuccess: () => {
                    toast.success("Plot Added Successfully");
                    onClose();
                },
                onError: () => {
                    toast.error("Invalid Input");
                },
            },
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="space-y-4 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Plot</SheetTitle>
                    <SheetDescription>
                        Create a new farm plot to track your agricultural land.
                    </SheetDescription>
                </SheetHeader>
                <PlotForm onSubmit={onSubmit} disabled={mutation.isPending} />
            </SheetContent>
        </Sheet>
    );
};

export default NewPlotSheet;
