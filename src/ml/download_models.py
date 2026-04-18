import os
import requests
from tqdm import tqdm
import time

urls = {
    "yolov8s-pose.pt": "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s-pose.pt",
    "yolov8s.pt": "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s.pt"
}

print("\n🚀 Starting Invincible Download AI for SOTA Models...")
for filename, url in urls.items():
    while True:
        headers = {}
        downloaded = 0
        if os.path.exists(filename):
            downloaded = os.path.getsize(filename)
            headers['Range'] = f"bytes={downloaded}-"

        try:
            response = requests.get(url, headers=headers, stream=True, timeout=10)
            
            # 416 means the file requested byte range is beyond the file size (meaning it's 100% complete)
            if response.status_code == 416: 
                print(f"✅ {filename} is 100% downloaded!")
                break
                
            total_size = int(response.headers.get('content-length', 0)) + downloaded
            
            # Catch if the server returns 200 instead of 206 (Partial Content), rewrite from zero
            mode = "ab" if response.status_code == 206 else "wb"
            if mode == "wb":
                downloaded = 0
            
            with open(filename, mode) as f, tqdm(
                desc=filename,
                initial=downloaded,
                total=total_size,
                unit='iB',
                unit_scale=True,
                unit_divisor=1024,
            ) as bar:
                for data in response.iter_content(chunk_size=131072):
                    if data:
                        size = f.write(data)
                        bar.update(size)
            
            if os.path.getsize(filename) >= total_size:
                break
                
        except Exception as e:
            print(f"\n⚠️ Wi-Fi Dropped... Reconnecting instantly!")
            time.sleep(1)

print("\n🎉 ALL SOTA MODELS DOWNLAODED PERFECTLY! You can now run ml_engine.py!")
