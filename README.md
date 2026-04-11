<p align="center">
  <img src="frontend/public/banner.png" alt="Vortex-Gen Banner" width="100%">
</p>

# 🌪️ Vortex-Gen: Interactive 3D Wind Tunnel

**Vortex-Gen** is a professional, high-fidelity real-time aerodynamics simulation engine designed for education, engineering intuition, and the **Hackathon Competition**. 

It combines advanced 3D rendering with neural-network-backed physics to allow users to interactively test airfoils in a virtual wind tunnel, instantly visualizing complex phenomena like pressure distribution, lift generation, and stall dynamics.

---

## ✨ Key Features & "Wow Factor"

- 🚀 **Real-Time 3D CFD Visualization:** Built on `React-Three-Fiber`, featuring dynamic surface pressure heatmaps (Cp) and an interactive particle flow engine.
- 🧠 **Interactive "Aero-Facts" Learn Mode:** A contextual, physics-aware educational engine. It detects the current simulation state (Angle of Attack, Wind Speed, Stall regime) and dynamically surfaces responsive tooltips, physical equations, and real-time concept summaries (e.g., *Boundary Layer Separation*, *Bernoulli's Principle*).
- ⚙️ **Machine Learning Physics Core:** Utilizes `NeuralFoil` (PyTorch) on the backend to predict real-world aerodynamic coefficients (Cl, Cd) in milliseconds, bypassing hours of traditional CFD meshing.
- 💎 **Premium Glassmorphism UI:** A meticulously crafted interface featuring multi-layered blur shadows, spring-eased micro-animations, glowing gradient sliders, and a dynamic Drag Polar chart.
- 🏎️ **Highly Optimized:** Constant-hoisting in the 3D render loops, React.memo caching, and GPU-composited overlay layers guarantee a buttery smooth 60fps experience even during rapid interactions.

---

## 🛠️ Installation & Setup (Start Here)

To maintain a lightweight and high-performance repository, all `node_modules` folders have been excluded. Ensure you have **Node.js** and **Python 3** installed.

### 1. Clone the Repository
Open your terminal and run:

```bash
git clone https://github.com/mahmoud31fathy/Hackathon_Comp.git
cd Hackathon_Comp
```

### 2. Root Directory Setup
Install global project dependencies:

```bash
npm install
```

### 3. Backend Environment Setup (Node & Python)
Our aerodynamic predictions are powered by the NeuralFoil engine. Open a terminal window and navigate to the backend:

```bash
cd backend
npm install
python -m pip install neuralfoil numpy
node server.js
```
*Wait for the console to confirm the server is running (e.g., "Backend Running on port 5000").*

### 4. Frontend Environment Setup
Open a **second** terminal window (leave the backend running) and navigate to the frontend:

```bash
cd frontend
npm install
npm run dev
```
*The application will be accessible at http://localhost:5173 (or the URL shown in your Vite terminal).*

---

## 📂 Project Structure & Core Architecture

- **`/backend`**: Node.js & Express server bridging the frontend to a Python-based machine learning physics engine.
- **`/frontend`**: React UI, state management, 3D Canvas, and the "Learn Mode" educational overlays.
  - `/src/components/SimulationView.jsx`: The core 3D simulation, flow particles, and perspective control.
  - `/src/components/AeroFactsPanel.jsx`: The context-aware physics insights engine.
  - `/src/index.css`: Tailwind 4 architecture and premium CSS-in-JS configurations.
- **`nextStep.md`**: Detailed roadmap for future features and scaling.

---

## 💡 Technical Stack

- **Frontend UI/UX**: React 18, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **3D Engine**: Three.js, React-Three-Fiber, Drei.
- **Backend / Server**: Node.js, Express.
- **Machine Learning Physics Engine**: Python, Numpy, NeuralFoil, PyTorch.

---

## ⚡ Important Note for Judges & Developers
Experiencing lag? The simulation computes heavy physics math. We have highly optimized the real-time simulation loops, but hardware-accelerated browsers (like Chrome or Edge) will provide the best 60fps glass-morphed visual experience. Running `npm install` in each directory is strictly required to build the web framework dependencies!
