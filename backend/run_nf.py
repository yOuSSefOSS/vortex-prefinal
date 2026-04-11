import sys
import json
import os
import neuralfoil as nf
import numpy as np

def main():
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        alpha_list = data.get("alpha", list(range(-20, 31)))
        Re = data.get("Re", 1e6)
        mach = data.get("mach", 0.0)
        points = data.get("points", [])
        
        if not points:
             print(json.dumps({"error": "No points provided"}))
             return

        tmp_path = f"tmp_airfoil_{os.getpid()}.dat"
        with open(tmp_path, "w") as f:
            f.write("Airfoil\n")
            for p in points:
                f.write(f"{p[0]} {p[1]}\n")
                
        aero = nf.get_aero_from_dat_file(tmp_path, alpha=np.array(alpha_list), Re=Re)
        
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
            
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        print(json.dumps(results))
    except Exception as e:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
