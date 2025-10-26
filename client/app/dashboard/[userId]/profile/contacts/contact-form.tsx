import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { SpeechInputButton } from "@/components/speech-input-button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const contactFormSchema = z.object({
  phoneNumber: z.string().length(10, "Phone number must be exactly 10 digits"),
  aadhaarNumber: z
    .string()
    .length(12, "Aadhaar number must be exactly 12 digits")
    .optional()
    .or(z.literal("")),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  verified: z.boolean().default(false),
});

type FormValues = z.input<typeof contactFormSchema>;

interface ContactFormProps {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultValues || {
      phoneNumber: "",
      aadhaarNumber: "",
      email: "",
      verified: false,
    },
  });

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const submitData = {
      ...data,
      aadhaarNumber: data.aadhaarNumber || undefined,
      email: data.email || undefined,
    };
    onSubmit(submitData);
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 mt-4"
      >
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="10-digit phone number"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => {
                    const numbers = text.replace(/\D/g, "");
                    if (numbers.length === 10) {
                      field.onChange(numbers);
                    } else {
                      toast.error("Please say a 10-digit phone number");
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
          name="aadhaarNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number (Optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="12-digit Aadhaar number"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <SpeechInputButton
                  onTranscript={(text) => {
                    const numbers = text.replace(/\D/g, "");
                    if (numbers.length === 12) {
                      field.onChange(numbers);
                    } else {
                      toast.error("Please say a 12-digit Aadhaar number");
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
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
          name="verified"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Verified</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark this contact as verified
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={disabled || !form.watch("phoneNumber")}
          className="w-full"
        >
          {id ? "Save Changes" : "Add Contact"}
        </Button>

        {!!id && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={handleDelete}
            className="flex items-center justify-center w-full gap-2"
          >
            <Trash className="size-4" />
            Delete Contact
          </Button>
        )}
      </form>
    </Form>
  );
};
