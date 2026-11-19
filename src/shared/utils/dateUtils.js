/**
 * Utilidades Centralizadas de Fecha, Horas y Contadores de Tiempo (Zona Horaria: America/Bogota, UTC-5)
 * Garantiza formato de 12 Horas (AM/PM), manejo seguro de DATEONLY (sin salto -1 día)
 * y cálculo exacto de años, meses, días, horas, minutos y segundos en horario colombiano.
 */

export const COLOMBIA_TZ = "America/Bogota";
export const COLOMBIA_OFFSET = "-05:00";
export const MS_PER_DAY = 86400000;

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MESES_CORTO_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const WEEKDAY_MAP = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

/**
 * Devuelve la fecha calendario actual (o de un Date/timestamp) en Colombia como 'YYYY-MM-DD'.
 */
export function getColombiaDateISO(dateInput = new Date()) {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const safeDate = isNaN(d.getTime()) ? new Date() : d;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(safeDate);
}

/**
 * Extrae 'YYYY-MM-DD' seguro desde DATEONLY ('YYYY-MM-DD'), timestamps o Date sin desplazar -1 día.
 */
export function extractDateOnlyISO(val) {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : getColombiaDateISO(val);
  }
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    return s.slice(0, 10);
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return getColombiaDateISO(parsed);
  }
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Parsea de forma segura un valor DATEONLY ('YYYY-MM-DD') o timestamp completo,
 * evitando que 'YYYY-MM-DD' se interprete como medianoche UTC (-1 día en Colombia).
 */
export function parseDateOnlySafe(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00${COLOMBIA_OFFSET}`);
  }
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    return new Date(`${s.slice(0, 10)}T${s.slice(11)}${COLOMBIA_OFFSET}`);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Devuelve epoch ms del inicio (00:00:00.000-05:00) o fin del día (23:59:59.999-05:00) en Colombia.
 */
export function getColombiaTimestamp(dateOrIso, endOfDay = false) {
  const iso = extractDateOnlyISO(dateOrIso);
  if (!iso) return NaN;
  const suffix = endOfDay ? `T23:59:59.999${COLOMBIA_OFFSET}` : `T00:00:00.000${COLOMBIA_OFFSET}`;
  return new Date(`${iso}${suffix}`).getTime();
}

/**
 * Devuelve componentes calendario exactos en America/Bogota.
 * month: 1..12, day: 1..31, hour: 0..23, dayOfWeek: 0 (Dom) .. 6 (Sáb)
 */
export function getColombiaDateParts(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : parseDateOnlySafe(dateInput);
  if (!d || isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short"
  }).formatToParts(d);

  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10) % 24,
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    dayOfWeek: WEEKDAY_MAP[map.weekday] ?? 0
  };
}

/**
 * Suma o resta días calendario exactos sin drift de zona horaria.
 */
export function addDaysColombiaISO(dateOrIso, deltaDays = 0) {
  const iso = extractDateOnlyISO(dateOrIso);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Number(deltaDays || 0)));
  return dt.toISOString().slice(0, 10);
}

/**
 * Diferencia en días calendario entre targetVal y baseISO en Colombia (target - base).
 * Negativo: pasado/vencido. 0: vence hoy (sigue utilizable hasta 11:59 PM). Positivo: días restantes.
 */
export function diffCalendarDaysColombia(targetVal, baseISO = getColombiaDateISO()) {
  const tIso = extractDateOnlyISO(targetVal);
  const bIso = extractDateOnlyISO(baseISO);
  if (!tIso || !bIso) return null;
  const [ty, tm, td] = tIso.split("-").map(Number);
  const [by, bm, bd] = bIso.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(by, bm - 1, bd)) / MS_PER_DAY);
}

/**
 * Convierte cualquier hora o fecha a formato 12 Horas estándar (ej: "01:30 PM", "11:15 AM")
 * Admite cadenas como "14:30", "14:30:00", rangos como "13:05 – 13:22", o fechas completas ISO / Date.
 */
export function formatTime12h(timeOrDate, fallback = "12:00 PM") {
  if (!timeOrDate) return fallback;

  if (timeOrDate instanceof Date) {
    if (isNaN(timeOrDate.getTime())) return fallback;
    return timeOrDate.toLocaleTimeString("es-CO", {
      timeZone: COLOMBIA_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).replace(/a\.\s*m\./i, "AM").replace(/p\.\s*m\./i, "PM").toUpperCase();
  }

  const str = String(timeOrDate).trim();

  if (str.includes("T") || (str.includes("-") && str.includes(":"))) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("es-CO", {
        timeZone: COLOMBIA_TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).replace(/a\.\s*m\./i, "AM").replace(/p\.\s*m\./i, "PM").toUpperCase();
    }
  }

  if (str.includes("–") || (str.includes("-") && !str.includes("T"))) {
    const parts = str.split(/[–-]/);
    if (parts.length === 2 && parts[0].includes(":") && parts[1].includes(":")) {
      return `${formatSingleTime12h(parts[0].trim())} – ${formatSingleTime12h(parts[1].trim())}`;
    }
  }

  return formatSingleTime12h(str, fallback);
}

/**
 * Formatea una hora individual (ej: "14:30" -> "02:30 PM")
 */
export function formatSingleTime12h(timeStr, fallback = "12:00 PM") {
  if (!timeStr) return fallback;
  const s = String(timeStr).trim();

  if (/am|pm|a\.\s*m\.|p\.\s*m\./i.test(s)) {
    return s.replace(/a\.\s*m\./i, "AM").replace(/p\.\s*m\./i, "PM").toUpperCase();
  }

  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }

  return s || fallback;
}

/**
 * Formatea una fecha segura (DD/MM/YYYY en Colombia), sin restar 1 día a campos DATEONLY.
 */
export function formatDateSafe(dateVal, fallback = "Hoy") {
  if (!dateVal) return fallback;
  try {
    const str = typeof dateVal === "string" ? dateVal.trim() : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-");
      return `${d}/${m}/${y}`;
    }
    const d = parseDateOnlySafe(dateVal);
    if (!d || isNaN(d.getTime())) return String(dateVal).slice(0, 10) || fallback;
    return d.toLocaleDateString("es-CO", {
      timeZone: COLOMBIA_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch (e) {
    return String(dateVal).slice(0, 10) || fallback;
  }
}

/**
 * Formatea una fecha extendida en español (ej: "25 de Octubre de 2026") en horario Colombia.
 */
export function formatDateLong(dateVal, fallback = "") {
  if (!dateVal) return fallback;
  try {
    const parts = getColombiaDateParts(dateVal);
    if (!parts) return fallback;
    const mes = MESES_ES[parts.month - 1] || MESES_CORTO_ES[parts.month - 1] || "";
    return `${parts.day} de ${mes} de ${parts.year}`;
  } catch (e) {
    return fallback;
  }
}

/**
 * Formatea fecha y hora completa en 12 horas (ej: "25/10/2026 03:45 PM") en Colombia.
 */
export function formatDateTime12h(dateVal, fallback = "") {
  if (!dateVal) return fallback;
  try {
    const d = parseDateOnlySafe(dateVal);
    if (!d || isNaN(d.getTime())) return fallback;
    const fStr = d.toLocaleDateString("es-CO", {
      timeZone: COLOMBIA_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const tStr = d.toLocaleTimeString("es-CO", {
      timeZone: COLOMBIA_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).replace(/a\.\s*m\./i, "AM").replace(/p\.\s*m\./i, "PM").toUpperCase();
    return `${fStr} ${tStr}`;
  } catch (e) {
    return fallback;
  }
}

/**
 * Cálculo exacto de cuenta regresiva en vivo hasta una fecha objetivo en Colombia (-05:00).
 * Si recibe 'YYYY-MM-DD', vence a las 23:59:59.999-05:00 de ese día.
 */
export function calculateCountdown(targetDate, now = Date.now()) {
  if (!targetDate) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: true, ms: 0 };
  }

  let targetTs = 0;
  if (targetDate instanceof Date) {
    targetTs = targetDate.getTime();
  } else if (typeof targetDate === "number") {
    targetTs = targetDate;
  } else {
    const str = String(targetDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      targetTs = new Date(`${str}T23:59:59.999${COLOMBIA_OFFSET}`).getTime();
    } else if (!str.includes("T") && /^\d{4}-\d{2}-\d{2}/.test(str)) {
      targetTs = new Date(`${str.slice(0, 10)}T23:59:59.999${COLOMBIA_OFFSET}`).getTime();
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
      targetTs = new Date(`${str}${COLOMBIA_OFFSET}`).getTime();
    } else {
      targetTs = new Date(str).getTime();
    }
  }

  if (isNaN(targetTs)) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: true, ms: 0 };
  }

  const currentTs = typeof now === "number" ? now : new Date(now).getTime();
  const diff = targetTs - currentTs;

  if (diff <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: true, ms: 0 };
  }

  const totalSec = Math.floor(diff / 1000);
  const dias = Math.floor(totalSec / 86400);
  const horas = Math.floor((totalSec % 86400) / 3600);
  const minutos = Math.floor((totalSec % 3600) / 60);
  const segundos = totalSec % 60;

  return {
    dias,
    horas,
    minutos,
    segundos,
    expirado: false,
    ms: diff
  };
}

/**
 * Formatea el tiempo transcurrido de forma humana (ej: "Hace un momento", "Hace 15 min", "Hace 2h")
 */
export function formatElapsed(dateVal, now = Date.now()) {
  if (!dateVal) return "Reciente";
  const d = parseDateOnlySafe(dateVal);
  if (!d || isNaN(d.getTime())) return "Reciente";

  const currentTs = typeof now === "number" ? now : new Date(now).getTime();
  const diffSec = Math.max(0, Math.floor((currentTs - d.getTime()) / 1000));

  if (diffSec < 60) return "Hace un momento";
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ""}`.trim();
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  const years = Math.floor(days / 365);
  return `Hace ${years} año${years > 1 ? "s" : ""}`;
}

/**
 * Valida si un evento/promoción está activo y vigente en fecha/hora de Colombia (-05:00).
 */
export function isEventActiveInColombia(evt, nowMs = Date.now()) {
  if (!evt) return false;
  const isActivo = evt.estado === 1 || evt.estado === "Activo" || evt.estado === undefined || evt.estado === true;
  if (!isActivo) return false;
  const inicioISO = extractDateOnlyISO(evt.fechaInicio);
  const finISO = extractDateOnlyISO(evt.fechaFin);
  if (inicioISO && nowMs < getColombiaTimestamp(inicioISO, false)) return false;
  if (finISO && nowMs > getColombiaTimestamp(finISO, true)) return false;
  return true;
}

/**
 * Evalúa la vigencia en vivo de un evento en horario de Colombia (America/Bogota).
 */
export function evaluateEventVigencia(evt, nowMs = Date.now()) {
  if (!evt) return null;
  const inicioISO = extractDateOnlyISO(evt.fechaInicio);
  const finISO = extractDateOnlyISO(evt.fechaFin);
  const isDbActivo = evt.estado === 1 || evt.estado === "Activo" || evt.estado === true;

  if (!finISO) {
    return {
      estadoVigencia: "PERMANENTE",
      estaVigente: isDbActivo,
      diasRestantes: null,
      horasRestantes: null,
      minutosRestantes: null,
      segundosRestantes: null,
      urgente: false,
      expirado: false,
      formattedDate: "",
      label: "Vigencia Permanente",
      fechaInicio: inicioISO,
      fechaFin: null
    };
  }

  let formattedDate = "";
  const parts = finISO.split("-");
  if (parts.length === 3) {
    formattedDate = `${parseInt(parts[2], 10)} de ${MESES_CORTO_ES[parseInt(parts[1], 10) - 1] || parts[1]}`;
  }

  const todayISO = getColombiaDateISO(new Date(nowMs));
  const inicioTs = inicioISO ? getColombiaTimestamp(inicioISO, false) : null;
  const countdown = calculateCountdown(finISO, nowMs);

  if (inicioTs !== null && nowMs < inicioTs) {
    const diasInicio = Math.max(1, diffCalendarDaysColombia(inicioISO, todayISO) ?? 1);
    return {
      estadoVigencia: "PROGRAMADO",
      estaVigente: false,
      diasRestantes: Math.max(0, diffCalendarDaysColombia(finISO, todayISO) ?? 0),
      horasRestantes: countdown.horas,
      minutosRestantes: countdown.minutos,
      segundosRestantes: countdown.segundos,
      diasParaInicio: diasInicio,
      urgente: false,
      expirado: false,
      formattedDate,
      label: `Inicia en ${diasInicio} día${diasInicio !== 1 ? "s" : ""}`,
      fechaInicio: inicioISO,
      fechaFin: finISO
    };
  }

  if (countdown.expirado) {
    const calDiff = diffCalendarDaysColombia(todayISO, finISO);
    const diasExpirado = calDiff !== null && calDiff > 0 ? calDiff : 1;
    const label = calDiff === 0
      ? "Finalizado hoy"
      : `Finalizado hace ${diasExpirado} día${diasExpirado !== 1 ? "s" : ""}`;
    return {
      estadoVigencia: "EXPIRADO",
      estaVigente: false,
      diasRestantes: 0,
      horasRestantes: 0,
      minutosRestantes: 0,
      segundosRestantes: 0,
      diasExpirado,
      urgente: false,
      expirado: true,
      formattedDate,
      label,
      fechaInicio: inicioISO,
      fechaFin: finISO
    };
  }

  const diasCalendario = Math.max(0, diffCalendarDaysColombia(finISO, todayISO) ?? countdown.dias);
  const totalHoras = Math.floor(countdown.ms / 3600000);
  const urgente = diasCalendario <= 3;

  let label;
  if (totalHoras === 0) {
    label = countdown.minutos > 0
      ? `¡Termina pronto! (${countdown.minutos}m ${countdown.segundos}s restantes)`
      : `¡Últimos segundos! (${countdown.segundos}s)`;
  } else if (diasCalendario === 0 || totalHoras < 24) {
    label = `¡Termina hoy! (${totalHoras}h ${countdown.minutos}m ${countdown.segundos}s)`;
  } else if (diasCalendario === 1) {
    label = `Finaliza mañana (${totalHoras}h ${countdown.minutos}m)`;
  } else {
    label = `Quedan ${diasCalendario} días`;
  }

  return {
    estadoVigencia: "ACTIVO",
    estaVigente: isDbActivo,
    diasRestantes: diasCalendario,
    horasRestantes: totalHoras,
    minutosRestantes: countdown.minutos,
    segundosRestantes: countdown.segundos,
    urgente,
    expirado: false,
    formattedDate,
    label,
    fechaInicio: inicioISO,
    fechaFin: finISO
  };
}
