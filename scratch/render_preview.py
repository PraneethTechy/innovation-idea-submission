import subprocess, os

html_path = os.path.abspath('scratch/test_svg.html')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write('''<!DOCTYPE html>
<html>
<body style="margin:0; background: linear-gradient(90deg, #F0E6FD 0%, #EDE4FD 35%, #EDE4FD 65%, #DECDFD 100%); display:flex; justify-content:center; align-items:center; height:100vh;">
  <div style="width:420px; height:200px;">
    <img src="../public/assets/hero_lightbulb.svg" style="width:100%; height:100%;" />
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

if browser_exe:
    out_png = os.path.abspath('scratch/browser_svg_preview.png')
    cmd = [browser_exe, '--headless', f'--screenshot={out_png}', '--window-size=600,300', f'file:///{html_path}']
    subprocess.run(cmd, check=True)
    print('Rendered browser preview to:', out_png)
else:
    print('No browser found.')
