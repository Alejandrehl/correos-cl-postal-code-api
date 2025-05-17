#!/usr/bin/env node
// Ejemplo de uso: node postal-code-scraper.util_2.0.js <Comuna> <Calle> <Altura>
// Ejemplo de uso: node postal-code-scraper.util_2.0.js "SANTIAGO" "AVENIDA LIBERTADOR BERNARDO OHIGGINS" 2000

const https = require("https");
const { argv, exit } = require("process");

const [, , comuna, calle, numero] = argv;

if (!comuna || !calle || !numero) {
  console.error('Uso: node postal-code-scraper.util_2.0.js <Comuna> <Calle> <Altura>');
  exit(1);
}

function obtenerDatosIniciales(debug = false) {
  return new Promise((resolve, reject) => {
    https
      .get(
        "https://www.correos.cl/codigo-postal",
        {
          headers: {
            Host: "www.correos.cl",
            "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Linux"',
            "Accept-Language": "en-US",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-User": "?1",
            "Sec-Fetch-Dest": "document",
          },
        },
        (res) => {
          let html = "";
          res.on("data", (chunk) => (html += chunk));
          res.on("end", () => {
            if (debug) {
              require("fs").writeFileSync("debug-correos.html", html);
              console.log("🔍 HTML guardado en debug-correos.html");
            }

            const portletMatch = html.match(
              /CodigoPostalPortlet_INSTANCE_([a-zA-Z0-9]+)/
            );
            const tokenMatch = html.match(/Liferay\.authToken\s*=\s*'([^']+)'/);

            if (!portletMatch || !tokenMatch) {
              return reject(
                new Error("❌ No se pudo extraer portletId o authToken")
              );
            }

            const cookies =
              res.headers["set-cookie"]
                ?.map((c) => c.split(";")[0])
                .join("; ") ?? "";

            resolve({
              portletId: portletMatch[1],
              authToken: tokenMatch[1],
              cookies,
            });
          });
        }
      )
      .on("error", reject);
  });
}

function consultarCodigoPostal() {
  obtenerDatosIniciales(/* debug */ false)
    .then(({ portletId, authToken, cookies }) => {
      const form = new URLSearchParams({
        [`_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_${portletId}_comuna`]:
          comuna.toUpperCase(),
        [`_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_${portletId}_calle`]:
          calle.toUpperCase(),
        [`_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_${portletId}_numero`]:
          numero,
        p_auth: authToken,
      }).toString();

      const options = {
        hostname: "www.correos.cl",
        path: `/codigo-postal?p_p_id=cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_${portletId}&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=COOKIES_RESOURCE_ACTION&p_p_cacheability=cacheLevelPage&_cl_cch_codigopostal_portlet_CodigoPostalPortlet_INSTANCE_${portletId}_cmd=CMD_ADD_COOKIE`,
        method: "POST",

        headers: {
          Host: "www.correos.cl",
          "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Linux"',
          "Accept-Language": "en-US",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-User": "?1",
          "Sec-Fetch-Dest": "document",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Content-Length": Buffer.byteLength(form),
          Origin: "https://www.correos.cl",
          Referer: "https://www.correos.cl/codigo-postal",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: cookies,
        },
      };

      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            const direcciones = json?.direcciones ?? [];
            const codPostal = direcciones[direcciones.length - 1]?.codPostal;
            if (codPostal) {
              console.log(codPostal);
            } else {
              console.error("⚠️ Dirección no encontrada o sin código postal.");
            }
          } catch {
            console.error(
              "❌ La respuesta no fue JSON. HTML recibido:\n",
              body.slice(0, 1000)
            );
          }
        });
      });

      req.on("error", (e) => console.error("Error en la solicitud:", e));
      req.write(form);
      req.end();
    })
    .catch((err) => {
      console.error("❌ Error crítico:", err.message);
    });
}

consultarCodigoPostal();
