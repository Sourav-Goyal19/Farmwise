import { CropTableType } from "./app/dashboard/[userId]/profile/crops/columns";

export type UserType = {
    id: string;
    name: string;
    gender: "M" | "F" | "O";
    primaryLanguage: string;
    village: string;
    district: string | null;
    age: number;
    educationLevel: string | null;
    totalLandArea: string;
    experience: string;
    createdAt: Date;
    updatedAt: Date;
    completed: boolean;
};

export type ConnectionDetails = {
    livekitServerUrl: string;
    roomName: string;
    participantIdentity: string;
    participantToken: string;
};

export type ContactType = {
    id: string;
    farmerId: string;
    phoneNumber: string;
    aadhaarNumber?: string | null;
    email?: string | null;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
};

export type PlotType = {
    id: string;
    farmerId: string;
    plotName?: string;
    area: string;
    soilType?: "clay" | "loamy" | "sandy" | "laterite" | "black";
    irrigationType?: "drip" | "canal" | "rain-fed" | "sprinkler";
    waterSource?: string;
    latitude?: string;
    longitude?: string;
    isOwned: boolean;
    ownershipProofUrl?: string;
    createdAt: string;
    updatedAt: string;
};

export type PlotCropType = {
    id: string;
    plotId: string;
    cropName: string;
    variety?: string;
    season?: string;
    sowingDate?: string;
    expectedHarvestDate?: string;
    currentStage?: string;
    estimatedYieldKg?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type CreatePlotResponse = {
    message: string;
    plot: PlotType;
};

export type UpdatePlotResponse = {
    message: string;
    plot: PlotType;
};

export type AddCropResponse = {
    message: string;
    plot: CropTableType;
};
export type UpdateCropResponse = {
    message: string;
    plot: CropTableType;
};
export type RetrieveCropResponse = {
    message: string;
    plot: CropTableType;
};

// export type CreateContactResponse={
//
// }
