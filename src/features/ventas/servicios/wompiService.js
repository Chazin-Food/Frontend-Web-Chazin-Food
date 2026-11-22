import { apiClient } from "@/shared/api/apiClient";

const WOMPI_SCRIPT_URL = "https://checkout.wompi.co/widget.js";

/**
 * Carga de forma segura el script del Widget de Wompi evitando bloqueos por scripts preexistentes
 */
export const loadWompiScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.WidgetCheckout) {
      return resolve(window.WidgetCheckout);
    }

    let checkCount = 0;
    const interval = setInterval(() => {
      checkCount++;
      if (typeof window !== "undefined" && window.WidgetCheckout) {
        clearInterval(interval);
        return resolve(window.WidgetCheckout);
      }
      if (checkCount >= 80) { // 8 segundos (80 * 100ms) - Tolerante a redes 3G lentas antes de activar fallback
        clearInterval(interval);
        reject(new Error("No se pudo inicializar la pasarela Wompi en el navegador. Revisa tu conexión o desactiva bloqueadores de anuncios."));
      }
    }, 100);

    const existingScript = document.querySelector(`script[src="${WOMPI_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (typeof window !== "undefined" && window.WidgetCheckout) {
          clearInterval(interval);
          resolve(window.WidgetCheckout);
        }
      });
      existingScript.addEventListener("error", () => {
        clearInterval(interval);
        reject(new Error("Error al descargar el script de Wompi desde Bancolombia."));
      });
    } else {
      const script = document.createElement("script");
      script.src = WOMPI_SCRIPT_URL; // Sin parámetros query para que coincida con el selector interno de Wompi
      script.async = true;
      script.onload = () => {
        if (typeof window !== "undefined" && window.WidgetCheckout) {
          clearInterval(interval);
          resolve(window.WidgetCheckout);
        }
      };
      script.onerror = () => {
        clearInterval(interval);
        reject(new Error("Error al descargar el script de Wompi desde Bancolombia."));
      };
      document.body.appendChild(script);
    }
  });
};

export const wompiService = {
  /**
   * Solicita al backend crear la intención de pago y generar la firma de integridad SHA-256
   */
  async crearIntencion(pedidoPayload) {
    return await apiClient.post("/wompi/intencion", pedidoPayload);
  },

  /**
   * Consulta en el backend el estado verificado de una transacción Wompi
   */
  async verificarTransaccion(idTransaccion) {
    return await apiClient.get(`/wompi/verificar/${encodeURIComponent(idTransaccion)}`);
  },

  /**
   * Genera el enlace de pago directo oficial de Wompi (Checkout Web sin iframe)
   */
  generarUrlDirecta({ referencia, montoEnCentavos, moneda = "COP", firma, publicKey, redirectUrl }) {
    const pubKey = publicKey || import.meta.env.VITE_WOMPI_PUBLIC_KEY;
    let url = `https://checkout.wompi.co/p/?public-key=${pubKey}&currency=${moneda}&amount-in-cents=${montoEnCentavos}&reference=${referencia}&signature:integrity=${firma}`;
    // IMPORTANTE: CloudFront bloquea con 403 cualquier URL que contenga 'localhost' en los parámetros query
    if (redirectUrl && !redirectUrl.includes("localhost") && !redirectUrl.includes("127.0.0.1")) {
      url += `&redirect-url=${encodeURIComponent(redirectUrl)}`;
    }
    return url;
  },

  /**
   * Abre el Widget oficial de Checkout de Wompi
   */
  async abrirWidget({
    referencia,
    montoEnCentavos,
    moneda = "COP",
    firma,
    publicKey,
    customerData = {},
    redirectUrl = undefined
  }) {
    const WidgetCheckout = await loadWompiScript();

    return new Promise((resolve, reject) => {
      try {
        const config = {
          currency: moneda,
          amountInCents: Number(montoEnCentavos),
          reference: String(referencia),
          publicKey: publicKey || import.meta.env.VITE_WOMPI_PUBLIC_KEY,
          signature: {
            integrity: firma
          }
        };

        // CloudFront de Wompi bloquea con 403 Forbidden URLs con localhost en query params.
        // En entorno local NUNCA debe enviarse redirectUrl; el widget entrega el resultado en su callback
        if (redirectUrl && !redirectUrl.includes("localhost") && !redirectUrl.includes("127.0.0.1")) {
          config.redirectUrl = redirectUrl;
        }

        // Solo agregar customerData si los campos son válidos y no vacíos
        const cleanCustomer = {};
        if (customerData.email && typeof customerData.email === 'string' && customerData.email.includes('@')) {
          cleanCustomer.email = customerData.email.trim();
        }
        if (customerData.nombre || customerData.fullName) {
          const name = (customerData.nombre || customerData.fullName || '').trim();
          if (name) cleanCustomer.fullName = name;
        }
        if (customerData.telefono) {
          const digits = String(customerData.telefono).replace(/\D/g, '');
          if (digits.length >= 10) {
            cleanCustomer.phoneNumber = digits.slice(-10);
            cleanCustomer.phoneNumberPrefix = "+57";
          }
        }
        if (customerData.documento && String(customerData.documento).trim()) {
          cleanCustomer.legalId = String(customerData.documento).trim();
          cleanCustomer.legalIdType = "CC";
        }

        if (Object.keys(cleanCustomer).length > 0) {
          config.customerData = cleanCustomer;
        }

        console.log("Inicializando WidgetCheckout de Wompi...", {
          referencia: config.reference,
          monto: config.amountInCents,
          moneda: config.currency,
          publicKey: config.publicKey
        });

        const cleanupClosedWompiNodes = () => {
          if (typeof document === "undefined") return;
          document
            .querySelectorAll(".waybox-backdrop.waybox-backdrop-final-close, .waybox-modal.waybox-modal-final-close")
            .forEach((el) => {
              if (el.hidden) {
                try { el.remove(); } catch (_) {}
              }
            });
          const rootEl = document.getElementById("root");
          if (rootEl && rootEl.getAttribute("aria-hidden") === "true") {
            rootEl.removeAttribute("aria-hidden");
          }
          if (document.body && document.body.style.height) {
            document.body.style.height = "";
          }
        };

        // Limpiar nodos residuales ocultos de sesiones previas del widget antes de crear una nueva instancia
        cleanupClosedWompiNodes();

        const checkout = new WidgetCheckout(config);

        let settled = false;
        let hasOpened = false;
        let observer = null;
        let pollTimer = null;
        let closeGraceTimer = null;
        let openTimeoutTimer = null;

        const cleanup = () => {
          if (observer) {
            try { observer.disconnect(); } catch (_) {}
            observer = null;
          }
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          if (closeGraceTimer) {
            clearTimeout(closeGraceTimer);
            closeGraceTimer = null;
          }
          if (openTimeoutTimer) {
            clearTimeout(openTimeoutTimer);
            openTimeoutTimer = null;
          }
        };

        const finish = (value) => {
          if (settled) return;
          settled = true;
          cleanup();
          if (value && value.status === "CLOSED_WITHOUT_RESULT") {
            cleanupClosedWompiNodes();
          }
          resolve(value);
        };

        const fail = (err) => {
          if (settled) return;
          settled = true;
          cleanup();
          cleanupClosedWompiNodes();
          reject(err);
        };

        const isBackdropOpen = () => {
          if (typeof document === "undefined") return false;
          const backdrops = document.querySelectorAll(".waybox-backdrop");
          for (const el of backdrops) {
            if (el.hidden) continue;
            if (el.classList.contains("waybox-backdrop-final-close")) continue;
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") continue;
            return true;
          }
          return false;
        };

        const evaluateBackdropState = () => {
          if (settled) return;
          const openNow = isBackdropOpen();
          if (openNow) {
            if (!hasOpened) {
              hasOpened = true;
              if (openTimeoutTimer) {
                clearTimeout(openTimeoutTimer);
                openTimeoutTimer = null;
              }
            }
            if (closeGraceTimer) {
              clearTimeout(closeGraceTimer);
              closeGraceTimer = null;
            }
          } else if (hasOpened && !closeGraceTimer) {
            // El widget de Wompi ejecuta closeModal() (anima 1000ms y luego oculta .waybox-backdrop + restaura aria-hidden)
            // sin invocar el callback de checkout.open cuando el usuario cierra con la X sin elegir medio de pago.
            // Esperamos 1050ms para que la animación/limpieza interna de Wompi termine antes de reactivar el checkout.
            closeGraceTimer = setTimeout(() => {
              if (!settled && !isBackdropOpen()) {
                finish({ status: "CLOSED_WITHOUT_RESULT" });
              }
            }, 1050);
          }
        };

        if (typeof document !== "undefined" && document.body && typeof MutationObserver !== "undefined") {
          observer = new MutationObserver(evaluateBackdropState);
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "hidden", "style"]
          });
        }

        pollTimer = setInterval(evaluateBackdropState, 400);

        // Si el widget jamás logra mostrarse (red bloqueada o fallo silencioso), activar fallback sin congelar UI
        openTimeoutTimer = setTimeout(() => {
          if (!settled && !hasOpened) {
            fail(new Error("El widget de Wompi tardó demasiado en responder."));
          }
        }, 20000);

        checkout.open(async (result) => {
          console.log("Resultado retornado por Wompi Widget:", result);
          const transaction = result ? result.transaction : null;
          if (!transaction) {
            return finish({ status: "CLOSED_WITHOUT_RESULT" });
          }
          finish(transaction);
        });

        // Evaluar inmediatamente porque checkout.open quita [hidden] del backdrop de forma síncrona
        evaluateBackdropState();
      } catch (err) {
        console.error("Error inicializando WidgetCheckout:", err);
        reject(err);
      }
    });
  }
};
