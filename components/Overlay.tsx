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
      banColorStart: "#880000ff", banColorEnd: "#111111ff",
      pickColorStart: "#006400ff", pickColorEnd: "#111111ff",
      deciderColorStart: "#ca8a04ff", deciderColorEnd: "#111111ff",
      scale: 1, itemScale: 1, verticalGap: 12, horizontalOffset: 60, verticalOffset: 180,
      imageBorderWidth: 2,
      deciderOffsetX: 0, deciderOffsetY: 0,
      fontSize: 24, fontFamily: 'Arial', customFonts: [],
      language: 'EN',
      vmixDelay: 4000
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
  const renderPlate = (step: any, align: 'left' | 'right' | 'center') => {
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

    // Apply item scale here via transform
    // We must set transformOrigin to correspond with the alignment so they scale "in place"
    let tOrigin = 'center center';
    if (align === 'left') tOrigin = 'top left';
    if (align === 'right') tOrigin = 'top right';
    if (align === 'center') tOrigin = 'top center';

    return (
        <div 
            key={step.id} 
            style={{ 
                marginBottom: `${d.verticalGap}px`,
                transform: `scale(${d.itemScale || 1})`,
                transformOrigin: tOrigin,
                width: '100%', // FORCE WIDTH to ensure items-end works correctly in parent
            }}
        >
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
                language={d.language}
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
        <div style={{ width: `${columnWidth}px` }} className="flex flex-col items-start">
            {showA && teamASteps.map(s => renderPlate(s, 'left'))}
        </div>

        {/* Right Column */}
        <div style={{ width: `${columnWidth}px` }} className="flex flex-col items-end">
             {showB && teamBSteps.map(s => renderPlate(s, 'right'))}
        </div>
      </div>

      {/* Decider */}
      {showDecider && deciderStep && (
        <div 
            className="absolute left-1/2 -translate-x-1/2"
            style={{ 
                bottom: '50px', 
                width: `${600 * d.scale}px`, 
                // We combine the positioning transform with the Global Scale transform
                transform: `scale(${d.scale}) translate(${d.deciderOffsetX}px, ${-d.deciderOffsetY}px)`,
                transformOrigin: 'bottom center',
                // Note: deciderOffsetY is inverted for intuitive "Up/Down" logic on UI
            }}
        >
             {/* Note: Decider internal plate also gets itemScale if we use the helper, 
                 but we need to pass 'center' alignment */}
             {renderPlate(deciderStep, 'center')}
        </div>
      )}

    </div>
  );
};