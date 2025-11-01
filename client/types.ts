export type UserType = {
  id: string;
  name: string;
  gender: "M" | "F" | "O";
  primaryLanguage: string;
  village: string;
  district: string | null;
  age: number;
  educationLevel?: string;
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
  aadhaarNumber?: string;
  email?: string;
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
