import { MapData, LogEntry } from '../types';
import { 
  VMIX_INPUT_NAME, 
  VMIX_SCRIPT_NAME, 
  TEXT_FIELD_HIDDEN, 
  TEXT_FIELD_VISIBLE,
  IMAGE_FIELD
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
   * Triggers the full sequence in vMix
   * @param map The map data
   * @param physicalImagePath The full local path on the vMix machine (e.g. "C:\Assets\map.png")
   */
  triggerMapReveal: async (map: MapData, physicalImagePath?: string): Promise<boolean> => {
    emitLog('info', `>>> START REVEAL SEQUENCE: ${map.name} (Video: ${map.videoInput})`);
    
    // 1. Set Hidden Input Name (Matches the Video Input Name, e.g. "Map.mp4")
    await sendCommand({
      Function: 'SetText',
      Input: VMIX_INPUT_NAME,
      SelectedName: TEXT_FIELD_HIDDEN,
      Value: map.videoInput
    });

    // 2. Set Visible Map Name (Display Name, e.g. "Map")
    await sendCommand({
      Function: 'SetText',
      Input: VMIX_INPUT_NAME,
      SelectedName: TEXT_FIELD_VISIBLE,
      Value: map.name
    });

    // 3. Set Map Image (using the physical path)
    if (physicalImagePath) {
      await sendCommand({
        Function: 'SetImage',
        Input: VMIX_INPUT_NAME,
        SelectedName: IMAGE_FIELD,
        Value: physicalImagePath
      });
    } else {
      // It's okay to skip this if we are just using web overlay, 
      // but for vMix native Title inputs, this is needed.
      // emitLog('info', 'Skipping SetImage: No physical path provided');
    }

    // 4. Direct Fade to the Map Video
    await sendCommand({
      Function: 'Fade',
      Input: map.videoInput,
      Duration: '500' 
    });

    // 5. Ensure Overlay is ON
    await sendCommand({
      Function: 'OverlayInput1',
      Input: VMIX_INPUT_NAME
    });

    // 6. Start the Script
    await sendCommand({
      Function: 'ScriptStart',
      Value: VMIX_SCRIPT_NAME
    });

    emitLog('success', `<<< SEQUENCE COMPLETE`);
    return true;
  }
};