// Panel privado: lista, aprueba o elimina testimonios. Requiere la clave ADMIN_KEY.
import { put, del } from "@vercel/blob";
import { leerCarpeta, json, leerCuerpo } from "./_lib.js";

export default async function handler(req, res) {
  const clave = String(req.headers["x-admin-key"] || "").trim();
  const real = String(process.env.ADMIN_KEY || "").trim(); // sin espacios ni saltos de línea pegados por error
  if (!real || clave !== real) return json(res, 401, { error: "Clave incorrecta" });
  try {
    if (req.method === "GET") {
      const [pendientes, aprobados] = await Promise.all([leerCarpeta("pendientes/"), leerCarpeta("aprobados/")]);
      return json(res, 200, { pendientes, aprobados });
    }
    if (req.method === "POST") {
      const { accion, url } = await leerCuerpo(req);
      const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
      if (!host.endsWith(".blob.vercel-storage.com")) return json(res, 400, { error: "Testimonio no válido" });
      if (accion === "aprobar") {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return json(res, 404, { error: "No se encontró el testimonio" });
        const data = await r.json();
        await put(`aprobados/${data.id}.json`, JSON.stringify({ ...data, aprobado: new Date().toISOString() }), { access: "public", contentType: "application/json", addRandomSuffix: true });
        await del(url);
        return json(res, 200, { ok: true });
      }
      if (accion === "eliminar") { await del(url); return json(res, 200, { ok: true }); }
      return json(res, 400, { error: "Acción no válida" });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Método no permitido" });
  } catch (e) {
    return json(res, 500, { error: "Algo falló. Intenta de nuevo." });
  }
}
