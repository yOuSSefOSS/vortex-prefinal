import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Edges, Text, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// ─── Viewport Gizmo ───────────────────────────────────────────────────────────
const ViewportGizmo = React.memo(({ cameraStr, onSnapView }) => {
  const size = 90, cx = 45, armLen = 30;
  const azimR = (parseFloat(cameraStr.azim) * Math.PI) / 180;
  const elevR = (parseFloat(cameraStr.elev) * Math.PI) / 180;
  const project = ([wx, wy, wz]) => {
    const rx = Math.cos(azimR), rz = -Math.sin(azimR);
    const ux = Math.sin(azimR)*Math.sin(elevR), uy = Math.cos(elevR), uz = Math.cos(azimR)*Math.sin(elevR);
    return { sx: wx*rx+wz*rz, sy: -(wx*ux+wy*uy+wz*uz) };
  };
  const axes = [
    { label:'X', dir:[1,0,0], color:'#E74C3C', neg:[-1,0,0], view:'right' },
    { label:'Y', dir:[0,1,0], color:'#2ECC71', neg:[0,-1,0], view:'top' },
    { label:'Z', dir:[0,0,1], color:'#3498DB', neg:[0,0,-1], view:'front' },
  ];
  const proj = axes.map(ax=>({...ax, pos:project(ax.dir), negPos:project(ax.neg)}));
  proj.sort((a,b)=>a.pos.sy-b.pos.sy);
  return (
    <div style={{position:'absolute',top:16,right:16,zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',gap:6,pointerEvents:'none'}}>
      <div style={{fontSize:10,fontFamily:'monospace',fontWeight:'bold',letterSpacing:'0.12em',color:'#00f0ff',textShadow:'0 0 8px #00f0ff',background:'rgba(0,0,0,0.5)',padding:'2px 8px',borderRadius:4,border:'1px solid rgba(0,240,255,0.2)'}}>{cameraStr.mode}</div>
      <div style={{width:size,height:size,borderRadius:'50%',background:'rgba(10,10,20,0.65)',border:'1px solid rgba(255,255,255,0.12)',boxShadow:'0 4px 24px rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',position:'relative',pointerEvents:'auto'}}>
        <svg width={size} height={size} style={{position:'absolute',top:0,left:0,overflow:'visible'}}>
          {proj.map(ax=>(
            <g key={`n${ax.label}`}>
              <line x1={cx} y1={cx} x2={cx+ax.negPos.sx*armLen} y2={cx+ax.negPos.sy*armLen} stroke={ax.color} strokeWidth={1.5} strokeOpacity={0.3} strokeLinecap="round"/>
              <circle cx={cx+ax.negPos.sx*armLen} cy={cx+ax.negPos.sy*armLen} r={5.5} fill={ax.color} fillOpacity={0.35} style={{cursor:'pointer'}} onClick={()=>onSnapView(`neg-${ax.view}`)}/>
              <text x={cx+ax.negPos.sx*armLen} y={cx+ax.negPos.sy*armLen+0.5} textAnchor="middle" dominantBaseline="middle" fill={ax.color} fillOpacity={0.6} fontSize="6" fontWeight="bold" fontFamily="monospace" style={{pointerEvents:'none'}}>-{ax.label}</text>
            </g>
          ))}
          {proj.map(ax=>(
            <g key={ax.label}>
              <line x1={cx} y1={cx} x2={cx+ax.pos.sx*armLen} y2={cx+ax.pos.sy*armLen} stroke={ax.color} strokeWidth={2.5} strokeLinecap="round"/>
              <circle cx={cx+ax.pos.sx*armLen} cy={cx+ax.pos.sy*armLen} r={8} fill={ax.color} fillOpacity={0.9} style={{cursor:'pointer'}} onClick={()=>onSnapView(ax.view)}/>
              <text x={cx+ax.pos.sx*armLen} y={cx+ax.pos.sy*armLen+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace" style={{pointerEvents:'none'}}>{ax.label}</text>
            </g>
          ))}
          <circle cx={cx} cy={cx} r={3} fill="rgba(255,255,255,0.6)"/>
        </svg>
      </div>
      <div style={{fontSize:9,fontFamily:'monospace',color:'rgba(255,255,255,0.3)',pointerEvents:'none'}}>NUMPAD · CLICK AXIS</div>
    </div>
  );
});

// ─── AoA Gauge ────────────────────────────────────────────────────────────────
const AoAGauge = React.memo(({ pitchAngle, positiveStallAngle, negativeStallAngle }) => {
  const pStall = positiveStallAngle !== null ? positiveStallAngle : 15;
  // If we have no negative stall data, we assume symmetric negative boundary
  const nStall = negativeStallAngle !== null && negativeStallAngle !== positiveStallAngle ? negativeStallAngle : -pStall;
  
  const pWarn = Math.max(0, pStall - 4);
  const nWarn = Math.min(0, nStall + 4);

  const isStall = pitchAngle >= pStall || pitchAngle <= nStall;
  const isWarn = pitchAngle >= pWarn || pitchAngle <= nWarn;

  const clamp = Math.max(-45, Math.min(45, pitchAngle));
  const nr = ((clamp * 2 - 90) * Math.PI) / 180;
  const GCX = 70, GCY = 70, R = 52;
  const nx = GCX + R * 0.85 * Math.cos(nr), ny = GCY + R * 0.85 * Math.sin(nr);

  const arc = (sAoA, eAoA, col) => {
    sAoA = Math.max(-45, Math.min(45, sAoA));
    eAoA = Math.max(-45, Math.min(45, eAoA));
    if (eAoA <= sAoA) return null;
    
    // Map AoA (-45 to 45) to semicircular angles (-90 to +90 degrees)
    const s = sAoA * 2;
    const e = eAoA * 2;
    const sr = ((s - 90) * Math.PI) / 180, er = ((e - 90) * Math.PI) / 180;
    return <path d={`M${GCX + R * Math.cos(sr)},${GCY + R * Math.sin(sr)} A${R},${R} 0 0,1 ${GCX + R * Math.cos(er)},${GCY + R * Math.sin(er)}`} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" />;
  };

  return (
    <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:20,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      {isStall && <div style={{fontSize:11,fontFamily:'monospace',fontWeight:'bold',color:'#ff2200',textShadow:'0 0 12px #ff2200',background:'rgba(255,34,0,0.15)',border:'1px solid #ff2200',borderRadius:4,padding:'2px 10px',letterSpacing:'0.15em'}}>⚠ STALL</div>}
      <svg width={140} height={80} style={{overflow:'visible'}}>
        {arc(-45, 45, 'rgba(255,255,255,0.08)')}
        {arc(-45, nStall, '#E74C3C')}
        {arc(nStall, nWarn, '#F39C12')}
        {arc(nWarn, pWarn, '#2ECC71')}
        {arc(pWarn, pStall, '#F39C12')}
        {arc(pStall, 45, '#E74C3C')}
        
        <line x1={GCX} y1={GCY} x2={nx} y2={ny} stroke={isStall ? '#ff2200' : isWarn ? '#F39C12' : '#00f0ff'} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={GCX} cy={GCY} r={4} fill={isStall ? '#ff2200' : '#00f0ff'}/>
        <text x={GCX} y={GCY+20} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="monospace" fontWeight="bold">{pitchAngle>0?'+':''}{pitchAngle}° AoA</text>
      </svg>
    </div>
  );
});

// ─── Surface helper (for heatmap Cp estimation) ──────────────────────────────
const buildSurfaceFn = (pts) => (x) => {
  if (x < -0.5 || x > 0.5) return { upper: 0, lower: 0 };
  const xn = x + 0.5;
  if (pts && pts.length > 3) {
    let up = -1, lo = 1;
    for (const [px, py] of pts) {
      if (Math.abs(px - x) < 0.03) {
        if (py > up) up = py;
        if (py < lo) lo = py;
      }
    }
    return { upper: up === -1 ? 0 : up, lower: lo === 1 ? 0 : lo };
  }
  const t = 0.12, m = 0.04, p = 0.4;
  const yt = 5 * t * (0.2969 * Math.sqrt(xn + 1e-9) - 0.126 * xn - 0.3516 * xn ** 2 + 0.2843 * xn ** 3 - 0.1015 * xn ** 4);
  const yc = xn < p ? (m / p ** 2) * (2 * p * xn - xn ** 2) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * xn - xn ** 2);
  return { upper: yc + yt, lower: yc - yt };
};

// ─── Polygon / inviscid-wall helpers (flow follows real airfoil coordinates) ──
const pointInPolygon = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  return inside;
};

const closestOnPolyline = (px, py, segs) => {
  let best = Infinity, bx = 0, by = 0, nx = 0, ny = 1;
  for (let s = 0; s < segs.length; s++) {
    const { ax, ay, bx: ex, by: ey } = segs[s];
    const abx = ex - ax, aby = ey - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx * abx + aby * aby + 1e-14;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const qx = ax + t * abx, qy = ay + t * aby;
    const dx = px - qx, dy = py - qy;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) {
      best = d2;
      bx = qx; by = qy;
      const ilen = 1 / Math.sqrt(ab2);
      const tx = abx * ilen, ty = aby * ilen;
      nx = ty; ny = -tx;
    }
  }
  return { x: bx, y: by, dist: Math.sqrt(best), nx, ny };
};

const buildPolyModel = (points) => {
  if (!points || points.length < 3) return null;
  const segs = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let sx = 0, sy = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const ax = points[i][0], ay = points[i][1];
    const bx = points[j][0], by = points[j][1];
    segs.push({ ax, ay, bx, by });
    sx += ax; sy += ay;
    minX = Math.min(minX, ax); maxX = Math.max(maxX, ax);
    minY = Math.min(minY, ay); maxY = Math.max(maxY, ay);
  }
  const n = points.length;
  return { points, segs, minX, maxX, minY, maxY, cx: sx / n, cy: sy / n, teX: maxX };
};

/** Short history = less spaghetti; long trails amplify snap/wrap artifacts. */
const FLOW_TRAIL_LEN = 6;
/** Max world-space length per streak segment; longer = teleport / jitter → hide segment. */
const STREAK_MAX_SEG = 0.22;
/** Only every Nth particle draws streaklines (cuts crossing clutter). */
const STREAK_DRAW_STRIDE = 3;

const resetParticleTrail = (i, trail, wx, wy, wz) => {
  for (let k = 0; k < FLOW_TRAIL_LEN; k++) {
    const o = (i * FLOW_TRAIL_LEN + k) * 3;
    trail[o] = wx;
    trail[o + 1] = wy;
    trail[o + 2] = wz;
  }
};

const pushParticleTrail = (i, trail, wx, wy, wz) => {
  for (let k = FLOW_TRAIL_LEN - 1; k > 0; k--) {
    const to = (i * FLOW_TRAIL_LEN + k) * 3;
    const from = (i * FLOW_TRAIL_LEN + k - 1) * 3;
    trail[to] = trail[from];
    trail[to + 1] = trail[from + 1];
    trail[to + 2] = trail[from + 2];
  }
  const h = (i * FLOW_TRAIL_LEN) * 3;
  trail[h] = wx;
  trail[h + 1] = wy;
  trail[h + 2] = wz;
};

// ─── Flow Particles ───────────────────────────────────────────────────────────
// With real airfoil points: inviscid wall (V·n=0 slip) + closest-surface deflection.
// Without points: legacy NACA-thickness heuristic (same domain as before).
const FlowParticles = ({ isActive, windSpeed, pitchAngle, airfoilPts }) => {
  const { lowPowerMode, flowVisualMode } = useAppContext();
  const meshRef = useRef();
  const lineRef = useRef();
  const colors = useRef(null);
  const trailRef = useRef(null);

  const particleCount = useMemo(() => {
    let n = lowPowerMode ? 1750 : 3500;
    // Fewer advected markers + stride drawing keeps streak view readable (no dense X grid).
    if (flowVisualMode === 'streaklines') n = Math.floor(n * 0.14);
    if (flowVisualMode === 'clean_vectors') n = Math.floor(n * 0.34);
    return Math.max(400, n);
  }, [lowPowerMode, flowVisualMode]);

  const geo = useMemo(() => buildPolyModel(airfoilPts), [airfoilPts]);
  const surfaceFn = useMemo(() => buildSurfaceFn(airfoilPts), [airfoilPts]);
  const isStreak = flowVisualMode === 'streaklines';

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const trail = new Float32Array(particleCount * FLOW_TRAIL_LEN * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = -3 + Math.random() * 6;
      pos[i * 3 + 1] = -1.5 + Math.random() * 3.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      col[i * 3] = 0; col[i * 3 + 1] = 0.94; col[i * 3 + 2] = 1;
      for (let k = 0; k < FLOW_TRAIL_LEN; k++) {
        const o = (i * FLOW_TRAIL_LEN + k) * 3;
        trail[o] = pos[i * 3];
        trail[o + 1] = pos[i * 3 + 1];
        trail[o + 2] = pos[i * 3 + 2];
      }
    }
    colors.current = col;
    trailRef.current = trail;
    return pos;
  }, [particleCount]);

  const lineVertexCount = particleCount * (FLOW_TRAIL_LEN - 1) * 2;
  const linePositions = useMemo(() => new Float32Array(lineVertexCount * 3), [lineVertexCount]);
  const lineColors = useMemo(() => new Float32Array(lineVertexCount * 3), [lineVertexCount]);

  useFrame((_, delta) => {
    if (!isActive || !meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    const col = colors.current;
    const trail = trailRef.current;
    const COUNT = particleCount;

    const dt = Math.min(delta, 0.04);
    const Uinf = Math.max(0.2, (windSpeed / 50) * 1.5);
    const pRad = pitchAngle * Math.PI / 180;
    const cosP = Math.cos(pRad), sinP = Math.sin(pRad);
    const halfC = 0.5;
    const thick = 0.12;
    const teX = geo ? geo.teX : halfC;
    const inflGeo = 0.62;

    for (let i = 0; i < COUNT; i++) {
      let x = pos[i * 3], y = pos[i * 3 + 1];
      let vx = Uinf, vy = 0;
      const lx = x * cosP - y * sinP;
      const ly = x * sinP + y * cosP;

      if (geo && airfoilPts) {
        const padX = 0.85, padY = 0.75;
        if (lx >= geo.minX - padX && lx <= geo.maxX + padX && ly >= geo.minY - padY && ly <= geo.maxY + padY) {
          const inside = pointInPolygon(lx, ly, geo.points);
          let { x: cpx, y: cpy, dist, nx, ny } = closestOnPolyline(lx, ly, geo.segs);
          const rdx = lx - cpx, rdy = ly - cpy;
          if (!inside && rdx * nx + rdy * ny < 0) {
            nx = -nx; ny = -ny;
          }
          if (inside) {
            const el = Math.hypot(rdx, rdy) || 1e-5;
            const eps = 0.022;
            const nlx = cpx + (rdx / el) * eps;
            const nly = cpy + (rdy / el) * eps;
            const nxw = nlx * cosP + nly * sinP;
            const nyw = -nlx * sinP + nly * cosP;
            pos[i * 3] = nxw;
            pos[i * 3 + 1] = nyw;
            if (isStreak && trail) resetParticleTrail(i, trail, nxw, nyw, pos[i * 3 + 2]);
            continue;
          }
          if (dist < 0.007) {
            const nlx = cpx + nx * 0.014;
            const nly = cpy + ny * 0.014;
            const nxw = nlx * cosP + nly * sinP;
            const nyw = -nlx * sinP + nly * cosP;
            pos[i * 3] = nxw;
            pos[i * 3 + 1] = nyw;
            if (isStreak && trail) resetParticleTrail(i, trail, nxw, nyw, pos[i * 3 + 2]);
            continue;
          }
          if (dist < inflGeo) {
            const Ulocx = Uinf * cosP, Ulocy = Uinf * sinP;
            const dotn = Ulocx * nx + Ulocy * ny;
            const slx = Ulocx - dotn * nx;
            const sly = Ulocy - dotn * ny;
            const wvx = slx * cosP + sly * sinP;
            const wvy = -slx * sinP + sly * cosP;
            const tinf = Math.pow(1 - dist / inflGeo, 1.22);
            vx = Uinf * (1 - tinf) + wvx * tinf;
            vy = vy * (1 - tinf) + wvy * tinf;
            const sf = surfaceFn(lx);
            const mid = 0.5 * (sf.upper + sf.lower);
            const isUpper = ly > mid;
            let speedBoost = 1;
            if (lx > -0.38 && lx < 0.42) {
              if (isUpper) speedBoost = 1 + 0.48 * Math.sin(Math.max(0, pRad)) * tinf;
              else speedBoost = 1 - 0.3 * Math.sin(Math.max(0, pRad)) * tinf;
            }
            vx *= speedBoost; vy *= speedBoost;
          }
        }
      } else if (!!airfoilPts && lx > -1.2 && lx < 1.0 && Math.abs(ly) < 1.2) {
        const xN = lx + halfC;
        let yt = 0, dyt = 0;
        if (xN > 0 && xN < 1) {
          yt = 5 * thick * (0.2969 * Math.sqrt(xN + 1e-9) - 0.126 * xN - 0.3516 * xN * xN + 0.2843 * xN ** 3 - 0.1015 * xN ** 4);
          dyt = 5 * thick * (0.14845 / Math.sqrt(xN + 1e-9) - 0.126 - 0.7032 * xN + 0.8529 * xN * xN - 0.406 * xN ** 3);
        }
        const isUpper = ly > 0;
        const distToChord = Math.abs(ly);
        if (lx > -halfC && lx < halfC && distToChord < yt) {
          const targetLy = isUpper ? yt + 0.01 : -yt - 0.01;
          const nxw = lx * cosP + targetLy * sinP;
          const nyw = -lx * sinP + targetLy * cosP;
          pos[i * 3] = nxw;
          pos[i * 3 + 1] = nyw;
          if (isStreak && trail) resetParticleTrail(i, trail, nxw, nyw, pos[i * 3 + 2]);
          continue;
        }
        const influenceZone = 0.7;
        const gap = distToChord - yt;
        if (gap > 0 && gap < influenceZone) {
          const influence = Math.pow(1 - gap / influenceZone, 1.2);
          let tvy = isUpper ? dyt : -dyt;
          if (xN <= 0) {
            const noseBend = Math.max(0, 1 - Math.abs(xN) / 0.4);
            tvy = (isUpper ? 0.8 : -0.8) * noseBend;
          }
          let tvx = 1.0;
          const tLen = Math.hypot(tvx, tvy) || 1;
          tvx /= tLen; tvy /= tLen;
          const wtvx = tvx * cosP + tvy * sinP;
          const wtvy = -tvx * sinP + tvy * cosP;
          let speedBoost = 1;
          if (lx > -0.4 && lx < 0.4) {
            if (isUpper) speedBoost = 1 + 0.5 * Math.sin(Math.max(0, pRad)) * influence;
            else speedBoost = 1 - 0.3 * Math.sin(Math.max(0, pRad)) * influence;
          }
          vx = vx * (1 - influence) + (wtvx * Uinf * speedBoost) * influence;
          vy = vy * (1 - influence) + (wtvy * Uinf * speedBoost) * influence;
        }
      }

      if (lx > teX - 0.02 && x < 3.5) {
        const downwashAngle = pRad * 0.7;
        if (Math.abs(ly) < 0.85) {
          const wakeInf = Math.max(0, 1 - Math.abs(ly) / 0.85);
          const decay = Math.max(0, 1 - (lx - teX + 0.02) / 2.5);
          const effectiveDW = downwashAngle * wakeInf * decay;
          const dwVx = Uinf * Math.cos(-effectiveDW);
          const dwVy = Uinf * Math.sin(-effectiveDW);
          const trans = Math.min((lx - teX + 0.02) / 0.28, 1);
          vx = vx * (1 - trans * wakeInf) + dwVx * trans * wakeInf;
          vy = vy * (1 - trans * wakeInf) + dwVy * trans * wakeInf;
        }
      }

      const absA = Math.abs(pitchAngle);
      if (absA > 14 && lx > -0.1 && lx < 1.8 && ly > 0 && ly < 0.72) {
        const stallIntensity = Math.min((absA - 14) / 10, 1);
        vx *= 1 - 0.4 * stallIntensity;
        vy += (Math.random() - 0.5) * Uinf * stallIntensity * 1.8;
        if (Math.random() > 0.9) vx -= Uinf * stallIntensity * 0.5;
      }

      const spd = Math.hypot(vx, vy);
      const sr = Math.max(0, Math.min((spd - Uinf * 0.5) / (Uinf * 1.2), 1));
      if (col) {
        if (flowVisualMode === 'wind_tunnel') {
          const t = sr;
          col[i * 3] = 0.15 + t * 0.55;
          col[i * 3 + 1] = 0.55 + t * 0.35;
          col[i * 3 + 2] = 0.75 + t * 0.2;
        } else if (flowVisualMode === 'clean_vectors') {
          const t = 0.55 + sr * 0.45;
          col[i * 3] = t * 0.95;
          col[i * 3 + 1] = t * 0.97;
          col[i * 3 + 2] = t;
        } else {
          if (sr < 0.4) {
            const t = sr / 0.4;
            col[i * 3] = 0; col[i * 3 + 1] = t * 0.94; col[i * 3 + 2] = 1;
          } else {
            const t = (sr - 0.4) / 0.6;
            col[i * 3] = t; col[i * 3 + 1] = 0.94 * (1 - t); col[i * 3 + 2] = 1 - t;
          }
        }
      }

      if (isStreak && trail) {
        pushParticleTrail(i, trail, x, y, pos[i * 3 + 2]);
      }

      x += vx * dt; y += vy * dt;
      if (x > 3.5 || x < -3.5 || y > 2.0 || y < -2.0) {
        x = -3.0 - Math.random() * 0.5;
        y = -1.5 + Math.random() * 3.0;
        if (isStreak && trail) resetParticleTrail(i, trail, x, y, pos[i * 3 + 2]);
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    if (meshRef.current.geometry.attributes.color) meshRef.current.geometry.attributes.color.needsUpdate = true;

    if (isStreak && lineRef.current && trail) {
      const lp = lineRef.current.geometry.attributes.position.array;
      const lc = lineRef.current.geometry.attributes.color.array;
      let w = 0;
      const invTrail = 1 / Math.max(1, FLOW_TRAIL_LEN - 1);
      for (let i = 0; i < COUNT; i++) {
        const drawStreak = i % STREAK_DRAW_STRIDE === 0;
        for (let k = 0; k < FLOW_TRAIL_LEN - 1; k++) {
          const k0 = (i * FLOW_TRAIL_LEN + k) * 3;
          const k1 = (i * FLOW_TRAIL_LEN + k + 1) * 3;
          const ax = trail[k0], ay = trail[k0 + 1], az = trail[k0 + 2];
          const bx = trail[k1], by = trail[k1 + 1], bz = trail[k1 + 2];
          const seg = Math.hypot(bx - ax, by - ay);
          const fade = (0.2 + 0.8 * (1 - k * invTrail)) * (drawStreak ? 1 : 0);
          if (!drawStreak || seg > STREAK_MAX_SEG) {
            lp[w] = lp[w + 3] = bx;
            lp[w + 1] = lp[w + 4] = by;
            lp[w + 2] = lp[w + 5] = bz;
            lc[w] = lc[w + 1] = lc[w + 2] = lc[w + 3] = lc[w + 4] = lc[w + 5] = 0;
          } else {
            lp[w] = ax; lp[w + 1] = ay; lp[w + 2] = az;
            lp[w + 3] = bx; lp[w + 4] = by; lp[w + 5] = bz;
            const f0 = fade * 0.85, f1 = fade;
            lc[w] = 0.12 * f0; lc[w + 1] = 0.55 * f0; lc[w + 2] = 0.95 * f0;
            lc[w + 3] = 0.2 * f1; lc[w + 4] = 0.72 * f1; lc[w + 5] = 1 * f1;
          }
          w += 6;
        }
      }
      lineRef.current.geometry.attributes.position.needsUpdate = true;
      lineRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  const windTunnel = flowVisualMode === 'wind_tunnel';
  const cleanVec = flowVisualMode === 'clean_vectors';
  const ptOpacity = isActive
    ? windTunnel
      ? 0.55
      : cleanVec
        ? 0.5
        : isStreak
          ? 0.22
          : 0.75
    : 0;
  const ptSize = windTunnel ? 0.032 : cleanVec ? 1.15 : isStreak ? 1.35 : 2;
  const lineOpacity = isActive && isStreak ? 0.52 : 0;

  return (
    <>
      <points ref={meshRef} key={`pts-${particleCount}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
          {colors.current && <bufferAttribute attach="attributes-color" count={particleCount} array={colors.current} itemSize={3} />}
        </bufferGeometry>
        <pointsMaterial
          size={ptSize}
          vertexColors
          transparent
          opacity={ptOpacity}
          blending={windTunnel || cleanVec ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthWrite={false}
          depthTest
          sizeAttenuation={windTunnel}
        />
      </points>
      {isStreak && (
        <lineSegments ref={lineRef} key={`line-${particleCount}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={lineVertexCount} array={linePositions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={lineVertexCount} array={lineColors} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={lineOpacity} blending={THREE.AdditiveBlending} />
        </lineSegments>
      )}
    </>
  );
};


// ─── Airfoil Mesh (Real-Time Cp Heatmap) ──────────────────────────────────────
const AirfoilMesh = ({ points, showHeatmap, isSimulating, pitchAngle }) => {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    if (!points || points.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false });
    geo.center();

    // Initialize color buffer once
    const pos = geo.attributes.position.array;
    const col = new Float32Array(pos.length);
    for(let i=0; i < col.length; i++) col[i] = 1.0;
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    
    return geo;
  }, [points]);

  useFrame(() => {
    if (!showHeatmap || !geometry || !meshRef.current) return;
    
    const pos = geometry.attributes.position.array;
    const col = geometry.attributes.color.array;
    const vertCount = pos.length / 3;
    
    // Bounding box for normalized chord — computed once per frame
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < vertCount; i++) {
       const px = pos[i * 3];
       if (px < minX) minX = px;
       if (px > maxX) maxX = px;
    }
    const invChordLen = 1 / ((maxX - minX) || 1);
    const alpha = pitchAngle;
    const pRad = alpha * Math.PI / 180;

    // ── Hoisted invariants (saves thousands of recalculations) ──
    const sinPRad = Math.sin(pRad);
    const sinPRad_2_2 = sinPRad * 2.2;
    const absA = Math.abs(alpha);
    const isStallRegime = absA > 14;
    const sepIntensity = isStallRegime ? Math.min(1.0, (absA - 14) / 5.0) : 0;
    const oneMinusSepI = 1 - sepIntensity;
    const sepTarget = 0.95 * sepIntensity;
    const alphaPositive = alpha >= 0;
    const stagXPos = Math.min(0.08, alpha * 0.004);
    const stagXNeg = Math.min(0.08, -alpha * 0.004);
    const stallUpperCheck = alphaPositive;  // upper separates at positive alpha
    
    for (let i = 0; i < vertCount; i++) {
       const px = pos[i * 3], py = pos[i * 3 + 1];
       const xNorm = Math.max(0.001, Math.min(0.999, (px - minX) * invChordLen));
       const isUpper = py > 0;
       
       // 1. Circulation (Lift) term — sin(pRad) hoisted
       const gammaTerm = sinPRad_2_2 * Math.sqrt((1 - xNorm) / xNorm);
       // 2. Thickness term
       const thicknessTerm = 1.0 + 0.24 * Math.sin(Math.PI * (1 - xNorm));
       
       let Vnorm = 0;
       if (alphaPositive) {
           if (isUpper) {
              Vnorm = thicknessTerm + gammaTerm;
           } else {
              if (xNorm < stagXPos) {
                 Vnorm = xNorm / stagXPos;
              } else {
                 Vnorm = thicknessTerm - gammaTerm * 0.5;
              }
           }
       } else {
           if (!isUpper) {
              Vnorm = thicknessTerm - gammaTerm;
           } else {
              if (xNorm < stagXNeg) {
                 Vnorm = xNorm / stagXNeg;
              } else {
                 Vnorm = thicknessTerm + gammaTerm * 0.5;
              }
           }
       }
       
       // 3. Stall Separation — intensity pre-computed
       if (isStallRegime) {
          const surfMatch = isUpper ? stallUpperCheck : !stallUpperCheck;
          if (surfMatch && xNorm > 0.2) {
             Vnorm = Vnorm * oneMinusSepI + sepTarget;
          }
       }
       
       // Smooth trailing edge
       if (xNorm > 0.95) Vnorm = Vnorm * 0.7 + 0.3;
       
       // Cp = 1 - V²
       const cp = 1.0 - (Vnorm * Vnorm);
       
       let r, g, b;
       if (cp > 0) {
          r = Math.min(1, cp * 1.2 + 0.2); 
          g = Math.max(0, 0.8 - cp);
          b = 0;
       } else {
          const neg = Math.min(Math.abs(cp) * 0.25, 1);
          r = Math.max(0, neg - 0.7) * 3.0; 
          g = Math.max(0, 0.9 - neg * 1.5);
          b = Math.min(1, 0.4 + neg * 2.0);
       }
       
       col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    }
    
    geometry.attributes.color.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, -pitchAngle * Math.PI / 180]}>
      {showHeatmap
        ? <meshBasicMaterial vertexColors transparent opacity={1.0} />
        : <meshStandardMaterial color={isSimulating ? '#ec4899' : '#0ea5e9'} transparent opacity={0.75} roughness={0.2} metalness={0.8} />
      }
      {!showHeatmap && <Edges linewidth={1.5} color="#00f0ff" />}
    </mesh>
  );
};

// ─── Cinematic atmosphere: wake mist (speed) + wing condensation (lift) ───
/** ~Cl·q proxy for mist intensity (viewport-only, not CFD). */
const liftMistFactor = (pitchDeg, wind) => {
  const rad = pitchDeg * (Math.PI / 180);
  const q = Math.min(1.45, Math.pow(Math.max(8, wind) / 52, 1.15));
  const circ = Math.pow(Math.min(1, Math.abs(Math.sin(rad)) * 1.08), 1.45);
  const stallFade =
    Math.abs(pitchDeg) > 14 ? Math.max(0.2, 1 - (Math.abs(pitchDeg) - 14) * 0.09) : 1;
  return Math.min(1, circ * q * stallFade);
};

const windVaporFactor = (wind) => THREE.MathUtils.smoothstep(52, 165, wind);

const buildUpperCondensationPositions = (pts, layers = 4) => {
  if (!pts || pts.length < 8) return null;
  const half = Math.floor(pts.length / 2);
  const chain = pts.slice(0, half + 1);
  let cx = 0,
    cy = 0;
  for (const p of pts) {
    cx += p[0];
    cy += p[1];
  }
  cx /= pts.length;
  cy /= pts.length;
  const nStations = Math.min(56, Math.max(18, chain.length * 2));
  const positions = new Float32Array(nStations * layers * 3);
  let w = 0;
  for (let s = 0; s < nStations; s++) {
    const u = s / Math.max(1, nStations - 1);
    const idx = u * (chain.length - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, chain.length - 1);
    const t = idx - i0;
    const x = chain[i0][0] * (1 - t) + chain[i1][0] * t;
    const y = chain[i0][1] * (1 - t) + chain[i1][1] * t;
    let ox = x - cx,
      oy = y - cy;
    const ol = Math.hypot(ox, oy) || 1;
    ox /= ol;
    oy /= ol;
    for (let layer = 0; layer < layers; layer++) {
      const off = 0.005 + layer * 0.007;
      positions[w++] = x + ox * off;
      positions[w++] = y + oy * off;
      positions[w++] = ((s + layer) % 5) * 0.01 - 0.02;
    }
  }
  const colors = new Float32Array((w / 3) * 3);
  for (let i = 0; i < w / 3; i++) {
    colors[i * 3] = 0.88;
    colors[i * 3 + 1] = 0.93;
    colors[i * 3 + 2] = 1;
  }
  return { positions, colors, count: w / 3 };
};

const VaporWakeField = ({ windSpeed, pitchAngle, active }) => {
  const { lowPowerMode } = useAppContext();
  const meshRef = useRef();
  const matRef = useRef();
  const tRef = useRef(0);
  const count = lowPowerMode ? 420 : 820;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = -0.35 + Math.random() * 3.6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.45;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }
    return arr;
  }, [count]);
  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const h = 0.7 + Math.random() * 0.22;
      c[i * 3] = 0.65 + h * 0.15;
      c[i * 3 + 1] = 0.78 + h * 0.12;
      c[i * 3 + 2] = 0.95;
    }
    return c;
  }, [count]);

  useFrame((_, dt) => {
    if (!active || !meshRef.current) return;
    tRef.current += dt;
    const pos = meshRef.current.geometry.attributes.position.array;
    const U = 0.28 + (windSpeed / 50) * 0.95;
    const yaw = pitchAngle * (Math.PI / 180) * 0.28;
    const wob = tRef.current;
    for (let i = 0; i < count; i++) {
      let x = pos[i * 3],
        y = pos[i * 3 + 1],
        z = pos[i * 3 + 2];
      x += U * dt * (0.82 + 0.18 * Math.sin(wob * 1.4 + i * 0.13));
      y += dt * (Math.sin(wob * 2 + i * 0.61) * 0.055 - yaw * 0.1);
      z += dt * Math.cos(wob * 1.1 + i * 0.31) * 0.018;
      if (x > 3.65) {
        x = -0.55 - Math.random() * 0.45;
        y = (Math.random() - 0.5) * 1.45;
        z = (Math.random() - 0.5) * 0.12;
      }
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    if (matRef.current) {
      const wf = windVaporFactor(windSpeed);
      const pulse = 0.88 + 0.12 * Math.sin(wob * 0.85);
      matRef.current.opacity = wf * 0.38 * pulse * (lowPowerMode ? 0.72 : 1);
    }
  });

  const wf = windVaporFactor(windSpeed);
  if (!active || wf < 0.04) return null;

  return (
    <points ref={meshRef} renderOrder={1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={Math.min(0.055, 0.028 + (windSpeed / 300) * 0.028)}
        vertexColors
        transparent
        opacity={wf * 0.32}
        depthWrite={false}
        depthTest
        blending={THREE.NormalBlending}
        sizeAttenuation
      />
    </points>
  );
};

const WingCondensationMist = ({ points, pitchAngle, windSpeed, showHeatmap, active }) => {
  const { lowPowerMode } = useAppContext();
  const matRef = useRef();
  const tRef = useRef(0);
  const geo = useMemo(
    () => buildUpperCondensationPositions(points, lowPowerMode ? 3 : 4),
    [points, lowPowerMode]
  );
  const lift = useMemo(() => liftMistFactor(pitchAngle, windSpeed), [pitchAngle, windSpeed]);

  useFrame((_, dt) => {
    tRef.current += dt;
    if (!matRef.current || !active || !geo) return;
    const heat = showHeatmap ? 0.58 : 1;
    const breathe = 0.82 + 0.18 * Math.sin(tRef.current * 1.15 + lift * 2.5);
    matRef.current.opacity = Math.min(0.26, lift * 0.22 * heat * breathe);
  });

  if (!geo || !active) return null;

  return (
    <group rotation={[0, 0, (-pitchAngle * Math.PI) / 180]} renderOrder={4}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={geo.count} array={geo.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={geo.count} array={geo.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          ref={matRef}
          size={0.034}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

// ─── Camera Tracker ───────────────────────────────────────────────────────────
const CameraTracker = ({ setCameraStr, cameraMode, setCameraMode, snapRef, turntableActive }) => {
  const { camera, controls } = useThree();
  useEffect(()=>{
    snapRef.current=(view)=>{
      if (!controls) return;
      const d=camera.position.distanceTo(controls.target), t=controls.target;
      const map={front:[t.x,t.y,t.z+d],right:[t.x+d,t.y,t.z],top:[t.x,t.y+d,t.z],'neg-front':[t.x,t.y,t.z-d],'neg-right':[t.x-d,t.y,t.z],'neg-top':[t.x,t.y-d,t.z]};
      if (map[view]) { camera.position.set(...map[view]); controls.update(); }
    };
  },[camera,controls,snapRef]);

  useFrame((_,delta)=>{
    if (!controls) return;
    if (turntableActive) { camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),delta*0.4); controls.update(); }
    const dx=camera.position.x-controls.target.x, dy=camera.position.y-controls.target.y, dz=camera.position.z-controls.target.z;
    const dist=Math.hypot(dx,dy,dz)||1;
    setCameraStr({elev:(Math.asin(dy/dist)*(180/Math.PI)).toFixed(1),azim:(Math.atan2(dx,dz)*(180/Math.PI)).toFixed(1),mode:cameraMode});
  });

  useEffect(()=>{
    const kd=(e)=>{
      if (!controls) return;
      const d=camera.position.distanceTo(controls.target), t=controls.target;
      switch(e.code){
        case 'Numpad5': case 'Digit5': setCameraMode(p=>p==='PERSPECTIVE'?'ORTHOGRAPHIC':'PERSPECTIVE'); break;
        case 'Numpad1': case 'Digit1': camera.position.set(t.x,t.y,t.z+d); controls.update(); break;
        case 'Numpad3': case 'Digit3': camera.position.set(t.x+d,t.y,t.z); controls.update(); break;
        case 'Numpad7': case 'Digit7': camera.position.set(t.x,t.y+d,t.z); controls.update(); break;
        case 'Numpad9': case 'Digit9': { const o=camera.position.clone().sub(t).negate(); camera.position.copy(t).add(o); controls.update(); break; }
        case 'NumpadDecimal': case 'Period': controls.target.set(0,0,0); controls.update(); break;
        default: break;
      }
    };
    window.addEventListener('keydown',kd);
    return ()=>window.removeEventListener('keydown',kd);
  },[camera,controls,setCameraMode]);
  return null;
};

// ─── Viewport Button ──────────────────────────────────────────────────────────
const VBtn = React.memo(({label,active,disabled,onClick,color='#00f0ff'})=>(
  <button onClick={onClick} disabled={disabled} style={{fontFamily:'monospace',fontSize:'10px',fontWeight:'bold',letterSpacing:'0.1em',padding:'5px 11px',borderRadius:6,cursor:disabled?'not-allowed':'pointer',border:`1px solid ${active?color:'rgba(255,255,255,0.12)'}`,background:active?`${color}18`:'rgba(0,0,0,0.55)',color:active?color:'rgba(255,255,255,0.45)',boxShadow:active?`0 0 14px ${color}33, inset 0 0 8px ${color}0a`:'none',transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.3s',backdropFilter:'blur(6px)',opacity:disabled?0.35:1,willChange:'transform',transform:'translateZ(0)'}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.transform='translateY(-1px)'}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'}} onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform='scale(0.97)'}} onMouseUp={e=>{if(!disabled)e.currentTarget.style.transform='translateY(-1px)'}}>
    {label}
  </button>
));




const SimulationView = ({
  isSimulating,
  activeShape,
  pitchAngle = 0,
  windSpeed = 50,
  airfoilPoints = null,
  flowActive = false,
  onFlowToggle,
  autotunePhase = 'idle',
  autotuneProgress = null,
  onAutotune,
  onAutotuneCancel,
  autotunePreview = null,
  autotuneResult = null,
  goldenLiftActive = false,
  aeroFactsActive = false,
  onAeroFactsToggle,
  positiveStallAngle = null,
  negativeStallAngle = null,
  isPreview = false,
}) => {
  const [cameraMode, setCameraMode] = useState('PERSPECTIVE');
  const [cameraStr, setCameraStr]   = useState({elev:'28.0',azim:'-55.0',mode:'PERSPECTIVE'});
  const [showHeatmap, setShowHeatmap]     = useState(false);
  const [turntableActive, setTurntable]   = useState(false);
  const [showMenu, setShowMenu]           = useState(false);
  const snapRef = useRef(null);
  const handleSnap = useCallback((v)=>{ if(snapRef.current) snapRef.current(v); },[]);

  const hasShape = !!activeShape||!!airfoilPoints;
  const displayPitch = autotunePreview?.pitchAngle ?? pitchAngle;
  const airfoilPts =
    autotunePreview?.airfoilData ?? airfoilPoints ?? activeShape?.airfoilData ?? null;
  const displayTargetName = autotunePreview?.name ?? (airfoilPoints ? 'IMPORTED AIRFOIL' : activeShape?.name) ?? 'NONE';
  const autotuneBusy = autotunePhase === 'running';

  return (
    <div className="relative w-full h-full min-h-[400px] glass-panel flex flex-col items-center justify-center overflow-hidden" style={{willChange:'transform',transform:'translateZ(0)'}}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50 z-0 pointer-events-none"/>

      {/* Top Left — Active target + AUTOTUNE */}
      {!isPreview && (
        <div className="absolute top-4 left-6 right-6 z-10 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-[var(--color-brand-100)] uppercase mt-2">Active Target</h2>
            <div className="text-xs text-[var(--color-accent-blue)] font-mono mt-1 flex flex-wrap items-center gap-2">
              <span className="max-w-[200px] truncate">{displayTargetName}</span>
              {goldenLiftActive && !autotuneBusy && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-200 border border-amber-400/40 shadow-[0_0_12px_rgba(234,179,8,0.35)]">
                  <Sparkles size={11} className="text-amber-300" /> Golden
                </span>
              )}
              <span className={`w-2 h-2 rounded-full shrink-0 ${isSimulating || autotuneBusy ? 'bg-[var(--color-accent-pink)] animate-pulse shadow-[0_0_10px_var(--color-accent-pink)]' : 'bg-transparent'}`}/>
            </div>
          </div>
        </div>
      )}

      {!isPreview && <ViewportGizmo cameraStr={cameraStr} onSnapView={handleSnap}/>}
      {!isPreview && <AoAGauge pitchAngle={displayPitch} positiveStallAngle={positiveStallAngle} negativeStallAngle={negativeStallAngle} />}

      {autotuneBusy && autotuneProgress && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] pointer-events-auto">
          <div className="w-[min(92%,420px)] rounded-xl border border-cyan-500/30 bg-brand-900/90 p-5 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs uppercase tracking-widest mb-3">
              <span className="inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Scanning…
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-[width] duration-150 ease-out"
                style={{ width: `${(autotuneProgress.index / Math.max(1, autotuneProgress.total)) * 100}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-brand-200 leading-relaxed min-h-[2.5rem]">{autotuneProgress.message}</p>
            {onAutotuneCancel && (
              <button
                type="button"
                onClick={onAutotuneCancel}
                className="mt-4 w-full py-2 rounded-lg border border-white/15 text-xs font-mono uppercase tracking-wider text-brand-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {autotunePhase === 'success' && autotuneResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl border-2 border-amber-400/60 bg-black/75 px-8 py-6 text-center shadow-[0_0_50px_rgba(234,179,8,0.35)]">
            <div className="flex justify-center mb-2 text-amber-300">
              <Sparkles size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-mono font-bold uppercase tracking-[0.2em] text-amber-100 mb-1">Golden Airfoil</h3>
            <p className="text-xs font-mono text-brand-300 mb-2">{autotuneResult.label}</p>
            <p className="text-sm font-mono text-[var(--color-accent-neon)]">
              Cl <span className="text-white font-bold">{autotuneResult.cl.toFixed(4)}</span>
              <span className="text-brand-500 mx-2">@</span>
              {autotuneResult.aoa}° AoA
            </p>
          </div>
        </div>
      )}





      {/* Toolbar bottom-left */}
      {!isPreview && (
        <div style={{position:'absolute',bottom:16,left:16,zIndex:20,display:'flex',gap:8,alignItems:'flex-end'}}>
          
          <div className="relative">
            {showMenu && (
              <div className="absolute bottom-full mb-3 left-0 flex flex-col gap-2 p-3 bg-brand-900/90 border border-white/10 rounded-xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] min-w-[140px]">
                <VBtn label="⬡ HEATMAP" active={showHeatmap} disabled={!hasShape} onClick={()=>setShowHeatmap(p=>!p)} color="#ff6600"/>
                <VBtn label="⟳ TURNTABLE" active={turntableActive} disabled={!hasShape} onClick={()=>setTurntable(p=>!p)} color="#a78bfa"/>
                {onAutotune && (
                  <>
                    <button
                      type="button"
                      onClick={() => { onAutotune('light'); setShowMenu(false); }}
                      disabled={!hasShape || autotuneBusy}
                      className="pointer-events-auto group relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-all disabled:opacity-35 disabled:cursor-not-allowed border border-amber-400/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 hover:border-amber-300/80 shadow-[0_0_12px_rgba(234,179,8,0.15)] backdrop-blur-sm w-full"
                      title="Quickly test ~30 basic airfoils"
                    >
                      <Sparkles size={13} className="text-amber-300 group-hover:scale-110 transition-transform" />
                      FAST TUNE
                    </button>
                    <button
                      type="button"
                      onClick={() => { onAutotune('heavy'); setShowMenu(false); }}
                      disabled={!hasShape || autotuneBusy}
                      className="pointer-events-auto group relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-md font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-all disabled:opacity-35 disabled:cursor-not-allowed border border-amber-400/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 hover:border-amber-300/80 shadow-[0_0_12px_rgba(234,179,8,0.15)] backdrop-blur-sm w-full"
                      title="Deep search of over 140 NACA permutations"
                    >
                      <Sparkles size={13} className="text-amber-300 group-hover:scale-110 transition-transform" />
                      DEEP SCAN
                    </button>
                  </>
                )}
                {onAeroFactsToggle && (
                  <button
                    onClick={() => { onAeroFactsToggle(); setShowMenu(false); }}
                    className={`learn-mode-btn ${aeroFactsActive ? 'active' : 'inactive'} w-full !py-2`}
                  >
                    {aeroFactsActive ? '💡 LEARN ON' : '💡 LEARN'}
                  </button>
                )}
              </div>
            )}
            
            <VBtn 
              label={
                <div className="flex flex-col items-center justify-center gap-[3px] w-[14px] h-[14px]">
                  <div className="w-[14px] h-[2px] bg-current rounded-sm" />
                  <div className="w-[14px] h-[2px] bg-current rounded-sm" />
                  <div className="w-[14px] h-[2px] bg-current rounded-sm" />
                </div>
              }
              active={showMenu}
              onClick={() => setShowMenu(!showMenu)}
              color="#ffffff"
            />
          </div>

          <VBtn label={flowActive?'⏸ PAUSE FLOW':'▶ START FLOW'} active={flowActive} disabled={!hasShape} onClick={onFlowToggle} color="#00f0ff"/>
        </div>
      )}

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 cursor-crosshair">
        <Canvas>
          {cameraMode==='PERSPECTIVE'
            ?<PerspectiveCamera makeDefault position={[3,2,4]} fov={28}/>
            :<OrthographicCamera makeDefault position={[3,2,4]} zoom={120} near={-100} far={100}/>
          }
          <ambientLight intensity={0.5}/>
          <directionalLight position={[10,10,5]} intensity={1}/>
          <OrbitControls target={[0,0,0]} enableDamping dampingFactor={0.12} maxDistance={100} minDistance={0.1} enablePan makeDefault/>
          <CameraTracker setCameraStr={setCameraStr} cameraMode={cameraMode} setCameraMode={setCameraMode} snapRef={snapRef} turntableActive={turntableActive}/>

          <group rotation={[-Math.PI/2,0,0]}>
            {airfoilPts && (
              <VaporWakeField windSpeed={windSpeed} pitchAngle={displayPitch} active={hasShape} />
            )}
            {/* Fluid Particles — tied to flowActive, NOT isSimulating → no orbit bug */}
            <FlowParticles isActive={flowActive} windSpeed={windSpeed} pitchAngle={displayPitch} airfoilPts={airfoilPts} />

            {airfoilPts && (
              <AirfoilMesh points={airfoilPts} showHeatmap={showHeatmap} isSimulating={isSimulating || autotuneBusy} pitchAngle={displayPitch} />
            )}
            {airfoilPts && (
              <WingCondensationMist
                points={airfoilPts}
                pitchAngle={displayPitch}
                windSpeed={windSpeed}
                showHeatmap={showHeatmap}
                active={hasShape}
              />
            )}

            {!hasShape && !isPreview && (
              <Text position={[0,0,0]} rotation={[Math.PI/2,0,0]} color="#64748b" fontSize={0.1} anchorX="center" anchorY="middle">Empty Workspace</Text>
            )}
          </group>
        </Canvas>
      </div>
    </div>
  );
};

export default SimulationView;
