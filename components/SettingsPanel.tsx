import React from 'react';
import { DesignSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DesignSettings;
  onUpdate: (newSettings: DesignSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  
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
                    <span>⚙ Design Settings</span>
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <div className="p-6 space-y-8">
            
            {/* COLUMN 1: COLORS */}
            <div className="space-y-4">
                <h3 className="text-orange-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Theme Colors</h3>
                
                {/* BAN */}
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Ban Gradient (Start -&gt; End)</label>
                    <div className="flex gap-2">
                        <input type="color" value={settings.banColorStart} onChange={e => handleChange('banColorStart', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                        <input type="color" value={settings.banColorEnd} onChange={e => handleChange('banColorEnd', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                    </div>
                </div>

                {/* PICK */}
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Pick Gradient (Start -&gt; End)</label>
                    <div className="flex gap-2">
                        <input type="color" value={settings.pickColorStart} onChange={e => handleChange('pickColorStart', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                        <input type="color" value={settings.pickColorEnd} onChange={e => handleChange('pickColorEnd', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                    </div>
                </div>

                {/* DECIDER */}
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Decider Gradient (Start -&gt; End)</label>
                    <div className="flex gap-2">
                        <input type="color" value={settings.deciderColorStart} onChange={e => handleChange('deciderColorStart', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                        <input type="color" value={settings.deciderColorEnd} onChange={e => handleChange('deciderColorEnd', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                    </div>
                </div>
            </div>

            {/* COLUMN 2: GEOMETRY */}
            <div className="space-y-4">
                <h3 className="text-blue-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Geometry / Layout</h3>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Global Scale</span>
                        <span>{settings.scale.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" min="0.5" max="2.0" step="0.1" 
                        value={settings.scale} 
                        onChange={e => handleChange('scale', parseFloat(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Vertical Gap</span>
                        <span>{settings.verticalGap}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="50" step="1" 
                        value={settings.verticalGap} 
                        onChange={e => handleChange('verticalGap', parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Horizontal Center Offset</span>
                        <span>{settings.horizontalOffset}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="500" step="10" 
                        value={settings.horizontalOffset} 
                        onChange={e => handleChange('horizontalOffset', parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Vertical Top Offset</span>
                        <span>{settings.verticalOffset}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="800" step="10" 
                        value={settings.verticalOffset} 
                        onChange={e => handleChange('verticalOffset', parseInt(e.target.value))}
                        className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>

                <div className="space-y-1 pt-4 border-t border-gray-800">
                    <div className="flex justify-between text-xs text-white font-bold font-mono">
                        <span>Image Border Width</span>
                        <span>{settings.imageBorderWidth || 0}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="10" step="1" 
                        value={settings.imageBorderWidth || 0} 
                        onChange={e => handleChange('imageBorderWidth', parseInt(e.target.value))}
                        className="w-full accent-white h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>
            </div>

            {/* COLUMN 3: TYPOGRAPHY */}
            <div className="space-y-4">
                <h3 className="text-green-500 font-bold uppercase border-b border-gray-700 pb-1 text-sm">Typography</h3>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Font Size</span>
                        <span>{settings.fontSize}px</span>
                    </div>
                    <input 
                        type="range" min="12" max="64" step="1" 
                        value={settings.fontSize} 
                        onChange={e => handleChange('fontSize', parseInt(e.target.value))}
                        className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                </div>

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
                v1.0.3 - Settings
            </div>

            </div>
        </div>
    </>
  );
};