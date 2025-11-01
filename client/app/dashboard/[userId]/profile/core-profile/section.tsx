import React from "react";
import {
    User,
    MapPin,
    GraduationCap,
    Calendar,
    Languages,
    Globe2,
} from "lucide-react";
import { CoreProfileEditSheet } from "./edit-sheet";
import { useUserStore } from "@/zustand/store";

export const CoreProfileSection = () => {
    const { user } = useUserStore();

    if (!user) return null;

    return (
        <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                    <h2 className="text-xl font-semibold text-card-foreground">
                        Core Profile
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your basic personal information
                    </p>
                </div>

                <CoreProfileEditSheet />
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 capitalize">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Full Name
                            </span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.name}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="text-sm font-medium">Gender</span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.gender === "M"
                                ? "Male"
                                : user.gender === "F"
                                  ? "Female"
                                  : "Other"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Age</span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.age} years
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Languages className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Primary Language
                            </span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.primaryLanguage}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">Village</span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.village}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe2 className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                District
                            </span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.district || "Not specified"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Education Level
                            </span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.educationLevel || "Not specified"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Total Land Area
                            </span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.totalLandArea}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Experience
                            </span>
                        </div>
                        <p className="text-base text-foreground font-medium">
                            {user.experience}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
