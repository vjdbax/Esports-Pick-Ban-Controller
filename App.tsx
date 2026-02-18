import React, { useEffect, useState, useRef } from 'react';
import { MATCH_SEQUENCE } from './constants';
import { MapData, SelectionState, Team, PhaseType, MatchStep, LogEntry, DesignSettings } from './types';
import { vmixService } from './services/vmixService';
import { StepBox } from './components/StepBox';
import { MapSelector } from './components/MapSelector';
import { LogViewer } from './components/LogViewer';
import { OverlayPlate } from './components/OverlayPlate';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [steps, setSteps] = useState<MatchStep[]>(MATCH_SEQUENCE);
  const [selections, setSelections] = useState<SelectionState>({});
  const [triggeredSteps, setTriggeredSteps] = useState<number[]>([]); 
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [teamAName, setTeamAName] = useState<string>("Team A");
  const [teamBName, setTeamBName] = useState<string>("Team B");

  // Design Settings State
  const [design, setDesign] = useState<DesignSettings>({
      banColorStart: "#880000",
      banColorEnd: "#111111",
      pickColorStart: "#006400",
      pickColorEnd: "#111111",
      deciderColorStart: "#ca8a04",
      deciderColorEnd: "#111111",
      scale: 1,
      verticalGap: 12,
      horizontalOffset: 60,
      verticalOffset: 180,
      fontSize: 24,
      fontFamily: 'Arial',
      customFonts: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Sync Controls
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  const [mapsDirty, setMapsDirty] = useState<boolean>(false);

  const [showPreviewA, setShowPreviewA] = useState(true);
  const [showPreviewB, setShowPreviewB] = useState(true);

  // Load initial state
  useEffect(() => {
    fetch('/api/state')
        .then(res => res.json())
        .then(data => {
             // Merge Design settings
             if (data.design) {
                 setDesign(prev => ({...prev, ...data.design}));
             }
             if (data.teamAName) setTeamAName(data.teamAName);
             if (data.teamBName) setTeamBName(data.teamBName);
             if (data.steps) setSteps(data.steps);
             if (data.selections) setSelections(data.selections);
             if (data.visibleSteps) setTriggeredSteps(data.visibleSteps);
             
             // Then load maps
             return fetch('/api/maps');
        })
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data) && data.length > 0) {
                setMaps(data);
            } else if (maps.length === 0) {
                 // fallback
                 fetch('/maps.json').then(r => r.json()).then(d => {
                     if (Array.isArray(d)) { 
                         setMaps(d);
                         setMapsDirty(true);
                     }
                 });
            }
        })
        .catch(e => console.warn("Init load error", e))
        .finally(() => setLoading(false));
  }, []);

  // vMix Log Subscription
  useEffect(() => {
    const unsubscribe = vmixService.onLog((entry) => {
      setLogs(prev => {
        if (prev.some(l => l.id === entry.id)) return prev;
        return [...prev, entry];
      });
    });
    return () => unsubscribe();
  }, []);

  // -- SYNC LOGIC --
  const pushStateToOverlay = async () => {
    setSyncStatus('syncing');
    
    const payload: any = {
      teamAName,
      teamBName,
      steps,
      selections,
      visibleSteps: triggeredSteps,
      design
    };

    if (mapsDirty) {
        payload.maps = maps;
    }

    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Sync failed");
      
      if (mapsDirty) setMapsDirty(false);

      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
        console.error("Failed to sync state", err);
        setSyncStatus('error');
    }
  };

  // Auto Sync Effect
  useEffect(() => {
    if (loading) return;

    if (autoSync) {
        const timer = setTimeout(() => {
            pushStateToOverlay();
        }, 500);
        return () => clearTimeout(timer);
    } else {
        setSyncStatus('idle');
    }
  }, [teamAName, teamBName, steps, selections, triggeredSteps, loading, autoSync, mapsDirty, design]);


  const handleSelection = (stepId: number) => {
    setEditingStepId(stepId);
    setIsModalOpen(true);
  };

  const confirmMapSelection = (map: MapData) => {
    if (editingStepId !== null) {
      setSelections(prev => ({
        ...prev,
        [editingStepId]: map.name
      }));
      setIsModalOpen(false);
      setEditingStepId(null);
    }
  };

  const handleTypeToggle = (e: React.MouseEvent, stepId: number) => {
    e.stopPropagation(); 
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id !== stepId || step.type === PhaseType.DECIDER) return step;
      return {
        ...step,
        type: step.type === PhaseType.BAN ? PhaseType.PICK : PhaseType.BAN
      };
    }));
  };

  const handleIndividualTrigger = async (e: React.MouseEvent, stepId: number) => {
    e.stopPropagation();

    if (!triggeredSteps.includes(stepId)) {
        const mapName = selections[stepId];
        if (!mapName) {
            alert("Please select a map first.");
            return;
        }
        const mapData = maps.find(m => m.name === mapName);
        if (mapData) {
            vmixService.triggerMapReveal(mapData).catch(console.error);
        }
    }

    if (triggeredSteps.includes(stepId)) {
      setTriggeredSteps(prev => prev.filter(id => id !== stepId));
    } else {
      setTriggeredSteps(prev => [...prev, stepId]);
      if (stepId === currentStepId && currentStepId < steps.length) {
        setCurrentStepId(currentStepId + 1);
      }
    }
  };

  const handleShowAll = () => {
    if(confirm("Show ALL maps on overlay?")) {
        const allIds = steps.map(s => s.id);
        setTriggeredSteps(allIds);
    }
  };

  const handleHideAll = () => {
    if(confirm("Hide ALL maps from overlay?")) {
        setTriggeredSteps([]);
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newMaps: MapData[] = [];
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
        const name = file.name.replace(/\.[^/.]+$/, ""); 
        newMaps.push({
          name: name,
          videoInput: file.name,
          imageFile: base64,
          imageFileName: file.name
        });
      }
      setMaps(prev => [...prev, ...newMaps]);
      setMapsDirty(true); 
      vmixService.logInfo("Images Uploaded", `${newMaps.length} images processed`);
    }
  };

  const resetAll = () => {
    if (confirm("Are you sure you want to RESET ALL?")) {
      setSelections({});
      setCurrentStepId(1);
      setTriggeredSteps([]);
      setSteps(MATCH_SEQUENCE);
      vmixService.logInfo("System Reset", "All states cleared");
    }
  };

  const openOverlay = () => {
    const params = new URLSearchParams({ ts: Date.now().toString() });
    window.open(`/overlay?${params.toString()}`, '_blank');
  };

  // Helper for Preview rendering
  const renderPreviewStep = (step: MatchStep) => {
    let cStart = design.banColorStart;
    let cEnd = design.banColorEnd;
    
    if (step.type === PhaseType.PICK) {
        cStart = design.pickColorStart;
        cEnd = design.pickColorEnd;
    } else if (step.type === PhaseType.DECIDER) {
        cStart = design.deciderColorStart;
        cEnd = design.deciderColorEnd;
    }

    return (
        <div key={step.id} style={{ marginBottom: `${design.verticalGap}px` }}>
            <OverlayPlate 
                type={step.type}
                isVisible={triggeredSteps.includes(step.id)} 
                mapName={selections[step.id]}
                mapImage={maps.find(m => m.name === selections[step.id])?.imageFile}
                colorStart={cStart}
                colorEnd={cEnd}
                fontSize={design.fontSize}
                fontFamily={design.fontFamily}
            />
        </div>
    );
  };

  const teamASteps = steps.filter(s => s.team === Team.A);
  const teamBSteps = steps.filter(s => s.team === Team.B);
  const deciderStep = steps.find(s => s.type === PhaseType.DECIDER);
  
  // Font Injection for Preview
  useEffect(() => {
      const styleId = 'custom-fonts-preview';
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
      }
      
      let css = '';
      design.customFonts.forEach(font => {
          css += `
            @font-face {
              font-family: '${font.name}';
              src: url('${font.data}');
            }
          `;
      });
      styleTag.innerHTML = css;
  }, [design.customFonts]);


  if (loading) return <div className="p-10 text-white bg-gray-950 h-screen flex items-center justify-center font-bold text-2xl">Loading Controller...</div>;

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      
      {/* 1. Header Area */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-2 shadow-lg flex justify-between items-center px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
            <span className="font-bold text-black uppercase tracking-widest hidden md:inline">Pick & Ban</span>
            
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-black/10">
                <div className={`w-3 h-3 rounded-full ${syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-xs font-bold text-black uppercase">
                    {syncStatus === 'syncing' ? 'SYNCING...' : syncStatus === 'error' ? 'OFFLINE' : 'ONLINE'}
                </span>
            </div>

            <div className="flex gap-1 ml-4">
                <button onClick={() => setShowPreviewA(!showPreviewA)} className={`text-xs px-2 py-1 rounded font-bold uppercase border ${showPreviewA ? 'bg-black text-white border-black' : 'bg-transparent text-black border-black/50 opacity-50'}`}>A</button>
                <button onClick={() => setShowPreviewB(!showPreviewB)} className={`text-xs px-2 py-1 rounded font-bold uppercase border ${showPreviewB ? 'bg-black text-white border-black' : 'bg-transparent text-black border-black/50 opacity-50'}`}>B</button>
            </div>
        </div>

        <div className="flex gap-4 items-center">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs uppercase font-bold border border-gray-600 flex items-center gap-1"
            >
                <span>⚙ Settings</span>
            </button>
            
            <div className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1 border border-gray-600">
                <input 
                    type="checkbox" 
                    checked={autoSync} 
                    onChange={(e) => setAutoSync(e.target.checked)}
                    id="autoSync"
                    className="cursor-pointer accent-orange-500"
                />
                <label htmlFor="autoSync" className="text-xs uppercase font-bold cursor-pointer select-none">Auto Sync</label>
            </div>

            {!autoSync && (
                <button 
                    onClick={pushStateToOverlay}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs uppercase font-bold border border-blue-400 shadow-md animate-pulse"
                >
                    PUSH TO OVERLAY
                </button>
            )}

            <div className="h-6 w-px bg-black/20 mx-2"></div>

            <button onClick={openOverlay} className="bg-black text-white px-4 py-1 rounded text-xs uppercase font-bold hover:bg-gray-800 transition-colors border border-gray-700">
                OPEN OVERLAY
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 border-b border-gray-800 shrink-0 z-20">
         <input 
           value={teamAName} 
           onChange={e => setTeamAName(e.target.value)}
           className="bg-transparent text-2xl font-bold text-center text-white border-b border-gray-600 focus:border-blue-500 outline-none pb-1"
           placeholder="Team A Name"
         />
         <input 
           value={teamBName} 
           onChange={e => setTeamBName(e.target.value)}
           className="bg-transparent text-2xl font-bold text-center text-white border-b border-gray-600 focus:border-blue-500 outline-none pb-1"
           placeholder="Team B Name"
         />
      </div>

      <div className="flex-grow flex overflow-hidden p-4 gap-6 justify-center">
        
        {showPreviewA && (
            <div className="hidden xl:flex flex-col w-[380px] shrink-0 border-r border-gray-800 pr-4 overflow-y-auto custom-scrollbar transition-all overflow-x-visible">
                <h3 className="text-gray-500 font-bold uppercase text-xs mb-4 text-center">Overlay Preview (A)</h3>
                <div className="space-y-0 pl-2">
                    {teamASteps.map(step => renderPreviewStep(step))}
                </div>
            </div>
        )}

        <div className="flex flex-col overflow-y-auto custom-scrollbar px-2 w-full max-w-4xl shrink-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 relative">
               <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-800 -translate-x-1/2 hidden md:block"></div>

               <div className="space-y-2">
                 {teamASteps.map(step => (
                   <StepBox
                     key={step.id}
                     step={step}
                     teamName={teamAName}
                     isActive={step.id === currentStepId}
                     isPast={step.id < currentStepId}
                     isTriggered={triggeredSteps.includes(step.id)}
                     mapName={selections[step.id]}
                     mapImage={maps.find(m => m.name === selections[step.id])?.imageFile}
                     onClick={() => handleSelection(step.id)}
                     onTypeToggle={(e) => handleTypeToggle(e, step.id)}
                     onTrigger={(e) => handleIndividualTrigger(e, step.id)}
                   />
                 ))}
               </div>

               <div className="space-y-2">
                 {teamBSteps.map(step => (
                   <StepBox
                     key={step.id}
                     step={step}
                     teamName={teamBName}
                     isActive={step.id === currentStepId}
                     isPast={step.id < currentStepId}
                     isTriggered={triggeredSteps.includes(step.id)}
                     mapName={selections[step.id]}
                     mapImage={maps.find(m => m.name === selections[step.id])?.imageFile}
                     onClick={() => handleSelection(step.id)}
                     onTypeToggle={(e) => handleTypeToggle(e, step.id)}
                     onTrigger={(e) => handleIndividualTrigger(e, step.id)}
                   />
                 ))}
               </div>
            </div>

            {deciderStep && (
              <div className="mx-auto mt-6 pb-20 w-full max-w-md">
                <StepBox
                     step={deciderStep}
                     teamName="DECIDER"
                     isActive={deciderStep.id === currentStepId}
                     isPast={deciderStep.id < currentStepId}
                     isTriggered={triggeredSteps.includes(deciderStep.id)}
                     mapName={selections[deciderStep.id]}
                     mapImage={maps.find(m => m.name === selections[deciderStep.id])?.imageFile}
                     onClick={() => handleSelection(deciderStep.id)}
                     onTypeToggle={(e) => handleTypeToggle(e, deciderStep.id)}
                     onTrigger={(e) => handleIndividualTrigger(e, deciderStep.id)}
                />
              </div>
            )}
        </div>

        {showPreviewB && (
            <div className="hidden xl:flex flex-col w-[380px] shrink-0 border-l border-gray-800 pl-4 overflow-y-auto custom-scrollbar transition-all overflow-x-visible">
                <h3 className="text-gray-500 font-bold uppercase text-xs mb-4 text-center">Overlay Preview (B)</h3>
                <div className="space-y-0 pr-2">
                    {teamBSteps.map(step => renderPreviewStep(step))}
                </div>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 sticky bottom-0 z-40 shadow-2xl shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <button onClick={resetAll} className="px-3 py-1 bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900 text-xs rounded uppercase">Reset All</button>
            <button onClick={handleShowAll} className="px-3 py-1 bg-green-900/50 text-green-400 border border-green-900 hover:bg-green-900 text-xs rounded uppercase">Show All</button>
            <button onClick={handleHideAll} className="px-3 py-1 bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 text-xs rounded uppercase">Hide All</button>
            <button onClick={() => setIsLogOpen(true)} className="px-3 py-1 bg-gray-800 text-blue-400 border border-gray-700 hover:bg-gray-700 text-xs rounded uppercase font-mono ml-4">Logs ({logs.length})</button>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-gray-600 flex items-center">
              <span>+ Add Map Images</span>
              <input type="file" multiple accept="image/*" onChange={handleBatchUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <MapSelector 
        isOpen={isModalOpen}
        maps={maps}
        onSelect={confirmMapSelection}
        onClose={() => setIsModalOpen(false)}
        usedMapNames={Object.values(selections)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        settings={design}
        onUpdate={setDesign}
        onClose={() => setIsSettingsOpen(false)}
      />

      <LogViewer 
        isOpen={isLogOpen}
        logs={logs}
        onClose={() => setIsLogOpen(false)}
        onClear={() => setLogs([])}
      />

    </div>
  );
};

export default App;
