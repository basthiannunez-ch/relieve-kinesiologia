// Catálogo de servicios de relieve. Para cambiar un precio o agregar un servicio, edita esta lista.
// cat: "kinesiologia" | "kinestetica" | "bienestar"
window.CATALOGO = [
  { id: "kine-1", nombre: "Sesión de kinesiología", detalle: "50 min · presencial", precio: 35000, cat: "kinesiologia", claves: "dolor espalda cuello hombro lesion rehabilitacion terapia manual evaluacion" },
  { id: "kine-5", nombre: "Pack 5 sesiones de kinesiología", detalle: "$30.000 por sesión", precio: 150000, cat: "kinesiologia", claves: "pack paquete rehabilitacion" },
  { id: "kine-10", nombre: "Pack 10 sesiones de kinesiología", detalle: "$25.000 por sesión", precio: 250000, cat: "kinesiologia", claves: "pack paquete rehabilitacion" },
  { id: "kine-online", nombre: "Sesión de kinesiología online", detalle: "50 min · videollamada", precio: 25000, cat: "kinesiologia", claves: "online video llamada distancia casa" },
  { id: "grupal-2", nombre: "Kinesiología grupal 2 veces por semana", detalle: "Valor por persona · grupos de 2 a 4", precio: 120000, cat: "kinesiologia", claves: "grupo grupal ejercicio amigos" },
  { id: "grupal-3", nombre: "Kinesiología grupal 3 veces por semana", detalle: "Valor por persona · grupos de 2 a 4", precio: 150000, cat: "kinesiologia", claves: "grupo grupal ejercicio amigos" },
  { id: "grupal-4", nombre: "Kinesiología grupal 4 veces por semana", detalle: "Valor por persona · grupos de 2 a 4", precio: 180000, cat: "kinesiologia", claves: "grupo grupal ejercicio amigos" },
  { id: "facial-limpieza", nombre: "Limpieza facial profunda", detalle: "50 min · productos Cásmara", precio: 35000, cat: "kinestetica", claves: "cara rostro piel poros puntos negros estetica facial" },
  { id: "facial-drenaje", nombre: "Drenaje facial", detalle: "30 min", precio: 25000, cat: "kinestetica", claves: "cara rostro hinchazon ojeras bolsas estetica facial" },
  { id: "spa-manos", nombre: "Spa de manos premium", detalle: "Más hidratación", precio: 25000, cat: "kinestetica", claves: "manos hidratacion unas estetica" },
  { id: "spa-pies", nombre: "Spa de pies premium", detalle: "Más hidratación", precio: 30000, cat: "kinestetica", claves: "pies hidratacion estetica" },
  { id: "mani-pedi", nombre: "Manicura y pedicura simple", detalle: "Un solo color", precio: 15000, cat: "kinestetica", claves: "unas manicure pedicure esmalte manos pies" },
  { id: "reflexologia", nombre: "Reflexología", detalle: "Masaje en los pies", precio: 35000, cat: "kinestetica", claves: "pies relajacion estres" },
  { id: "reductivo", nombre: "Masaje reductivo con aparatología", detalle: "50 min · por sesión", precio: 35000, cat: "kinestetica", claves: "reducir medidas figura abdomen celulitis bajar" },
  { id: "reductivo-12", nombre: "Pack 12 sesiones reductivas", detalle: "Con aparatología", precio: 250000, cat: "kinestetica", claves: "reducir medidas figura pack paquete" },
  { id: "piedras", nombre: "Masaje con piedras calientes", detalle: "50 min", precio: 45000, cat: "bienestar", claves: "relajacion calor estres" },
  { id: "descontracturante", nombre: "Masaje descontracturante", detalle: "50 min", precio: 40000, cat: "bienestar", claves: "contractura espalda cuello dolor tension nudos" },
  { id: "relajacion", nombre: "Masaje de relajación", detalle: "50 min", precio: 35000, cat: "bienestar", claves: "relajante estres ansiedad dormir" },
  { id: "drenaje-linfatico", nombre: "Masaje de drenaje linfático", detalle: "50 min", precio: 35000, cat: "bienestar", claves: "retencion liquidos piernas hinchazon" },
  { id: "recovery", nombre: "Recovery deportivo", detalle: "50 min", precio: 35000, cat: "bienestar", claves: "deporte deportivo entrenamiento recuperacion musculos" },
  { id: "localizado", nombre: "Masaje localizado", detalle: "30 min · una zona", precio: 25000, cat: "bienestar", claves: "zona especifica cuello espalda" },
  { id: "puncion", nombre: "Punción seca", detalle: "30 min", precio: 25000, cat: "bienestar", claves: "aguja puntos gatillo dolor muscular" },
  { id: "presoterapia", nombre: "Presoterapia", detalle: "30 min", precio: 25000, cat: "bienestar", claves: "piernas circulacion botas retencion" },
];
window.CATEGORIAS = {
  kinesiologia: { nombre: "Kinesiología", url: "/kinesiologia" },
  kinestetica: { nombre: "Kinestética", url: "/kinestetica" },
  bienestar: { nombre: "Masajes y bienestar", url: "/bienestar" },
};
