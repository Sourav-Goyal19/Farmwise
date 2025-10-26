import { z } from "zod";
import { Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
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

interface CropFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const CropForm: React.FC<CropFormProps> = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
}) => {
  const form = useForm<FormValues>({
    defaultValues: defaultValues || {
      cropName: "",
      variety: "",
      season: "",
      sowingDate: "",
      expectedHarvestDate: "",
      currentStage: "",
      estimatedYieldKg: "",
    },
    resolver: zodResolver(cropFormSchema),
  });

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    onSubmit(data);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  const stringToDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return isNaN(date.getTime()) ? undefined : date;
  };

  const dateToString = (date?: Date): string => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 mt-4 w-full"
      >
        <FormField
          control={form.control}
          name="cropName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop Name *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. Wheat, Rice, Cotton"
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
          name="variety"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variety</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. Basmati, Hybrid"
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
          name="season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Season</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="kharif">Kharif</SelectItem>
                  <SelectItem value="rabi">Rabi</SelectItem>
                  <SelectItem value="zaid">Zaid</SelectItem>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sowingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Sowing Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={stringToDate(field.value)}
                  onChange={(date) => field.onChange(dateToString(date))}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedHarvestDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expected Harvest Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={stringToDate(field.value)}
                  onChange={(date) => field.onChange(dateToString(date))}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currentStage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Stage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select current stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sowing">Sowing</SelectItem>
                  <SelectItem value="germination">Germination</SelectItem>
                  <SelectItem value="vegetative">Vegetative</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                  <SelectItem value="fruiting">Fruiting</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="harvested">Harvested</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedYieldKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Yield (kg)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="e.g. 500"
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

        <Button type="submit" disabled={disabled || !form.watch("cropName")}>
          {id ? "Save Changes" : "Add Crop"}
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
            Delete Crop
          </Button>
        )}
      </form>
    </Form>
  );
};
