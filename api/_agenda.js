// Utilidades de la agenda (no es una ruta: empieza con "_").
// Todo se guarda en el mismo Vercel Blob de los testimonios, dentro de la carpeta agenda/AAAA-MM/.
// El nombre de cada archivo ya trae los datos que hacen falta para calcular las horas libres:
//   agenda/2026-11/d-12-h9.10.11.17-<marca>.json   horas abiertas de ese día (lo que marca la dueña)
//   agenda/2026-11/r-p-12-9-2-<id>.json           reserva p=por confirmar / a=aceptada, día 12, 9:00, 2 bloques
import { list } from "@vercel/blob";

export const ZONA = "America/Santiago";
export const FIN = "2027-12-31";
export const HORAS_BASE = [9, 10, 11, 17, 18, 19]; // lunes a sábado 9-12 y 17-20
export const HORA_MIN = 8, HORA_MAX = 20;          // la dueña puede abrir bloques desde las 8:00 hasta las 20:00 (termina 21:00)
export const AVISO_HORAS = 24;                      // se reserva con al menos 24 h de anticipación

const RE_DIA = /^agenda\/(\d{4}-\d{2})\/d-(\d{2})-h([\d.]*)-(\d+)\.json$/;
const RE_RES = /^agenda\/(\d{4}-\d{2})\/r-([pa])-(\d{2})-(\d{1,2})-(\d)-([\w]+)\.json$/;

export const pad = (n) => String(n).padStart(2, "0");
export const diaSemana = (fecha) => { const [y, m, d] = fecha.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
export const horasBase = (fecha) => (diaSemana(fecha) === 0 ? [] : HORAS_BASE.slice());
export const fechaValida = (f) => /^\d{4}-\d{2}-\d{2}$/.test(f) && !isNaN(Date.parse(f + "T00:00:00Z")) && new Date(f + "T00:00:00Z").toISOString().slice(0, 10) === f;

// Fecha y hora actual en Chile.
export function ahora() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour), min: Number(p.minute) };
}
// Minutos "de reloj" para comparar fechas locales sin líos de zona horaria.
export const reloj = (fecha, hora, min = 0) => { const [y, m, d] = fecha.split("-").map(Number); return Date.UTC(y, m - 1, d, hora, min) / 60000; };

export function sumarDias(fecha, n) { const d = new Date(fecha + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

// Lee toda la carpeta agenda/ con una sola consulta (más páginas si hiciera falta).
export async function leerAgenda() {
  const dias = {}; const reservas = [];
  let cursor;
  do {
    const r = await list({ prefix: "agenda/", cursor, limit: 1000 });
    for (const b of r.blobs) {
      let m = RE_DIA.exec(b.pathname);
      if (m) {
        const fecha = `${m[1]}-${m[2]}`; const marca = Number(m[4]);
        const horas = m[3] ? m[3].split(".").map(Number) : [];
        (dias[fecha] ||= []).push({ horas, marca, url: b.url });
        continue;
      }
      m = RE_RES.exec(b.pathname);
      if (m) reservas.push({ estado: m[2] === "a" ? "aceptada" : "pendiente", fecha: `${m[1]}-${m[3]}`, hora: Number(m[4]), bloques: Number(m[5]), id: m[6], url: b.url, pathname: b.pathname });
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  // Si un día tiene varios archivos, vale el más nuevo.
  const ajustes = {};
  for (const [f, arr] of Object.entries(dias)) { arr.sort((a, b) => b.marca - a.marca); ajustes[f] = { horas: arr[0].horas, archivos: arr.map((x) => x.url) }; }
  return { ajustes, reservas };
}

export const horasAbiertas = (ajustes, fecha) => (ajustes[fecha] ? ajustes[fecha].horas : horasBase(fecha));

export function horasOcupadas(reservas) {
  const occ = {};
  for (const r of reservas) for (let k = 0; k < r.bloques; k++) (occ[r.fecha] ||= new Set()).add(r.hora + k);
  return occ;
}

// Horas libres por día, desde hoy hasta FIN, respetando el aviso mínimo.
export function horasLibres({ ajustes, reservas }) {
  const hoy = ahora(); const limite = reloj(hoy.fecha, hoy.hora, hoy.min) + AVISO_HORAS * 60;
  const occ = horasOcupadas(reservas); const out = {};
  for (let f = hoy.fecha; f <= FIN; f = sumarDias(f, 1)) {
    const libres = horasAbiertas(ajustes, f).filter((h) => !(occ[f] && occ[f].has(h)) && reloj(f, h) >= limite);
    if (libres.length) out[f] = libres.sort((a, b) => a - b);
  }
  return out;
}

// ¿Caben n bloques seguidos desde la hora h?
export const cabe = (libres, h, n) => { for (let k = 0; k < n; k++) if (!libres.includes(h + k)) return false; return true; };
