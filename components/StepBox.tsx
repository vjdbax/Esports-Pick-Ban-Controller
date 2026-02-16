import React from 'react';
import { MatchStep, PhaseType } from '../types';

interface StepBoxProps {
  step: MatchStep;
  mapName?: string;
  mapImage?: string;
  isActive: boolean;
  isPast: boolean;
  isTriggered: boolean;
  teamName: string;
  onClick: () => void;
  onTypeToggle: (e: React.MouseEvent) => void;
  onTrigger: (e: React.MouseEvent) => void;
}

export const StepBox: React.FC<StepBoxProps> = ({
  step,
  mapName,
  mapImage,
  isActive,
  isPast,
  isTriggered,
  teamName,
  onClick,
  onTypeToggle,
  onTrigger
}) => {
  // Determine colors based on phase type
  let headerColor = 'bg-gray-700';
  let bodyColor = 'bg-gray-800';
  let borderColor = 'border-gray-700';

  if (step.type === PhaseType.BAN) {
    headerColor = 'bg-purple-900';
    borderColor = 'border-purple-600';
  } else if (step.type === PhaseType.PICK) {
    headerColor = 'bg-green-700';
    borderColor = 'border-green-500';
  } else if (step.type === PhaseType.DECIDER) {
    headerColor = 'bg-blue-600';
    borderColor = 'border-blue-400';
  }

  // Active state highlighting
  const activeClass = isActive 
    ? 'ring-2 ring-yellow-400 scale-105 shadow-lg z-10' 
    : isPast 
      ? 'opacity-80' 
      : 'opacity-100';

  // Triggered state (e.g. green border or different opacity)
  const triggeredClass = isTriggered ? 'ring-2 ring-green-500' : '';

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col rounded-md overflow-hidden border-2 cursor-pointer transition-all duration-200
        ${borderColor} ${activeClass} ${triggeredClass}
        h-24
      `}
    >
      {/* Header Bar */}
      <div className={`${headerColor} text-white text-xs font-bold px-2 py-1 uppercase flex justify-between items-center select-none`}>
        <div className="flex items-center gap-2">
          <span>{teamName} - </span>
          {/* Toggleable Type Badge */}
          {step.type !== PhaseType.DECIDER ? (
             <span 
              onClick={onTypeToggle}
              className="bg-black/30 hover:bg-white/20 px-1 rounded cursor-pointer transition-colors"
              title="Click to switch Pick/Ban"
             >
               {step.type}
             </span>
          ) : (
             <span>{step.type}</span>
          )}
        </div>
        <span className="opacity-70">#{step.id}</span>
      </div>

      {/* Body / Map Content */}
      <div className={`${bodyColor} flex-grow flex items-center justify-center relative overflow-hidden group`}>
        {mapImage ? (
          <>
            <img src={mapImage} alt={mapName} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            <span className="relative z-10 font-bold text-white text-shadow-md text-lg text-center px-2 pointer-events-none">
              {mapName}
            </span>
            
            {/* Individual Trigger Button - Visible when map is selected */}
            <div className="absolute right-2 bottom-2 z-20">
               <button
                 onClick={onTrigger}
                 className={`
                   text-xs font-bold uppercase px-3 py-1 rounded shadow-lg border transition-all hover:scale-105
                   ${isTriggered 
                     ? 'bg-red-600 border-red-400 text-white hover:bg-red-500' 
                     : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-500 animate-pulse'}
                 `}
               >
                 {isTriggered ? 'RESET' : 'GO'}
               </button>
            </div>
          </>
        ) : (
          <span className="text-gray-500 text-sm font-mono group-hover:text-gray-300">
            {isActive ? 'CLICK TO SELECT' : 'WAITING'}
          </span>
        )}
      </div>
    </div>
  );
};