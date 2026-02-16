import React from 'react';
import { MatchStep, PhaseType, MapData } from '../types';

interface StepRowProps {
  step: MatchStep;
  maps: MapData[];
  selectedMap: string;
  onSelect: (mapName: string) => void;
  onGo: () => void;
  isUsed: (mapName: string) => boolean;
  isActive: boolean;
  isPast: boolean;
}

export const StepRow: React.FC<StepRowProps> = ({ 
  step, 
  maps, 
  selectedMap, 
  onSelect, 
  onGo, 
  isUsed,
  isActive,
  isPast
}) => {
  
  // Style configurations based on phase type
  const getStyles = () => {
    switch (step.type) {
      case PhaseType.BAN:
        return {
          badge: 'bg-red-500/20 text-red-500 border-red-500/50',
          row: isActive ? 'bg-red-900/20 border-l-4 border-red-500' : 'border-l-4 border-transparent'
        };
      case PhaseType.PICK:
        return {
          badge: 'bg-green-500/20 text-green-500 border-green-500/50',
          row: isActive ? 'bg-green-900/20 border-l-4 border-green-500' : 'border-l-4 border-transparent'
        };
      case PhaseType.DECIDER:
        return {
          badge: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
          row: isActive ? 'bg-yellow-900/20 border-l-4 border-yellow-500' : 'border-l-4 border-transparent'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`grid grid-cols-12 gap-4 items-center p-3 rounded-md mb-2 transition-all ${styles.row} ${isPast ? 'opacity-50' : 'opacity-100'}`}>
      
      {/* Index & Type */}
      <div className="col-span-2 flex flex-col justify-center items-center">
        <span className="text-gray-500 text-xs font-mono mb-1">#{step.id}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${styles.badge} w-full text-center`}>
          {step.type}
        </span>
      </div>

      {/* Team A Side */}
      <div className="col-span-4 flex items-center justify-end">
        {step.team === 'Team A' && (
           <span className="font-bold text-lg text-white">TEAM A</span>
        )}
      </div>

      {/* Center Action/Selection */}
      <div className="col-span-2 flex justify-center">
         {step.team === 'Decider' && (
           <span className="font-bold text-lg text-yellow-500">DECIDER</span>
        )}
      </div>

      {/* Team B Side */}
      <div className="col-span-4 flex items-center justify-start">
        {step.team === 'Team B' && (
           <span className="font-bold text-lg text-white">TEAM B</span>
        )}
      </div>

      {/* Control Row (Full Width below details) */}
      <div className="col-span-12 flex gap-4 mt-2">
         <select 
           className={`flex-grow bg-gray-800 border ${isActive ? 'border-gray-500' : 'border-gray-700'} text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
           value={selectedMap || ''}
           onChange={(e) => onSelect(e.target.value)}
           disabled={isPast && !isActive} // Can edit current or future, but strictly usually just current
         >
           <option value="" disabled>Select Map...</option>
           {maps.map(map => (
             <option 
                key={map.name} 
                value={map.name}
                disabled={isUsed(map.name) && map.name !== selectedMap}
                className="text-white bg-gray-800"
              >
               {map.name} {isUsed(map.name) && map.name !== selectedMap ? '(Used)' : ''}
             </option>
           ))}
         </select>

         <button
           onClick={onGo}
           disabled={!selectedMap || !isActive}
           className={`
             w-24 font-bold rounded shadow-lg transition-all
             ${isActive && selectedMap 
               ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transform hover:scale-105' 
               : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
           `}
         >
           GO
         </button>
      </div>
    </div>
  );
};