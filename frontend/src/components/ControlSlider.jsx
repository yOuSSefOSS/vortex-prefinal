import React from 'react';

const ControlSlider = ({ label, value, min, max, unit, onChange, accent = "blue" }) => {
  const isNeon = accent === "neon";
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="text-xs font-semibold tracking-widest text-brand-300 uppercase">{label}</label>
        <div className={`font-mono font-bold text-xl ${isNeon ? 'text-[var(--color-accent-neon)]' : 'text-[var(--color-accent-blue)]'}`}>
          {value}<span className="text-xs text-brand-400 ml-1">{unit}</span>
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-brand-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/50 focus:ring-offset-2 focus:ring-offset-brand-900 slider-thumb-styled"
      />
    </div>
  );
};

export default ControlSlider;
