import React from "react";
import { ContactType } from "@/types";
import { useUserStore } from "@/zustand/store";
import { Button } from "@/components/ui/button";
import NewContactSheet from "./new-contact-sheet";
import EditContactSheet from "./edit-contact-sheet";
import { useFetchContactsByFarmer } from "@/hooks/contact-api-hook";
import { useNewContact, useOpenContact } from "@/hooks/use-contact-store";
import { Phone, Mail, IdCard, ShieldCheck, Pencil, Plus } from "lucide-react";

export const ContactsSection = () => {
  const { user } = useUserStore();
  const {
    data: contacts,
    isLoading,
    error,
  } = useFetchContactsByFarmer(user?.id);
  const { onOpen: onOpenNew } = useNewContact();
  const { onOpen: onOpenEdit } = useOpenContact();

  if (!user) return null;

  const contact = contacts?.[0];

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Loading contact information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-destructive">
              Error loading contact information
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Contact Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your primary phone number and contact details
            </p>
          </div>

          <Button
            onClick={contact ? () => onOpenEdit(contact.id) : onOpenNew}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {contact ? (
              <>
                <Pencil className="h-4 w-4" />
                Edit Contact
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Contact
              </>
            )}
          </Button>
        </div>

        <div className="p-6">
          {!contact ? <EmptyState /> : <ContactDisplay contact={contact} />}
        </div>
      </div>

      <NewContactSheet />
      <EditContactSheet />
    </>
  );
};

const EmptyState = () => (
  <div className="text-center py-8">
    <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-muted-foreground">No contact information added yet</p>
    <p className="text-sm text-muted-foreground mt-1">
      Add your phone number and contact details to get started
    </p>
  </div>
);

const ContactDisplay = ({ contact }: { contact: ContactType }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <Phone className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Phone Number
          </p>
          <p className="text-base text-foreground font-medium">
            {contact.phoneNumber}
          </p>
        </div>
      </div>
      {contact.verified && <ShieldCheck className="h-5 w-5 text-green-600" />}
    </div>

    {contact.aadhaarNumber && (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <IdCard className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Aadhaar Number
            </p>
            <p className="text-base text-foreground font-medium">
              {contact.aadhaarNumber}
            </p>
          </div>
        </div>
      </div>
    )}

    {contact.email && (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Email Address
            </p>
            <p className="text-base text-foreground font-medium">
              {contact.email}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
);
