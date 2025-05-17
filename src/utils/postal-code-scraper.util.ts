import { Page } from 'playwright';
import { normalizeText } from './normalize-text.util';
import * as browserManager from './browser-manager';

function wait(seconds: number, msg = ''): Promise<void> {
  if (msg) console.log(`[WAIT] ${msg} (${seconds}s)`);
  return new Promise((res) => setTimeout(res, seconds * 1000));
}

async function autocompleteSelect(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  await page.locator(selector).click();
  await wait(0.5);
  await page.locator(selector).fill(value);
  await wait(1.2);
  await page.keyboard.press('ArrowDown');
  await wait(0.3);
  await page.keyboard.press('Enter');
  await wait(1);
}

async function ensureAutocompleteSelected(
  page: Page,
  selector: string,
  expectedValue: string,
  label: string,
  maxRetries = 2,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    await autocompleteSelect(page, selector, expectedValue);
    const actual = (await page.inputValue(selector)).trim().toUpperCase();
    console.log(`[DEBUG] Verifying ${label}: attempt ${i + 1} → '${actual}'`);
    if (actual.includes(expectedValue.toUpperCase())) return;
    console.warn(`[WARNING] ${label} value not correctly applied, retrying...`);
  }
  throw new Error(
    `Failed to select ${label} correctly after ${maxRetries} attempts.`,
  );
}

async function ensureNumberFilled(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  await page.locator(selector).fill(value);
  await wait(0.5);
  const filled = (await page.inputValue(selector)).trim();
  if (filled !== value.trim()) {
    throw new Error(
      `Number field not filled correctly: expected '${value}', got '${filled}'`,
    );
  }
}

export async function scrapePostalCode(
  commune: string,
  street: string,
  number: string,
): Promise<{ postalCode?: string; error?: string }> {
  console.log(
    `[INFO] Scraping started for: '${commune}', '${street}', '${number}'`,
  );

  const normalizedCommune = normalizeText(commune);
  const normalizedStreet = normalizeText(street);
  const normalizedNumber = normalizeText(number);

  const browser = await browserManager.get();
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    console.log('[INFO] Opening Correos de Chile postal code page...');
    await page.goto('https://www.correos.cl/codigo-postal', {
      timeout: 30000,
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('input#mini-search-form-text');
    await wait(1);

    await ensureAutocompleteSelected(
      page,
      'input#mini-search-form-text',
      normalizedCommune,
      'commune',
    );
    await ensureAutocompleteSelected(
      page,
      'input#mini-search-form-text-direcciones',
      normalizedStreet,
      'street',
    );
    await ensureNumberFilled(
      page,
      '#_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_numero',
      normalizedNumber,
    );

    await page
      .locator("label[for='mini-search-form-text']")
      .click({ force: true });
    await wait(1);

    const searchBtn = page.locator(
      '#_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_searchDirection',
    );
    for (let i = 0; i < 20; i++) {
      if (await searchBtn.isEnabled()) break;
      await wait(0.5);
      if (i === 19)
        throw new Error('Search button did not become enabled in time.');
    }

    await searchBtn.click({ force: true });
    await wait(2);

    const resultLocator = page.locator(
      '#_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_ddCodPostal',
    );
    await resultLocator.waitFor({ state: 'visible', timeout: 15000 });

    const code = (await resultLocator.innerText()).trim();
    console.log(`[INFO] Postal code retrieved: ${code}`);
    return { postalCode: code };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ERROR]', message);
    console.error(
      `[DEBUG] Scraper context → commune: '${commune}', street: '${street}', number: '${number}'`,
    );

    return { error: `Scraper failed: ${message}` };
  } finally {
    console.log('[INFO] Closing page and releasing browser...');
    if (page && !page.isClosed()) await page.close();
    browserManager.release(browser);
  }
}
