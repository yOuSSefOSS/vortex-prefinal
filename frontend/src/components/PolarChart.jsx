import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label, Line, ComposedChart
} from 'recharts';

// Custom dot for the current operating point
const ActiveDot = ({ cx, cy, isStalling }) => (
  <circle
    cx={cx} cy={cy} r={7}
    fill={isStalling ? '#ff4444' : 'var(--color-accent-neon)'}
    stroke={isStalling ? '#ff444488' : 'var(--color-accent-neon)'}
    strokeWidth={3}
    opacity={0.95}
  />
);

// Custom tooltip
const PolarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const ld = d.cd > 0 ? (d.cl / d.cd).toFixed(1) : '—';
    return (
      <div style={{
        background: 'var(--color-brand-800)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: 11,
      }}>
        <div style={{ color: 'var(--color-brand-300)', marginBottom: 4 }}>α = {d.aoa}°</div>
        <div style={{ color: 'var(--color-accent-neon)' }}>Cl = {d.cl?.toFixed(4)}</div>
        <div style={{ color: 'var(--color-accent-pink)' }}>Cd = {d.cd?.toFixed(4)}</div>
        <div style={{ color: '#f59e0b', marginTop: 4 }}>L/D = {ld}</div>
      </div>
    );
  }
  return null;
};

const PolarChart = ({ data, currentCd, currentCl, stallCd, stallCl, isStalling }) => {
  // Build polar data: {cd, cl, aoa} for each point
  const polarData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .filter(d => typeof d.cd === 'number' && typeof d.cl === 'number')
      .map(d => ({ cd: d.cd, cl: d.cl, aoa: d.aoa }));
  }, [data]);

  // Compute best L/D point (tangent from origin to polar)
  const bestLD = useMemo(() => {
    if (!polarData.length) return null;
    let best = null, bestRatio = -Infinity;
    for (const p of polarData) {
      if (p.cd > 0) {
        const ratio = p.cl / p.cd;
        if (ratio > bestRatio) { bestRatio = ratio; best = p; }
      }
    }
    return best;
  }, [polarData]);

  // Best L/D tangent line: from origin to bestLD point (extended slightly)
  const tangentLine = useMemo(() => {
    if (!bestLD) return [];
    const slope = bestLD.cl / bestLD.cd;
    const maxCd = bestLD.cd * 1.4;
    return [
      { cd: 0, cl: 0 },
      { cd: maxCd, cl: slope * maxCd }
    ];
  }, [bestLD]);

  // Current operating point
  const activePoint = (currentCd != null && currentCl != null)
    ? [{ cd: currentCd, cl: currentCl, aoa: '–' }]
    : [];

  const stallPoint = (stallCd != null && stallCl != null)
    ? [{ cd: stallCd, cl: stallCl }]
    : [];

  const isEmpty = polarData.length === 0;

  return (
    <div
      className="w-full h-full glass-panel p-4 flex flex-col"
      style={{
        boxShadow: isStalling ? '0 0 20px rgba(255,68,68,0.25), inset 0 0 30px rgba(255,68,68,0.05)' : undefined,
        transition: 'box-shadow 0.3s ease'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-brand-300 uppercase">Drag Polar (Cl vs Cd)</h3>
          {bestLD && (
            <span className="text-[10px] font-mono text-amber-400 opacity-80">
              Best L/D = {(bestLD.cl / bestLD.cd).toFixed(1)} at α = {bestLD.aoa}°
            </span>
          )}
        </div>
        {isStalling && (
          <span className="text-[10px] font-mono font-bold text-[#ff4444] animate-pulse tracking-widest border border-[#ff4444]/50 px-2 py-0.5 rounded-full bg-[#ff4444]/10">
            ⚠ STALL
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-brand-500 font-mono text-xs tracking-widest">
          SELECT AN AIRFOIL TO VIEW POLAR
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-700)" />
              <XAxis
                dataKey="cd"
                type="number"
                name="Cd"
                domain={['auto', 'auto']}
                stroke="var(--color-brand-400)"
                tick={{ fill: 'var(--color-brand-300)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v.toFixed(3)}
              >
                <Label value="Cd →" position="insideBottomRight" offset={-5} fill="var(--color-accent-pink)" fontSize={10} />
              </XAxis>
              <YAxis
                dataKey="cl"
                type="number"
                name="Cl"
                domain={['auto', 'auto']}
                stroke="var(--color-brand-400)"
                tick={{ fill: 'var(--color-brand-300)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              >
                <Label value="Cl" position="insideTopLeft" fill="var(--color-accent-neon)" fontSize={10} />
              </YAxis>
              <Tooltip content={<PolarTooltip />} />

              {/* Best L/D tangent line from origin */}
              {tangentLine.length > 0 && (
                <Line
                  data={tangentLine}
                  dataKey="cl"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  legendType="none"
                />
              )}

              {/* Main drag polar curve */}
              <Scatter
                data={polarData}
                fill="var(--color-accent-blue)"
                line={{ stroke: 'var(--color-accent-blue)', strokeWidth: 2 }}
                lineType="joint"
                shape={<circle r={0} />}
              />

              {/* Stall point marker */}
              {stallPoint.length > 0 && (
                <Scatter
                  data={stallPoint}
                  fill="#ff2200"
                  shape={({ cx, cy }) => (
                    <g>
                      <circle cx={cx} cy={cy} r={5} fill="#ff2200" opacity={0.9} />
                      <circle cx={cx} cy={cy} r={9} fill="none" stroke="#ff2200" strokeWidth={1.5} opacity={0.5} />
                    </g>
                  )}
                />
              )}

              {/* Current operating point */}
              {activePoint.length > 0 && (
                <Scatter
                  data={activePoint}
                  shape={({ cx, cy }) => <ActiveDot cx={cx} cy={cy} isStalling={isStalling} />}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PolarChart;
