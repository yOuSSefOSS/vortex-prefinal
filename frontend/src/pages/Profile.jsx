import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Trash2 } from 'lucide-react';

const Profile = () => {
  const { customAirfoils, setCustomAirfoils, lastSimulationData, activeShapeIdGlobal } = useAppContext();

  const handleDownloadCSV = () => {
     if (!lastSimulationData || lastSimulationData.length === 0) return;
     let csvContent = "data:text/csv;charset=utf-8,Angle of Attack,Lift Coefficient (Cl),Drag Coefficient (Cd)\n";
     lastSimulationData.forEach(row => {
         csvContent += `${row.aoa},${row.cl},${row.cd}\n`;
     });
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `telemetry_${activeShapeIdGlobal}.csv`);
     document.body.appendChild(link);
     link.click();
     link.parentNode.removeChild(link);
  };

  const deleteAirfoil = (id) => {
     setCustomAirfoils(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="w-full h-full glass-panel flex flex-col p-8 overflow-y-auto custom-scrollbar">
       <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
          <div className="w-20 h-20 bg-brand-800 rounded-full border-2 border-[var(--color-accent-blue)] flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(14,165,233,0.3)] shrink-0">
             <div className="w-full h-full bg-[radial-gradient(circle_at_30%_30%,#00f0ff,#0ea5e9)] opacity-80"></div>
          </div>
          <div>
             <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-1" contentEditable suppressContentEditableWarning>Lead Engineer</h1>
             <p className="text-[var(--color-accent-neon)] font-mono text-sm" contentEditable suppressContentEditableWarning>ID: VX-9942A</p>
          </div>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Telemetry Actions */}
          <div className="bg-brand-900/60 p-6 rounded-xl border border-white/5 flex flex-col">
             <h2 className="text-xs text-brand-400 tracking-widest font-mono mb-4 uppercase">Data Exports</h2>
             <p className="text-sm text-brand-300 mb-6">Generate an Excel-ready CSV array of the last ran fluid dynamic calculation trace.</p>
             <button 
                onClick={handleDownloadCSV}
                disabled={!lastSimulationData || lastSimulationData.length === 0}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-neon)] border border-[var(--color-accent-blue)]/50 hover:bg-[var(--color-accent-blue)] hover:text-white transition-all shadow-[0_0_10px_rgba(14,165,233,0.2)] disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs font-bold tracking-widest"
             >
                <Download size={16}/> Extract Telemetry to CSV
             </button>
             {lastSimulationData && lastSimulationData.length > 0 && (
                <div className="text-[10px] text-brand-500 font-mono text-center mt-3">Target: {activeShapeIdGlobal.toUpperCase()} | {lastSimulationData.length} records ready.</div>
             )}
          </div>

          {/* Airfoil Hangar */}
          <div className="bg-brand-900/60 p-6 rounded-xl border border-white/5 flex flex-col max-h-[300px]">
             <h2 className="text-xs text-brand-400 tracking-widest font-mono mb-4 uppercase">Airfoil Hangar</h2>
             <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                {customAirfoils.length === 0 ? (
                   <div className="text-sm text-brand-500 italic text-center mt-8">No custom geometries stored yet.</div>
                ) : (
                   customAirfoils.map(a => (
                     <div key={a.id} className="flex justify-between items-center p-3 rounded-lg border border-white/10 bg-black/30 hover:border-white/20 transition-all">
                       <div>
                         <div className="text-sm font-bold text-white font-mono">{a.name}</div>
                         <div className="text-[10px] text-brand-400">{a.airfoilData ? a.airfoilData.length : 0} Points</div>
                       </div>
                       <button onClick={() => deleteAirfoil(a.id)} className="p-2 text-brand-500 hover:text-[var(--color-accent-pink)] hover:bg-[var(--color-accent-pink)]/10 rounded transition-all">
                          <Trash2 size={16}/>
                       </button>
                     </div>
                   ))
                )}
             </div>
          </div>
       </div>

    </div>
  );
};

export default Profile;
