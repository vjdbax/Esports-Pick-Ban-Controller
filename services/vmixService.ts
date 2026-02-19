import { MapData, LogEntry, MatchStep, PhaseType } from '../types';
import { 
  VMIX_INPUT_NAME, 
} from '../constants';

const API_BASE = '/api/vmix';

// Simple Event Emitter for Logs
type LogListener = (entry: LogEntry) => void;
let listeners: LogListener[] = [];

const emitLog = (type: LogEntry['type'], message: string, details?: any) => {
  const entry: LogEntry = {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date(),
    type,
    message,
    details
  };
  
  console.log(`[vMix ${type.toUpperCase()}] ${message}`, details || '');
  listeners.forEach(fn => fn(entry));
};

const sendCommand = async (params: Record<string, string>) => {
  emitLog('request', `Sending: ${params.Function}`, params);
  
  try {
    const searchParams = new URLSearchParams(params);
    const url = `${API_BASE}?${searchParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`vMix API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    emitLog('success', `Executed: ${params.Function}`);
    return true;
  } catch (error) {
    emitLog('error', `Failed: ${params.Function}`, (error as Error).message);
    return false;
  }
};

export const vmixService = {
  // Subscribe to logs
  onLog: (listener: LogListener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  // Allow manual logging from App
  logInfo: (message: string, details?: any) => {
    emitLog('info', message, details);
  },

  /**
   * Updated logic:
   * 1. Target Input: PIC_BAN.gtzip -> TextBlock{customId}.Text = MapName.mp4
   * 2. Restart & Play MapName.mp4
   * 3. Trigger OverlayInput2In for MapName.mp4 (VIDEO)
   * 4. Trigger OverlayInput3In for Phase Image (BAN/PICK/DECIDER)
   * 5. Wait {delay} ms
   * 6. Trigger OverlayInput2Out AND OverlayInput3Out
   */
  triggerMapReveal: async (map: MapData, step: MatchStep, delayMs: number = 4000): Promise<boolean> => {
    const plateId = step.customId || step.id.toString();
    const mapVideoName = `${map.name}.mp4`; // Ensure we target the video input by name
    
    // Determine the secondary image input based on type
    let overlayImageInput = "plaska_PICK_small.png"; // Default to PICK
    
    if (step.type === PhaseType.BAN) {
        overlayImageInput = "plaska_BAN small.png";
    } else if (step.type === PhaseType.DECIDER) {
        overlayImageInput = "plaska_TB_small.png";
    }
    
    emitLog('info', `>>> REVEAL Plate #${plateId}: Video on Ovl2, ${step.type} Image on Ovl3`);
    
    // 1. Send Map Name to Title Input (PIC_BAN.gtzip) -> TextBlock{N}.Text
    const fieldName = `TextBlock${plateId}.Text`;
    
    await sendCommand({
      Function: 'SetText',
      Input: VMIX_INPUT_NAME, 
      SelectedName: fieldName,
      Value: mapVideoName
    });

    // 2. Control the Map Video Input directly
    
    // Restart video to beginning
    await sendCommand({
        Function: 'Restart',
        Input: mapVideoName
    });
    
    // Play the map video
    await sendCommand({
      Function: 'Play',
      Input: mapVideoName
    });

    // 3. Switch Overlay 2 ON (Video)
    await sendCommand({
      Function: 'OverlayInput2In',
      Input: mapVideoName
    });

    // 4. Switch Overlay 3 ON (Plate Image)
    await sendCommand({
      Function: 'OverlayInput3In',
      Input: overlayImageInput
    });

    // 5. Set Timer to switch BOTH Overlays OFF after delay
    setTimeout(async () => {
        emitLog('info', `>>> TIMEOUT: Hiding Overlays 2 & 3`);
        
        // Hide Video
        await sendCommand({
            Function: 'OverlayInput2Out',
            Input: mapVideoName
        });

        // Hide Plate Image
        await sendCommand({
            Function: 'OverlayInput3Out',
            Input: overlayImageInput
        });

    }, delayMs);
    
    return true;
  }
};