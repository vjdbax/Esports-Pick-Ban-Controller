import React, { useState } from 'react';
import { DesignSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DesignSettings;
  onUpdate: (newSettings: DesignSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
          <h2 className="text-xl font-bold text-white uppercase">Design Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-800">Close</button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLUMN 1: COLORS */}
          <div className="space-y-6">
            <h3 className="text-orange-500 font-bold uppercase border-b border-gray-700 pb-1">Colors</h3>
            
            {/* BAN */}
            <div className="bg-gray-800 p-3 rounded">
                <label className="text-xs font-bold text-gray-400 block mb-2">BAN GRADIENT (Start - End)</label>
                <div className="flex gap-2">
                    <input type="color" value={settings.banColorStart} onChange={e => handleChange('banColorStart', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                    <input type="color" value={settings.banColorEnd} onChange={e => handleChange('banColorEnd', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                </div>
            </div>

            {/* PICK */}
            <div className="bg-gray-800 p-3 rounded">
                <label className="text-xs font-bold text-gray-400 block mb-2">PICK GRADIENT (Start - End)</label>
                <div className="flex gap-2">
                    <input type="color" value={settings.pickColorStart} onChange={e => handleChange('pickColorStart', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                    <input type="color" value={settings.pickColorEnd} onChange={e => handleChange('pickColorEnd', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                </div>
            </div>

            {/* DECIDER */}
             <div className="bg-gray-800 p-3 rounded">
                <label className="text-xs font-bold text-gray-400 block mb-2">DECIDER GRADIENT (Start - End)</label>
                <div className="flex gap-2">
                    <input type="color" value={settings.deciderColorStart} onChange={e => handleChange('deciderColorStart', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                    <input type="color" value={settings.deciderColorEnd} onChange={e => handleChange('deciderColorEnd', e.target.value)} className="w-full h-8 cursor-pointer rounded bg-transparent" />
                </div>
            </div>
          </div>

          {/* COLUMN 2: GEOMETRY */}
          <div className="space-y-6">
            <h3 className="text-blue-500 font-bold uppercase border-b border-gray-700 pb-1">Geometry / Layout</h3>
            
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Global Scale</span>
                    <span>{settings.scale.toFixed(1)}x</span>
                </div>
                <input 
                    type="range" min="0.5" max="2.0" step="0.1" 
                    value={settings.scale} 
                    onChange={e => handleChange('scale', parseFloat(e.target.value))}
                    className="w-full accent-blue-500" 
                />
            </div>

             <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Vertical Gap (px)</span>
                    <span>{settings.verticalGap}px</span>
                </div>
                <input 
                    type="range" min="0" max="50" step="1" 
                    value={settings.verticalGap} 
                    onChange={e => handleChange('verticalGap', parseInt(e.target.value))}
                    className="w-full accent-blue-500" 
                />
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Horizontal Center Offset</span>
                    <span>{settings.horizontalOffset}px</span>
                </div>
                <input 
                    type="range" min="0" max="500" step="10" 
                    value={settings.horizontalOffset} 
                    onChange={e => handleChange('horizontalOffset', parseInt(e.target.value))}
                    className="w-full accent-blue-500" 
                />
            </div>

             <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Vertical Top Offset</span>
                    <span>{settings.verticalOffset}px</span>
                </div>
                <input 
                    type="range" min="0" max="800" step="10" 
                    value={settings.verticalOffset} 
                    onChange={e => handleChange('verticalOffset', parseInt(e.target.value))}
                    className="w-full accent-blue-500" 
                />
            </div>
          </div>

          {/* COLUMN 3: TYPOGRAPHY */}
          <div className="space-y-6">
            <h3 className="text-green-500 font-bold uppercase border-b border-gray-700 pb-1">Typography</h3>

            <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Font Size</span>
                    <span>{settings.fontSize}px</span>
                </div>
                <input 
                    type="range" min="12" max="64" step="1" 
                    value={settings.fontSize} 
                    onChange={e => handleChange('fontSize', parseInt(e.target.value))}
                    className="w-full accent-green-500" 
                />
            </div>

            <div>
                 <label className="text-xs font-bold text-gray-400 block mb-2">Select Font</label>
                 <select 
                    value={settings.fontFamily} 
                    onChange={e => handleChange('fontFamily', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-white outline-none focus:border-green-500"
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
                    <span>Upload Font (.ttf/.otf)</span>
                    <input type="file" accept=".ttf,.otf,.woff" onChange={handleFontUpload} className="hidden" />
                </label>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
