import { MatchStep, PhaseType, Team } from './types';

// The sequence based on the prompt description
// 1. A-BAN, 2. B-BAN, 3. B-BAN, 4. A-BAN, 5. A-PICK, 6. B-PICK
// 7. B-BAN, 8. A-BAN, 9. A-PICK, 10. B-PICK ... ending in Decider at 23
export const MATCH_SEQUENCE: MatchStep[] = [
  { id: 1, team: Team.A, type: PhaseType.BAN },
  { id: 2, team: Team.B, type: PhaseType.BAN },
  { id: 3, team: Team.B, type: PhaseType.BAN },
  { id: 4, team: Team.A, type: PhaseType.BAN },
  { id: 5, team: Team.A, type: PhaseType.PICK },
  { id: 6, team: Team.B, type: PhaseType.PICK },
  { id: 7, team: Team.B, type: PhaseType.BAN },
  { id: 8, team: Team.A, type: PhaseType.BAN },
  { id: 9, team: Team.A, type: PhaseType.PICK },
  { id: 10, team: Team.B, type: PhaseType.PICK },
  { id: 11, team: Team.A, type: PhaseType.BAN },
  { id: 12, team: Team.B, type: PhaseType.BAN },
  { id: 13, team: Team.A, type: PhaseType.PICK },
  { id: 14, team: Team.B, type: PhaseType.PICK },
  { id: 15, team: Team.B, type: PhaseType.BAN },
  { id: 16, team: Team.A, type: PhaseType.BAN },
  { id: 17, team: Team.A, type: PhaseType.PICK },
  { id: 18, team: Team.B, type: PhaseType.PICK },
  { id: 19, team: Team.A, type: PhaseType.BAN },
  { id: 20, team: Team.B, type: PhaseType.BAN },
  { id: 21, team: Team.A, type: PhaseType.PICK },
  { id: 22, team: Team.B, type: PhaseType.PICK },
  { id: 23, team: Team.NONE, type: PhaseType.DECIDER },
];

export const VMIX_INPUT_NAME = "PIC_BAN.gtzip";
export const VMIX_SCRIPT_NAME = "Script1"; // The script inside vMix
export const TEXT_FIELD_VISIBLE = "TextBlock1.Text"; // Visual Map Name
export const TEXT_FIELD_HIDDEN = "TextBlock2.Text"; // Hidden Input Name for Script
export const IMAGE_FIELD = "Image1.Source"; // Visual Map Image