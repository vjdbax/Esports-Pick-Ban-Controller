import React, { useEffect, useState } from 'react';
import { SharedState, PhaseType, Team } from '../types';

export const Overlay: React.FC = () => {
  const [state, setState] = useState<SharedState | null>(null);
  const [error, setError] = useState<string>("");

  // Poll server for state changes
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
          setError("");
        } else {
            setError(`Server Error: ${res.status}`);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 500); 
    return () => clearInterval(interval);
  }, []);

  if (!state) return null; 

  const { steps, selections, maps, visibleSteps, teamAName, teamBName } = state;
  
  const currentSteps = steps || [];
  const teamASteps = currentSteps.filter(s => s.team === Team.A && s.type !== PhaseType.DECIDER);
  const teamBSteps = currentSteps.filter(s => s.team === Team.B && s.type !== PhaseType.DECIDER);
  const deciderStep = currentSteps.find(s => s.type === PhaseType.DECIDER);

  const getLabel = (type: PhaseType) => {
    switch(type) {
      case PhaseType.BAN: return "БАН";
      case PhaseType.PICK: return "ПИК";
      case PhaseType.DECIDER: return "ДЕСАЙДЕР";
      default: return type;
    }
  };

  const renderCard = (stepId: number, type: PhaseType) => {
    const isVisible = visibleSteps.includes(stepId);
    const mapName = selections[stepId];
    const mapData = maps.find(m => m.name === mapName);

    // If not visible, render placeholder to keep grid strict
    // CHANGED: Removed opacity class, just using an empty div for spacing
    if (!isVisible) {
      return <div className="h-[72px] w-full mb-3"></div>;
    }

    const isBan = type === PhaseType.BAN;
    // Purple for Ban, Green for Pick
    const labelBg = isBan ? 'bg-[#D02090]' : 'bg-[#66BB22]'; 
    const barGradient = isBan 
      ? 'linear-gradient(90deg, #5a2e5a 0%, #4a254a 100%)'
      : 'linear-gradient(90deg, #4d6b26 0%, #3d551e 100%)';

    return (
      <div className="flex items-end h-[72px] w-full mb-3 relative group">
        
        {/* Image Box */}
        <div className="relative z-20 w-[110px] h-full shrink-0 border-2 border-gray-600 bg-gray-900 overflow-hidden shadow-lg">
           {mapData?.imageFile ? (
             <img src={mapData.imageFile} alt={mapName} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                {/* Fallback if no image but name exists */}
                <span className="text-xs text-gray-500 text-center px-1">{mapName || "?"}</span>
             </div>
           )}
           
           {/* TYPE TAG */}
           <div className={`absolute top-0 left-0 ${labelBg} text-white text-[11px] font-black uppercase px-2 py-0.5 shadow-md leading-none tracking-wider z-30`}>
             {getLabel(type)}
           </div>
        </div>

        {/* Slanted Text Bar */}
        <div 
            className="relative h-[50px] flex-grow flex items-center pl-4 pr-8 ml-[-2px] mb-[2px] shadow-md"
            style={{ 
                background: barGradient,
                // CLIP PATH for the slanted right edge
                clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)'
            }}
        >
            <span className="text-white font-black text-2xl uppercase tracking-wider drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis w-full">
              {mapName || "UNKNOWN"}
            </span>
        </div>
      </div>
    );
  };

  return (
    <div 
        className="fixed top-0 left-0 w-[1920px] h-[1080px] overflow-hidden font-sans select-none"
        style={{ transformOrigin: 'top left' }} 
    >
      
      {/* Top Header */}
      <div className="absolute top-[20px] left-0 w-full flex justify-between px-[100px] items-start">
         <div className="bg-gradient-to-r from-gray-900/90 to-transparent p-4 w-[600px]">
             <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-left truncate">
                 {teamAName}
             </h1>
         </div>
         
         <div className="bg-gradient-to-l from-gray-900/90 to-transparent p-4 w-[600px] flex justify-end">
             <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-right truncate">
                 {teamBName}
             </h1>
         </div>
      </div>

      <div className="absolute top-[30px] left-1/2 -translate-x-1/2">
           <span className="text-4xl font-bold text-orange-500 drop-shadow-lg italic">VS</span>
      </div>

      {/* Main Grid Content */}
      <div className="absolute top-[180px] left-0 w-full px-[60px] flex justify-between">
        
        {/* Left Column (Team A) */}
        <div className="w-[450px] flex flex-col">
            {teamASteps.map(step => (
                <div key={step.id}>
                    {renderCard(step.id, step.type)}
                </div>
            ))}
        </div>

        {/* Right Column (Team B) */}
        <div className="w-[450px] flex flex-col">
             {teamBSteps.map(step => (
                <div key={step.id}>
                    {renderCard(step.id, step.type)}
                </div>
            ))}
        </div>
      </div>

      {/* Decider */}
      {deciderStep && visibleSteps.includes(deciderStep.id) && (
        <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 w-[600px]">
             {renderCard(deciderStep.id, deciderStep.type)}
        </div>
      )}

    </div>
  );
};