import React, { useEffect, useState } from 'react';
import { SharedState, PhaseType, Team } from '../types';
import { OverlayPlate } from './OverlayPlate';

interface OverlayProps {
  variant?: 'full' | 'A' | 'B';
}

export const Overlay: React.FC<OverlayProps> = ({ variant = 'full' }) => {
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

  const getMapData = (mapName: string | undefined) => {
    return maps.find(m => m.name === mapName);
  };

  // Visibility Logic based on Variant
  const showA = variant === 'full' || variant === 'A';
  const showB = variant === 'full' || variant === 'B';
  const showDecider = variant === 'full'; // Decider typically only on main overlay, or add logic if needed

  return (
    <div 
        className="fixed top-0 left-0 w-[1920px] h-[1080px] overflow-hidden font-sans select-none"
        style={{ transformOrigin: 'top left' }} 
    >
      
      {/* Top Header */}
      <div className="absolute top-[20px] left-0 w-full flex justify-between px-[100px] items-start">
         {/* Team A Header */}
         <div className="p-4 w-[600px]">
             {showA && (
                 <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-left truncate">
                     {teamAName}
                 </h1>
             )}
         </div>
         
         {/* Team B Header */}
         <div className="p-4 w-[600px] flex justify-end">
             {showB && (
                 <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-right truncate">
                     {teamBName}
                 </h1>
             )}
         </div>
      </div>

      {/* VS Label - Only show on Full */}
      {variant === 'full' && (
          <div className="absolute top-[30px] left-1/2 -translate-x-1/2">
               <span className="text-4xl font-bold text-orange-500 drop-shadow-lg italic">VS</span>
          </div>
      )}

      {/* Main Grid Content */}
      <div className="absolute top-[180px] left-0 w-full px-[60px] flex justify-between">
        
        {/* Left Column (Team A) */}
        <div className="w-[450px] flex flex-col">
            {showA && teamASteps.map(step => {
                const mapName = selections[step.id];
                const mapData = getMapData(mapName);
                return (
                    <OverlayPlate 
                        key={step.id}
                        type={step.type}
                        isVisible={true}
                        mapName={mapName}
                        mapImage={mapData?.imageFile}
                    />
                );
            })}
        </div>

        {/* Right Column (Team B) */}
        <div className="w-[450px] flex flex-col">
             {showB && teamBSteps.map(step => {
                const mapName = selections[step.id];
                const mapData = getMapData(mapName);
                return (
                    <OverlayPlate 
                        key={step.id}
                        type={step.type}
                        isVisible={true}
                        mapName={mapName}
                        mapImage={mapData?.imageFile}
                    />
                );
            })}
        </div>
      </div>

      {/* Decider */}
      {showDecider && deciderStep && (
        <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 w-[600px]">
             <OverlayPlate 
                type={deciderStep.type}
                isVisible={true}
                mapName={selections[deciderStep.id]}
                mapImage={getMapData(selections[deciderStep.id])?.imageFile}
             />
        </div>
      )}

    </div>
  );
};