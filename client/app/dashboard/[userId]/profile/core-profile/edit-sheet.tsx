import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/zustand/store";
import { Button } from "@/components/ui/button";
import { useUpdateUser } from "@/hooks/user-api-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { SpeechInputButton } from "@/components/speech-input-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["M", "F", "O"]),
  primaryLanguage: z.string().min(1, "Primary language is required"),
  village: z.string().min(1, "Village is required"),
  district: z.string().min(1, "District is required"),
  age: z.number().min(0, "Age must be a positive number"),
  educationLevel: z.string().optional(),
  totalLandArea: z.string().min(1, "Land area is required"),
  experience: z.string().min(1, "Experience is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const CoreProfileEditSheet = () => {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useUpdateUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      gender: user?.gender || "M",
      primaryLanguage: user?.primaryLanguage || "",
      village: user?.village || "",
      district: user?.district || "",
      age: user?.age || 0,
      educationLevel: user?.educationLevel || "",
      totalLandArea: user?.totalLandArea || "",
      experience: user?.experience || "",
    },
  });

  useEffect(() => {
    if (isOpen && user) {
      form.reset({
        name: user?.name || "",
        gender: user?.gender || "M",
        primaryLanguage: user?.primaryLanguage || "",
        village: user?.village || "",
        district: user?.district || "",
        age: user?.age || 0,
        educationLevel: user?.educationLevel || "",
        totalLandArea: user?.totalLandArea || "",
        experience: user?.experience || "",
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = (data: FormValues) => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    mutation.mutate(
      {
        userId: user.id,
        data: {
          ...data,
          educationLevel: data.educationLevel || null,
        },
      },
      {
        onSuccess: (data, variables, context) => {
          setIsOpen(false);
          toast.success("Profile updated successfully");
        },
        onError: (error, variables, context) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Core Profile</SheetTitle>
          <SheetDescription>
            Update your personal information. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-6 w-full"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
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
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    disabled={mutation.isPending}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <SpeechInputButton
                      onTranscript={(text) => {
                        const num = parseInt(text);
                        if (!isNaN(num)) {
                          field.onChange(num);
                        } else {
                          toast.error("Please say a valid number");
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
              name="primaryLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Language</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
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
              name="village"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Village</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
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
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
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
              name="educationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education Level</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        disabled={mutation.isPending}
                        {...field}
                        placeholder="Optional"
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
              name="totalLandArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Land Area</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
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
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
                    </FormControl>
                    <SpeechInputButton
                      onTranscript={(text) => field.onChange(text)}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
