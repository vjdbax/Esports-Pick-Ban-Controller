import React, { useEffect, useState, useRef } from 'react';
import { MATCH_SEQUENCE } from './constants';
import { MapData, SelectionState, Team, PhaseType, MatchStep, LogEntry, SharedState } from './types';
import { vmixService } from './services/vmixService';
import { StepBox } from './components/StepBox';
import { MapSelector } from './components/MapSelector';
import { LogViewer } from './components/LogViewer';

const App: React.FC = () => {
  const [maps, setMaps] = useState<MapData[]>([]);
  const [steps, setSteps] = useState<MatchStep[]>(MATCH_SEQUENCE);
  const [selections, setSelections] = useState<SelectionState>({});
  const [triggeredSteps, setTriggeredSteps] = useState<number[]>([]); // This now controls Visibility on Overlay
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [teamAName, setTeamAName] = useState<string>("Team A");
  const [teamBName, setTeamBName] = useState<string>("Team B");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Load initial maps from JSON (optional, if user has presets)
  useEffect(() => {
    fetch('/maps.json')
      .then(res => res.json())
      .then(data => {
        setMaps(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load maps.json", err);
        setLoading(false);
      });
  }, []);

  // vMix Log Subscription
  useEffect(() => {
    const unsubscribe = vmixService.onLog((entry) => {
      setLogs(prev => [...prev, entry]);
    });
    // Log startup to verify connection
    vmixService.logInfo("Application Started", "Ready to control vMix");
    return () => unsubscribe();
  }, []);

  // --- STATE SYNC TO SERVER ---
  // Whenever relevant state changes, send it to the server so the Overlay can see it.
  useEffect(() => {
    if (loading) return;

    const payload: SharedState = {
      teamAName,
      teamBName,
      maps,
      steps,
      selections,
      visibleSteps: triggeredSteps
    };

    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Failed to sync state", err));

  }, [teamAName, teamBName, maps, steps, selections, triggeredSteps, loading]);


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

  // Logic: "GO" Button Toggles Visibility AND triggers vMix
  const handleIndividualTrigger = async (e: React.MouseEvent, stepId: number) => {
    e.stopPropagation();

    // Check if map is selected
    if (!triggeredSteps.includes(stepId)) {
        const mapName = selections[stepId];
        if (!mapName) {
            alert("Please select a map first.");
            return;
        }
        
        // --- TRIGGER VMIX ---
        const mapData = maps.find(m => m.name === mapName);
        if (mapData) {
            vmixService.triggerMapReveal(mapData).catch(console.error);
        } else {
             console.warn("Map data not found for vMix trigger");
        }
    }

    // Toggle Visibility
    if (triggeredSteps.includes(stepId)) {
      // Hide it
      setTriggeredSteps(prev => prev.filter(id => id !== stepId));
    } else {
      // Show it
      setTriggeredSteps(prev => [...prev, stepId]);
      
      // Advance Linear Counter if applicable
      if (stepId === currentStepId && currentStepId < steps.length) {
        setCurrentStepId(currentStepId + 1);
      }
    }
  };

  const handleShowAll = () => {
    if(confirm("Show ALL maps on overlay?")) {
        vmixService.logInfo("Command: Show All Maps", "Manual trigger via Admin UI");
        const allIds = steps.map(s => s.id);
        setTriggeredSteps(allIds);
    }
  };

  const handleHideAll = () => {
    if(confirm("Hide ALL maps from overlay?")) {
        vmixService.logInfo("Command: Hide All Maps", "Manual trigger via Admin UI");
        setTriggeredSteps([]);
    }
  };

  // Convert Images to Base64 on Upload so Overlay can see them
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newMaps: MapData[] = [];
      
      for (const file of Array.from(e.target.files)) {
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });

        const name = file.name.replace(/\.[^/.]+$/, ""); 
        newMaps.push({
          name: name,
          videoInput: file.name,
          imageFile: base64, // Stored as Base64 Data URL
          imageFileName: file.name
        });
      }

      setMaps(prev => [...prev, ...newMaps]);
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
    window.open('/overlay', '_blank');
  };

  const teamASteps = steps.filter(s => s.team === Team.A);
  const teamBSteps = steps.filter(s => s.team === Team.B);
  const deciderStep = steps.find(s => s.type === PhaseType.DECIDER);

  if (loading) return <div className="p-10 text-white bg-gray-950 h-screen">Loading...</div>;

  return (
    // CHANGED: Added h-screen and overflow-y-auto here because we removed it from body
    <div className="h-screen overflow-y-auto bg-gray-950 text-white flex flex-col">
      
      {/* 1. Header Area */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-2 text-center shadow-lg flex justify-between items-center px-4 shrink-0">
        <span className="font-bold text-black uppercase tracking-widest">Pick & Ban Controller</span>
        <button 
            onClick={openOverlay}
            className="bg-black text-white px-4 py-1 rounded text-xs uppercase font-bold hover:bg-gray-800 transition-colors border border-gray-700"
        >
            Open Overlay
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 border-b border-gray-800 shrink-0">
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

      {/* 2. Main Content Grid */}
      <div className="flex-grow p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-6xl mx-auto relative">
           <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-800 -translate-x-1/2 hidden md:block"></div>

           {/* Team A */}
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

           {/* Team B */}
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
          <div className="max-w-md mx-auto mt-6 pb-20">
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

      {/* 3. Control Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 sticky bottom-0 z-20 shadow-2xl shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <button onClick={resetAll} className="px-3 py-1 bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900 text-xs rounded uppercase">
              Reset All
            </button>
            
            {/* BULK CONTROLS */}
            <button onClick={handleShowAll} className="px-3 py-1 bg-green-900/50 text-green-400 border border-green-900 hover:bg-green-900 text-xs rounded uppercase">
              Show All
            </button>
            <button onClick={handleHideAll} className="px-3 py-1 bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 text-xs rounded uppercase">
              Hide All
            </button>

            <button 
              onClick={() => setIsLogOpen(true)} 
              className="px-3 py-1 bg-gray-800 text-blue-400 border border-gray-700 hover:bg-gray-700 text-xs rounded uppercase font-mono ml-4"
            >
              Logs ({logs.length})
            </button>
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