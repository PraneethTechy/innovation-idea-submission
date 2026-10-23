import subprocess, os

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

out_png = os.path.abspath('scratch/live_app_employee_screenshot.png')
cmd = [
    browser_exe,
    '--headless',
    '--virtual-time-budget=6000',
    f'--screenshot={out_png}',
    '--window-size=1400,900',
    'http://localhost:5173/employee'
]
subprocess.run(cmd, check=True)
print('Captured live employee screenshot with virtual time budget.')
