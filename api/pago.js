// Pago en línea con Mercado Pago (Checkout Pro).
// Necesita la variable MP_ACCESS_TOKEN en Vercel. Sin ella, la página no muestra los botones de pago.
import "../catalogo.js";

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

const ABONO = 10000;

export default async function handler(req, res) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (req.method === "GET") return json(res, 200, { activo: Boolean(token) });
  if (req.method !== "POST") return json(res, 405, { error: "Método no permitido" });
  if (!token) return json(res, 503, { error: "El pago en línea aún no está disponible." });

  const body = await leerCuerpo(req);
  const byId = Object.fromEntries((globalThis.CATALOGO || []).map((s) => [s.id, s]));
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ s: byId[i && i.id], qty: Math.min(10, Math.max(0, parseInt(i && i.qty, 10) || 0)) }))
    .filter((i) => i.s && i.qty > 0)
    .slice(0, 30);
  if (!items.length) return json(res, 400, { error: "El carrito está vacío." });

  const reserva = /^[a-z0-9]{6,24}$/.test(String(body.reserva || "")) ? String(body.reserva) : "";
  const unidades = items.reduce((t, i) => t + i.qty, 0);
  const detalle = items.map((i) => i.qty + " x " + i.s.nombre).join(", ").slice(0, 240);
  const mpItems = body.modo === "abono"
    ? [{ title: "Abono de reserva relieve", description: detalle, quantity: unidades, unit_price: ABONO, currency_id: "CLP" }]
    : items.map((i) => ({ id: i.s.id, title: i.s.nombre, description: i.s.detalle, quantity: i.qty, unit_price: i.s.precio, currency_id: "CLP" }));

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const base = "https://" + host;
  const pref = {
    items: mpItems,
    back_urls: { success: base + "/?pago=ok", failure: base + "/?pago=error", pending: base + "/?pago=pendiente" },
    auto_return: "approved",
    statement_descriptor: "RELIEVE",
    external_reference: (body.modo === "abono" ? "abono" : "total") + "-" + (reserva || Date.now()),
    metadata: { modo: body.modo === "abono" ? "abono" : "total", detalle, reserva },
  };
  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(pref),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.init_point) return json(res, 502, { error: "No pudimos iniciar el pago. Intenta de nuevo o escríbenos por WhatsApp." });
    return json(res, 200, { url: out.init_point });
  } catch (e) {
    return json(res, 502, { error: "No pudimos iniciar el pago. Intenta de nuevo o escríbenos por WhatsApp." });
  }
}
