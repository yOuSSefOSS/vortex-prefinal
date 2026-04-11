---
pdf_options:
  format: a4
  margin: 20mm 20mm
---

<style>
  body {
    background-color: #0b101e;
    color: #94a3b8;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  h1 {
    color: #00f0ff;
    font-size: 3.5rem;
    text-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
    margin-bottom: 5px;
  }
  h2 {
    color: #ec4899;
    border-bottom: 1px solid rgba(236, 72, 153, 0.3);
    padding-bottom: 5px;
    margin-top: 40px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  h3 {
    color: #00f0ff;
    font-family: monospace;
    letter-spacing: 1px;
  }
  strong {
    color: #e2e8f0;
  }
  br {
    margin-bottom: 15px;
  }
  img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(0, 240, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    margin: 20px 0;
  }
  .image-caption {
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
    margin-top: -10px;
    margin-bottom: 30px;
    font-style: italic;
  }
  blockquote {
    border-left: 4px solid #00f0ff;
    background: rgba(0, 240, 255, 0.05);
    padding: 15px 20px;
    margin: 20px 0;
    color: #e2e8f0;
    font-style: italic;
    border-radius: 0 8px 8px 0;
  }
  .highlight-pink { color: #ec4899; }
  .highlight-cyan { color: #00f0ff; }
  ul li { margin-bottom: 10px; }
  .page-break { page-break-after: always; }
</style>

<div style="text-align: center; padding: 120px 20px;">
  
<h1 style="margin-bottom: 0;">🌪️ Vortex-Gen</h1>
<h3 style="color: #94a3b8; margin-top: 5px; text-shadow: none;">Interactive Aerodynamics & Wind Tunnel Simulator</h3>

<br><br><br>

<div style="color: #e2e8f0; font-size: 1.2rem; line-height: 1.8;">
**A Project By:**<br><br>
Youssef Usama<br>
Omar Ibrahim<br>
Mahmoud Fathy<br>
Youssef Ibrahim<br>
Basmalla Fawzy<br>
Eman Elsayed<br>
Habiba Mohamed<br>
</div>

<br><br><br><br>
<span style="color: #ec4899; font-family: monospace; letter-spacing: 2px;">[ HACKATHON SUBMISSION ]</span>
</div>

<div class="page-break"></div>

## PAGE 2: The Problem 🛑
### The "Invisible Wall" of Aerospace Engineering

If you ask a kid how an airplane flies, they might say "magic." If you ask an engineering student, they will show you a chalkboard full of complex calculus and fluid dynamics equations. 

**The truth is, studying aerodynamics has always been difficult for three reasons:**

1. **Wind is Invisible:** You cannot see the air moving around an object in real life without expensive smoke machines or lasers.
2. **Software is too Complex:** Professional tools (like Computational Fluid Dynamics software) take months to learn, require supercomputers to run, and cost thousands of dollars.
3. **Wind Tunnels are Expensive:** Building physical models and testing them in real wind tunnels is a luxury reserved for massive companies like Boeing or F1 racing teams.

<br>

<img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/NASA_wind_tunnel.jpg" alt="NASA Wind Tunnel">
<div class="image-caption">Traditional wind tunnels are massive, expensive, and inaccessible to the average student or hobbyist.</div>

Because of this, many brilliant young minds are intimidated by aerodynamics. The tools required to experiment and learn are simply out of reach.

> *“What if anyone, anywhere, could test the aerodynamics of any shape right in their web browser, for free, in real-time?”*


<div class="page-break"></div>

## PAGE 3: The Solution 💡
### Enter 'Vortex-Gen'

**Vortex-Gen** is a lightweight, web-based interactive wind tunnel. We have taken the complex math of aerodynamics and translated it into a beautiful, dashboard-style 3D experience that anyone can understand instantly.

Instead of staring at pure math or waiting hours for a simulation to process, **Vortex-Gen** provides an intuitive interface:
- <strong class="highlight-cyan">Geometry Library:</strong> Drop a 3D shape (like a built-in NACA 4412 airfoil) into the virtual wind tunnel with one click.
- <strong class="highlight-pink">Active Target Simulation:</strong> Instantly see thousands of wind particles react dynamically to the shape in 3D space.
- <strong class="highlight-cyan">Environment Presets:</strong> Change from 'Standard Air' to 'High Altitude' to see how drastically a drop in air density (from 1.225 to 0.414 kg/m³) affects flight.

It is designed to be as **approachable as a video game**, yet accurate enough to teach real concepts of physics, drag, and lift. By making the invisible forces of nature *visible*, we are democratizing aerodynamic testing.

<br>

<div style="border: 2px dashed #ec4899; padding: 40px; text-align: center; border-radius: 10px; background: rgba(236, 72, 153, 0.05); color: #ec4899; font-family: monospace;">
  [ THIS PDF IS MISSING YOUR AWESOME SCREENSHOT! ] <br><br>
  To add it, save the screenshot you took as "screenshot.png" in this folder, and replace this warning box in vortex_gen_pitch.md with: <br>
  &lt;img src="screenshot.png"&gt;
</div>
<div class="image-caption">The Vortex-Gen Dashboard: Showing live flow simulation, AoA gauge, and real-time data tracking.</div>

<div class="page-break"></div>

## PAGE 4: Key Features & Impact 🚀

Why is Vortex-Gen a game-changer? Here is what makes our tool unique:

### 1. 💨 Real-Time Flow Visualization 
Watch virtual wind particles react dynamically. Adjust the <strong class="highlight-cyan">Pitch Angle</strong> slider, and the airfoil will tilt in real-time, completely recalculating the flow path. We even included a **Stall Warning ** on our central Angle of Attack (AoA) gauge!

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Airfoil_Lift_and_Drag.svg/800px-Airfoil_Lift_and_Drag.svg.png" style="background: white; padding: 10px;" alt="Airfoil Diagram">
<div class="image-caption">Visualizing Lift and Drag forces is crucial for understanding how objects cut through the air.</div>

### 2. 📉 Live Metrics & Trajectory Tracking
As you adjust parameters, the simulation calculates changes instantly. You can watch the <strong class="highlight-pink">Drag (Cd)</strong> and <strong class="highlight-cyan">Lift (Cl)</strong> numbers change live, while beautiful animated charts map out the **Drag Force Integration** and **Lift Force Trajectory** over time.

### 3. 📝 Custom .DAT Airfoil Importing
This isn't just a toy—it's a real utility! Engineers and students can upload actual global standard wing profiles (Selig .DAT format) directly into our app. Our custom algorithm instantly builds the 3D wing and begins the flow test.

### 4. 🌍 Environment Presets
We built in "Standard Air" and "High Altitude" presets. Users can learn how air density affects flight—why helicopters struggle to fly near Mount Everest, but operate perfectly at sea level.

<div class="page-break"></div>

## PAGE 5: The Future 🌟
### Where we go from here

Vortex-Gen was built rapidly during this hackathon, but our vision for its future is massive:

1. <strong class="highlight-cyan">Car Aerodynamics:</strong> Expanding from airplane wings to importing custom 3D models of cars to test drag coefficients for fuel efficiency.
2. <strong class="highlight-pink">Cloud Computing Integration:</strong> Connecting our front-end visualizer to a true supercomputing cloud backend for highly accurate, professional-grade fluid simulations.
3. <strong class="highlight-cyan">VR/AR Wind Tunnels:</strong> Allowing students to put on a VR headset and physically stand inside the wind tunnel, watching the forces wrap around them.

### Conclusion
**Vortex-Gen** is more than just code. It is an educational revolution. We have proven that the steepest concepts in engineering can be made accessible, beautiful, and interactive for everyone. 

<br><br><br>

> **Thank you to the Judges for your time!**
> *- The Vortex-Gen Team*
