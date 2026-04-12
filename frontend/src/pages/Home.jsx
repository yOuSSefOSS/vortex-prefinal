import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import ShapeCard from '../components/ShapeCard';
import ControlSlider from '../components/ControlSlider';
import SimulationView from '../components/SimulationView';
import DataChart from '../components/DataChart';
import PolarChart from '../components/PolarChart';
import AeroFactsPanel from '../components/AeroFactsPanel';
import { Box, Circle, Upload, Mountain, Globe, Wind, Layers } from 'lucide-react';

// ─── Generic NACA 4-digit coordinate generator ───────────────────────────────
const computeNACA = (m, p, t, N = 60) => {
  const upper = [], lower = [];
  for (let i = 0; i <= N; i++) {
    const x = (1 - Math.cos(Math.PI * i / N)) / 2;
    const xn = Math.max(0, x);
    const yt = 5 * t * (0.2969 * Math.sqrt(xn + 1e-9) - 0.126 * xn - 0.3516 * xn ** 2 + 0.2843 * xn ** 3 - 0.1015 * xn ** 4);
    let yc, dyc;
    if (m === 0 || p === 0) {
      yc = 0; dyc = 0; // symmetric airfoil
    } else if (xn < p) {
      yc = (m / p ** 2) * (2 * p * xn - xn ** 2);
      dyc = (2 * m / p ** 2) * (p - xn);
    } else {
      yc = (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * xn - xn ** 2);
      dyc = (2 * m / (1 - p) ** 2) * (p - xn);
    }
    const theta = Math.atan(dyc);
    upper.push([xn - yt * Math.sin(theta) - 0.5, yc + yt * Math.cos(theta)]);
    lower.push([xn + yt * Math.sin(theta) - 0.5, yc - yt * Math.cos(theta)]);
  }
  return [...upper, ...lower.slice(1).reverse()];
};

const NACA4412_POINTS = computeNACA(0.04, 0.4, 0.12);
const NACA0012_POINTS = computeNACA(0, 0, 0.12);

// ─── Environment presets ──────────────────────────────────────────────────────
const ENV_PRESETS = {
  standard: { label:'Standard Air', sublabel:'Earth Sea Level', icon:<Globe size={13}/>, density:1.225, windSpeed:50,  particleCount:1000, color:'#00f0ff' },
  highAlt:  { label:'High Altitude', sublabel:'Upper Troposphere', icon:<Mountain size={13}/>, density:0.414, windSpeed:80, particleCount:500,  color:'#a78bfa' },
};

// ─── Shapes library ───────────────────────────────────────────────────────────
const SHAPES = [
  { id:'naca4412', name:'NACA 4412', type:'Airfoil · Cambered',   icon:<Wind size={18}/>,   airfoilData: NACA4412_POINTS },
  { id:'naca0012', name:'NACA 0012', type:'Airfoil · Symmetric',  icon:<Layers size={18}/>, airfoilData: NACA0012_POINTS },
];

// ─── Aerodynamic coefficient model ────────────────────────────────────────────
// Per-airfoil parameters from published wind-tunnel data:
//   NACA 4412: α₀ = -4°, Cl_max ≈ 1.5 at α_stall ≈ 14°, Cd_min ≈ 0.006
//   NACA 0012: α₀ =  0°, Cl_max ≈ 1.6 at α_stall ≈ 16°, Cd_min ≈ 0.006  (symmetric)
const AIRFOIL_PARAMS = {
  naca4412: { alpha0: -4, clAlpha: 0.11, stallPos: 14, stallNeg: -12, clMax: 1.5, cdMin: 0.006, k: 0.004 },
  naca0012: { alpha0:  0, clAlpha: 0.11, stallPos: 16, stallNeg: -16, clMax: 1.6, cdMin: 0.006, k: 0.004 },
  imported: { alpha0:  0, clAlpha: 0.11, stallPos: 15, stallNeg: -15, clMax: 1.5, cdMin: 0.008, k: 0.005 },
};

const calculateAerodynamics = (shapeId, isAirfoil, alpha) => {
  alpha = parseFloat(alpha) || 0;

  if (isAirfoil || shapeId === 'naca4412' || shapeId === 'naca0012') {
    const params = AIRFOIL_PARAMS[shapeId] || AIRFOIL_PARAMS.imported;
    const { alpha0, clAlpha, stallPos, stallNeg, clMax, cdMin, k } = params;

    // ── Linear (attached-flow) region ──
    let cl = clAlpha * (alpha - alpha0);
    // Induced-drag parabola: Cd = Cd_min + k·(Cl)²  (drag polar)
    let cd = cdMin + k * cl * cl;

    // ── Positive stall ──
    if (alpha > stallPos) {
      const excess = alpha - stallPos;
      // Cl drops roughly linearly past stall, then levels toward ~0.6
      const clAtStall = clAlpha * (stallPos - alpha0);
      cl = Math.max(0.15, clAtStall - excess * 0.08);
      // Cd rises sharply (separated flow)
      cd = cdMin + k * clAtStall * clAtStall + 0.015 * Math.pow(excess, 1.6);
    }
    // ── Negative stall ──
    else if (alpha < stallNeg) {
      const excess = Math.abs(alpha - stallNeg);
      const clAtStall = clAlpha * (stallNeg - alpha0);
      cl = Math.min(-0.15, clAtStall + excess * 0.08);
      cd = cdMin + k * clAtStall * clAtStall + 0.015 * Math.pow(excess, 1.6);
    }

    // Deep stall / very high AoA → flat-plate drag dominates
    if (Math.abs(alpha) > 35) {
      cd = Math.max(cd, 1.2 * Math.pow(Math.sin((alpha * Math.PI) / 180), 2));
    }

    return { cl: Number(cl.toFixed(4)), cd: Number(cd.toFixed(4)) };
  }

  return { cl: 0, cd: 0 };
};

/** Per-NACA params for empirical autotune (when NeuralFoil is off). */
const nacaParamsFromDigits = (m, p, t) => ({
  alpha0: m < 1e-8 ? 0 : -2.5 - m * 55 * Math.max(0.15, p),
  clAlpha: 0.1 + m * 0.95 + Math.max(0, 0.14 - t) * 0.35,
  stallPos: 14 + m * 18 - Math.abs(t - 0.12) * 38 + Math.abs(p - 0.4) * 4,
  stallNeg: -13 - m * 8,
  clMax: 1.4 + m * 0.45,
  cdMin: 0.0055 + t * 0.028,
  k: 0.004 + m * 0.0015,
});

const calculateAerodynamicsWithParams = (params, alpha) => {
  const { alpha0, clAlpha, stallPos, stallNeg, cdMin, k } = params;
  let cl = clAlpha * (alpha - alpha0);
  let cd = cdMin + k * cl * cl;
  if (alpha > stallPos) {
    const excess = alpha - stallPos;
    const clAtStall = clAlpha * (stallPos - alpha0);
    cl = Math.max(0.15, clAtStall - excess * 0.08);
    cd = cdMin + k * clAtStall * clAtStall + 0.015 * Math.pow(excess, 1.6);
  } else if (alpha < stallNeg) {
    const excess = Math.abs(alpha - stallNeg);
    const clAtStall = clAlpha * (stallNeg - alpha0);
    cl = Math.min(-0.15, clAtStall + excess * 0.08);
    cd = cdMin + k * clAtStall * clAtStall + 0.015 * Math.pow(excess, 1.6);
  }
  if (Math.abs(alpha) > 35) {
    cd = Math.max(cd, 1.2 * Math.pow(Math.sin((alpha * Math.PI) / 180), 2));
  }
  return { cl: Number(cl.toFixed(4)), cd: Number(cd.toFixed(4)) };
};

/** Coarse NACA 4-digit grid (~147) — balances coverage vs UI responsiveness. */
function* iterateNACA4DigitCandidates(mode = 'light') {
  const isDeep = mode === 'heavy';
  const tList = isDeep ? [8, 10, 12, 14, 16, 18, 20] : [10, 12, 15];
  for (const td of tList) {
    const t = td / 100;
    yield { m: 0, p: isDeep ? 0.4 : 4, t, label: `NACA 00${String(td).padStart(2, '0')}` };
  }
  const mDigits = isDeep ? [1, 3, 5, 7, 9] : [2, 4, 6];
  const pDigits = isDeep ? [2, 4, 6, 8] : [3, 4, 5];
  for (const md of mDigits) {
    for (const pd of pDigits) {
      for (const td of tList) {
        yield {
          m: md / 100,
          p: pd / 10,
          t: td / 100,
          label: `NACA ${md}${pd}${String(td).padStart(2, '0')}`,
        };
      }
    }
  }
}

const buildAlphaList = (bounds) => {
  const out = [];
  for (let a = bounds.min; a <= bounds.max; a++) out.push(a);
  return out;
};

// ─── Parse .dat airfoil ───────────────────────────────────────────────────────
const parseAirfoilDat = (text) => {
  const points = [];
  for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
    if (line.startsWith('#')||isNaN(parseFloat(line.split(/\s+/)[0]))) continue;
    const parts=line.split(/[\s,]+/);
    if (parts.length>=2) {
      const x=parseFloat(parts[0]), y=parseFloat(parts[1]);
      if (!isNaN(x)&&!isNaN(y)) points.push([x,y]);
    }
  }
  if (points.length<3) return null;
  const minX=Math.min(...points.map(p=>p[0])), maxX=Math.max(...points.map(p=>p[0]));
  const chord=(maxX-minX)||1;
  return points.map(([x,y])=>[(x-minX)/chord-0.5, y/chord]);
};

// ─── Preset Button ────────────────────────────────────────────────────────────
const PresetButton = ({ preset, active, onClick }) => (
  <button
    onClick={onClick}
    className={`${preset.shape} group transition-all duration-300 relative flex items-center justify-between p-4 w-full cursor-pointer overflow-hidden border-l-4`}
    style={{
      background: active ? `${preset.color}20` : 'rgba(255,255,255,0.03)',
      borderLeftColor: preset.color,
      borderTop: 'none', borderRight: 'none', borderBottom: 'none',
      opacity: active ? 1 : 0.6,
      height: '52px'
    }}
  >
    <div className="flex flex-col items-start gap-0.5">
      <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase" style={{color: active ? preset.color : 'white'}}>
        {preset.icon} {preset.label}
      </span>
      <span className="text-[9px] opacity-60 font-mono">{preset.sublabel}</span>
    </div>
    <div className="text-right">
       <span className="text-[10px] font-mono opacity-80" style={{color: preset.color}}>ρ {preset.density}</span>
    </div>
  </button>
);

// ─── Home ─────────────────────────────────────────────────────────────────────
const Home = () => {
  const [activeShapeId, setActiveShapeId] = useState(null);
  const [windSpeed,     setWindSpeed]     = useState(50);
  const [pitchAngle,    setPitchAngle]    = useState(0);
  const [isSimulating,  setIsSimulating]  = useState(false);
  const [chartData,     setChartData]     = useState([]);
  
  // Custom Airfoils State via Context
  const {
    useNeuralFoil,
    units,
    audioVolume,
    soundPreset,
    graphBounds,
    customAirfoils,
    setCustomAirfoils,
    setLastSimulationData,
    setActiveShapeIdGlobal,
    goldenLiftActive,
    setGoldenLiftActive,
  } = useAppContext();

  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingAirfoil, setPendingAirfoil] = useState(null);
  const [pendingAirfoilName, setPendingAirfoilName] = useState('');

  const [activePreset,  setActivePreset]  = useState('standard');
  const [density,       setDensity]       = useState(1.225);
  const [importError,   setImportError]   = useState('');
  const [flowActive,    setFlowActive]    = useState(false);
  const [aeroFactsActive, setAeroFactsActive] = useState(false);
  const fileInputRef = useRef(null);

  const [autotunePhase, setAutotunePhase] = useState('idle');
  const [autotuneProgress, setAutotuneProgress] = useState(null);
  const [autotunePreview, setAutotunePreview] = useState(null);
  const [autotuneResult, setAutotuneResult] = useState(null);
  const autotuneAbortRef = useRef(false);
  const autotuneAbortControllerRef = useRef(null);
  const autotuneLockRef = useRef(false);
  const suppressGoldenClear = useRef(false);

  const ALL_SHAPES = [...SHAPES, ...customAirfoils];
  const activeShape = ALL_SHAPES.find(s=>s.id===activeShapeId);
  const hasTarget = !!activeShape;

  // Compute both positive and negative stall angles from chart data
  const { positiveStallAngle, negativeStallAngle } = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return { positiveStallAngle: null, negativeStallAngle: null };
    let maxCl = -Infinity, minCl = Infinity;
    let posAoA = null, negAoA = null;
    for (const d of chartData) {
      if (d.cl > maxCl) { maxCl = d.cl; posAoA = d.aoa; }
      if (d.cl < minCl) { minCl = d.cl; negAoA = d.aoa; }
    }
    // Only report a negative stall if the Cl actually goes negative (real negative stall)
    return {
      positiveStallAngle: posAoA,
      negativeStallAngle: minCl < -0.1 ? negAoA : null
    };
  }, [chartData]);

  // Derive legacy stallAngle for chart reference line (positive stall)
  const stallAngle = positiveStallAngle;

  // Stall state — fires only when STRICTLY past the stall boundary, not at it
  const isStalling = React.useMemo(() => {
    if (positiveStallAngle === null) return false;
    if (pitchAngle > positiveStallAngle) return true;
    if (negativeStallAngle !== null && pitchAngle < negativeStallAngle) return true;
    return false;
  }, [pitchAngle, positiveStallAngle, negativeStallAngle]);

  // Stall point coordinates on the polar (Cd, Cl at stall AoA)
  const stallPoint = React.useMemo(() => {
    if (!positiveStallAngle || !chartData.length) return { cd: null, cl: null };
    const pt = chartData.find(d => d.aoa === positiveStallAngle);
    return pt ? { cd: pt.cd, cl: pt.cl } : { cd: null, cl: null };
  }, [positiveStallAngle, chartData]);

  // Audio Alarm Effect on stall threshold crossover
  useEffect(() => {
    let timeoutId;
    let isActive = true;
    let step = 0;
    
    // Rhythm pattern: [duration_on_ms, duration_off_ms]
    // Standard aviation stall warning pattern: Intense repetitive bursts
    const rhythm = [
      [200, 100], 
      [200, 100], 
      [500, 200]
    ];

    const playAlarm = () => {
       if (!isActive || !isStalling) return;
       
       const [onTime, offTime] = rhythm[step % rhythm.length];
       
       try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const masterGain = audioCtx.createGain();
          masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
          masterGain.gain.linearRampToValueAtTime((audioVolume / 100) * 0.25, audioCtx.currentTime + 0.05);
          masterGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (onTime / 1000));
          masterGain.connect(audioCtx.destination);

          if (soundPreset === 'siren') {
            // --- Aviation Siren (High Pitch) ---
            const osc1 = audioCtx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
            const osc2 = audioCtx.createOscillator();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(885, audioCtx.currentTime);
            osc1.connect(masterGain);
            osc2.connect(masterGain);
            osc1.start(); osc2.start();
            osc1.stop(audioCtx.currentTime + (onTime / 1000));
            osc2.stop(audioCtx.currentTime + (onTime / 1000));

          } else if (soundPreset === 'sonar') {
            // --- Sonar Pulse (Sine) ---
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + (onTime / 1000));

          } else {
            // --- Industrial Horn (Default) ---
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
            
            const osc1 = audioCtx.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(400, audioCtx.currentTime);
            
            const osc2 = audioCtx.createOscillator();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(202, audioCtx.currentTime);
            
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(masterGain);
            
            osc1.start(); osc2.start();
            osc1.stop(audioCtx.currentTime + (onTime / 1000));
            osc2.stop(audioCtx.currentTime + (onTime / 1000));
          }

       } catch(e) { 
         console.warn("Audio Context failed:", e);
       }
       
       step++;
       timeoutId = setTimeout(playAlarm, onTime + offTime);
    };

    if (isStalling) {
       playAlarm();
    }
    
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [pitchAngle, isStalling, audioVolume, soundPreset]);

  // Live aerodynamic values from NeuralFoil Chart Data
  const currentAeroItem = chartData.find(d => d.aoa === pitchAngle) || { cl: 0, cd: 0 };
  const currentForce = {
    lift: 0.5 * density * Math.pow(windSpeed, 2) * currentAeroItem.cl * 1,
    drag: 0.5 * density * Math.pow(windSpeed, 2) * currentAeroItem.cd * 1
  };

  const applyPreset = (key) => {
    const p=ENV_PRESETS[key];
    setActivePreset(key); setDensity(p.density);
    setWindSpeed(p.windSpeed);
  };

  const handleFileUpload = (e) => {
    const file=e.target.files[0]; if (!file) return;
    setImportError('');
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const pts=parseAirfoilDat(ev.target.result);
      if (!pts) { setImportError('Could not parse. Ensure X Y coordinate pairs per line.'); return; }
      setPendingAirfoil(pts);
      setPendingAirfoilName(file.name.replace(/\.[^.]+$/,'').toUpperCase());
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value='';
  };

  const addCustomAirfoil = () => {
    const newShape = {
      id: `custom-${Date.now()}`,
      name: pendingAirfoilName || 'CUSTOM AIRFOIL',
      type: 'Airfoil · Imported',
      icon: 'box',
      airfoilData: pendingAirfoil
    };
    setCustomAirfoils(prev => [...prev, newShape]);
    setActiveShapeId(newShape.id);
    setShowImportModal(false);
    setPendingAirfoil(null);
    setPendingAirfoilName('');
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setPendingAirfoil(null);
    setPendingAirfoilName('');
  };

  const handleShapeClick = (id) => {
    setActiveShapeId(id);
    setActiveShapeIdGlobal(id);
    setFlowActive(false);
  };

  useEffect(() => {
    if (suppressGoldenClear.current) return;
    setGoldenLiftActive(false);
  }, [pitchAngle, activeShapeId, setGoldenLiftActive]);

  const fetchNeuralPolar = async (points, alphaList, re, signal, modelSize = 'large') => {
    const res = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alpha: alphaList, Re: re, mach: 0, points, modelSize }),
      signal,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!Array.isArray(data)) throw new Error('Invalid polar');
    return data;
  };

  const runAutotune = useCallback(async (mode = 'light') => {
    if (autotuneLockRef.current || !hasTarget) return;
    autotuneLockRef.current = true;
    setFlowActive(false);
    setAutotunePhase('running');
    setAutotuneResult(null);
    setGoldenLiftActive(false);
    autotuneAbortRef.current = false;
    autotuneAbortControllerRef.current?.abort();
    const controller = new AbortController();
    autotuneAbortControllerRef.current = controller;

    const candidates = [...iterateNACA4DigitCandidates(mode)];
    const total = candidates.length;
    const alphaList = buildAlphaList(graphBounds);
    const reynolds = (windSpeed * density) / 1.5e-5;

    let bestCl = -Infinity;
    let bestAoa = graphBounds.min;
    let bestLabel = '';
    let bestPoints = null;

    try {
      for (let i = 0; i < candidates.length; i++) {
        if (autotuneAbortRef.current) break;
        const c = candidates[i];
        const points = computeNACA(c.m, c.p, c.t);
        setAutotunePreview({ airfoilData: points, name: c.label, pitchAngle: graphBounds.min });
        setAutotuneProgress({
          index: i + 1,
          total,
          message: `Testing ${c.label} at sweep ${graphBounds.min}°…${graphBounds.max}° (${i + 1} / ${total})`,
        });

        let polar;
        if (useNeuralFoil) {
          try {
            const nfModelSize = mode === 'heavy' ? 'xxxlarge' : 'large';
            polar = await fetchNeuralPolar(points, alphaList, reynolds, controller.signal, nfModelSize);
          } catch {
            const params = nacaParamsFromDigits(c.m, c.p, c.t);
            polar = alphaList.map((aoa) => ({
              aoa,
              ...calculateAerodynamicsWithParams(params, aoa),
            }));
          }
        } else {
          const params = nacaParamsFromDigits(c.m, c.p, c.t);
          polar = alphaList.map((aoa) => ({
            aoa,
            ...calculateAerodynamicsWithParams(params, aoa),
          }));
        }

        for (const row of polar) {
          const aoa = row.aoa;
          const cl = Number(row.cl);
          if (aoa >= graphBounds.min && aoa <= graphBounds.max && cl > bestCl) {
            bestCl = cl;
            bestAoa = aoa;
            bestLabel = c.label;
            bestPoints = points;
          }
        }

        const rowBest = polar.reduce((a, b) => (Number(b.cl) > Number(a.cl) ? b : a), polar[0]);
        setAutotunePreview({
          airfoilData: points,
          name: c.label,
          pitchAngle: rowBest.aoa,
        });

        await new Promise((r) => setTimeout(r, 0));
      }

      if (autotuneAbortRef.current) {
        setAutotunePhase('idle');
        setAutotunePreview(null);
        setAutotuneProgress(null);
        return;
      }

      if (!bestPoints || bestCl === -Infinity) {
        setAutotunePhase('idle');
        setAutotunePreview(null);
        setAutotuneProgress(null);
        return;
      }

      const id = `golden-autotune-${Date.now()}`;
      const roundedAoA = Math.round(bestAoa);
      const shape = {
        id,
        name: `★ GOLDEN · ${bestLabel}`,
        type: 'Airfoil · Autotune',
        icon: 'sparkles',
        airfoilData: bestPoints,
      };
      suppressGoldenClear.current = true;
      setCustomAirfoils((prev) => [...prev.filter((s) => !String(s.id).startsWith('golden-autotune-')), shape]);
      setActiveShapeId(id);
      setActiveShapeIdGlobal(id);
      setPitchAngle(roundedAoA);
      setAutotunePreview(null);
      setAutotuneProgress(null);
      setAutotuneResult({ label: bestLabel, cl: bestCl, aoa: roundedAoA });
      setAutotunePhase('success');
      setGoldenLiftActive(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          suppressGoldenClear.current = false;
        });
      });
      window.setTimeout(() => {
        setAutotunePhase('idle');
        setAutotuneResult(null);
      }, 3200);
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Autotune:', e);
      setAutotunePhase('idle');
      setAutotunePreview(null);
      setAutotuneProgress(null);
    } finally {
      autotuneAbortControllerRef.current = null;
      autotuneLockRef.current = false;
    }
  }, [
    hasTarget,
    graphBounds,
    windSpeed,
    density,
    useNeuralFoil,
    setCustomAirfoils,
    setActiveShapeIdGlobal,
    setGoldenLiftActive,
  ]);

  const handleAutotuneCancel = useCallback(() => {
    autotuneAbortRef.current = true;
    autotuneAbortControllerRef.current?.abort();
    setAutotunePhase('idle');
    setAutotunePreview(null);
    setAutotuneProgress(null);
    autotuneLockRef.current = false;
  }, []);

  // Chart and Aerodynamic Calculations utilizing NeuralFoil backend API or Empirical Math
  useEffect(()=>{
    if (!hasTarget || !activeShape) return;
    let isMounted = true;
    setIsSimulating(true);

    const isCustomAirfoil = !['naca4412', 'naca0012'].includes(activeShapeId);

    if (!useNeuralFoil) {
      setTimeout(() => {
        if (isMounted) {
          const newData = [];
          for (let a = graphBounds.min; a <= graphBounds.max; a++) {
            const { cl, cd } = calculateAerodynamics(activeShapeId, isCustomAirfoil, a);
            newData.push({
              aoa: a,
              cl: Number(cl.toFixed(3)),
              cd: Number(cd.toFixed(3))
            });
          }
          setChartData(newData);
          setLastSimulationData(newData);
          setIsSimulating(false);
        }
      }, 300); // Small artificial delay to imply calculation
      return () => { isMounted = false; };
    }
    
    // Approximate Reynolds number based on wind speed and standard chord of 1m
    const reynolds = (windSpeed * density) / 1.5e-5;

    fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alpha: Array.from({length: graphBounds.max - graphBounds.min + 1}, (_, i) => i + graphBounds.min),
        Re: reynolds,
        mach: 0,
        points: activeShape.airfoilData,
        modelSize: 'xlarge'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (isMounted) {
        if (!data.error && Array.isArray(data)) {
           setChartData(data);
           setLastSimulationData(data);
        } else {
           console.error("NeuralFoil Error:", data.error);
        }
        setIsSimulating(false);
      }
    })
    .catch(err => {
      if (isMounted) {
        setIsSimulating(false);
        console.error("Fetch Error:", err);
      }
    });

    return ()=> { isMounted = false; };
  }, [activeShapeId, windSpeed, density, useNeuralFoil, graphBounds, hasTarget]); // Trigger dynamically


  return (
    <div className="flex flex-col gap-6 max-w-[1800px] mx-auto w-full pb-8">

      {/* Top 4-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">

        {/* ── Left: Library + Importer ── */}
        <div className="col-span-1 glass-panel p-4 flex flex-col gap-4 max-h-[600px]">
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-neon)] uppercase flex-shrink-0">Geometry Library</h2>

          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {ALL_SHAPES.map(shape=>(
              <ShapeCard key={shape.id} {...shape}
                active={activeShapeId===shape.id}
                onClick={handleShapeClick}
              />
            ))}
          </div>

          {/* Importer */}
          <div className="flex-shrink-0 border-t border-white/10 pt-4 flex flex-col gap-2">
            <h3 className="text-xs font-mono tracking-widest text-[var(--color-accent-blue)] uppercase">Import Airfoil</h3>
            <button onClick={()=>fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-[var(--color-accent-blue)]/60 hover:bg-[var(--color-accent-blue)]/5 text-brand-400 hover:text-[var(--color-accent-blue)] text-xs font-mono tracking-wider transition-all">
              <Upload size={13}/> UPLOAD .DAT FILE
            </button>
            <input ref={fileInputRef} type="file" accept=".dat,.txt,.csv" className="hidden" onChange={handleFileUpload}/>
            {importError&&<div className="text-[10px] text-[var(--color-accent-pink)] font-mono">{importError}</div>}
            <div className="text-[9px] text-brand-400 font-mono leading-relaxed">Selig .dat format (X Y pairs). NACA coords supported.</div>
          </div>
        </div>

        {/* ── Center: Viewport ── */}
        <div className="col-span-1 lg:col-span-2 relative">
          <SimulationView
            isSimulating={isSimulating}
            activeShape={activeShape}
            pitchAngle={pitchAngle}
            windSpeed={windSpeed}
            flowActive={flowActive}
            onFlowToggle={()=>setFlowActive(p=>!p)}
            autotunePhase={autotunePhase}
            autotuneProgress={autotuneProgress}
            onAutotune={runAutotune}
            onAutotuneCancel={handleAutotuneCancel}
            autotunePreview={autotunePreview}
            autotuneResult={autotuneResult}
            goldenLiftActive={goldenLiftActive}
            aeroFactsActive={aeroFactsActive}
            onAeroFactsToggle={() => setAeroFactsActive(p => !p)}
            liftForce={currentForce.lift}
            dragForce={currentForce.drag}
            isStalling={isStalling}
          />

          {/* Aero-Facts Learn Mode Panel */}
          {aeroFactsActive && (
            <AeroFactsPanel
              pitchAngle={pitchAngle}
              windSpeed={windSpeed}
              isStalling={isStalling}
              onClose={() => setAeroFactsActive(false)}
            />
          )}
        </div>

        {/* ── Right: Controls ── */}
        <div className="col-span-1 glass-panel p-6 flex flex-col max-h-[600px]">
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-blue)] uppercase mb-4 flex-shrink-0">Atmosphere</h2>
          <div className="flex flex-col gap-2 mb-6 flex-shrink-0">
            {Object.entries(ENV_PRESETS).map(([key,preset])=>(
              <PresetButton key={key} preset={preset} active={activePreset===key} onClick={()=>applyPreset(key)}/>
            ))}
            
            {/* The Circle Settings Button from Mockup */}
            <button
               className="aero-shape-circle self-center mt-2 flex flex-col gap-1 items-center justify-center text-white/50 hover:text-[var(--color-accent-blue)] transition-all cursor-pointer"
               title="Global Physics Settings"
            >
              <div className="w-5 h-0.5 bg-current" />
              <div className="w-5 h-0.5 bg-current" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
          </div>

          <div className="border-t border-white/10 pt-4 mb-2 flex-shrink-0">
            <h2 className="text-sm font-mono tracking-widest text-[var(--color-accent-blue)] uppercase mb-4">Parameters</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <ControlSlider label="Wind Speed"    value={windSpeed}     min={0}   max={300}   unit={units === 'imperial' ? 'mph' : 'm/s'} onChange={setWindSpeed}     accent="neon"/>
            <ControlSlider label="Pitch Angle"   value={pitchAngle}    min={-45} max={45}    unit="°"   onChange={setPitchAngle}    accent="blue"/>
          </div>

          {/* Live metrics */}
          <div
            className={`mt-6 border-t border-white/10 pt-5 flex-shrink-0 rounded-xl transition-[box-shadow,border-color] duration-500 ${
              goldenLiftActive
                ? 'shadow-[0_0_32px_rgba(234,179,8,0.22),inset_0_0_24px_rgba(234,179,8,0.06)] border border-amber-500/35 p-4 -m-1 bg-amber-500/[0.04]'
                : ''
            }`}
          >
            <h2
              className={`text-sm font-mono tracking-widest uppercase mb-4 ${
                goldenLiftActive ? 'text-amber-200/90' : 'text-[var(--color-accent-pink)]'
              }`}
            >
              Live Metrics
              {goldenLiftActive && (
                <span className="ml-2 text-[10px] font-normal text-amber-400/90 tracking-normal">· Golden optimum</span>
              )}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-1">
                  <div className="text-xs text-brand-400 font-bold">DRAG <span className="font-normal opacity-70">(Cd)</span></div>
                  <div className="text-[10px] text-brand-500">{hasTarget ? currentForce.drag.toFixed(0) : '--'} N</div>
                </div>
                <div className="text-xl font-bold font-mono text-[var(--color-accent-pink)]">{isSimulating || !hasTarget ? '--' : currentAeroItem.cd.toFixed(3)}</div>
              </div>
              <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-1">
                  <div className="text-xs text-[var(--color-accent-neon)] font-bold">LIFT <span className="font-normal opacity-70">(Cl)</span></div>
                  <div className="text-[10px] text-brand-500">{hasTarget ? currentForce.lift.toFixed(0) : '--'} N</div>
                </div>
                <div className="text-xl font-bold font-mono text-[var(--color-accent-neon)] neon-text">{isSimulating || !hasTarget ? '--' : currentAeroItem.cl.toFixed(3)}</div>
              </div>
              <div className="bg-brand-900/50 p-3 rounded-lg border border-white/5 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-brand-400 mb-1">AIR DENSITY</div>
                    <div className="text-sm font-bold font-mono" style={{color:ENV_PRESETS[activePreset].color}}>
                       ρ = {density} <span className="text-[10px]">kg/m³</span>
                       {units === 'imperial' && <span className="text-[10px] text-brand-500 ml-2">({(density * 0.00194032).toFixed(4)} slug/ft³)</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-brand-400 mb-1">DYNAMIC PRESSURE</div>
                    <div className="text-sm font-bold font-mono text-white">
                       {(0.5 * density * Math.pow(windSpeed, 2)).toFixed(0)} <span className="text-[10px]">Pa</span>
                       {units === 'imperial' && <span className="text-[10px] text-brand-500 ml-2">({(0.5 * density * Math.pow(windSpeed, 2) * 0.0208854).toFixed(1)} psf)</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Charts — 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[280px] flex-shrink-0 relative">
        {isSimulating && (
           <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
             <div className="text-[var(--color-brand-100)] font-mono animate-pulse tracking-widest text-sm flex gap-3 items-center">
               <div className="w-4 h-4 border-2 border-[var(--color-accent-neon)] border-t-transparent rounded-full animate-spin"></div>
               COMPUTING NEURALFOIL CFD...
             </div>
           </div>
        )}
        <DataChart data={chartData} title="Drag Coefficient (Cd vs AoA)" dataKey="cd" xKey="aoa" activeX={pitchAngle} stallAngleX={positiveStallAngle} negativeStallAngleX={negativeStallAngle} isStalling={isStalling} strokeColor="var(--color-accent-pink)" />
        <DataChart data={chartData} title="Lift Coefficient (Cl vs AoA)" dataKey="cl" xKey="aoa" activeX={pitchAngle} stallAngleX={positiveStallAngle} negativeStallAngleX={negativeStallAngle} isStalling={isStalling} strokeColor="var(--color-accent-neon)" />
        <PolarChart
          data={chartData}
          currentCd={currentAeroItem.cd}
          currentCl={currentAeroItem.cl}
          stallCd={stallPoint.cd}
          stallCl={stallPoint.cl}
          isStalling={isStalling}
        />
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel p-6 w-full max-w-md flex flex-col gap-5 border border-[var(--color-accent-blue)]/30">
            <div className="flex items-center gap-3 text-[var(--color-accent-neon)]">
              <Upload size={20} />
              <h2 className="text-lg font-mono font-bold uppercase tracking-wider">Save Imported Airfoil</h2>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-brand-400 uppercase tracking-widest">Airfoil Name</label>
              <input 
                type="text" 
                value={pendingAirfoilName}
                onChange={(e) => setPendingAirfoilName(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-lg p-3 text-white font-mono outline-none focus:border-[var(--color-accent-neon)] transition-colors"
                placeholder="e.g. CUSTOM WING"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={cancelImport} className="px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider text-brand-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button 
                onClick={addCustomAirfoil} 
                className="px-5 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/50 hover:bg-[var(--color-accent-blue)] hover:text-white transition-all shadow-[0_0_15px_var(--color-accent-blue)]"
              >
                Add to Library
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
