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
