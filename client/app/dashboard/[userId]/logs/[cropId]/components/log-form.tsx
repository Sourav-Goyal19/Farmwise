import { z } from "zod";
import { Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface LogFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  cropName?: string;
}

export const LogForm: React.FC<LogFormProps> = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  cropName,
}) => {
  const form = useForm<FormValues>({
    defaultValues: defaultValues || {
      activityType: undefined,
      summary: "",
      details: [],
      notes: "",
      suggestions: [],
    },
    resolver: zodResolver(logFormSchema),
  });

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    onSubmit(data);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const details = form.watch("details") || [];
  const suggestions = form.watch("suggestions") || [];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 mt-4 w-full"
      >
        {cropName && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Crop: {cropName}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="activityType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Type*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="pesticide">Pesticide</SelectItem>
                  <SelectItem value="fertilizer">Fertilizer</SelectItem>
                  <SelectItem value="sowing">Sowing</SelectItem>
                  <SelectItem value="plowing">Plowing</SelectItem>
                  <SelectItem value="weeding">Weeding</SelectItem>
                  <SelectItem value="harvest">Harvest</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary of the activity..."
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {details.length > 0 && (
          <FormItem>
            <FormLabel>Activity Details</FormLabel>
            <div className="flex flex-wrap gap-2">
              {details.map((detail, index) => (
                <Badge key={index} variant="secondary">
                  {detail}
                </Badge>
              ))}
            </div>
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {suggestions.length > 0 && (
          <FormItem>
            <FormLabel>Suggestions</FormLabel>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50">
                  {suggestion}
                </Badge>
              ))}
            </div>
          </FormItem>
        )}

        <Button type="submit" disabled={disabled || !form.watch("summary")}>
          {id ? "Save Changes" : "Update Log"}
        </Button>

        {!!id && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={handleDelete}
            className="flex items-center justify-center w-full gap-2"
          >
            <Trash className="size-4 mr-2" />
            Delete Log
          </Button>
        )}
      </form>
    </Form>
  );
};
