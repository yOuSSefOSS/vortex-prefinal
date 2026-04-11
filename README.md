<p align="center">
  <img src="frontend/public/banner.png" alt="Vortex-Gen Banner" width="100%">
</p>

# 🌪️ Vortex-Gen: Interactive Wind Tunnel

This is a professional full-stack web application developed for the **Hackathon Competition**. The project is architected with a modular structure, separating the concerns of the Backend server and the Frontend user interface.

---

## 🛠️ Installation & Setup (Start Here)

To maintain a lightweight and high-performance repository, all `node_modules` folders have been excluded from the cloud. Please follow these steps in order to set up your local environment.

### 1. Clone the Repository
Open your terminal and run:

`git clone https://github.com/mahmoud31fathy/Hackathon_Comp.git`  
`cd Hackathon_Comp`

### 2. Root Directory Setup
Install any global project tools by running the following in the root folder:

`npm install`

### 3. Backend Environment Setup (Node & Python)
Our aerodynamic predictions are powered by the NeuralFoil engine. Ensure you have Python installed on your system.
Open a terminal window and navigate to the backend:

`cd backend`  
`npm install`  
`python -m pip install neuralfoil numpy`
`node server.js`  

*Wait for the console to confirm the server is running (e.g., "Server listening on port 5000").*

### 4. Frontend Environment Setup
Open a **second** terminal window (leave the backend running) and navigate to the frontend:

`cd frontend`  
`npm install`  
`npm run dev`  

*The application will be accessible at http://localhost:3000 or the URL shown in your terminal.*

---

## 📂 Project Structure & Core Notes
- **`/root`**: Project configuration and global documentation.
- **`/backend`**: Node.js & Express server logic, API endpoints, and database integration.
- **`/frontend`**: React/Next.js UI components, Tailwind CSS styling, and client-side state.
- **`.gitignore`**: Optimized to exclude 6,000+ dependency files (`node_modules`) to follow professional industry standards.
- **`nextStep.md`**: Detailed roadmap for future features, scaling, and 3D asset integration.

---

## 💡 Technical Stack
- **UI/UX**: React / Vite / Tailwind CSS / Recharts
- **Server**: Node.js / Express
- **Machine Learning**: Python / NeuralFoil / PyTorch (CFD Aerodynamics)
- **Assets**: Custom 3D components (modeled in Blender).

---

## ⚡ Important Note for Judges & Developers
- **Environment Variables**: If the project uses a database or external APIs, ensure you create a `.env` file in the `/backend` folder with your credentials.
- **Dependencies**: Running `npm install` in each directory is required to rebuild the `node_modules` folders specifically for your operating system and Node.js version.
