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

export type CreateCropResponse = {
    message: string;
    crop: CropTableType;
};
export type UpdateCropResponse = {
    message: string;
    crop: CropTableType;
};
export type RetrieveCropResponse = {
    message: string;
    crop: CropTableType;
};

export type SelectActivityLogType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
  cropId: string;
  activityType:
    | "irrigation"
    | "pesticide"
    | "fertilizer"
    | "sowing"
    | "plowing"
    | "weeding"
    | "harvest"
    | "transport"
    | "sales"
    | "inspection"
    | "maintenance"
    | "other";
  details: string[];
  summary: string;
  said: string;
  photoUrl?: string;
  notes?: string;
  suggestions?: string[];
};

export type InsertActivityLogType = {
  cropId: string;
  farmerId: string;
  activityType:
    | "irrigation"
    | "pesticide"
    | "fertilizer"
    | "sowing"
    | "plowing"
    | "weeding"
    | "harvest"
    | "transport"
    | "sales"
    | "inspection"
    | "maintenance"
    | "other";
  details: string[];
  summary: string;
  said: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  photoUrl?: string;
  notes?: string;
  suggestions?: string[];
};

export type NotificationType = {
  id: string;
  createdAt: Date;
  farmerId: string;
  message: string;
  type: "message" | "reminder" | "alert";
  scheduledFor: Date | null;
  isRead: boolean;
  isSent: boolean;
  jobId?: string;
};
