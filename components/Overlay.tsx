import React, { useEffect, useState, useRef } from 'react';
import { SharedState, PhaseType, Team, MapData, DesignSettings } from '../types';
import { OverlayPlate } from './OverlayPlate';

interface OverlayProps {
  variant?: 'full' | 'A' | 'B';
}

interface OverlayState extends Omit<SharedState, 'maps'> {
    mapUpdateTs?: number;
    maps?: MapData[]; 
}

export const Overlay: React.FC<OverlayProps> = ({ variant = 'full' }) => {
  const [state, setState] = useState<OverlayState | null>(null);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [error, setError] = useState<string>("");
  const lastMapTsRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setState(data);
            setError("");
            
            const serverTs = data.mapUpdateTs || 0;
            if (serverTs > lastMapTsRef.current) {
                const mapRes = await fetch('/api/maps');
                if (mapRes.ok) {
                    const newMaps = await mapRes.json();
                    setMaps(newMaps);
                    lastMapTsRef.current = serverTs;
                }
            }
          }
        }
      } catch (e) {
         if (isMounted) setError(e instanceof Error ? e.message : "Error");
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 500); 
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // 1. Inject Custom Fonts into DOM
  useEffect(() => {
    if (state?.design?.customFonts) {
        const styleId = 'custom-fonts-overlay';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        
        let css = '';
        state.design.customFonts.forEach(font => {
            css += `
                @font-face {
                    font-family: '${font.name}';
                    src: url('${font.data}');
                }
            `;
        });
        styleTag.innerHTML = css;
    }
  }, [state?.design?.customFonts]);

  if (!state) return <div className="text-transparent">Loading...</div>;

  const { steps, selections, visibleSteps, design } = state;
  const currentSteps = steps || [];
  
  // Design Defaults fallback
  const d: DesignSettings = design || {
      banColorStart: "#880000", banColorEnd: "#111111",
      pickColorStart: "#006400", pickColorEnd: "#111111",
      deciderColorStart: "#ca8a04", deciderColorEnd: "#111111",
      scale: 1, verticalGap: 12, horizontalOffset: 60, verticalOffset: 180,
      imageBorderWidth: 2,
      fontSize: 24, fontFamily: 'Arial', customFonts: []
  };

  const teamASteps = currentSteps.filter(s => s.team === Team.A && s.type !== PhaseType.DECIDER);
  const teamBSteps = currentSteps.filter(s => s.team === Team.B && s.type !== PhaseType.DECIDER);
  const deciderStep = currentSteps.find(s => s.type === PhaseType.DECIDER);

  const getMapData = (mapName: string | undefined) => maps.find(m => m.name === mapName);
  const isStepVisible = (id: number) => visibleSteps && visibleSteps.includes(id);

  const showA = variant === 'full' || variant === 'A';
  const showB = variant === 'full' || variant === 'B';
  const showDecider = variant === 'full'; 

  // --- Render Helpers ---
  const renderPlate = (step: any) => {
    let cStart = d.banColorStart;
    let cEnd = d.banColorEnd;
    if (step.type === PhaseType.PICK) {
        cStart = d.pickColorStart;
        cEnd = d.pickColorEnd;
    } else if (step.type === PhaseType.DECIDER) {
        cStart = d.deciderColorStart;
        cEnd = d.deciderColorEnd;
    }

    const mapName = selections[step.id];
    const mapData = getMapData(mapName);

    return (
        <div key={step.id} style={{ marginBottom: `${d.verticalGap}px` }}>
            <OverlayPlate 
                type={step.type}
                isVisible={isStepVisible(step.id)} 
                mapName={mapName}
                mapImage={mapData?.imageFile}
                colorStart={cStart}
                colorEnd={cEnd}
                fontSize={d.fontSize}
                fontFamily={d.fontFamily}
                borderWidth={d.imageBorderWidth}
            />
        </div>
    );
  };

  // --- Layout Calculations ---
  // The base width of the columns. We apply Scale transform to the entire container to resize everything uniformly.
  const columnWidth = 450; 
  
  return (
    <div 
        className="fixed top-0 left-0 w-[1920px] h-[1080px] overflow-hidden font-sans select-none"
        style={{ transformOrigin: 'top left' }} 
    >
      
      {/* 
         Removed Header (Names) and VS as requested. 
         Elements are positioned based on user settings now. 
      */}

      {/* Main Grid Content */}
      <div 
        className="absolute w-full flex justify-between"
        style={{
            top: `${d.verticalOffset}px`,
            paddingLeft: `${d.horizontalOffset}px`,
            paddingRight: `${d.horizontalOffset}px`,
            // Apply Scaling here
            transform: `scale(${d.scale})`,
            transformOrigin: 'top center'
        }}
      >
        
        {/* Left Column */}
        <div style={{ width: `${columnWidth}px` }} className="flex flex-col">
            {showA && teamASteps.map(renderPlate)}
        </div>

        {/* Right Column */}
        <div style={{ width: `${columnWidth}px` }} className="flex flex-col">
             {showB && teamBSteps.map(renderPlate)}
        </div>
      </div>

      {/* Decider */}
      {showDecider && deciderStep && (
        <div 
            className="absolute left-1/2 -translate-x-1/2"
            style={{ 
                bottom: '50px', 
                width: `${600 * d.scale}px`, // Scale decider width
                transform: `scale(${d.scale})`,
                transformOrigin: 'bottom center'
            }}
        >
             {renderPlate(deciderStep)}
        </div>
      )}

    </div>
  );
};