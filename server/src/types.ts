export type ConnectionDetails = {
  livekitServerUrl: string;
  roomName: string;
  participantIdentity: string;
  participantToken: string;
};

// types.ts
export interface Scheme {
  scheme_name: string;
  ministry: string;
  objective: string | string[];
  benefit?: string;
  eligibility: {
    criteria: string[];
  };
  exclusions?: string[];
  application_process: string;
  documents_required: string[];
  official_website: string;
  last_updated: string;
  features?: string[];
  targets?: string[];
  components?: string[];
}

export interface Chunk {
  scheme_name: string;
  ministry?: string;
  objective?: string | string[];
  benefit?: string;
  eligibility_criteria?: string[];
  exclusions?: string[];
  application_process?: string;
  documents_required?: string[];
  official_website?: string;
  features?: string[];
  chunk_type: "overview" | "eligibility" | "application" | "features";
  last_updated?: string;
}

export interface SchemeMetadata {
  scheme_name: string;
  ministry: string;
  chunk_type: string;
  last_updated: string;
  official_website: string;
}

export interface VectorEntry {
  id: string;
  values: number[];
  metadata: SchemeMetadata;
  document?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: SchemeMetadata;
  document?: string;
}
