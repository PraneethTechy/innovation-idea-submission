import subprocess, os
from PIL import Image
import numpy as np

html_path = os.path.abspath('scratch/render_trans_png.html')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write('''<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { background: transparent; overflow: hidden; }
    #container { 
      width: 1000px; 
      height: 500px; 
      padding: 40px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    img { width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
  <div id="container">
    <img src="../public/assets/hero_lightbulb.svg" />
  </div>
</body>
</html>''')

edge_paths = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe'
]
browser_exe = None
for p in edge_paths:
    if os.path.exists(p):
        browser_exe = p
        break

raw_png = os.path.abspath('scratch/raw_trans.png')
cmd = [
    browser_exe,
    '--headless',
    '--default-background-color=00000000',
    f'--screenshot={raw_png}',
    '--window-size=1000,500',
    f'file:///{html_path}'
]
subprocess.run(cmd, check=True)

# Now auto-crop transparent margins with a 10px safe padding
im = Image.open(raw_png)
arr = np.array(im)
alpha = arr[:, :, 3]

# Find non-zero bounding box
nonzero_y, nonzero_x = np.nonzero(alpha > 0)
min_y, max_y = nonzero_y.min(), nonzero_y.max()
min_x, max_x = nonzero_x.min(), nonzero_x.max()

pad = 12
min_y = max(0, min_y - pad)
max_y = min(im.height - 1, max_y + pad)
min_x = max(0, min_x - pad)
max_x = min(im.width - 1, max_x + pad)

cropped = im.crop((min_x, min_y, max_x, max_y))

# Ensure extreme borders are strictly 0
c_arr = np.array(cropped)
c_alpha = c_arr[:, :, 3]
c_alpha[0, :] = 0
c_alpha[-1, :] = 0
c_alpha[:, 0] = 0
c_alpha[:, -1] = 0
final_im = Image.fromarray(c_arr)

out_trans = 'public/assets/hero_lightbulb_transparent.png'
out_exact = 'public/assets/hero_lightbulb_exact.png'
final_im.save(out_trans)
final_im.save(out_exact)
print('Saved clean transparent PNG to:', out_trans, 'and', out_exact, 'Size:', final_im.size)
