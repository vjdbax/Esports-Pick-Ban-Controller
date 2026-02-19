import React, { useRef } from 'react';
import { DesignSettings, SharedState } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DesignSettings;
  onUpdate: (newSettings: DesignSettings) => void;
  // New props for full state Import/Export
  fullState?: Partial<SharedState>;
  onFullImport?: (state: Partial<SharedState>) => void;
}

// Helper to split #RRGGBBAA into #RRGGBB and Opacity (0-1)
const parseColor = (hex: string) => {
  // Ensure we have a valid hex, default to black if not
  const cleanHex = hex.replace('#', '');
  
  if (cleanHex.length === 6) {
    return { color: `#${cleanHex}`, alpha: 100 };
  } else if (cleanHex.length === 8) {
    const color = `#${cleanHex.substring(0, 6)}`;
    const alphaHex = cleanHex.substring(6, 8);
    const alpha = Math.round((parseInt(alphaHex, 16) / 255) * 100);
    return { color, alpha };
  }
  return { color: '#000000', alpha: 100 };
};

// Helper to combine #RRGGBB and Opacity (0-100) into #RRGGBBAA
const combineColor = (hex: string, alphaPercent: number) => {
    const alphaVal = Math.round((alphaPercent / 100) * 255);
    const alphaHex = alphaVal.toString(16).padStart(2, '0');
    return `${hex}${alphaHex}`;
};

// --- Extracted Component to prevent re-render focus loss ---
const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    const { color, alpha } = parseColor(value);
    
    // Internal handlers to call the parent onChange with the combined string
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(combineColor(e.target.value, alpha));
    };

    const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(combineColor(color, parseInt(e.target.value)));
    };

    return (
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
          <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">{label}</label>
          <div className="flex gap-2 items-center">
              {/* Standard Color Picker (RGB) */}
              <input 
                  type="color" 
                  value={color} 
                  onChange={handleHexChange} 
                  className="w-10 h-8 cursor-pointer rounded bg-transparent border-0 p-0" 
              />
              
              {/* Alpha Slider */}
              <div className="flex-grow flex flex-col justify-center">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                      <span>Opacity</span>
                      <span>{alpha}%</span>
                  </div>
                  <input 
                      type="range" min="0" max="100" 
                      value={alpha} 
                      onChange={handleAlphaChange}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white" 
                  />
              </div>

              {/* Preview Box for final RGBA */}
              <div 
                  className="w-8 h-8 rounded border border-gray-600 shadow-inner"
                  style={{ 
                      backgroundColor: color, 
                      opacity: alpha / 100,
                      backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                      backgroundSize: '10px 10px',
                      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' 
                  }}
              >
                   {/* The color layer on top of checkerboard */}
                   <div className="w-full h-full" style={{ backgroundColor: color, opacity: alpha/100 }}></div>
              </div>
          </div>
      </div>
    );
};

// --- Range Control with Number Input ---
const RangeControl = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    onChange, 
    suffix = '',
    colorClass = 'accent-blue-500'
}: { 
    label: string, 
    value: number, 
    min: number, 
    max: number, 
    step: number, 
    onChange: (val: number) => void,
    suffix?: string,
    colorClass?: string
}) => {
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange(val);
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>{label}</span>
                <div className="flex items-center gap-1">
                    <input 
                        type="number" 
                        min={min} 
                        max={max} 
                        step={step} 
                        value={value} 
                        onChange={handleNumberChange}
                        className="w-16 bg-gray-800 border border-gray-600 rounded px-1 text-right text-white focus:border-blue-500 outline-none text-xs py-0.5"
                    />
                    <span className="text-[10px] w-4 text-right opacity-50">{suffix}</span>
                </div>
            </div>
            <input 
                type="range" min={min} max={max} step={step} 
                value={value} 
                onChange={e => onChange(parseFloat(e.target.value))}
                className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer ${colorClass}`} 
            />
        </div>
    );
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    isOpen, onClose, settings, onUpdate, fullState, onFullImport 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof DesignSettings, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const fontName = file.name.split('.')[0];
        const newFont = { name: fontName, data: base64 };
        const updatedFonts = [...settings.customFonts, newFont];
        
        onUpdate({ 
          ...settings, 
          customFonts: updatedFonts,
          fontFamily: fontName // Auto select uploaded font
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
      // Export FULL state including images, maps, steps, selections
      // We prioritize the fullState prop passed from App
      const exportData = fullState || settings;
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pickban_full_state.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              try {
                  const json = JSON.parse(ev.target?.result as string);
                  // Basic validation
                  if(json && typeof json === 'object') {
                      if (onFullImport) {
                          onFullImport(json);
                      } else {
                          // Fallback to just settings if full import handler not provided
                          onUpdate({...settings, ...json});
                      }
                      alert("Config imported successfully!");
                  }
              } catch (err) {
                  alert("Failed to parse JSON file.");
              }
          };
          reader.readAsText(file);
      }
  };

  // Convert milliseconds to seconds for the UI
  const delayInSeconds = (settings.vmixDelay || 0) / 1000;
  
  const handleDelayChange = (seconds: number) => {
      handleChange('vmixDelay', seconds * 1000);
  };

  return (
    <>
        {/* Backdrop only for mobile or if we want to click-away, but keeping it invisible for "see preview" effect */}
        {isOpen && (
            <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose}></div>
        )}

        <div 
            className={`fixed top-0 right-0 h-full w-[400px] bg-gray-900 border-l border-gray-700 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                    <span>⚙ Design & Logic</span>
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            {/* Import / Export Controls */}
            <div className="flex gap-2 p-4 border-b border-gray-800 bg-gray-900/50">
                <button onClick={handleExport} className="flex-1 bg-blue-900/40 text-blue-300 border border-blue-800 hover:bg-blue-800 hover:text-white py-1 px-2 rounded text-xs font-bold uppercase transition-colors">
                    Export Full State
                </button>
                <button onClick={handleImportClick} className="flex-1 bg-green-900/40 text-green-300 border border-green-800 hover:bg-green-800 hover:text-white py-1 px-2 rounded text-xs font-bold uppercase transition-colors">
                    Import Full State
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
            </div>

            <div className="p-6 space-y-8">

            {/* LOGIC, DELAY & NETWORK */}
            <div className="space-y-4">
                <h3 className="text-red-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Automations & Connection</h3>
                
                {/* Network / vMix Connection */}
                <div className="bg-gray-800 p-3 rounded border border-gray-700 space-y-3">
                     <label className="text-[10px] font-bold text-gray-400 block uppercase">vMix LAN Connection</label>
                     
                     <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-2 space-y-1">
                             <label className="text-[10px] text-gray-500">IP Address</label>
                             <input 
                                type="text" 
                                value={settings.vmixHost || '127.0.0.1'} 
                                onChange={(e) => handleChange('vmixHost', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-red-500 outline-none font-mono"
                                placeholder="127.0.0.1"
                             />
                         </div>
                         <div className="space-y-1">
                             <label className="text-[10px] text-gray-500">Port</label>
                             <input 
                                type="number" 
                                value={settings.vmixPort || 8088} 
                                onChange={(e) => handleChange('vmixPort', parseInt(e.target.value) || 8088)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-red-500 outline-none font-mono"
                                placeholder="8088"
                             />
                         </div>
                     </div>
                     <p className="text-[10px] text-gray-500 leading-tight">
                        Use this to control a vMix instance running on another computer in your local network.
                     </p>
                </div>

                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                    <RangeControl 
                        label="vMix Video -> Overlay Delay" 
                        value={delayInSeconds} min={0} max={20} step={0.5} suffix="s"
                        colorClass="accent-red-500"
                        onChange={handleDelayChange}
                    />
                    <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                        When you click "GO", the vMix video plays immediately. The Web Overlay plate appears after this delay.
                    </p>
                </div>
            </div>
            
            {/* COLUMN 1: COLORS */}
            <div className="space-y-4">
                <h3 className="text-orange-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Theme Colors</h3>
                
                <ColorInput label="Ban Gradient Start" value={settings.banColorStart} onChange={(v) => handleChange('banColorStart', v)} />
                <ColorInput label="Ban Gradient End" value={settings.banColorEnd} onChange={(v) => handleChange('banColorEnd', v)} />
                
                <ColorInput label="Pick Gradient Start" value={settings.pickColorStart} onChange={(v) => handleChange('pickColorStart', v)} />
                <ColorInput label="Pick Gradient End" value={settings.pickColorEnd} onChange={(v) => handleChange('pickColorEnd', v)} />

                <ColorInput label="Decider Gradient Start" value={settings.deciderColorStart} onChange={(v) => handleChange('deciderColorStart', v)} />
                <ColorInput label="Decider Gradient End" value={settings.deciderColorEnd} onChange={(v) => handleChange('deciderColorEnd', v)} />
            </div>

            {/* COLUMN 2: GEOMETRY */}
            <div className="space-y-4">
                <h3 className="text-blue-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Geometry / Layout</h3>
                
                <RangeControl 
                    label="Global Scale (Zoom)" 
                    value={settings.scale} min={0.5} max={2.0} step={0.1} suffix="x"
                    onChange={v => handleChange('scale', v)}
                />

                <RangeControl 
                    label="Item Scale (Plate Size)" 
                    value={settings.itemScale || 1} min={0.1} max={2.0} step={0.05} suffix="x"
                    colorClass="accent-purple-500"
                    onChange={v => handleChange('itemScale', v)}
                />

                <RangeControl 
                    label="Vertical Gap" 
                    value={settings.verticalGap} min={-50} max={50} step={1} suffix="px"
                    onChange={v => handleChange('verticalGap', v)}
                />

                <RangeControl 
                    label="Horizontal Center Offset" 
                    value={settings.horizontalOffset} min={0} max={1000} step={10} suffix="px"
                    onChange={v => handleChange('horizontalOffset', v)}
                />

                <RangeControl 
                    label="Vertical Top Offset" 
                    value={settings.verticalOffset} min={0} max={1200} step={10} suffix="px"
                    onChange={v => handleChange('verticalOffset', v)}
                />

                <div className="pt-4 border-t border-gray-800">
                     <RangeControl 
                        label="Image Border Width" 
                        value={settings.imageBorderWidth || 0} min={0} max={10} step={1} suffix="px"
                        colorClass="accent-white"
                        onChange={v => handleChange('imageBorderWidth', v)}
                    />
                </div>

                <div className="bg-gray-800/30 p-3 rounded border border-blue-900/50 mt-4 space-y-3">
                     <label className="text-[10px] font-bold text-blue-400 block uppercase">Decider Position (Fine Tune)</label>
                     
                     <RangeControl 
                        label="Offset X (Left/Right)" 
                        value={settings.deciderOffsetX || 0} min={-500} max={500} step={10} suffix="px"
                        colorClass="accent-blue-400"
                        onChange={v => handleChange('deciderOffsetX', v)}
                    />

                    <RangeControl 
                        label="Offset Y (Up/Down)" 
                        value={settings.deciderOffsetY || 0} min={-500} max={500} step={10} suffix="px"
                        colorClass="accent-blue-400"
                        onChange={v => handleChange('deciderOffsetY', v)}
                    />
                </div>
            </div>

            {/* COLUMN 3: TYPOGRAPHY & SETTINGS */}
            <div className="space-y-4">
                <h3 className="text-green-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Typography & Locale</h3>

                <div className="bg-gray-800 p-3 rounded border border-gray-700 flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300">Use Russian Language</label>
                    <input 
                        type="checkbox" 
                        checked={settings.language === 'RU'}
                        onChange={(e) => handleChange('language', e.target.checked ? 'RU' : 'EN')}
                        className="w-5 h-5 rounded accent-green-500 cursor-pointer"
                    />
                </div>
                <div className="text-[10px] text-gray-500 px-1 -mt-2 mb-4">
                    {settings.language === 'RU' ? 'ПИК / БАН / ТАЙ-БРЕЙК' : 'PICK / BAN / DECIDER'}
                </div>

                 <RangeControl 
                    label="Font Size" 
                    value={settings.fontSize} min={12} max={64} step={1} suffix="px"
                    colorClass="accent-green-500"
                    onChange={v => handleChange('fontSize', v)}
                />

                <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Select Font</label>
                    <select 
                        value={settings.fontFamily} 
                        onChange={e => handleChange('fontFamily', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white outline-none focus:border-green-500 text-sm"
                    >
                        <option value="Arial">Arial (System)</option>
                        <option value="Verdana">Verdana (System)</option>
                        <option value="Times New Roman">Times New Roman (System)</option>
                        <option value="Courier New">Courier New (System)</option>
                        {settings.customFonts.map(f => (
                            <option key={f.name} value={f.name}>{f.name} (Custom)</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-gray-600 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span>Upload Font (.ttf/.otf)</span>
                        <input type="file" accept=".ttf,.otf,.woff" onChange={handleFontUpload} className="hidden" />
                    </label>
                </div>

            </div>
            
            <div className="pt-10 pb-4 text-center text-xs text-gray-600">
                v1.5.0 - LAN Connectivity Added
            </div>

            </div>
        </div>
    </>
  );
};