const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,720',
      '--start-fullscreen',
      '--kiosk',
      '--disable-infobars'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('https://tv-tj.vercel.app/', { waitUntil: 'networkidle2' });
  
  // Mantém o processo vivo para o FFmpeg capturar
})();
