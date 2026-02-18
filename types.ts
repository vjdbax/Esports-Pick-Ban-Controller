
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
  videoInput: string; 
  imageFile: string; 
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

export interface CustomFont {
  name: string;
  data: string; // Base64
}

export interface DesignSettings {
  // Colors (Start / End gradients)
  banColorStart: string;
  banColorEnd: string;
  pickColorStart: string;
  pickColorEnd: string;
  deciderColorStart: string;
  deciderColorEnd: string;

  // Geometry
  scale: number; // 0.5 to 2.0
  verticalGap: number; // px
  horizontalOffset: number; // px from center
  verticalOffset: number; // px from top base line
  imageBorderWidth: number; // px

  // Typography
  fontSize: number;
  fontFamily: string;
  customFonts: CustomFont[];
}

// New Interface for the shared application state
export interface SharedState {
  teamAName: string;
  teamBName: string;
  maps: MapData[];
  steps: MatchStep[];
  selections: SelectionState;
  visibleSteps: number[];
  
  // New Design Settings Container
  design: DesignSettings;
}
