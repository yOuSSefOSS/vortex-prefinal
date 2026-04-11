import React from 'react';
import { Box, Wind, Layers } from 'lucide-react';

const ICON_MAP = {
  box: <Box size={18} />,
  wind: <Wind size={18} />,
  layers: <Layers size={18} />
};

const ShapeCard = ({ id, name, type, icon, active, onClick }) => {
  // If icon is a string, use ICON_MAP. If it's an object but doesn't look like a valid React element, 
  // or if it was corrupted by JSON serialization, default to 'box' icon.
  const renderedIcon = typeof icon === 'string' 
    ? (ICON_MAP[icon] || <Box size={18} />) 
    : (React.isValidElement(icon) ? icon : <Box size={18} />);

  return (
    <button 
      onClick={() => onClick(id)}
      className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-4 border ${
        active 
          ? 'bg-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]/50 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
          : 'bg-brand-800/40 border-white/5 hover:border-white/20 hover:bg-brand-800'
      }`}
    >
      <div className={`p-3 rounded-lg ${active ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-neon)]' : 'bg-brand-700 text-brand-300'}`}>
        {renderedIcon}
      </div>
      <div>
        <h3 className={`font-semibold tracking-wide ${active ? 'text-white' : 'text-brand-100'}`}>{name}</h3>
        <span className="text-xs text-brand-400 capitalize">{type}</span>
      </div>
    </button>
  );
};

export default ShapeCard;
