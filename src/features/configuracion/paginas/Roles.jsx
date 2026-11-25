import { useState } from "react";
import { Plus, Search, Shield, ShieldCheck, ShieldAlert, Users, LayoutGrid, List, X, Filter } from "lucide-react";
import { useRoles } from "../hooks/useRoles";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { hasPrivilege } from "@/features/configuracion/utils/privilegiosUtils";
import { RolesTable } from "../componentes/roles/RolesTable";
import { RolesGrid } from "../componentes/roles/RolesGrid";
import { RolFormView } from "../componentes/roles/RolFormView";
import { ChazinLoader } from "@/shared/components/ui/ChazinLoader";
import { useNotifications } from "@/shared/hooks/useNotifications";

const isAdministradorRol = (rol) =>
  Boolean(rol) && (String(rol.id) === "1" || (rol.nombre || "").toLowerCase() === "administrador");

export function Roles() {
  const { user } = useAuth();
  const { warning: notifWarning } = useNotifications();
  const canCreate = hasPrivilege(user, "Roles", "crear");
  const canEdit = hasPrivilege(user, "Roles", "editar");
  const canDelete = hasPrivilege(user, "Roles", "eliminar");

  const {
    roles,
    filteredRoles,
    loading,
    searchTerm,
    setSearchTerm,
    createRol,
    updateRol,
    updatePermisos,
    toggleEstadoRol,
    deleteRol
  } = useRoles();

  // Vista completa (no modal) para crear rol, editar rol o gestionar permisos
  const [activeFormView, setActiveFormView] = useState(null); // null | { mode: "create" | "edit" | "permisos", rol: object | null }
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"

  const totalRoles = roles.length;
  const rolesActivos = roles.filter((r) => r.estado === "Activo" || r.estado === 1 || r.estado === "1").length;
  const rolesInactivos = roles.filter((r) => r.estado === "Inactivo" || r.estado === 0 || r.estado === "0").length;
  const totalUsuariosAsignados = roles.reduce((acc, r) => acc + (r.usuarios || 0), 0);

  const rolesToDisplay = filteredRoles.filter((r) => {
    const hasSearch = Boolean(searchTerm && searchTerm.trim());
    if (hasSearch) return true;
    if (filterEstado === "Activo") return r.estado === "Activo" || r.estado === 1 || r.estado === "1";
    if (filterEstado === "Inactivo") return r.estado === "Inactivo" || r.estado === 0 || r.estado === "0";
    return true;
  });

  const handleOpenCreate = () => {
    setActiveFormView({ mode: "create", rol: null });
  };

  const handleOpenEdit = (rol) => {
    if (isAdministradorRol(rol)) {
      notifWarning("Rol protegido", "El rol Administrador es un rol del sistema y no se puede editar.");
      return;
    }
    setActiveFormView({ mode: "edit", rol });
  };

  const handleSaveRol = async (nombre, descripcion, permisos) => {
    let ok = false;
    if (activeFormView?.mode === "edit" && activeFormView.rol) {
      ok = await updateRol(activeFormView.rol.id, nombre, descripcion, permisos);
    } else {
      ok = await createRol(nombre, descripcion, permisos);
    }
    if (ok) {
      setActiveFormView(null);
    }
    return ok;
  };

  const handleOpenPermisos = (rol) => {
    if (isAdministradorRol(rol)) {
      notifWarning("Rol protegido", "Los permisos del rol Administrador no se pueden modificar.");
      return;
    }
    setActiveFormView({ mode: "permisos", rol });
  };

  const handleSavePermisos = async (permisos) => {
    if (activeFormView?.rol) {
      const ok = await updatePermisos(activeFormView.rol.id, permisos);
      if (ok) {
        setActiveFormView(null);
      }
      return ok;
    }
    return false;
  };

  if (activeFormView) {
    return (
      <RolFormView
        mode={activeFormView.mode}
        rol={activeFormView.rol}
        onBack={() => setActiveFormView(null)}
        onSaveRol={handleSaveRol}
        onSavePermisos={handleSavePermisos}
      />
    );
  }

  const statCards = [
    {
      id: "total",
      title: "Total Roles",
      value: totalRoles,
      subtext: "configurados",
      subtextColor: "text-gray-400 dark:text-gray-500",
      icon: Shield,
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-500 dark:text-blue-400"
    },
    {
      id: "activos",
      title: "Roles Activos",
      value: rolesActivos,
      subtext: "en operación",
      subtextColor: "text-emerald-600 dark:text-emerald-400",
      icon: ShieldCheck,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-500 dark:text-emerald-400"
    },
    {
      id: "inactivos",
      title: "Roles Inactivos",
      value: rolesInactivos,
      subtext: "deshabilitados",
      subtextColor: "text-rose-500 dark:text-rose-400",
      icon: ShieldAlert,
      bgColor: "bg-rose-50 dark:bg-rose-950/40",
      iconColor: "text-rose-500 dark:text-rose-400"
    },
    {
      id: "usuarios",
      title: "Usuarios Asignados",
      value: totalUsuariosAsignados,
      subtext: "con rol activo",
      subtextColor: "text-purple-600 dark:text-purple-400",
      icon: Users,
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      iconColor: "text-purple-500 dark:text-purple-400"
    }
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 w-full max-w-full space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Roles
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Administra los roles del personal, sus descripciones y los permisos de acceso al sistema
        </p>
      </div>

      {/* 4 Stat Cards Grid: 2x2 compacto en móvil, 4 columnas en escritorio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-2.5 sm:gap-4 transition-all hover:shadow-sm min-w-0"
            >
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center shrink-0`}>
                <IconComponent className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">
                  {card.title}
                </p>
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    {card.value}
                  </span>
                  <span className={`text-[10.5px] sm:text-xs font-medium ${card.subtextColor} truncate`}>
                    {card.subtext}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Action Bar Box - Responsive limpio sin desbordamiento ni select aplastado */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar rol..."
            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-colors placeholder:text-gray-400 outline-none"
          />
        </div>

        {/* Filter Dropdown, View Toggle & Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              aria-label="Filtrar roles por estado"
              className="flex-1 sm:flex-none min-w-0 px-3.5 sm:px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500/50 cursor-pointer outline-none font-medium"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>

            {/* Toggle View Mode */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 border border-gray-200 dark:border-gray-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Vista en tabla"
                aria-label="Vista en tabla"
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === "table" ? "bg-white dark:bg-gray-700 text-[#F05454] shadow-xs" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Vista en tarjetas"
                aria-label="Vista en tarjetas"
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === "grid" ? "bg-white dark:bg-gray-700 text-[#F05454] shadow-xs" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuevo Rol</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Indicators (#55, #56) */}
      {(filterEstado !== "Todos" || searchTerm.trim() !== "") && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Filtros activos:
          </span>
          {filterEstado !== "Todos" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-semibold">
              Estado: {filterEstado}
              <button
                type="button"
                onClick={() => setFilterEstado("Todos")}
                className="hover:text-red-800 ml-0.5"
                title="Quitar filtro de estado"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchTerm.trim() !== "" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 font-medium">
              Búsqueda: &ldquo;{searchTerm}&rdquo;
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="hover:text-slate-900 ml-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setFilterEstado("Todos");
              setSearchTerm("");
            }}
            className="text-xs text-red-500 hover:text-red-600 underline font-medium ml-2 cursor-pointer"
          >
            Restablecer todo
          </button>
        </div>
      )}

      {/* Main Content: Table by default or Grid */}
      {loading ? (
        <ChazinLoader text="CARGANDO ROLES" size="md" />
      ) : viewMode === "grid" ? (
        <RolesGrid
          roles={rolesToDisplay}
          onOpenPermisos={handleOpenPermisos}
          onEdit={handleOpenEdit}
          onToggleEstado={toggleEstadoRol}
          onDelete={deleteRol}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ) : (
        <RolesTable
          roles={rolesToDisplay}
          onOpenPermisos={handleOpenPermisos}
          onEdit={handleOpenEdit}
          onToggleEstado={toggleEstadoRol}
          onDelete={deleteRol}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}

export default Roles;
