import { z } from "zod";
import { Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { SpeechInputButton } from "@/components/speech-input-button";
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

interface PlotFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const PlotForm: React.FC<PlotFormProps> = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
}) => {
  const form = useForm<FormValues>({
    defaultValues: defaultValues || {
      plotName: "",
      area: "",
      soilType: undefined,
      irrigationType: undefined,
      waterSource: "",
      latitude: "",
      longitude: "",
      isOwned: true,
      ownershipProofUrl: "",
    },
    resolver: zodResolver(plotFormSchema),
  });

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    onSubmit(data);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 mt-4 w-full"
      >
        <FormField
          control={form.control}
          name="plotName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plot Name (Optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. North Field, Main Plot"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => field.onChange(text)}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area (acres)*</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. 2.5"
                    type="number"
                    step="0.1"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => {
                    const numbers = text.match(/\d+(\.\d+)?/g);
                    if (numbers && numbers.length > 0) {
                      field.onChange(numbers[0]);
                    } else {
                      field.onChange(text);
                    }
                  }}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="soilType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soil Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="loamy">Loamy</SelectItem>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="laterite">Laterite</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="irrigationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Irrigation Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select irrigation type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="drip">Drip</SelectItem>
                  <SelectItem value="canal">Canal</SelectItem>
                  <SelectItem value="rain-fed">Rain-fed</SelectItem>
                  <SelectItem value="sprinkler">Sprinkler</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="waterSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Water Source</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. Well, River, Pond"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => field.onChange(text)}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. 28.6139"
                    type="number"
                    step="0.0001"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => {
                    const numbers = text.match(/\d+(\.\d+)?/g);
                    if (numbers && numbers.length > 0) {
                      field.onChange(numbers[0]);
                    } else {
                      field.onChange(text);
                    }
                  }}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. 77.2090"
                    type="number"
                    step="0.0001"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => {
                    const numbers = text.match(/\d+(\.\d+)?/g);
                    if (numbers && numbers.length > 0) {
                      field.onChange(numbers[0]);
                    } else {
                      field.onChange(text);
                    }
                  }}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isOwned"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>This plot is owned by me</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Uncheck if this plot is rented or leased
                </p>
              </div>
            </FormItem>
          )}
        />

        {form.watch("isOwned") === false && (
          <FormField
            control={form.control}
            name="ownershipProofUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lease/Rental Proof URL</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="https://example.com/lease-document.pdf"
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                  <SpeechInputButton
                    onTranscript={(text) => field.onChange(text)}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={disabled || !form.watch("area")}>
          {id ? "Save Changes" : "Create Plot"}
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
            Delete Plot
          </Button>
        )}
      </form>
    </Form>
  );
};
