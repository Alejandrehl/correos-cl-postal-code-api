import { Browser, chromium } from 'playwright';

let browser: Browser | null = null;

export async function get(): Promise<Browser> {
  if (browser) return browser;
  browser = await chromium.launch();
  return browser;
}

export async function close() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
