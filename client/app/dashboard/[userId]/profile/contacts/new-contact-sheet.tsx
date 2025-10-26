import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNewContact } from "@/hooks/use-contact-store";
import { ContactForm } from "./contact-form";
import { useCreateContact } from "@/hooks/contact-api-hook";
import { useUserStore } from "@/zustand/store";

const NewContactSheet = () => {
  const { isOpen, onClose } = useNewContact();
  const { user } = useUserStore();
  const createMutation = useCreateContact();

  const onSubmit = (data: any) => {
    if (!user?.id) return;

    createMutation.mutate(
      {
        ...data,
        farmerId: user.id,
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
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>Add Contact</SheetTitle>
          <SheetDescription>
            Add a new phone number and contact information
          </SheetDescription>
        </SheetHeader>
        <ContactForm onSubmit={onSubmit} disabled={createMutation.isPending} />
      </SheetContent>
    </Sheet>
  );
};

export default NewContactSheet;
