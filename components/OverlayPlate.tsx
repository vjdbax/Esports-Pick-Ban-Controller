import React from 'react';
import { PhaseType, MapData } from '../types';

interface OverlayPlateProps {
  type: PhaseType;
  mapName?: string;
  mapImage?: string;
  isVisible: boolean;
  colorStart: string;
  colorEnd: string;
  fontFamily?: string;
  fontSize?: number;
}

export const OverlayPlate: React.FC<OverlayPlateProps> = ({ 
  type, 
  mapName, 
  mapImage, 
  isVisible,
  colorStart,
  colorEnd,
  fontFamily = 'Arial',
  fontSize = 24
}) => {
  // Stable transition for opacity
  const visibilityClass = isVisible ? 'opacity-100' : 'opacity-0';

  const getLabel = (t: PhaseType) => {
    switch(t) {
      case PhaseType.BAN: return "BAN";
      case PhaseType.PICK: return "PICK";
      case PhaseType.DECIDER: return "DECIDER";
      default: return t;
    }
  };
  
  // Dynamic Background: Gradient from Start to End
  const barStyle: React.CSSProperties = {
      background: `linear-gradient(90deg, ${colorStart} 20%, ${colorEnd} 100%)`,
      clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)'
  };
  
  // The small tag uses the start color solid
  const tagStyle: React.CSSProperties = {
      backgroundColor: colorStart,
      fontFamily: fontFamily
  };

  const textStyle: React.CSSProperties = {
      fontFamily: fontFamily,
      fontSize: `${fontSize}px`
  };

  return (
    <div className={`flex items-end h-[72px] w-full mb-0 relative group transition-opacity duration-500 ${visibilityClass}`}>
      
      {/* Image Box */}
      <div className="relative z-20 w-[110px] h-full shrink-0 border-2 border-gray-600 bg-gray-900 overflow-hidden shadow-lg">
         {mapImage ? (
           <img src={mapImage} alt={mapName} className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-xs text-gray-400 text-center px-1 font-mono tracking-widest opacity-70">
                  {mapName ? "?" : "WAITING"}
              </span>
           </div>
         )}
         
         {/* TYPE TAG */}
         <div 
            className="absolute top-0 left-0 text-white text-[10px] font-black uppercase px-2 py-0.5 shadow-md leading-none tracking-wider z-30"
            style={tagStyle}
         >
           {getLabel(type)}
         </div>
      </div>

      {/* Slanted Text Bar */}
      <div 
          className="relative h-[50px] flex-grow flex items-center pl-4 pr-8 ml-[-2px] mb-[2px] shadow-md transition-all duration-500"
          style={barStyle}
      >
          {/* Ensure text is always white and visible */}
          <span 
            className="text-white font-black uppercase tracking-wider drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis w-full"
            style={textStyle}
          >
            {mapName || ""}
          </span>
      </div>
    </div>
  );
};
