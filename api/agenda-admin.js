// Panel privado de la agenda. Requiere la clave ADMIN_KEY (la misma de los testimonios).
// GET: horas de cada día y reservas. POST: { accion: "dia", fecha, horas } | { accion: "aceptar"|"rechazar"|"cancelar", url }
import { put, del } from "@vercel/blob";
import { json, leerCuerpo } from "./_lib.js";
import { leerAgenda, horasAbiertas, ahora, sumarDias, fechaValida, FIN, HORAS_BASE, HORA_MIN, HORA_MAX } from "./_agenda.js";

const urlBlob = (u) => { try { return new URL(u).hostname.endsWith(".blob.vercel-storage.com"); } catch { return false; } };

export default async function handler(req, res) {
  const clave = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || clave !== process.env.ADMIN_KEY) return json(res, 401, { error: "Clave incorrecta" });
  try {
    if (req.method === "GET") {
      const ag = await leerAgenda();
      const hoy = ahora().fecha;
      const horas = {};
      for (let f = hoy; f <= FIN; f = sumarDias(f, 1)) horas[f] = horasAbiertas(ag.ajustes, f);
      const desde = sumarDias(hoy, -1);
      const reservas = (await Promise.all(ag.reservas.filter((r) => r.fecha >= desde).map(async (r) => {
        try { const x = await fetch(r.url, { cache: "no-store" }); return x.ok ? { ...(await x.json()), ...r } : r; } catch { return r; }
      }))).sort((a, b) => (a.fecha + String(a.hora).padStart(2, "0")).localeCompare(b.fecha + String(b.hora).padStart(2, "0")));
      return json(res, 200, { hoy, fin: FIN, base: HORAS_BASE, min: HORA_MIN, max: HORA_MAX, horas, reservas });
    }
    if (req.method === "POST") {
      const b = await leerCuerpo(req);
      if (b.accion === "dia") {
        if (!fechaValida(b.fecha) || b.fecha > FIN) return json(res, 400, { error: "Fecha no válida" });
        const horas = [...new Set((Array.isArray(b.horas) ? b.horas : []).map(Number).filter((h) => Number.isInteger(h) && h >= HORA_MIN && h <= HORA_MAX))].sort((x, y) => x - y);
        const ag = await leerAgenda();
        const viejos = (ag.ajustes[b.fecha] || {}).archivos || [];
        await put(`agenda/${b.fecha.slice(0, 7)}/d-${b.fecha.slice(8)}-h${horas.join(".")}-${Date.now()}.json`, JSON.stringify({ fecha: b.fecha, horas }), { access: "public", contentType: "application/json", addRandomSuffix: false });
        if (viejos.length) await del(viejos);
        return json(res, 200, { ok: true, fecha: b.fecha, horas });
      }
      if (["aceptar", "rechazar", "cancelar"].includes(b.accion)) {
        if (!urlBlob(b.url)) return json(res, 400, { error: "Reserva no válida" });
        if (b.accion === "aceptar") {
          const r = await fetch(b.url, { cache: "no-store" });
          if (!r.ok) return json(res, 404, { error: "No se encontró la reserva" });
          const data = await r.json();
          const nuevo = new URL(b.url).pathname.slice(1).replace(/\/r-p-/, "/r-a-");
          if (!nuevo.includes("/r-a-")) return json(res, 400, { error: "La reserva ya estaba aceptada" });
          await put(nuevo, JSON.stringify({ ...data, aceptada: new Date().toISOString() }), { access: "public", contentType: "application/json", addRandomSuffix: false });
        }
        await del(b.url);
        return json(res, 200, { ok: true });
      }
      return json(res, 400, { error: "Acción no válida" });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Método no permitido" });
  } catch (e) {
    return json(res, 500, { error: "Algo falló. Intenta de nuevo." });
  }
}
