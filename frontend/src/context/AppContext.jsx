import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Persistence Effects
  useEffect(() => { localStorage.setItem('useNeuralFoil', useNeuralFoil); }, [useNeuralFoil]);
  useEffect(() => { localStorage.setItem('appUnits', units); }, [units]);
  useEffect(() => { localStorage.setItem('lowPowerMode', lowPowerMode); }, [lowPowerMode]);
  useEffect(() => { localStorage.setItem('audioVolume', audioVolume); }, [audioVolume]);
  useEffect(() => { localStorage.setItem('soundPreset', soundPreset); }, [soundPreset]);
  useEffect(() => { localStorage.setItem('graphBounds', JSON.stringify(graphBounds)); }, [graphBounds]);
  useEffect(() => { localStorage.setItem('customAirfoils', JSON.stringify(customAirfoils)); }, [customAirfoils]);

  const value = {
    useNeuralFoil, setUseNeuralFoil,
    units, setUnits,
    lowPowerMode, setLowPowerMode,
    audioVolume, setAudioVolume,
    soundPreset, setSoundPreset,
    graphBounds, setGraphBounds,
    customAirfoils, setCustomAirfoils,
    lastSimulationData, setLastSimulationData,
    activeShapeIdGlobal, setActiveShapeIdGlobal
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
