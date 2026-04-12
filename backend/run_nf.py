import sys
import json
import os
import neuralfoil as nf
import numpy as np

# Load the model into memory just once!
print("Loading Neuralfoil model into memory and starting daemon...", file=sys.stderr)


def compute_aerodynamics(data):
    alpha_list = data.get("alpha", list(range(-20, 31)))
    Re = data.get("Re", 1e6)
    points = data.get("points", [])
    model_size = data.get("modelSize", "large")
    
    if not points:
        return {"error": "No points provided"}

    tmp_path = f"tmp_airfoil_{os.getpid()}.dat"
    try:
        with open(tmp_path, "w") as f:
            f.write("Airfoil\n")
            for p in points:
                f.write(f"{p[0]} {p[1]}\n")
                
        aero = nf.get_aero_from_dat_file(tmp_path, alpha=np.array(alpha_list), Re=Re, model_size=model_size)
        
        cl_data = aero.get('CL', np.zeros(len(alpha_list)))
        cd_data = aero.get('CD', np.zeros(len(alpha_list)))

        if hasattr(cl_data, 'tolist'):
            cl_data = cl_data.tolist()
        else:
            cl_data = [cl_data] * len(alpha_list)
            
        if hasattr(cd_data, 'tolist'):
            cd_data = cd_data.tolist()
        else:
            cd_data = [cd_data] * len(alpha_list)
        
        results = []
        for i, a in enumerate(alpha_list):
            results.append({
                "aoa": a,
                "cl": round(float(cl_data[i]), 4),
                "cd": round(float(cd_data[i]), 4)
            })
            
        return results
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def main():
    if "--daemon" in sys.argv:
        # ── Persistent Mode for 100x Faster Execution ──
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
                
            try:
                data = json.loads(line)
                res = compute_aerodynamics(data)
                print(json.dumps(res))
                sys.stdout.flush()
            except Exception as e:
                print(json.dumps({"error": str(e)}))
                sys.stdout.flush()
    else:
        # ── Standard One-Time Run Mode ──
        try:
            input_data = sys.stdin.read()
            data = json.loads(input_data)
            res = compute_aerodynamics(data)
            print(json.dumps(res))
        except Exception as e:
            print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
