import React from 'react';
import { PhaseType, MapData } from '../types';

interface OverlayPlateProps {
  type: PhaseType;
  mapName?: string;
  mapImage?: string;
  isVisible: boolean;
  side?: 'left' | 'right'; // For gradient direction if we want to mirror it (optional, current design is same for both)
}

export const OverlayPlate: React.FC<OverlayPlateProps> = ({ 
  type, 
  mapName, 
  mapImage, 
  isVisible
}) => {
  // If not visible, render placeholder to keep grid layout consistent
  // We use invisible div instead of returning null to maintain spacing
  if (!isVisible) {
    return <div className="h-[72px] w-full mb-3 transition-all duration-500 opacity-0"></div>;
  }

  const getLabel = (t: PhaseType) => {
    switch(t) {
      case PhaseType.BAN: return "BAN";
      case PhaseType.PICK: return "PICK";
      case PhaseType.DECIDER: return "DECIDER";
      default: return t;
    }
  };

  const isBan = type === PhaseType.BAN;
  // Purple for Ban, Green for Pick
  const labelBg = isBan ? 'bg-[#D02090]' : 'bg-[#66BB22]'; 
  const barGradient = isBan 
    ? 'linear-gradient(90deg, #5a2e5a 0%, #4a254a 100%)'
    : 'linear-gradient(90deg, #4d6b26 0%, #3d551e 100%)';

  return (
    <div className="flex items-end h-[72px] w-full mb-3 relative group animate-in fade-in duration-500">
      
      {/* Image Box */}
      <div className="relative z-20 w-[110px] h-full shrink-0 border-2 border-gray-600 bg-gray-900 overflow-hidden shadow-lg">
         {mapImage ? (
           <img src={mapImage} alt={mapName} className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-xs text-gray-500 text-center px-1 break-words leading-tight">{mapName || "?"}</span>
           </div>
         )}
         
         {/* TYPE TAG */}
         <div className={`absolute top-0 left-0 ${labelBg} text-white text-[10px] font-black uppercase px-2 py-0.5 shadow-md leading-none tracking-wider z-30`}>
           {getLabel(type)}
         </div>
      </div>

      {/* Slanted Text Bar */}
      <div 
          className="relative h-[50px] flex-grow flex items-center pl-4 pr-8 ml-[-2px] mb-[2px] shadow-md transition-all duration-500"
          style={{ 
              background: barGradient,
              clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)'
          }}
      >
          <span className="text-white font-black text-xl lg:text-2xl uppercase tracking-wider drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis w-full">
            {mapName || ""}
          </span>
      </div>
    </div>
  );
};
