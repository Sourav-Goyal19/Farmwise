"use client";

import { useState, useEffect } from "react";
import axiosIns from "@/lib/axios";
import { UserType } from "@/types";
import { AxiosResponse } from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ProfileBuilding } from "./components/profile-building";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  // { id: "gujrati", label: "Gujrati" },
  // { id: "punjabi", label: "Punjabi" },
  // { id: "bengali", label: "Bengali" },
  // { id: "tamil", label: "Tamil" },
] as const;

const ProfileBuildingPage = () => {
  const [_, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [languageSelected, setLanguageSelected] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.id) {
        router.push("/");
        return;
      }

      try {
        const res: AxiosResponse<{ message: string; user: UserType | null }> =
          await axiosIns.get(`/api/user?userId=${user.id}`);

        if (res.data?.user?.completed) {
          router.push("/dashboard");
        } else {
          setUser(res.data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUser();
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

  if (!isLoaded || loading) {
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
          console.log("Call ended");
        }}
      />
    </div>
  );
};

export default ProfileBuildingPage;
