import React from 'react';

const ControlSlider = ({ label, value, min, max, step = 1, unit, onChange, accent = "blue" }) => {
  const isNeon = accent === "neon";
  const accentColor = isNeon ? '#00f0ff' : '#0ea5e9';
  const range = max - min || 1;
  const pct = ((value - min) / range) * 100;
  
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 10,
      }}>
        <label style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: '#64748b',
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}>{label}</label>
        <div style={{
          fontFamily: 'monospace',
          fontWeight: 700,
          fontSize: 22,
          color: accentColor,
          textShadow: `0 0 12px ${accentColor}44`,
          lineHeight: 1,
          transition: 'color 0.3s',
        }}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? Math.max(0, Math.ceil(-Math.log10(step))) : 0) : value}
          <span style={{
            fontSize: 11,
            color: '#475569',
            marginLeft: 4,
            fontWeight: 400,
          }}>{unit}</span>
        </div>
      </div>

      {/* Custom slider with glowing gradient fill */}
      <div style={{ position: 'relative', paddingTop: 2, paddingBottom: 2 }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 6,
          marginTop: -3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {/* Filled portion with gradient */}
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${accentColor}55, ${accentColor})`,
            boxShadow: `0 0 10px ${accentColor}44`,
            transition: 'width 0.05s linear',
          }} />
        </div>

        {/* Native range input (transparent, sits on top) */}
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 22,
            position: 'relative',
            zIndex: 2,
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Range labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
      }}>
        <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>{min}</span>
        <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>{max}</span>
      </div>
    </div>
  );
};

export default ControlSlider;
