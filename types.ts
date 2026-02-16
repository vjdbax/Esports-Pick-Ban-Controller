export enum PhaseType {
  BAN = 'BAN',
  PICK = 'PICK',
  DECIDER = 'DECIDER'
}

export enum Team {
  A = 'Team A',
  B = 'Team B',
  NONE = 'Decider'
}

export interface MapData {
  name: string;
  videoInput: string; // Kept for legacy vMix compatibility if needed
  imageFile: string; // Base64 Data URL for Overlay compatibility
  imageFileName?: string;
}

export interface MatchStep {
  id: number;
  team: Team;
  type: PhaseType;
}

export interface SelectionState {
  [stepId: number]: string; // mapName
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'request';
  message: string;
  details?: any;
}

// New Interface for the shared application state
export interface SharedState {
  teamAName: string;
  teamBName: string;
  maps: MapData[];
  steps: MatchStep[];
  selections: SelectionState;
  visibleSteps: number[]; // IDs of steps that have been triggered ("GO")
}