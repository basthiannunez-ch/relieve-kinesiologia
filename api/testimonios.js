// GET: testimonios aprobados. POST: deja uno nuevo "por revisar".
import { put } from "@vercel/blob";
import { leerCarpeta, json, leerCuerpo, limpiar } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = await leerCarpeta("aprobados/");
      return json(res, 200, items.map(({ nombre, texto, servicio, fecha }) => ({ nombre, texto, servicio, fecha })));
    }
    if (req.method === "POST") {
      const b = await leerCuerpo(req);
      if (b.sitio) return json(res, 200, { ok: true }); // campo trampa para bots
      const nombre = limpiar(b.nombre, 60);
      const texto = limpiar(b.texto, 800);
      const servicio = limpiar(b.servicio, 60);
      if (nombre.length < 2 || texto.length < 10) return json(res, 400, { error: "Escribe tu nombre y un testimonio de al menos 10 letras." });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const data = { id, nombre, texto, servicio, fecha: new Date().toISOString() };
      await put(`pendientes/${id}.json`, JSON.stringify(data), { access: "public", contentType: "application/json", addRandomSuffix: true });
      return json(res, 201, { ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Método no permitido" });
  } catch (e) {
    return json(res, 500, { error: "No se pudo guardar. Intenta de nuevo más tarde." });
  }
}
