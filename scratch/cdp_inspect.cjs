const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9333;
  const userDataDir = path.join(__dirname, 'chrome_temp_profile');
  
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,960'
  ]);

  // wait 1.5s for chrome to start
  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/version`);
    const versionData = await listRes.json();
    const wsUrl = versionData.webSocketDebuggerUrl;
    console.log('Connecting to Chrome CDP at:', wsUrl);

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    // Create target page
    const targetRes = await send('Target.createTarget', { url: 'http://localhost:5173/employee' });
    const targetId = targetRes.result.targetId;
    const attachRes = await send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attachRes.result.sessionId;

    function sendSession(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
      });
    }

    await sendSession('Page.enable');
    await sendSession('DOM.enable');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Wait for page load and react render
    await new Promise(r => setTimeout(r, 2000));

    // Evaluate rects
    const evalRes = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          function getRect(sel) {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              height: Math.round(r.height),
              width: Math.round(r.width),
              y: Math.round(window.scrollY + r.top)
            };
          }
          return {
            windowInnerHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight,
            grid: getRect('.sp-dashboard-grid'),
            colLeft: getRect('.sp-col-left'),
            colCenter: getRect('.sp-col-center'),
            colRight: getRect('.sp-col-right'),
            stagesCard: getRect('.sp-stages-card'),
            backedCard: getRect('.sp-backed-card'),
            promoCard: getRect('.sp-supporting-promo-card')
          };
        })()
      `,
      returnByValue: true
    });

    console.log('MEASUREMENTS:', JSON.stringify(evalRes.result?.result?.value, null, 2));

    // Capture full height screenshot
    const layoutMetrics = await sendSession('Page.getLayoutMetrics');
    const width = 1440;
    const height = Math.ceil(layoutMetrics.result.cssContentSize.height);

    await sendSession('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });

    const shotRes = await sendSession('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });
    const shotPath = path.join(__dirname, 'cdp_full_app.png');
    fs.writeFileSync(shotPath, Buffer.from(shotRes.result.data, 'base64'));
    console.log('Full screenshot saved to:', shotPath);

    ws.close();
  } catch (err) {
    console.error('Error during CDP script:', err);
  } finally {
    chromeProc.kill();
  }
}

main();
