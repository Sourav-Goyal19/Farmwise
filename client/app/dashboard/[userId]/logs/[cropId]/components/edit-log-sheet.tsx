import { z } from "zod";
import { LogForm } from "./log-form";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { useOpenLog } from "@/hooks/use-log-store";
import { useFetchActivityLog } from "@/hooks/logs-api-hook";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useUpdateActivityLog,
  useDeleteActivityLog,
} from "@/hooks/logs-api-hook";

const logFormSchema = z.object({
  activityType: z.enum([
    "irrigation",
    "pesticide",
    "fertilizer",
    "sowing",
    "plowing",
    "weeding",
    "harvest",
    "transport",
    "sales",
    "inspection",
    "maintenance",
    "other",
  ]),
  summary: z.string().min(1, "Summary is required"),
  details: z.array(z.string()).default([]),
  notes: z.string().optional(),
  suggestions: z.array(z.string()).default([]),
});

type FormValues = z.input<typeof logFormSchema>;

export const EditLogSheet = () => {
  const { isOpen, onClose, id } = useOpenLog();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this activity log"
  );

  const logQuery = useFetchActivityLog(id, isOpen);
  const updateMutation = useUpdateActivityLog();
  const deleteMutation = useDeleteActivityLog();

  const onSubmit = (data: FormValues) => {
    if (!id) return;

    updateMutation.mutate(
      {
        logId: id,
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

  if (!logQuery.data) return null;

  const defaultValues = logQuery.data && {
    activityType: logQuery?.data?.activeLog?.activityType,
    summary: logQuery?.data?.activeLog?.summary,
    details: logQuery?.data?.activeLog?.details || [],
    notes: logQuery?.data?.activeLog?.notes || "",
    suggestions: logQuery.data?.activeLog?.suggestions || [],
  };

  return (
    <Sheet open={isOpen && logQuery.data != undefined} onOpenChange={onClose}>
      <ConfirmDialog />
      <SheetContent className="space-y-4 overflow-y-auto max-w-md">
        <SheetHeader>
          <SheetTitle>Activity Log Details</SheetTitle>
          <SheetDescription>
            View and update activity log information.
          </SheetDescription>
        </SheetHeader>

        {logQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <LogForm
            id={id}
            onSubmit={onSubmit}
            defaultValues={defaultValues}
            disabled={isPending}
            onDelete={onDelete}
            cropName={logQuery.data.crop.cropName}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
