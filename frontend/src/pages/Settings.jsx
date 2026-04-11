import React from 'react';
import { useAppContext, FLOW_VISUAL_OPTIONS } from '../context/AppContext';

const Settings = () => {
  const { 
    useNeuralFoil, setUseNeuralFoil,
    units, setUnits,
    lowPowerMode, setLowPowerMode,
    flowVisualMode, setFlowVisualMode,
    audioVolume, setAudioVolume,
    soundPreset, setSoundPreset,
    graphBounds, setGraphBounds
  } = useAppContext();

  return (
    <div className="w-full h-full glass-panel flex flex-col p-8 overflow-y-auto custom-scrollbar">
       <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-8 border-b border-white/10 pb-4">System Preferences</h1>
       
       <div className="space-y-6 max-w-2xl pb-10">
          
          {/* NeuralFoil Toggle */}
          <div 
             className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer"
             onClick={() => setUseNeuralFoil(!useNeuralFoil)}
          >
             <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  NeuralFoil Machine Learning
                  {!useNeuralFoil && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/50">DISABLED</span>}
                </h3>
                <p className="text-sm text-brand-300">Utilize the PyTorch backend API for high-accuracy CFD predictions. If disabled, uses rudimentary math approximations.</p>
             </div>
             <div className={`w-12 h-6 flex-shrink-0 rounded-full relative shadow-[0_0_10px_var(--color-accent-blue)] transition-colors ${useNeuralFoil ? 'bg-[var(--color-accent-blue)]' : 'bg-gray-600 shadow-none'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all ${useNeuralFoil ? 'right-1' : 'left-1'}`}></div>
             </div>
          </div>

          {/* Low Power Mode Toggle */}
          <div 
             className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer"
             onClick={() => setLowPowerMode(!lowPowerMode)}
          >
             <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  Low Power Mode (Eco)
                  {lowPowerMode && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">ACTIVE</span>}
                </h3>
                <p className="text-sm text-brand-300">Reduces 3D flow particle count by half (and tightens streakline seeds) to save GPU and battery.</p>
             </div>
             <div className={`w-12 h-6 flex-shrink-0 rounded-full relative shadow-[0_0_10px_var(--color-accent-neon)] transition-colors ${lowPowerMode ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-600 shadow-none'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all ${lowPowerMode ? 'right-1' : 'left-1'}`}></div>
             </div>
          </div>

          {/* Flow / streamline look (3D viewport) */}
          <div className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex flex-col gap-4">
             <div>
                <h3 className="text-white font-semibold">Flow visualization</h3>
                <p className="text-sm text-brand-300">How wind particles and streaklines appear in the dashboard 3D view (Start Flow).</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FLOW_VISUAL_OPTIONS.map((opt) => (
                   <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFlowVisualMode(opt.id)}
                      className={`text-left py-3 px-4 rounded-lg border transition-all ${
                        flowVisualMode === opt.id
                          ? 'bg-[var(--color-accent-blue)]/15 border-[var(--color-accent-blue)] text-white shadow-[0_0_12px_rgba(14,165,233,0.25)]'
                          : 'bg-black/20 border-white/10 text-brand-400 hover:border-white/25 hover:text-brand-200'
                      }`}
                   >
                      <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-accent-blue)] mb-1">{opt.label}</div>
                      <div className="text-[11px] leading-snug text-brand-300">{opt.description}</div>
                   </button>
                ))}
             </div>
          </div>

          {/* Units Selector */}
          <div className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex flex-col gap-4">
             <div>
                <h3 className="text-white font-semibold">Measurement Units</h3>
                <p className="text-sm text-brand-300">Select standard metric or imperial aviation units.</p>
             </div>
             <div className="flex bg-black/40 rounded-lg p-1 w-full max-w-xs border border-white/10">
                <button 
                  onClick={() => setUnits('metric')} 
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${units === 'metric' ? 'bg-[var(--color-accent-blue)] text-white shadow-md' : 'text-brand-400 hover:text-white'}`}
                >Metric (m/s)</button>
                <button 
                  onClick={() => setUnits('imperial')} 
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${units === 'imperial' ? 'bg-[var(--color-accent-blue)] text-white shadow-md' : 'text-brand-400 hover:text-white'}`}
                >Imperial (mph)</button>
             </div>
          </div>

          {/* Alarm Audio Settings */}
          <div className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex flex-col gap-6">
             <div>
                <h3 className="text-white font-semibold">Alarm Audio</h3>
                <p className="text-sm text-brand-300">Configure the stall warning audio profile and volume.</p>
             </div>
             
             <div className="flex flex-col gap-3">
                <label className="text-xs font-mono text-brand-400 uppercase tracking-widest">Sound Profile</label>
                <div className="grid grid-cols-3 gap-2">
                   {[
                     { id: 'horn', label: 'Classic Horn' },
                     { id: 'siren', label: 'Aviation Siren' },
                     { id: 'sonar', label: 'Sonar Pulse' }
                   ].map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setSoundPreset(p.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all ${soundPreset === p.id ? 'bg-[var(--color-accent-pink)]/20 border-[var(--color-accent-pink)] text-[var(--color-accent-pink)] shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-black/20 border-white/10 text-brand-400 hover:border-white/30'}`}
                      >
                        {p.label}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                   <label className="text-xs font-mono text-brand-400 uppercase tracking-widest">Stall Alarm Volume</label>
                   <span className="text-[var(--color-accent-pink)] font-mono text-lg">{audioVolume}%</span>
                </div>
                <input 
                   type="range" min="0" max="100" 
                   value={audioVolume} onChange={(e) => setAudioVolume(e.target.value)}
                   className="w-full h-2 bg-brand-900 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-pink)]"
                />
             </div>
          </div>

          {/* Graph Bounds Sliders */}
          <div className="bg-brand-800/50 p-6 rounded-xl border border-white/5 flex flex-col gap-5">
             <div>
                <h3 className="text-white font-semibold">Graph Bounds (AoA Calculation Range)</h3>
                <p className="text-sm text-brand-300">Limit the NeuralFoil sweep to specific Angles of Attack.</p>
             </div>
             
             <div className="flex items-center gap-4">
               <span className="w-8 text-right font-mono text-brand-300 text-xs">MIN</span>
               <input 
                  type="range" min="-40" max="0" 
                  value={graphBounds.min} onChange={(e) => setGraphBounds({...graphBounds, min: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-brand-900 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-blue)]"
               />
               <span className="w-8 font-mono text-[var(--color-accent-blue)] font-bold">{graphBounds.min}°</span>
             </div>
             <div className="flex items-center gap-4">
               <span className="w-8 text-right font-mono text-brand-300 text-xs">MAX</span>
               <input 
                  type="range" min="0" max="40" 
                  value={graphBounds.max} onChange={(e) => setGraphBounds({...graphBounds, max: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-brand-900 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-blue)]"
               />
               <span className="w-8 font-mono text-[var(--color-accent-blue)] font-bold">{graphBounds.max}°</span>
             </div>
          </div>

       </div>
    </div>
  );
};
export default Settings;
