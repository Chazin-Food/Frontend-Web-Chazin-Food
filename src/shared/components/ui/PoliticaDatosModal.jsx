import { useState, useEffect } from "react";
import { X, ShieldCheck, FileText, CheckCircle2, Lock, AlertTriangle, Scale } from "lucide-react";

/**
 * Modal de Marco Legal: Términos y Condiciones, Política de Tratamiento de Datos Personales
 * (Ley 1581 de 2012 y Decreto 1377 de 2013 — Colombia) y Licenciamiento del Software (MIT).
 */
export function PoliticaDatosModal({
  isOpen,
  onClose,
  initialTab = "terminos", // "terminos" | "datos" | "licencia"
  onAccept
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "terminos");
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="politica-datos-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[88dvh] shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#B91C1C] via-[#D9383A] to-[#E03E3E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              {activeTab === "datos" ? (
                <ShieldCheck className="w-5 h-5" />
              ) : activeTab === "licencia" ? (
                <Scale className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 id="politica-datos-modal-title" className="text-base sm:text-lg font-extrabold leading-tight truncate">
                Marco Legal y Licenciamiento — Chazin Food
              </h3>
              <p className="text-[11px] text-white/85 truncate">
                Términos de servicio, protección de datos (Ley 1581 de 2012) y licencia de software
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana legal"
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("terminos")}
            className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "terminos"
                ? "bg-white dark:bg-gray-900 text-[#B91C1C] dark:text-red-400 shadow-xs border border-red-200 dark:border-red-900/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Términos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("datos")}
            className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "datos"
                ? "bg-white dark:bg-gray-900 text-[#B91C1C] dark:text-red-400 shadow-xs border border-red-200 dark:border-red-900/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Datos (Ley 1581)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("licencia")}
            className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "licencia"
                ? "bg-white dark:bg-gray-900 text-[#B91C1C] dark:text-red-400 shadow-xs border border-red-200 dark:border-red-900/50"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Licenciamiento</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
          {activeTab === "terminos" ? (
            <>
              <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  Condiciones Generales de Uso y Pedidos en Línea
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Al registrarte o confirmar un pedido en la plataforma web de <strong>Chazin Food</strong> (Medellín, Colombia), aceptas de manera libre, previa e informada los siguientes términos:
                </p>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  1. Registro y veracidad de la información
                </h4>
                <p>
                  El usuario se compromete a suministrar datos reales, completos y verificables (nombre, documento de identidad, correo electrónico, número de teléfono y dirección en Medellín) para la correcta emisión de comprobantes, validación de pagos y entrega del pedido.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  2. Pagos en línea y pasarela Wompi
                </h4>
                <p>
                  Los pedidos realizados desde la tienda web se procesan exclusivamente a través de la pasarela certificada <strong>Wompi (Bancolombia)</strong> mediante Nequi, PSE, Bancolombia o tarjetas débito/crédito. El estado del pago es confirmado automáticamente por Wompi; Chazin Food no almacena datos sensibles de tarjetas ni claves bancarias.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  3. Entrega a domicilio y costo de envío
                </h4>
                <p>
                  El valor mostrado en el resumen de compra corresponde exclusivamente a los productos y adiciones seleccionados. <strong>El costo del domicilio se paga por aparte</strong> directamente al domiciliario al momento de la entrega según la tarifa vigente para la zona de cobertura en Medellín. Los tiempos de preparación y entrega son estimados y pueden variar por demanda en cocina o condiciones climáticas.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  4. Cambios, devoluciones y reembolsos
                </h4>
                <p>
                  En caso de novedad comprobable con el pedido (producto incompleto, error de preparación o daño en transporte), el cliente puede reportarlo a través de los canales oficiales de atención de Chazin Food el mismo día de la entrega para gestionar reposición o devolución/reembolso conforme a la normativa de protección al consumidor (Ley 1480 de 2011).
                </p>
              </section>
            </>
          ) : activeTab === "datos" ? (
            <>
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    Autorización de Tratamiento de Datos Personales — Ley 1581 de 2012
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong> de la República de Colombia, Chazin Food actúa como Responsable del Tratamiento de los datos personales suministrados por sus clientes y usuarios.
                  </p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  1. Datos recolectados
                </h4>
                <p>
                  Recolectamos únicamente los datos necesarios para la prestación del servicio: nombres y apellidos, tipo y número de documento de identidad, correo electrónico, número telefónico de contacto, dirección de entrega e historial de pedidos y fidelización.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  2. Finalidades del tratamiento
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gestionar el registro de cuenta, autenticación y recuperación segura de acceso.</li>
                  <li>Procesar pedidos, facturación, validaciones de pago a través de Wompi y coordinación de entregas a domicilio.</li>
                  <li>Contactar al cliente por teléfono o correo ante novedades del pedido, garantías o devoluciones.</li>
                  <li>Administrar el programa de fidelización (niveles Regular, Frecuente y VIP) y beneficios aplicables.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  3. Derechos del titular (Habeas Data)
                </h4>
                <p>
                  Como titular de los datos personales tienes derecho a <strong>conocer, actualizar, rectificar y suprimir</strong> tu información personal, así como a revocar esta autorización o solicitar prueba de la misma, en cualquier momento desde tu perfil o escribiendo al canal de soporte oficial de Chazin Food.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  4. Seguridad y confidencialidad
                </h4>
                <p>
                  Chazin Food implementa medidas técnicas y administrativas (cifrado de contraseñas, control de acceso por roles y comunicaciones seguras HTTPS) para proteger tu información contra acceso no autorizado, pérdida o uso indebido. Tus datos no serán vendidos ni cedidos a terceros sin autorización expresa, salvo los necesarios para procesar pagos y entregas.
                </p>
              </section>
            </>
          ) : activeTab === "licencia" ? (
            <>
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-[#C92A2A] dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    Licencia de Software — Chazin Food Web v2.0 (MIT License)
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Copyright © 2026 <strong>Chazin Food — Equipo de Desarrollo ADSO (SENA, Medellín)</strong>. Todos los derechos morales de autor se reconocen conforme a la Ley 23 de 1982 y Decisión Andina 351 de 1993.
                  </p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  1. Condiciones de la Licencia MIT
                </h4>
                <p>
                  Se concede permiso, de forma gratuita, a cualquier persona autorizada que obtenga una copia de este software y de los archivos de documentación asociados, para utilizar, copiar, modificar, fusionar, publicar y distribuir copias del software, sujeto a conservar el aviso de derechos de autor y este aviso de permiso en todas las copias o partes sustanciales del sistema.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  2. Propiedad de marca y datos del negocio
                </h4>
                <p>
                  La licencia del código fuente no otorga derechos sobre las marcas comerciales, logotipos oficiales (<strong>Chazin Food</strong>, <strong>Saimon Bread</strong>), fotografías de catálogo ni bases de datos operativas de clientes, ventas o proveedores, los cuales son de uso exclusivo del establecimiento.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  3. Atribución de software de terceros (Open Source)
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Frontend:</strong> React, Vite, React Router, Tailwind CSS, Lucide Icons, Recharts y write-excel-file (Licencias MIT / ISC).</li>
                  <li><strong>Backend:</strong> Node.js, Express, Sequelize ORM, MySQL2, Helmet, JWT, Nodemailer y Swagger UI (Licencias MIT / Apache-2.0).</li>
                  <li><strong>Servicios integrados:</strong> Wompi (pasarela de pagos), Cloudinary (almacenamiento multimedia) y TiDB Cloud (base de datos).</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-extrabold text-gray-900 dark:text-gray-100">
                  4. Exención de garantía
                </h4>
                <p>
                  El software se proporciona &ldquo;tal cual&rdquo;, sin garantía de ningún tipo, expresa o implícita. Los autores no se responsabilizan por daños derivados de modificaciones no autorizadas o configuraciones externas de infraestructura.
                </p>
              </section>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Cerrar
          </button>
          {typeof onAccept === "function" && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose?.();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E03E3E] to-[#B91C1C] hover:from-[#C92A2A] hover:to-[#991B1B] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entendido y Aceptar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Checkbox obligatorio de aceptación de Términos y Condiciones + Política de Datos (Ley 1581)
 */
export function AceptacionLegalCheckbox({
  id = "aceptacion-legal-checkbox",
  checked = false,
  onChange,
  error = "",
  context = "checkout" // "checkout" | "register"
}) {
  const [modalState, setModalState] = useState({ open: false, tab: "terminos" });

  return (
    <div className="space-y-1.5">
      <div
        className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-colors ${
          error
            ? "bg-red-50/60 dark:bg-red-950/25 border-red-400 dark:border-red-700"
            : checked
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
            : "bg-gray-50/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={Boolean(checked)}
          onChange={(e) => onChange?.(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded text-[#E03E3E] focus:ring-[#E03E3E] accent-[#E03E3E] cursor-pointer shrink-0"
        />
        <label
          htmlFor={id}
          className="text-[11.5px] sm:text-xs text-gray-700 dark:text-gray-300 leading-snug cursor-pointer select-none"
        >
          {context === "register"
            ? "Declaro haber leído y acepto los "
            : context === "admin_register"
            ? "Confirmo que el titular autorizó el tratamiento de sus datos personales conforme a los "
            : "Confirmo que he leído y acepto los "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModalState({ open: true, tab: "terminos" });
            }}
            className="font-bold text-[#C92A2A] dark:text-red-400 underline hover:text-[#991B1B] dark:hover:text-red-300 cursor-pointer"
          >
            Términos y Condiciones
          </button>
          {" y la "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setModalState({ open: true, tab: "datos" });
            }}
            className="font-bold text-[#C92A2A] dark:text-red-400 underline hover:text-[#991B1B] dark:hover:text-red-300 cursor-pointer"
          >
            Política de Tratamiento de Datos Personales (Ley 1581 de 2012)
          </button>
          <span className="text-red-500 font-bold"> *</span>
        </label>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 px-1 animate-in fade-in">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <PoliticaDatosModal
        isOpen={modalState.open}
        initialTab={modalState.tab}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onAccept={() => onChange?.(true)}
      />
    </div>
  );
}

export default PoliticaDatosModal;
