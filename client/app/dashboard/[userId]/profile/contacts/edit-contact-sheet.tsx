import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useOpenContact } from "@/hooks/use-contact-store";
import {
    useFetchContact,
    useUpdateContact,
    useDeleteContact,
} from "@/hooks/contact-api-hook";
import { ContactForm } from "./contact-form";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";

const EditContactSheet = () => {
    const { isOpen, onClose, id } = useOpenContact();
    const [ConfirmDialog, confirm] = useConfirm(
        "Are you sure?",
        "You are about to delete this contact",
    );

    const contactQuery = useFetchContact(id);
    const updateMutation = useUpdateContact();
    const deleteMutation = useDeleteContact();

    const onSubmit = (data: any) => {
        if (!id) return;

        updateMutation.mutate(
            {
                contactId: id,
                data,
            },
            {
                onSuccess: () => {
                    toast.success("Contact Updated Successfully");
                    onClose();
                },
            },
        );
    };

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

    const isPending = updateMutation.isPending || deleteMutation.isPending;

    const defaultValues = contactQuery.data
        ? {
            phoneNumber: contactQuery.data.phoneNumber,
            aadhaarNumber: contactQuery.data.aadhaarNumber || "",
            email: contactQuery.data.email || "",
            verified: contactQuery.data.verified,
        }
        : undefined;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <ConfirmDialog />
            <SheetContent className="space-y-4">
                <SheetHeader>
                    <SheetTitle>Edit Contact</SheetTitle>
                    <SheetDescription>
                        Update contact information
                    </SheetDescription>
                </SheetHeader>

                {contactQuery.isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ContactForm
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

export default EditContactSheet;
