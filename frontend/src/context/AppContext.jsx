import React, { createContext, useContext, useState, useEffect } from 'react';

/** Persisted IDs for `flowVisualMode` — keep in sync with Settings + SimulationView. */
export const FLOW_VISUAL_OPTIONS = [
  { id: 'neon_streams', label: 'Neon streams', description: 'Bright additive particles (default).' },
  { id: 'wind_tunnel', label: 'Wind tunnel', description: 'Softer, depth-aware smoke-like traces.' },
  { id: 'streaklines', label: 'Streaklines', description: 'Short, sparse trails (teleports culled; calmer than dense line fields).' },
  { id: 'clean_vectors', label: 'Clean vectors', description: 'Sparse minimal highlights — good for stills.' },
];

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Application Settings State
  const [useNeuralFoil, setUseNeuralFoil] = useState(
    localStorage.getItem('useNeuralFoil') !== 'false'
  );
  
  const [units, setUnits] = useState(
    localStorage.getItem('appUnits') || 'metric' // 'metric' or 'imperial'
  );
  
  const [lowPowerMode, setLowPowerMode] = useState(
    localStorage.getItem('lowPowerMode') === 'true'
  );

  /** 3D flow visualization: particles look / streaklines (see Settings). */
  const [flowVisualMode, setFlowVisualMode] = useState(() => {
    const v = localStorage.getItem('flowVisualMode');
    const ok = FLOW_VISUAL_OPTIONS.some((o) => o.id === v);
    return ok ? v : 'neon_streams';
  });
  
  const [audioVolume, setAudioVolume] = useState(
    parseFloat(localStorage.getItem('audioVolume') || '50')
  );

  const [soundPreset, setSoundPreset] = useState(
    localStorage.getItem('soundPreset') || 'horn'
  );
  
  const [graphBounds, setGraphBounds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('graphBounds')) || { min: -20, max: 30 };
    } catch {
      return { min: -20, max: 30 };
    }
  });

  // Hangar / Data State
  const [customAirfoils, setCustomAirfoils] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customAirfoils')) || [];
    } catch {
      return [];
    }
  });
  
  // Ephemeral Data (Not stored in localStorage)
  const [lastSimulationData, setLastSimulationData] = useState([]);
  const [activeShapeIdGlobal, setActiveShapeIdGlobal] = useState('naca4412');

  /** True after AUTOTUNE FOR MAX LIFT completes — metrics panel gold accent until user edits. */
  const [goldenLiftActive, setGoldenLiftActive] = useState(false);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('useNeuralFoil', useNeuralFoil); }, [useNeuralFoil]);
  useEffect(() => { localStorage.setItem('appUnits', units); }, [units]);
  useEffect(() => { localStorage.setItem('lowPowerMode', lowPowerMode); }, [lowPowerMode]);
  useEffect(() => { localStorage.setItem('flowVisualMode', flowVisualMode); }, [flowVisualMode]);
  useEffect(() => { localStorage.setItem('audioVolume', audioVolume); }, [audioVolume]);
  useEffect(() => { localStorage.setItem('soundPreset', soundPreset); }, [soundPreset]);
  useEffect(() => { localStorage.setItem('graphBounds', JSON.stringify(graphBounds)); }, [graphBounds]);
  useEffect(() => { localStorage.setItem('customAirfoils', JSON.stringify(customAirfoils)); }, [customAirfoils]);

  const value = {
    useNeuralFoil, setUseNeuralFoil,
    units, setUnits,
    lowPowerMode, setLowPowerMode,
    flowVisualMode, setFlowVisualMode,
    audioVolume, setAudioVolume,
    soundPreset, setSoundPreset,
    graphBounds, setGraphBounds,
    customAirfoils, setCustomAirfoils,
    lastSimulationData, setLastSimulationData,
    activeShapeIdGlobal, setActiveShapeIdGlobal,
    goldenLiftActive, setGoldenLiftActive
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
