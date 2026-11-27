import React, { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Clock, Sparkles, ShieldCheck, FileText, Scale, HelpCircle } from "lucide-react";
import logoImg from "@/shared/assets/logo_optimized.webp";
const PoliticaDatosModal = lazy(() => import("@/shared/components/ui/PoliticaDatosModal").then((m) => ({ default: m.PoliticaDatosModal })));
const AyudaEnLineaModal = lazy(() => import("@/shared/components/ui/AyudaEnLineaModal").then((m) => ({ default: m.AyudaEnLineaModal })));

export function ClienteFooter() {
  const [legalModal, setLegalModal] = useState({ open: false, tab: "terminos" });
  const [ayudaOpen, setAyudaOpen] = useState(false);

  return (
    <footer className="w-full bg-[#181615] text-stone-300 border-t border-stone-800/80 mt-16 relative overflow-hidden transition-colors">
      {/* Iluminación cálida sutil */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/[0.04] blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] p-2 shadow-sm border border-stone-700/60 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img src={logoImg} alt="Chazin Food" width="48" height="48" loading="lazy" decoding="async" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xl font-black text-[#FAF8F5] tracking-tight flex items-center gap-1.5">
                  Chazin <span className="text-[#D46A67]">Food</span>
                </span>
                <span className="text-[11px] text-stone-400 font-medium block">Sabor artesanal auténtico</span>
              </div>
            </Link>
            <p className="text-xs text-stone-400 leading-relaxed">
              Las mejores hamburguesas, perros calientes, salchipapas y comida rápida artesanal de Medellín. Calidad premium y frescura en cada mordisco.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://instagram.com/chazinfood"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Chazin Food"
                className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-600 hover:bg-stone-800 hover:text-amber-200 flex items-center justify-center text-stone-400 transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/saimonbread"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Saimon Bread"
                className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-600 hover:bg-stone-800 hover:text-amber-200 flex items-center justify-center text-stone-400 transition"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <span className="text-[11px] text-stone-400 ml-1">@chazinfood • @saimonbread</span>
            </div>
          </div>

          {/* Horario de Atención */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-200/90" /> Horario
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex justify-between py-1 border-b border-stone-800/70">
                <span>Lunes - Jueves:</span>
                <span className="font-semibold text-stone-200">4:00 PM - 11:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/70">
                <span>Viernes - Sábado:</span>
                <span className="font-semibold text-stone-200">4:00 PM - 12:00 AM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Domingos y Festivos:</span>
                <span className="font-semibold text-stone-200">4:00 PM - 11:00 PM</span>
              </div>
            </div>
          </div>

          {/* Contacto Oficial */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-200/90" /> Contacto Directo
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>Cl. 21 #80-21, Belén, Medellín, Antioquia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400/90 shrink-0" />
                <a
                  href="https://wa.me/573192028562"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition font-medium"
                >
                  +57 319 202 8562 (WhatsApp / Pedidos)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                <a
                  href="mailto:simonpaniagua2907@gmail.com"
                  className="hover:text-amber-200 transition font-medium break-all"
                >
                  simonpaniagua2907@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Redes y Marcas Aliadas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-200/90" /> Nuestras Marcas
            </h4>
            <div className="space-y-2">
              <a
                href="https://instagram.com/chazinfood"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#B83B38]/20 text-[#E06D6A] flex items-center justify-center font-bold text-xs">
                  CF
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FAF8F5] group-hover:text-amber-200 transition">Chazin Food</p>
                  <p className="text-[10px] text-stone-400">@chazinfood en Instagram</p>
                </div>
              </a>

              <a
                href="https://instagram.com/saimonbread"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-stone-700 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-200 flex items-center justify-center font-bold text-xs">
                  SB
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FAF8F5] group-hover:text-amber-200 transition">Saimon Bread</p>
                  <p className="text-[10px] text-stone-400">@saimonbread en Instagram</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p className="text-center md:text-left">
            © 2026 <strong className="text-stone-200 font-semibold">Chazin Food</strong>. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-stone-400">
            <button
              type="button"
              onClick={() => setLegalModal({ open: true, tab: "terminos" })}
              className="inline-flex items-center gap-1 hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              <span>Términos y Condiciones</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setLegalModal({ open: true, tab: "datos" })}
              className="inline-flex items-center gap-1 hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>Tratamiento y Política de Datos</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setLegalModal({ open: true, tab: "licencia" })}
              className="inline-flex items-center gap-1 hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-stone-400" />
              <span>Licenciamiento</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setAyudaOpen(true)}
              className="inline-flex items-center gap-1 hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-200/80" />
              <span>Ayuda en Línea</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <span>Medellín, Colombia</span>
          </div>
        </div>
      </div>

      {legalModal.open && (
        <Suspense fallback={null}>
          <PoliticaDatosModal
            isOpen={legalModal.open}
            initialTab={legalModal.tab}
            onClose={() => setLegalModal((prev) => ({ ...prev, open: false }))}
          />
        </Suspense>
      )}

      {ayudaOpen && (
        <Suspense fallback={null}>
          <AyudaEnLineaModal
            isOpen={ayudaOpen}
            onClose={() => setAyudaOpen(false)}
            initialModule="tienda"
            audience="cliente"
          />
        </Suspense>
      )}
    </footer>
  );
}
export default ClienteFooter;
