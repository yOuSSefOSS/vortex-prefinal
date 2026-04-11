import React, { useMemo } from 'react';
import { BookOpen, X, ArrowUp, ArrowDown, Wind, AlertTriangle, Plane, Zap, ChevronRight } from 'lucide-react';

// ─── Aero-Fact Knowledge Engine ─────────────────────────────────────────────
// Each fact has a condition function and a priority. The engine selects the
// highest-priority matching fact for the current simulation state, so the panel
// always shows the single most relevant insight.

const AERO_FACTS = [
  // ── STALL (highest priority) ─────────────────────────────────────
  {
    id: 'deep-stall',
    priority: 100,
    condition: ({ pitchAngle }) => Math.abs(pitchAngle) > 25,
    icon: <AlertTriangle size={18} />,
    accentColor: '#ff2200',
    title: 'Deep Stall!',
    body: `At this extreme angle the airflow has completely separated from the wing's 
           upper surface. The wing is behaving more like a flat plate — almost all 
           aerodynamic lift is lost and drag skyrockets. In a real aircraft this 
           would trigger aggressive stall-recovery procedures.`,
    concept: 'Flow Separation',
    conceptDetail: `When air can no longer follow the curved surface of the wing, 
                    it "separates" and forms chaotic, turbulent eddies. This destroys 
                    the low-pressure region on top of the wing that creates lift.`,
  },
  {
    id: 'stall-positive',
    priority: 90,
    condition: ({ pitchAngle, isStalling }) => isStalling && pitchAngle > 0,
    icon: <AlertTriangle size={18} />,
    accentColor: '#ff6600',
    title: 'Stall Warning!',
    body: `You've pitched up beyond the critical angle of attack! The smooth airflow 
           over the top of the wing has broken away. Lift is dropping rapidly and 
           drag is surging. Real aircraft have "stick shakers" that vibrate the 
           control column to warn pilots of exactly this.`,
    concept: 'Critical Angle of Attack',
    conceptDetail: `Every airfoil has a maximum angle (typically 14–16°) beyond 
                    which it can no longer maintain attached flow. This angle is 
                    fixed by the wing's shape — it doesn't change with speed.`,
  },
  {
    id: 'stall-negative',
    priority: 90,
    condition: ({ pitchAngle, isStalling }) => isStalling && pitchAngle < 0,
    icon: <AlertTriangle size={18} />,
    accentColor: '#ff6600',
    title: 'Inverted Stall!',
    body: `Negative angle stall — the same separation phenomenon, but on the 
           lower surface. Aerobatic pilots encounter this during inverted flight 
           or aggressive push-over maneuvers.`,
    concept: 'Symmetric vs Cambered',
    conceptDetail: `A symmetric airfoil (like NACA 0012) stalls at the same angle 
                    whether pitched up or down. A cambered airfoil (like NACA 4412) 
                    stalls sooner going negative because its curved shape already 
                    favors positive lift.`,
  },

  // ── HIGH ANGLE (pre-stall) ───────────────────────────────────────
  {
    id: 'near-stall',
    priority: 70,
    condition: ({ pitchAngle }) => Math.abs(pitchAngle) > 10 && Math.abs(pitchAngle) <= 14,
    icon: <Zap size={18} />,
    accentColor: '#F39C12',
    title: 'Approaching the Limit',
    body: `You're in a high angle-of-attack regime. Lift is near its maximum, but 
           the boundary layer on top of the wing is being stretched thin. A few more 
           degrees and the flow will separate — this is the "edge of the envelope."`,
    concept: 'Boundary Layer',
    conceptDetail: `There's a very thin layer of air sticking to the wing's surface 
                    (just millimeters thick!) called the boundary layer. At high angles, 
                    this layer thickens toward the trailing edge and eventually tears 
                    away, causing stall.`,
  },

  // ── MODERATE POSITIVE ────────────────────────────────────────────
  {
    id: 'optimal-lift',
    priority: 55,
    condition: ({ pitchAngle }) => pitchAngle >= 4 && pitchAngle <= 10,
    icon: <Plane size={18} />,
    accentColor: '#2ECC71',
    title: 'Efficient Flight Zone',
    body: `This is where wings shine! Between about 4° and 10°, the airfoil is 
           generating strong lift with manageable drag. Most commercial aircraft 
           cruise at roughly 2–5° angle of attack during level flight.`,
    concept: 'Lift-to-Drag Ratio (L/D)',
    conceptDetail: `The L/D ratio measures aerodynamic efficiency. A higher ratio 
                    means more lift for less drag. Gliders achieve L/D of 40–60:1, 
                    while a typical airliner achieves ~17:1. The angle where L/D 
                    peaks is called the "best glide angle."`,
  },

  // ── SMALL POSITIVE ──────────────────────────────────────────────
  {
    id: 'positive-low',
    priority: 40,
    condition: ({ pitchAngle }) => pitchAngle > 0 && pitchAngle < 4,
    icon: <ArrowUp size={18} />,
    accentColor: '#0ea5e9',
    title: 'Generating Lift',
    body: `Even at this gentle angle, the cambered wing is deflecting air 
           downward. By Newton's Third Law, pushing air down means the wing is 
           pushed up — that's lift! The curved upper surface also accelerates 
           airflow, dropping pressure above the wing (Bernoulli's Principle).`,
    concept: 'How Wings Really Work',
    conceptDetail: `It's not just Bernoulli OR Newton — it's both simultaneously. 
                    The wing's shape and angle force oncoming air to curve downward. 
                    This redirection creates a pressure difference: lower pressure 
                    above, higher pressure below. The net upward push is lift.`,
  },

  // ── ZERO AoA ────────────────────────────────────────────────────
  {
    id: 'zero-aoa',
    priority: 35,
    condition: ({ pitchAngle }) => pitchAngle === 0,
    icon: <Wind size={18} />,
    accentColor: '#00f0ff',
    title: 'Zero Angle of Attack',
    body: `Even at 0° pitch, a cambered (curved) airfoil still produces some 
           lift! The curve in the wing's shape deflects oncoming air slightly 
           downward. Only a perfectly symmetric airfoil produces zero lift at 0°.`,
    concept: 'Camber',
    conceptDetail: `Camber is the asymmetry between the top and bottom surfaces of 
                    an airfoil. A "cambered" airfoil has a curved mean line, which 
                    gives it a built-in angle of attack. The NACA 4412 has 4% camber 
                    at 40% chord — meaning its midline peaks 4% up at 40% along the wing.`,
  },

  // ── NEGATIVE AoA ────────────────────────────────────────────────
  {
    id: 'negative-aoa',
    priority: 40,
    condition: ({ pitchAngle }) => pitchAngle < 0 && pitchAngle >= -10,
    icon: <ArrowDown size={18} />,
    accentColor: '#a78bfa',
    title: 'Negative Angle — Pushing Down',
    body: `The wing is angled nose-down, reducing lift. At some negative angle 
           the lift will actually become negative — pushing the aircraft downward. 
           Pilots use this during descent or steep dive maneuvers.`,
    concept: 'Zero-Lift Angle (α₀)',
    conceptDetail: `For a cambered airfoil, zero lift doesn't happen at 0° — it 
                    happens at a slightly negative angle, called α₀. For the 
                    NACA 4412, α₀ ≈ -4°. This means the wing still creates lift 
                    even when pointing slightly nose-down!`,
  },

  // ── HIGH WIND SPEED ─────────────────────────────────────────────
  {
    id: 'high-speed',
    priority: 50,
    condition: ({ windSpeed }) => windSpeed > 200,
    icon: <Zap size={18} />,
    accentColor: '#ec4899',
    title: 'High-Speed Regime',
    body: `At these velocities (> 200 m/s ≈ Mach 0.6), compressibility effects 
           start to matter. Shock waves can form on the wing's upper surface, 
           causing "wave drag." Real high-speed aircraft use swept wings and 
           supercritical airfoil shapes to delay this.`,
    concept: 'Mach Number',
    conceptDetail: `Mach number = airflow speed ÷ speed of sound (~343 m/s at 
                    sea level). Below Mach 0.3, air acts incompressible. Between 
                    0.3–0.8 is "transonic" where shocks form locally. Above Mach 1 
                    is supersonic — completely different aerodynamics!`,
  },

  // ── FALLBACK ────────────────────────────────────────────────────
  {
    id: 'default',
    priority: 0,
    condition: () => true,
    icon: <BookOpen size={18} />,
    accentColor: '#00f0ff',
    title: 'How Does a Wing Fly?',
    body: `A wing generates lift by reshaping the airflow around it. The curved 
           upper surface forces air to speed up (lowering pressure), while the 
           flatter lower surface slows it down (raising pressure). This pressure 
           difference pushes the wing upward. Adjust the Pitch Angle slider to 
           see how angle of attack changes everything!`,
    concept: 'The Four Forces of Flight',
    conceptDetail: `Every aircraft in flight has four forces acting on it: 
                    Lift (up), Weight (down), Thrust (forward), and Drag (backward). 
                    Steady, level flight happens when all four are in balance. 
                    Try increasing the pitch angle to see lift and drag change!`,
  },
];

// ─── Component ──────────────────────────────────────────────────────────────
const AeroFactsPanel = ({ pitchAngle, windSpeed, isStalling, onClose }) => {
  // Select the best-matching fact
  const activeFact = useMemo(() => {
    const state = { pitchAngle, windSpeed, isStalling };
    return [...AERO_FACTS]
      .filter(f => f.condition(state))
      .sort((a, b) => b.priority - a.priority)[0];
  }, [pitchAngle, windSpeed, isStalling]);

  if (!activeFact) return null;

  return (
    <div className="aero-facts-panel" style={{ '--fact-accent': activeFact.accentColor }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="aero-facts-close"
        title="Close Aero-Facts"
      >
        <X size={14} />
      </button>

      {/* Header */}
      <div className="aero-facts-header">
        <div className="aero-facts-icon" style={{ color: activeFact.accentColor }}>
          {activeFact.icon}
        </div>
        <div>
          <div className="aero-facts-badge">AERO-FACT</div>
          <h3 className="aero-facts-title">{activeFact.title}</h3>
        </div>
      </div>

      {/* Body */}
      <p className="aero-facts-body">{activeFact.body}</p>

      {/* Concept Explainer */}
      <details className="aero-facts-concept">
        <summary className="aero-facts-concept-summary">
          <ChevronRight size={13} className="aero-facts-chevron" />
          <span style={{ color: activeFact.accentColor }}>{activeFact.concept}</span>
          <span className="aero-facts-concept-hint">Tap to learn more</span>
        </summary>
        <p className="aero-facts-concept-detail">{activeFact.conceptDetail}</p>
      </details>

      {/* Live State Indicator Bar */}
      <div className="aero-facts-state-bar">
        <div className="aero-facts-state-item">
          <span className="aero-facts-state-label">AoA</span>
          <span className="aero-facts-state-value" style={{ color: activeFact.accentColor }}>
            {pitchAngle > 0 ? '+' : ''}{pitchAngle}°
          </span>
        </div>
        <div className="aero-facts-state-divider" />
        <div className="aero-facts-state-item">
          <span className="aero-facts-state-label">V∞</span>
          <span className="aero-facts-state-value" style={{ color: activeFact.accentColor }}>
            {windSpeed} m/s
          </span>
        </div>
        <div className="aero-facts-state-divider" />
        <div className="aero-facts-state-item">
          <span className="aero-facts-state-label">STATUS</span>
          <span className={`aero-facts-state-value ${isStalling ? 'aero-facts-stall-blink' : ''}`}
                style={{ color: isStalling ? '#ff2200' : '#2ECC71' }}>
            {isStalling ? '⚠ STALL' : '✓ NORMAL'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AeroFactsPanel;
