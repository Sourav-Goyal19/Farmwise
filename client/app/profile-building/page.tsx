"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFetchUser } from "@/hooks/use-fetch-user";
import { ProfileBuilding } from "./components/profile-building";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  // { id: "gujrati", label: "Gujrati" },
  // { id: "punjabi", label: "Punjabi" },
  // { id: "bengali", label: "Bengali" },
  // { id: "tamil", label: "Tamil" },
] as const;

const ProfileBuildingPage = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [languageSelected, setLanguageSelected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const { data, isLoading, isPending } = useFetchUser(user?.id, isLoaded);

  useEffect(() => {
    if (!user?.id) {
      router.push("/sign-in");
      return;
    }

    if (data?.completed) {
      router.push("/dashboard");
    }
  }, [user?.id, isLoaded, router]);

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      setLanguageSelected(true);
    }
  };

  if (!isLoaded || isLoading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    router.push("/");
    return null;
  }

  if (!languageSelected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl font-semibold">
              Select Language
            </CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3">
              {LANGUAGES.map((language) => (
                <Button
                  key={language.id}
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-base transition-all",
                    selectedLanguage == language.id &&
                      "bg-primary/10 border-2 border-primary hover:bg-primary/10"
                  )}
                  onClick={() => handleLanguageSelect(language.id)}
                >
                  {language.label}
                </Button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleContinue}
              disabled={!selectedLanguage}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <ProfileBuilding
        userId={user.id}
        primaryLanguage={selectedLanguage}
        onCallEnd={() => {
          // console.log("Call ended");
          setSelectedLanguage("");
          setLanguageSelected(false);
          router.push("/dashboard");
        }}
      />
    </div>
  );
};

export default ProfileBuildingPage;
