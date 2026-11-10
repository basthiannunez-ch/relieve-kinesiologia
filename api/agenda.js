// Agenda pública. GET: horas libres desde hoy hasta fin de 2027. POST: solicita una reserva (queda por confirmar).
import { put } from "@vercel/blob";
import "../catalogo.js";
import { json, leerCuerpo, limpiar } from "./_lib.js";
import { leerAgenda, horasLibres, cabe, fechaValida, pad, FIN, HORA_MIN, HORA_MAX } from "./_agenda.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const libres = horasLibres(await leerAgenda());
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=20, stale-while-revalidate=40");
      res.statusCode = 200;
      return res.end(JSON.stringify({ libres, fin: FIN }));
    }
    if (req.method === "POST") {
      const b = await leerCuerpo(req);
      if (b.sitio) return json(res, 200, { ok: true }); // campo trampa para bots
      const byId = Object.fromEntries(globalThis.CATALOGO.map((s) => [s.id, s]));
      const items = (Array.isArray(b.items) ? b.items : [])
        .map((i) => ({ id: i && i.id, qty: Math.min(10, Math.max(0, parseInt(i && i.qty, 10) || 0)) }))
        .filter((i) => byId[i.id] && i.qty > 0).slice(0, 30);
      if (!items.length) return json(res, 400, { error: "Tu carrito está vacío." });
      const { minutos, bloques } = globalThis.calcularBloques(items);
      if (bloques > 6) return json(res, 400, { error: "Tu pedido necesita más de 6 horas. Escríbenos por WhatsApp y lo coordinamos." });
      const nombre = limpiar(b.nombre, 60), telefono = limpiar(b.telefono, 30), nota = limpiar(b.nota, 400);
      if (nombre.length < 2) return json(res, 400, { error: "Escribe tu nombre." });
      if (telefono.replace(/\D/g, "").length < 8) return json(res, 400, { error: "Escribe un teléfono o WhatsApp válido." });
      const fecha = String(b.fecha || ""), hora = parseInt(b.hora, 10);
      if (!fechaValida(fecha) || !(hora >= HORA_MIN && hora <= HORA_MAX)) return json(res, 400, { error: "Elige un día y una hora." });

      const libres = horasLibres(await leerAgenda());
      if (!libres[fecha] || !cabe(libres[fecha], hora, bloques)) return json(res, 409, { error: "Esa hora se acaba de ocupar. Elige otra, por favor." });

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      const data = {
        id, fecha, hora, bloques, minutos, nombre, telefono, nota,
        items: items.map((i) => ({ id: i.id, qty: i.qty, nombre: byId[i.id].nombre, min: byId[i.id].min, precio: byId[i.id].precio })),
        total: items.reduce((t, i) => t + byId[i.id].precio * i.qty, 0),
        creada: new Date().toISOString(),
      };
      await put(`agenda/${fecha.slice(0, 7)}/r-p-${fecha.slice(8)}-${hora}-${bloques}-${id}.json`, JSON.stringify(data), { access: "public", contentType: "application/json", addRandomSuffix: false });
      return json(res, 201, { ok: true, id, fecha, hora, bloques, desde: pad(hora) + ":00", hasta: pad(hora + bloques) + ":00" });
    }
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Método no permitido" });
  } catch (e) {
    return json(res, 500, { error: "No pudimos revisar la agenda. Intenta de nuevo o escríbenos por WhatsApp." });
  }
}
