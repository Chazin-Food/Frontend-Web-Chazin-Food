/**
 * Gestión centralizada, organizada y codificada de localStorage para Chazin Food Web.
 *
 * Claves consolidadas (elimina claves sueltas y evita exponer roles numéricos/PII en claro):
 *  - `cf_session`: sesión del usuario codificada (sin almacenar `idRol` numérico en claro; usa códigos opacos de rol).
 *  - `cf_cart`: referencias compactas del carrito sincronizadas con catálogo en vivo (`/api/productos`).
 *  - `cf_prefs`: preferencias de interfaz (`darkMode`, `kdsSound`, `kdsAutoFadeSec`).
 *  - `cf_client_meta`: metadatos efímeros locales (ej. historial de respaldo por usuario).
 *
 * Nota de seguridad: la autorización real siempre la impone el backend verificando el JWT firmado.
 */

const STORAGE_KEYS = {
  SESSION: "cf_session",
  CART: "cf_cart",
  PREFS: "cf_prefs",
  CLIENT_META: "cf_client_meta",
  CATALOG_VER: "cf_catalog_ver"
};

const LEGACY_KEYS = [
  "chazin_user",
  "chazin_cart",
  "chazin-dark",
  "kds_sound_enabled",
  "kds_auto_fade_sec",
  "chazin_tiempos_estados_v2",
  "chazin_modo_tiempo_entrega_v1"
];

// Códigos opacos de rol (evita persistir idRol numérico 1/2/3/4 en claro en localStorage)
const ROLE_TO_CODE = {
  1: "CF_R_A9X", // Administrador
  2: "CF_R_C4K", // Cocinero
  3: "CF_R_V7M", // Vendedor
  4: "CF_R_U2P"  // Cliente
};

const CODE_TO_ROLE = {
  CF_R_A9X: { idRol: 1, rol: "Administrador" },
  CF_R_C4K: { idRol: 2, rol: "Cocinero" },
  CF_R_V7M: { idRol: 3, rol: "Vendedor" },
  CF_R_U2P: { idRol: 4, rol: "Cliente" }
};

const CIPHER_SEED = "CF::Web::2026::StoreKey#v1";

function encodePayload(obj) {
  try {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    const keyBytes = new TextEncoder().encode(CIPHER_SEED);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 31) & 0xff);
    }
    let binary = "";
    for (let i = 0; i < out.length; i++) {
      binary += String.fromCharCode(out[i]);
    }
    return `v1.${btoa(binary)}`;
  } catch {
    return null;
  }
}

function decodePayload(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    if (!raw.startsWith("v1.")) {
      // Compatibilidad transitoria con JSON legado
      return JSON.parse(raw);
    }
    const binary = atob(raw.slice(3));
    const bytes = new Uint8Array(binary.length);
    const keyBytes = new TextEncoder().encode(CIPHER_SEED);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i) ^ keyBytes[i % keyBytes.length] ^ ((i * 31) & 0xff);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function resolveRoleCode(user) {
  const numId = Number(user?.idRol ?? user?.rolInfo?.idRol ?? 0);
  if (ROLE_TO_CODE[numId]) return ROLE_TO_CODE[numId];
  const rName = String(user?.rol || user?.rolInfo?.nombre || "").toLowerCase().trim();
  if (rName.includes("admin")) return ROLE_TO_CODE[1];
  if (rName.includes("cocin") || rName.includes("chef")) return ROLE_TO_CODE[2];
  if (rName.includes("vend") || rName.includes("caj")) return ROLE_TO_CODE[3];
  if (rName.includes("cli")) return ROLE_TO_CODE[4];
  // Rol personalizado no estándar: codificar su descriptor de forma opaca
  return numId > 0 ? `CF_R_X${(numId * 7919).toString(36).toUpperCase()}` : ROLE_TO_CODE[4];
}

function decodeRoleFromCode(code, customMeta = null) {
  if (code && CODE_TO_ROLE[code]) {
    return CODE_TO_ROLE[code];
  }
  if (typeof code === "string" && code.startsWith("CF_R_X")) {
    const parsed = parseInt(code.slice(6), 36);
    if (Number.isFinite(parsed) && parsed > 0 && parsed % 7919 === 0) {
      return {
        idRol: parsed / 7919,
        rol: customMeta?.rLabel || "Personal"
      };
    }
  }
  return { idRol: 4, rol: "Cliente" };
}

/**
 * Serializa el usuario eliminando `idRol` numérico en claro y codificando el payload en `cf_session`.
 */
export function saveSessionUser(userObj) {
  if (typeof window === "undefined" || !userObj || typeof userObj !== "object") return;
  try {
    const roleCode = resolveRoleCode(userObj);
    const {
      idRol: _omitIdRol,
      rol: _omitRol,
      rolInfo: _omitRolInfo,
      ...restUser
    } = userObj;

    const customRoleLabel =
      !CODE_TO_ROLE[roleCode]
        ? String(userObj.rol || userObj.rolInfo?.nombre || "Personal")
        : undefined;

    const storedShape = {
      ...restUser,
      rc: roleCode,
      ...(customRoleLabel ? { rl: customRoleLabel } : {}),
      ...(userObj.rolInfo?.permisos ? { rp: userObj.rolInfo.permisos } : {})
    };

    const encoded = encodePayload(storedShape);
    if (encoded) {
      localStorage.setItem(STORAGE_KEYS.SESSION, encoded);
      localStorage.removeItem("chazin_user");
    }
  } catch (e) {
    console.warn("Error guardando sesión codificada:", e);
  }
}

/**
 * Lee y decodifica la sesión desde `cf_session` (migrando automáticamente `chazin_user` si existe).
 */
export function loadSessionUser() {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) {
      const legacy = localStorage.getItem("chazin_user");
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (parsedLegacy && typeof parsedLegacy === "object") {
          saveSessionUser(parsedLegacy);
          return parsedLegacy;
        }
      }
      return null;
    }

    const decoded = decodePayload(raw);
    if (!decoded || typeof decoded !== "object") {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }

    const roleMeta = decodeRoleFromCode(decoded.rc, { rLabel: decoded.rl });
    const { rc: _rc, rl: _rl, rp: _rp, ...cleanFields } = decoded;
    return {
      ...cleanFields,
      idRol: roleMeta.idRol,
      rol: roleMeta.rol,
      rolInfo: {
        idRol: roleMeta.idRol,
        nombre: roleMeta.rol,
        ...(Array.isArray(_rp) ? { permisos: _rp } : {})
      }
    };
  } catch {
    return null;
  }
}

export function clearSessionUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem("chazin_user");
  } catch {}
}

/**
 * Preferencias de interfaz consolidadas bajo `cf_prefs` (migra claves legadas automáticamente).
 */
export function loadPrefs() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    let prefs = raw ? JSON.parse(raw) : null;
    if (!prefs || typeof prefs !== "object") {
      prefs = {};
      const legacyDark = localStorage.getItem("chazin-dark");
      const legacySound = localStorage.getItem("kds_sound_enabled");
      const legacyFade = localStorage.getItem("kds_auto_fade_sec");
      if (legacyDark !== null) prefs.darkMode = legacyDark === "true";
      if (legacySound !== null) prefs.kdsSound = legacySound !== "false";
      if (legacyFade !== null && !Number.isNaN(Number(legacyFade))) prefs.kdsAutoFadeSec = Number(legacyFade);
      if (Object.keys(prefs).length > 0) {
        localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
        localStorage.removeItem("chazin-dark");
        localStorage.removeItem("kds_sound_enabled");
        localStorage.removeItem("kds_auto_fade_sec");
      }
    }
    return prefs;
  } catch {
    return {};
  }
}

export function savePref(key, value) {
  if (typeof window === "undefined") return;
  try {
    const current = loadPrefs();
    current[key] = value;
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(current));
  } catch {}
}

/**
 * Carrito organizado y codificado bajo `cf_cart` (migra `chazin_cart` automáticamente).
 * Se resincroniza contra `/api/productos` para evitar precios, nombres o stock desactualizados.
 */
export function loadStoredCart() {
  if (typeof window === "undefined") return [];
  try {
    let raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (!raw) {
      const legacy = localStorage.getItem("chazin_cart");
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy)) {
          saveStoredCart(parsedLegacy);
          return parsedLegacy;
        }
        localStorage.removeItem("chazin_cart");
        return [];
      }
      return [];
    }
    const decoded = decodePayload(raw);
    return Array.isArray(decoded) ? decoded : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(items = []) {
  if (typeof window === "undefined") return;
  try {
    const safeList = Array.isArray(items) ? items : [];
    const encoded = encodePayload(safeList);
    if (encoded) {
      localStorage.setItem(STORAGE_KEYS.CART, encoded);
    }
    localStorage.removeItem("chazin_cart");
  } catch (e) {
    console.warn("Error guardando carrito en localStorage:", e);
  }
}

export function clearStoredCart() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem("chazin_cart");
  } catch {}
}

/**
 * Notifica a otras pestañas (Tienda / Carrito / POS) que el catálogo de productos,
 * eventos o adiciones cambió para que resincronicen precios/nombres/stock al instante.
 */
export function notifyCatalogUpdated() {
  if (typeof window === "undefined") return;
  const stamp = String(Date.now());
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG_VER, stamp);
  } catch {}
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("chazin_catalog_sync");
      bc.postMessage({ type: "CATALOG_UPDATED", at: stamp });
      bc.close();
    }
  } catch {}
}

export function subscribeCatalogUpdates(onUpdate) {
  if (typeof window === "undefined" || typeof onUpdate !== "function") return () => {};
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEYS.CATALOG_VER) {
      onUpdate();
    }
  };
  window.addEventListener("storage", handleStorage);

  let bc = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("chazin_catalog_sync");
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "CATALOG_UPDATED") onUpdate();
      };
    }
  } catch {}

  return () => {
    window.removeEventListener("storage", handleStorage);
    try {
      if (bc) bc.close();
    } catch {}
  };
}

/**
 * Metadatos locales agrupados bajo `cf_client_meta` (reemplaza avatar_<id>, chazin_orders_<id>, etc.).
 */
export function getClientMeta(section, key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENT_META);
    const meta = raw ? JSON.parse(raw) : {};
    if (meta?.[section] && Object.prototype.hasOwnProperty.call(meta[section], key)) {
      return meta[section][key];
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function setClientMeta(section, key, value) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENT_META);
    const meta = raw ? JSON.parse(raw) : {};
    if (!meta[section] || typeof meta[section] !== "object") meta[section] = {};
    if (value === undefined || value === null) {
      delete meta[section][key];
    } else {
      meta[section][key] = value;
    }
    localStorage.setItem(STORAGE_KEYS.CLIENT_META, JSON.stringify(meta));
  } catch {}
}

export function cleanupLegacyStorageKeys() {
  if (typeof window === "undefined") return;
  try {
    for (const k of LEGACY_KEYS) {
      localStorage.removeItem(k);
    }
  } catch {}
}

export { STORAGE_KEYS, ROLE_TO_CODE, encodePayload, decodePayload };
