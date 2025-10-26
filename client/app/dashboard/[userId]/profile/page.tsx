"use client";

import { Heading } from "@/components/heading";
import { useUserStore } from "@/zustand/store";
import { CropClient } from "./crops/crop-client";
import { ContactsSection } from "./contacts/section";
import { PlotsClientPage } from "./plots/plot-client";
import { CoreProfileSection } from "./core-profile/section";

const ProfilePage = () => {
  const { user } = useUserStore();

  if (!user) {
    return (
      <div className="flex bg-background min-h-screen">
        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-8">
            <div className="text-center py-12 text-muted-foreground">
              <p>Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background min-h-screen">
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-8">
          <Heading
            title="Profile"
            subheading="Manage your personal information and preferences"
          />
          <div className="space-y-8">
            <CoreProfileSection />
            <ContactsSection />
            <PlotsClientPage />
            <CropClient />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <p>Additional sections will be added here</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
