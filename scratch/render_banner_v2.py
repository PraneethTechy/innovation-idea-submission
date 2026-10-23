import subprocess, os

html_path = os.path.abspath('scratch/test_hero_banner.html')
with open(html_path, 'w', encoding='utf-8') as f:
    f.write('''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #F8F5FE;
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .sp-hero-card {
      position: relative;
      width: 1080px;
      min-height: 204px;
      background: linear-gradient(90deg, #F0E6FD 0%, #EDE4FD 35%, #EDE4FD 65%, #DECDFD 100%);
      border: 1px solid rgba(216,203,238,0.85);
      border-radius: 20px;
      padding: 16px 32px;
      display: grid;
      grid-template-columns: 1.28fr 1.32fr 0.85fr;
      gap: 16px;
      align-items: center;
      overflow: hidden;
      box-shadow: 0 8px 24px -4px rgba(107,47,168,0.06);
    }
    .sp-hero-bg-waves {
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: 20px;
      background:
        radial-gradient(ellipse 65% 55% at 20% 90%, rgba(196,181,253,0.3) 0%, transparent 60%),
        radial-gradient(ellipse 70% 50% at 85% 85%, rgba(167,139,250,0.25) 0%, transparent 65%),
        radial-gradient(ellipse 50% 40% at 50% 95%, rgba(216,180,254,0.35) 0%, transparent 70%);
      z-index: 0;
    }
    .sp-hero-left {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .sp-hero-eyebrow {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .12em;
      color: #7C3AED;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .sp-hero-title {
      font-size: 30px;
      font-weight: 800;
      line-height: 1.15;
      color: #1E1B4B;
      letter-spacing: -0.025em;
      margin: 0 0 8px;
    }
    .sp-hero-title-highlight {
      color: #6D28D9;
      white-space: nowrap;
    }
    .sp-hero-sub {
      font-size: 13px;
      line-height: 1.4;
      color: #5D5875;
      max-width: 350px;
      margin: 0 0 16px;
    }
    .sp-hero-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sp-hero-btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
      color: #FFFFFF;
      font-size: 13.5px;
      font-weight: 600;
      padding: 9px 22px;
      border-radius: 999px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(124,58,237,0.3);
    }
    .sp-hero-btn-secondary {
      display: inline-flex;
      align-items: center;
      padding: 8.5px 22px;
      border-radius: 999px;
      border: 1.5px solid rgba(139,92,246,0.4);
      background: rgba(255,255,255,0.7);
      color: #6D28D9;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
    }
    .sp-hero-center {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .sp-hero-artwork-wrapper {
      position: relative;
      width: 100%;
      max-width: 440px;
      height: 188px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .sp-hero-bulb-img-exact {
      height: 100%;
      max-height: 188px;
      width: auto;
      max-width: 100%;
      object-fit: contain;
    }
    .sp-hero-right {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: center;
      padding-left: 8px;
    }
    .sp-hero-pillars-list {
      display: flex;
      flex-direction: column;
      gap: 11px;
    }
    .sp-pillar-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sp-pillar-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      border: 1.5px solid rgba(196,181,253,0.7);
      color: #7C3AED;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(107,47,168,0.06);
    }
    .sp-pillar-text {
      font-size: 13px;
      font-weight: 600;
      color: #2E284A;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="sp-hero-card">
    <div class="sp-hero-bg-waves"></div>

    <!-- Left -->
    <div class="sp-hero-left">
      <div class="sp-hero-eyebrow">SPARK IDEAS PLATFORM</div>
      <h1 class="sp-hero-title">
        Ideas today<br />
        <span class="sp-hero-title-highlight">for a better tomorrow</span>
      </h1>
      <p class="sp-hero-sub">
        Share innovative ideas, collaborate with teams, and help build a better GWC.
      </p>
      <div class="sp-hero-actions">
        <a href="#" class="sp-hero-btn-primary">+ Submit an idea</a>
        <a href="#" class="sp-hero-btn-secondary">Explore ideas</a>
      </div>
    </div>

    <!-- Center -->
    <div class="sp-hero-center">
      <div class="sp-hero-artwork-wrapper">
        <img src="../public/assets/hero_lightbulb.svg" class="sp-hero-bulb-img-exact" />
      </div>
    </div>

    <!-- Right -->
    <div class="sp-hero-right">
      <div class="sp-hero-pillars-list">
        <div class="sp-pillar-item">
          <div class="sp-pillar-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <span class="sp-pillar-text">Solve real problems</span>
        </div>
        <div class="sp-pillar-item">
          <div class="sp-pillar-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span class="sp-pillar-text">Improve processes</span>
        </div>
        <div class="sp-pillar-item">
          <div class="sp-pillar-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <span class="sp-pillar-text">Create value</span>
        </div>
        <div class="sp-pillar-item">
          <div class="sp-pillar-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3v18M3 12h18M5.3 5.3l13.4 13.4M5.3 18.7L18.7 5.3"/></svg>
          </div>
          <span class="sp-pillar-text">Be a part of change</span>
        </div>
      </div>
    </div>
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

out_png = os.path.abspath('scratch/browser_hero_banner_preview_v2.png')
cmd = [browser_exe, '--headless', f'--screenshot={out_png}', '--window-size=1180,320', f'file:///{html_path}']
subprocess.run(cmd, check=True)
print('Rendered V2 full hero banner preview to:', out_png)
