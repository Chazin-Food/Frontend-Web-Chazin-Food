import { useState, useEffect } from "react";
import { ChevronLeft, Shield, Key, Check, AlertCircle, Users } from "lucide-react";
import { PermisosSelector } from "./PermisosSelector";
import { validateNombreRol } from "@/shared/utils/validationUtils";

export function RolFormView({
  mode = "create", // "create" | "edit" | "permisos"
  rol = null,
  onBack,
  onSaveRol,
  onSavePermisos
}) {
  const isPermisosOnly = mode === "permisos";
  const isEditing = mode === "edit" && Boolean(rol);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [permisos, setPermisos] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rol) {
      setNombre(rol.nombre || "");
      setDescripcion(rol.descripcion || "");
      setPermisos(rol.permisos || []);
    } else {
      setNombre("");
      setDescripcion("");
      setPermisos([]);
    }
    setErrors({});
    setTouched({});
    setValidationError("");
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [rol, mode]);

  const handleNombreChange = (val) => {
    setNombre(val);
    const res = validateNombreRol(val);
    setErrors((prev) => ({ ...prev, nombre: res.isValid ? "" : res.error }));
    if (validationError) setValidationError("");
  };

  const handleNombreBlur = () => {
    setTouched((prev) => ({ ...prev, nombre: true }));
    const res = validateNombreRol(nombre);
    setErrors((prev) => ({ ...prev, nombre: res.isValid ? "" : res.error }));
  };

  const handlePermisosChange = (nuevosPermisos) => {
    setPermisos(nuevosPermisos);
    setTouched((prev) => ({ ...prev, permisos: true }));
    const hasPermisos = nuevosPermisos && nuevosPermisos.length > 0;
    setErrors((prev) => ({
      ...prev,
      permisos: hasPermisos ? "" : "Debes asignar al menos un módulo o privilegio al rol."
    }));
    if (validationError) setValidationError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setValidationError("");

    const hasPermisos = permisos && permisos.length > 0;

    if (isPermisosOnly) {
      if (!hasPermisos) {
        const msg = "Debes asignar al menos un módulo o privilegio al rol.";
        setErrors({ permisos: msg });
        setTouched({ permisos: true });
        setValidationError(msg);
        return;
      }
      try {
        setIsSubmitting(true);
        await onSavePermisos(permisos);
      } catch (err) {
        setValidationError(err?.message || "Ocurrió un error al actualizar los permisos.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const nombreRes = validateNombreRol(nombre);
    const newErrors = {};
    if (!nombreRes.isValid) newErrors.nombre = nombreRes.error;
    if (!hasPermisos) newErrors.permisos = "Debes asignar al menos un módulo o privilegio al rol.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ nombre: true, permisos: true });
      setValidationError(newErrors.nombre || newErrors.permisos);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveRol(nombre.trim(), descripcion.trim(), permisos);
    } catch (err) {
      setValidationError(err?.message || "Ocurrió un error al procesar el rol.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isPermisosOnly
    ? `Gestionar Permisos: ${rol?.nombre || ""}`
    : isEditing
      ? `Editar Rol: ${rol?.nombre || ""}`
      : "Nuevo Rol";

  const pageSubtitle = isPermisosOnly
    ? "Configura los módulos y privilegios granulares de acceso asignados a este rol"
    : isEditing
      ? "Actualiza la información general, módulos y privilegios asignados al rol"
      : "Define el nombre del rol, su descripción y los permisos de acceso al sistema";

  const submitLabel = isPermisosOnly
    ? "Guardar Permisos"
    : isEditing
      ? "Guardar Cambios"
      : "Crear Rol";

  const isSubmitDisabled =
    isSubmitting || (!isPermisosOnly && touched.nombre && Boolean(errors.nombre));

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-150">
      {/* Barra superior de navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#F05454] dark:hover:text-[#F05454] transition-colors cursor-pointer self-start"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Volver a Gestión de Roles</span>
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="rol-form-view"
            disabled={isSubmitDisabled}
            className={`px-5 py-2 rounded-2xl text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
              isSubmitDisabled
                ? "bg-[#F05454]/60 cursor-not-allowed shadow-none"
                : "bg-[#F05454] hover:bg-[#d94444]"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Encabezado de la vista */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              isPermisosOnly
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40"
                : "bg-rose-50 dark:bg-rose-950/40 text-[#F05454] border-rose-100/80 dark:border-rose-900/40"
            }`}
          >
            {isPermisosOnly ? (
              <Key className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Shield className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {rol && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
              <Users className="w-3.5 h-3.5" />
              <span>{rol.usuarios || 0} usuario{(rol.usuarios || 0) === 1 ? "" : "s"}</span>
            </span>
          </div>
        )}
      </div>

      {/* Formulario completo en vista */}
      <form id="rol-form-view" onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
        {validationError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* SECCIÓN 1: INFORMACIÓN GENERAL (Solo en crear/editar) */}
        {!isPermisosOnly && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                1. Información General
              </h2>
              <span className="text-[11px] text-gray-400">
                Campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre del Rol <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  onBlur={handleNombreBlur}
                  className={`w-full px-4 py-2.5 rounded-2xl text-sm transition-all duration-150 font-medium outline-none ${
                    touched.nombre && errors.nombre
                      ? "border border-red-500 bg-red-50/30 text-red-900 dark:bg-red-950/20 dark:text-red-300 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                      : "border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#F05454]/40 focus:border-transparent"
                  }`}
                  placeholder="Ej. Cajero Principal"
                />
                {touched.nombre && errors.nombre && (
                  <p className="text-[11px] text-red-500 font-medium mt-1.5 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.nombre}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#F05454]/40 focus:border-transparent transition-colors font-medium outline-none"
                  placeholder="Ej. Control de caja y cobros del punto de venta"
                />
              </div>
            </div>
          </section>
        )}

        {/* SECCIÓN 2: ASIGNACIÓN DE PERMISOS Y PRIVILEGIOS */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isPermisosOnly
                ? "Asignación de Permisos y Privilegios"
                : "2. Asignación de Permisos y Privilegios"}{" "}
              <span className="text-red-500 font-bold ml-0.5">*</span>
            </h2>
            <span className="text-[11px] text-gray-400">
              (Obligatorio al menos un módulo)
            </span>
          </div>

          {touched.permisos && errors.permisos && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.permisos}</span>
            </div>
          )}

          <PermisosSelector
            value={permisos}
            scrollable={false}
            onChange={handlePermisosChange}
          />
        </section>

        {/* Barra inferior de acciones */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`px-6 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              isSubmitDisabled
                ? "bg-[#F05454]/60 cursor-not-allowed shadow-none"
                : "bg-[#F05454] hover:bg-[#d94444]"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RolFormView;
