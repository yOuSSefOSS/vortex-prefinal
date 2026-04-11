import React from 'react';
import { Box, Wind, Layers, Sparkles } from 'lucide-react';

const ICON_MAP = {
  box: <Box size={18} />,
  wind: <Wind size={18} />,
  layers: <Layers size={18} />,
  sparkles: <Sparkles size={18} className="text-amber-300" />,
};

const ShapeCard = ({ id, name, type, icon, active, onClick }) => {
  const renderedIcon = typeof icon === 'string' 
    ? (ICON_MAP[icon] || <Box size={18} />) 
    : (React.isValidElement(icon) ? icon : <Box size={18} />);

  return (
    <button 
      onClick={() => onClick(id)}
      className="w-full text-left group relative"
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        border: `1px solid ${active ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.08)'}`,
        background: active
          ? 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(0,240,255,0.03) 100%)'
          : 'rgba(17,24,39,0.6)',
        boxShadow: active
          ? '0 0 12px rgba(14,165,233,0.15), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s, background 0.3s, box-shadow 0.35s',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.background = 'rgba(17,24,39,0.8)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5), 0 0 12px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.background = 'rgba(17,24,39,0.6)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)';
        }
      }}
    >
      <div style={{
        padding: 10,
        borderRadius: 10,
        background: active
          ? 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(14,165,233,0.08))'
          : 'rgba(31,41,55,0.6)',
        color: active ? '#0ea5e9' : '#64748b',
        transition: 'background 0.3s, color 0.3s, box-shadow 0.3s',
        boxShadow: active ? '0 0 10px rgba(0,240,255,0.1)' : 'none',
        flexShrink: 0,
      }}>
        {renderedIcon}
      </div>
      <div>
        <h3 style={{
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.03em',
          color: active ? '#fff' : '#cbd5e1',
          transition: 'color 0.25s',
          marginBottom: 2,
        }}>{name}</h3>
        <span style={{
          fontSize: 11,
          color: '#475569',
          textTransform: 'capitalize',
          letterSpacing: '0.04em',
        }}>{type}</span>
      </div>

      {/* Active glow indicator bar */}
      {active && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: 2,
          borderRadius: 4,
          background: 'linear-gradient(180deg, #00f0ff, #0ea5e9)',
          boxShadow: '0 0 8px rgba(0,240,255,0.3)',
        }} />
      )}
    </button>
  );
};

export default ShapeCard;
