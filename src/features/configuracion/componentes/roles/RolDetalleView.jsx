import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  Shield,
  Users,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Layers,
  ShieldCheck,
  Info
} from "lucide-react";
import {
  GRUPOS_PERMISOS,
  ACCIONES_PRIVILEGIOS,
  TOTAL_MODULOS,
  parsePermisosYPrivilegios
} from "../../utils/privilegiosUtils";
import { matchesSmartSearch } from "@/shared/utils/searchUtils";

export function RolDetalleView({
  rol,
  canEdit = false,
  onBack,
  onEdit
}) {
  const [searchFilter, setSearchFilter] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [rol]);

  const nombreNorm = String(rol?.nombre || "").trim().toLowerCase();
  const isAdministrador =
    Boolean(rol) &&
    (nombreNorm === "administrador" || nombreNorm === "admin" || String(rol.id) === "1");
  const isActivo =
    rol?.estado === "Activo" || rol?.estado === 1 || rol?.estado === "1";

  const stateMap = useMemo(() => {
    if (isAdministrador) {
      const fullMap = {};
      GRUPOS_PERMISOS.forEach((g) => {
        if (!g.isGroup) {
          fullMap[g.permiso] = { activo: true, privilegios: { ver: true } };
        } else {
          g.subPermisos.forEach((sub) => {
            const acciones = sub.accionesDisponibles || ["ver", "crear", "editar", "eliminar"];
            const privs = {};
            acciones.forEach((a) => {
              privs[a] = true;
            });
            fullMap[sub.id] = { activo: true, privilegios: privs };
          });
        }
      });
      return fullMap;
    }
    return parsePermisosYPrivilegios(rol?.permisos || []);
  }, [rol?.permisos, isAdministrador]);

  const stats = useMemo(() => {
    let modulosActivos = 0;
    let privilegiosActivos = 0;

    Object.values(stateMap).forEach((mod) => {
      if (mod?.activo) {
        modulosActivos += 1;
        Object.values(mod.privilegios || {}).forEach((enabled) => {
          if (enabled) privilegiosActivos += 1;
        });
      }
    });

    return { modulosActivos, privilegiosActivos };
  }, [stateMap]);

  const gruposFiltrados = useMemo(() => {
    const query = searchFilter.trim();
    return GRUPOS_PERMISOS.map((grupo) => {
      if (!grupo.isGroup) {
        const modState = stateMap[grupo.permiso] || { activo: false, privilegios: {} };
        if (showOnlyActive && !modState.activo) return null;
        if (query && !matchesSmartSearch([grupo.nombre, grupo.descripcion], query)) return null;
        return grupo;
      }

      const matchedSubs = grupo.subPermisos.filter((sub) => {
        const subState = stateMap[sub.id] || { activo: false, privilegios: {} };
        if (showOnlyActive && !subState.activo) return false;
        if (!query) return true;
        return matchesSmartSearch([grupo.nombre, sub.nombre, sub.descripcion], query);
      });

      if (matchedSubs.length === 0) return null;
      return {
        ...grupo,
        subPermisos: matchedSubs
      };
    }).filter(Boolean);
  }, [stateMap, searchFilter, showOnlyActive]);

  if (!rol) return null;

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

        {!isAdministrador && canEdit && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(rol)}
            className="px-5 py-2 rounded-2xl text-white text-xs sm:text-sm font-bold bg-[#F05454] hover:bg-[#d94444] transition-all shadow-sm flex items-center gap-2 cursor-pointer self-end sm:self-auto"
          >
            <Edit className="w-4 h-4 stroke-[2.2]" />
            <span>Editar Rol</span>
          </button>
        )}
      </div>

      {/* Tarjeta principal de información del rol */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#F05454] border border-rose-100/80 dark:border-rose-900/40 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {rol.nombre}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  ID #{rol.id}
                </span>
                {isAdministrador && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-[#F05454] border border-rose-200/70 dark:border-rose-900/60">
                    Rol del Sistema
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {rol.descripcion || "Sin descripción registrada"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start ${
              isActivo
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {isActivo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Resumen numérico del rol */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Usuarios Asignados
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {rol.usuarios || 0}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Módulos Activos
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.modulosActivos}{" "}
                <span className="text-xs font-medium text-gray-400">/ {TOTAL_MODULOS}</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Privilegios Activos
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.privilegiosActivos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de módulos y privilegios en modo solo lectura */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Módulos y Privilegios Asignados (Solo lectura)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Detalle completo de los accesos y acciones permitidas para este rol.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar módulo..."
                className="w-full sm:w-56 pl-9 pr-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F05454]/40"
              />
            </div>

            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200/80 dark:border-gray-700/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowOnlyActive(true)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  showOnlyActive
                    ? "bg-white dark:bg-gray-700 text-[#F05454] shadow-2xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                Solo activos ({stats.modulosActivos})
              </button>
              <button
                type="button"
                onClick={() => setShowOnlyActive(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  !showOnlyActive
                    ? "bg-white dark:bg-gray-700 text-[#F05454] shadow-2xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                Todos ({TOTAL_MODULOS})
              </button>
            </div>
          </div>
        </div>

        {stats.modulosActivos === 0 && showOnlyActive ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Sin módulos administrativos asignados
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Este rol no tiene acceso a módulos del panel administrativo.{" "}
              {(rol.nombre || "").toLowerCase() === "cliente"
                ? "Su acceso está orientado al portal público de clientes para realizar y consultar pedidos."
                : "Puedes cambiar a la vista 'Todos' para revisar los módulos disponibles."}
            </p>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">
            No se encontraron módulos que coincidan con &ldquo;{searchFilter}&rdquo;.
          </div>
        ) : (
          <div className="space-y-4">
            {gruposFiltrados.map((grupo) => {
              const IconComponent = grupo.icon;

              if (!grupo.isGroup) {
                const modState = stateMap[grupo.permiso] || { activo: false, privilegios: {} };
                const acciones = grupo.accionesDisponibles || ["ver"];
                return (
                  <div
                    key={grupo.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      modState.activo
                        ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/15"
                        : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20 opacity-75"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            modState.activo
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {grupo.nombre}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {grupo.descripcion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ACCIONES_PRIVILEGIOS.filter((a) => acciones.includes(a.id)).map((acc) => {
                          const enabled = Boolean(modState.activo && modState.privilegios?.[acc.id]);
                          const AccIcon = acc.icon;
                          return (
                            <span
                              key={acc.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                enabled
                                  ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <AccIcon className="w-3 h-3" />
                              <span>{acc.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={grupo.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {grupo.nombre}
                    </h3>
                    <span className="text-[11px] font-semibold text-gray-400">
                      ({grupo.subPermisos.length} módulo{grupo.subPermisos.length === 1 ? "" : "s"})
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {grupo.subPermisos.map((sub) => {
                      const subState = stateMap[sub.id] || { activo: false, privilegios: {} };
                      const acciones = sub.accionesDisponibles || ["ver", "crear", "editar", "eliminar"];
                      return (
                        <div
                          key={sub.id}
                          className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            subState.activo
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50/40 dark:bg-gray-900/40 opacity-70"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {subState.activo ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                                {sub.nombre}
                              </p>
                              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                {sub.descripcion}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            {ACCIONES_PRIVILEGIOS.filter((a) => acciones.includes(a.id)).map((acc) => {
                              const enabled = Boolean(subState.activo && subState.privilegios?.[acc.id]);
                              const AccIcon = acc.icon;
                              return (
                                <span
                                  key={acc.id}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                    enabled
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                      : "bg-gray-50 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 line-through"
                                  }`}
                                >
                                  <AccIcon className="w-3 h-3" />
                                  <span>{acc.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default RolDetalleView;
