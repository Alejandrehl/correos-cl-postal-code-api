import { Browser, chromium } from 'playwright';

const MAX_BROWSER_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_IDLE_TIME_MS = 30 * 60 * 1000; // 30 minutes
export const CLEANUP_INTERVAL_MS = MAX_IDLE_TIME_MS; // Match the idle timeout

type BrowserInstance = {
  browser: Browser;
  lastUsed: number;
  isInUse: boolean;
};

let browserPool: BrowserInstance[] = [];

// Helper functions
const isBrowserOld = (instance: BrowserInstance, now: number): boolean =>
  now - instance.lastUsed > MAX_BROWSER_AGE_MS;

const isBrowserIdle = (instance: BrowserInstance, now: number): boolean =>
  !instance.isInUse && now - instance.lastUsed > MAX_IDLE_TIME_MS;

const closeBrowser = async (instance: BrowserInstance): Promise<void> => {
  console.log('[INFO] Closing browser instance');
  await instance.browser.close();
};

// Main functions
export async function get(): Promise<Browser> {
  const now = Date.now();

  // Clean up old browsers
  browserPool = await Promise.all(
    browserPool.map(async (instance) => {
      if (isBrowserOld(instance, now)) {
        await closeBrowser(instance);
        return null;
      }
      return instance;
    }),
  ).then((instances) =>
    instances.filter(
      (instance): instance is BrowserInstance => instance !== null,
    ),
  );

  // Try to find an available browser
  const availableBrowser = browserPool.find((instance) => !instance.isInUse);
  if (availableBrowser) {
    availableBrowser.isInUse = true;
    availableBrowser.lastUsed = now;
    return availableBrowser.browser;
  }

  // Create new browser if none available
  console.log('[INFO] Creating new browser instance');
  const browser = await chromium.launch();
  const newInstance: BrowserInstance = {
    browser,
    lastUsed: now,
    isInUse: true,
  };
  browserPool.push(newInstance);
  return browser;
}

export function release(browser: Browser): void {
  const instance = browserPool.find((i) => i.browser === browser);
  if (instance) {
    instance.isInUse = false;
    instance.lastUsed = Date.now();
  }
}

export async function cleanup(): Promise<void> {
  const now = Date.now();
  const browsersToClose = browserPool.filter((instance) =>
    isBrowserIdle(instance, now),
  );

  if (browsersToClose.length > 0) {
    console.log(
      `[INFO] Cleaning up ${browsersToClose.length} idle browser instance(s)`,
    );
    await Promise.all(browsersToClose.map(closeBrowser));
  }

  browserPool = browserPool.filter((instance) => !isBrowserIdle(instance, now));
}

export async function close(): Promise<void> {
  console.log('[INFO] Closing all browser instances...');
  await Promise.all(browserPool.map(closeBrowser));
  browserPool = [];
}
