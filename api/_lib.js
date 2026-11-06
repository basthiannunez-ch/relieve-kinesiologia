// Utilidades compartidas para los testimonios (no es una ruta: empieza con "_").
import { list } from "@vercel/blob";

export async function leerCarpeta(prefix) {
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) {
      try {
        const res = await fetch(b.url, { cache: "no-store" });
        if (res.ok) out.push({ ...(await res.json()), url: b.url });
      } catch (e) { /* se ignora un archivo dañado */ }
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
}

export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

export const limpiar = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
