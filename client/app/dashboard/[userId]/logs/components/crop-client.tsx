"use client";

import { format } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { useFetchCropsByFarmer } from "@/hooks/plot-crops-api-hook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CropsClient = () => {
  const { user } = useUser();
  const router = useRouter();
  const { data: crops, isLoading } = useFetchCropsByFarmer(user?.id);

  const handleCropClick = (cropId: string) => {
    if (user?.id) {
      router.push(`/dashboard/${user.id}/logs/${cropId}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "d MMM, yyyy");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!crops || crops.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No crops found</h3>
        <p className="text-muted-foreground mb-6">
          You haven't added any crops to your plots yet.
        </p>
        <Button onClick={() => router.push("/profile")}>
          Add Crops to Plots
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Crops</h1>
          <p className="text-muted-foreground mt-2">
            Select a crop to view and manage its activity logs
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {crops.length} {crops.length === 1 ? "crop" : "crops"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map(({ crop, plot }) => (
          <Card
            key={crop.id}
            className="border-border hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleCropClick(crop.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {crop.cropName}
                  </CardTitle>
                  {crop.variety && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {crop.variety}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {plot.plotName || "Unnamed Plot"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {crop.season && (
                  <Badge variant="outline" className="text-xs">
                    {crop.season}
                  </Badge>
                )}
                {crop.currentStage && (
                  <Badge variant="secondary" className="text-xs">
                    {crop.currentStage}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sowing:</span>
                  <span>{formatDate(crop.sowingDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Expected Harvest:
                  </span>
                  <span>{formatDate(crop.expectedHarvestDate)}</span>
                </div>
              </div>

              {crop.estimatedYieldKg && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Estimated Yield:
                    </span>
                    <span className="font-medium">
                      {crop.estimatedYieldKg} kg
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4 group-hover:border-primary group-hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCropClick(crop.id);
                }}
              >
                View Logs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
