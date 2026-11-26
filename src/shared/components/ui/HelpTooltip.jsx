import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

/**
 * Tooltip / Popover de ayuda en línea reutilizable (accesible por clic, teclado y hover).
 * Atiende la observación de ayudas contextuales en línea sin recargar la interfaz.
 */
export function HelpTooltip({
  title = "Ayuda rápida",
  text = "",
  align = "left", // "left" | "right" | "center"
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (!text) return null;

  const alignClasses =
    align === "right"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={title}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400/50"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2 ${alignClasses} z-50 w-64 sm:w-72 p-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-[11.5px] leading-relaxed shadow-xl border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150 text-left font-normal`}
        >
          {title && (
            <p className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{title}</span>
            </p>
          )}
          <p className="text-slate-200">{text}</p>
        </div>
      )}
    </span>
  );
}

export default HelpTooltip;
