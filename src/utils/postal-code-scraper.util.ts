import axios, { AxiosInstance } from 'axios';
import * as qs from 'qs';
import { normalizeText } from './normalize-text.util';
import { AppLogger } from '../common/logger/logger.service';

const logger = new AppLogger();
const CONTEXT = 'PostalCodeScraperHTTP';

/* ════════════════════════  Tipos auxiliares  ═════════════════════════════ */

type CookieJar = Record<string, string>;

interface SessionData {
  cookies: CookieJar;
  authToken: string;
}

interface CorreosDireccion {
  codPostal: string;
  // Otros campos del backend de Correos que no nos interesan:
  [key: string]: unknown;
}

interface CorreosApiResponse {
  direcciones?: CorreosDireccion[];
  currentDir?: string; // JSON serializado con codPostal
  [key: string]: unknown;
}

export interface PostalCodeResultSuccess {
  postalCode: string;
}

export interface PostalCodeResultError {
  error: string;
}

export type PostalCodeResult = PostalCodeResultSuccess | PostalCodeResultError;

/* ═════════════════════════ Helper functions ══════════════════════════════ */

function parseSetCookie(headers: string[] = []): CookieJar {
  return headers.reduce<CookieJar>((jar, raw) => {
    const [kv] = raw.split(';');
    const [k, v] = kv.split('=');
    jar[k.trim()] = v.trim();
    return jar;
  }, {});
}

function buildCookieHeader(jar: CookieJar): string {
  const keys = ['__uzma', '__uzmb', '__uzme', 'JSESSIONID', 'SERVER_ID'];
  const pairs = keys.filter((k) => jar[k]).map((k) => `${k}=${jar[k]}`);
  pairs.push('COOKIE_SUPPORT=true', 'GUEST_LANGUAGE_ID=es_ES');
  return pairs.join('; ');
}

async function startSession(): Promise<SessionData> {
  const url = 'https://www.correos.cl/codigo-postal';
  const res = await axios.get<string>(url, { timeout: 10_000 });

  const cookies = parseSetCookie(res.headers['set-cookie']);
  const match = res.data.match(/Liferay\.authToken\s*=\s*'([^']+)'/);
  if (!match?.[1]) throw new Error('authToken not found');

  return { cookies, authToken: match[1] };
}

/* ═════════════════════ Public scraper function ═══════════════════════════ */

export async function scrapePostalCode(
  commune: string,
  street: string,
  number: string,
): Promise<PostalCodeResult> {
  const com = normalizeText(commune);
  const str = normalizeText(street);
  const num = normalizeText(number);

  logger.log(`Lookup → '${com}', '${str}', '${num}'`, CONTEXT);

  let http: AxiosInstance | null = null;

  try {
    /* 1️⃣  Crea sesión & cliente Axios */
    const { cookies, authToken } = await startSession();
    http = axios.create({
      timeout: 15_000,
      headers: { Cookie: buildCookieHeader(cookies) },
    });

    /* 2️⃣  Payload x-www-form-urlencoded */
    const payload = qs.stringify({
      _cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_comuna:
        com,
      _cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_calle:
        str,
      _cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_numero:
        num,
      p_auth: authToken,
    });

    const url =
      'https://www.correos.cl/codigo-postal' +
      '?p_p_id=cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9' +
      '&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view' +
      '&p_p_resource_id=COOKIES_RESOURCE_ACTION&p_p_cacheability=cacheLevelPage' +
      '&_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_MloJQpiDsCw9_cmd=CMD_ADD_COOKIE';

    /* 3️⃣  Llama al endpoint */
    const { data } = await http.post<CorreosApiResponse>(url, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    /* 4️⃣  Extrae el código postal */
    const fromDirecciones = data.direcciones?.[0]?.codPostal;
    const fromCurrentDir = data.currentDir
      ? (JSON.parse(data.currentDir) as { codPostal?: string }).codPostal
      : undefined;

    const code = fromDirecciones ?? fromCurrentDir;

    if (code) {
      logger.log(`✔︎ Postal code → ${code}`, CONTEXT);
      return { postalCode: code };
    }

    logger.warn('Código no encontrado', CONTEXT);
    return { error: 'Postal code not found' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Scraper failed: ${msg}`, (err as Error)?.stack, CONTEXT);
    return { error: msg };
  } finally {
    http = null; // hint GC
  }
}
