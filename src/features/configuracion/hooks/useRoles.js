import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { rolesService } from "../servicios/rolesService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useConfirm } from "@/shared/context/ConfirmContext";
import { matchesSmartSearch, formatStatusTokens, formatIdTokens } from "@/shared/utils/searchUtils";
import { validateNombreRol } from "@/shared/utils/validationUtils";
import { AlertTriangle, CheckCircle } from "lucide-react";

const isRolActivo = (estado) =>
  estado === "Activo" ||
  estado === 1 ||
  estado === "1" ||
  estado === true ||
  String(estado || "").trim().toLowerCase() === "activo";

export function useRoles() {
  const { success, error: notifError, confirmDelete } = useNotifications();
  const { confirm } = useConfirm();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const togglingIdsRef = useRef(new Set());

  const fetchRoles = useCallback(async ({ forceRefresh = false, silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const data = await rolesService.getRoles({ forceRefresh });
      setRoles(data || []);
    } catch (err) {
      console.error(err);
      notifError("Error", err.message || "Error al cargar los roles");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const isAdministrador = (r.nombre || "").toLowerCase() === "administrador" || String(r.id || r.idRol) === "1";
      const rolAliases = isAdministrador ? "Admin Administrador Rol del Sistema Rol del sistema" : "";

      const permisosText = Array.isArray(r.permisos)
        ? r.permisos.map((p) => (typeof p === "string" ? p : p.nombre || p.permiso || "")).join(" ")
        : "";

      const privilegiosGranularesCount = (r.permisos || []).filter((p) => {
        const name = typeof p === "string" ? p : p.nombre || p.permiso || "";
        return name.includes(":");
      }).length;

      const modulosBaseCount = (r.permisos || []).filter((p) => {
        const name = typeof p === "string" ? p : p.nombre || p.permiso || "";
        return !name.includes(":") && name !== "Vendedor";
      }).length;

      const hasDesc = Boolean(r.descripcion && String(r.descripcion).trim());
      const descText = hasDesc ? `${r.descripcion} con_descripcion con descripcion` : "sin_descripcion sin descripcion";

      const numUsuarios = Number(r.usuarios ?? 0);
      const usuariosText = numUsuarios === 0
        ? "0 usuarios sin_usuarios sin usuarios"
        : `${numUsuarios} usuarios ${numUsuarios} usuario`;

      const modulosText = modulosBaseCount === 0
        ? "0 módulos 0 modulos sin_modulos sin modulos sin_permisos sin permisos"
        : `${modulosBaseCount} módulos ${modulosBaseCount} modulos ${modulosBaseCount} módulo ${modulosBaseCount} modulo ${modulosBaseCount} permisos`;

      const privilegiosText = privilegiosGranularesCount > 0
        ? `${privilegiosGranularesCount} privilegios ${privilegiosGranularesCount} privilegio privilegios`
        : "";

      return matchesSmartSearch(
        [
          r.nombre,
          rolAliases,
          descText,
          formatStatusTokens(r.estado),
          ...formatIdTokens(r.id || r.idRol),
          numUsuarios,
          String(numUsuarios),
          usuariosText,
          modulosBaseCount,
          String(modulosBaseCount),
          modulosText,
          privilegiosGranularesCount > 0 ? privilegiosGranularesCount : "",
          privilegiosText,
          permisosText
        ],
        searchTerm
      );
    });
  }, [roles, searchTerm]);

  const createRol = async (nombre, descripcion, permisos = []) => {
    try {
      const nombreRes = validateNombreRol(nombre);
      if (!nombreRes.isValid) {
        notifError("Nombre de rol inválido", nombreRes.error);
        return false;
      }
      if (!permisos || permisos.length === 0) {
        notifError("Permisos requeridos", "Debes asignar al menos un permiso o módulo al rol.");
        return false;
      }
      const created = await rolesService.createRol({
        nombre: nombre.trim(),
        descripcion: (descripcion || "").trim(),
        permisos,
        estado: "Activo"
      });
      success("Éxito", "Rol creado correctamente con sus permisos y privilegios");
      if (created && created.id) {
        setRoles((prev) => [...prev, created]);
      }
      await fetchRoles({ forceRefresh: true, silent: true });
      return true;
    } catch (err) {
      notifError("Error", err.message || "Error al crear el rol");
      return false;
    }
  };

  const updateRol = async (id, nombre, descripcion, permisos = null) => {
    const rolActual = roles.find((r) => String(r.id) === String(id));
    if (String(id) === "1" || rolActual?.nombre?.toLowerCase() === "administrador") {
      notifError("Acción no permitida", "El rol Administrador es un rol del sistema y no se puede editar.");
      return false;
    }
    try {
      const nombreRes = validateNombreRol(nombre);
      if (!nombreRes.isValid) {
        notifError("Nombre de rol inválido", nombreRes.error);
        return false;
      }
      if (permisos !== null && (!permisos || permisos.length === 0)) {
        notifError("Permisos requeridos", "El rol debe tener al menos un permiso o módulo asignado.");
        return false;
      }
      const payload = {
        nombre: nombre.trim(),
        descripcion: (descripcion || "").trim()
      };
      if (permisos !== null) {
        payload.permisos = permisos;
      }
      const updated = await rolesService.updateRol(id, payload);
      success("Éxito", "Rol actualizado correctamente");
      // Actualización optimista instantánea en el estado
      if (updated && updated.id) {
        setRoles((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? { ...r, ...updated } : r)));
      }
      await fetchRoles({ forceRefresh: true, silent: true });
      return true;
    } catch (err) {
      notifError("Error", err.message || "Error al actualizar el rol");
      return false;
    }
  };

  const updatePermisos = async (id, permisos) => {
    const rolActual = roles.find((r) => String(r.id) === String(id));
    if (String(id) === "1" || rolActual?.nombre?.toLowerCase() === "administrador") {
      notifError("Acción no permitida", "Los permisos del rol Administrador no se pueden modificar.");
      return false;
    }
    try {
      if (!permisos || permisos.length === 0) {
        notifError("Permisos requeridos", "Debes asignar al menos un permiso o módulo al rol.");
        return false;
      }
      const updated = await rolesService.updatePermisos(id, permisos);
      success("Éxito", "Permisos actualizados correctamente");
      if (updated && updated.id) {
        setRoles((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? { ...r, ...updated } : r)));
      }
      await fetchRoles({ forceRefresh: true, silent: true });
      return true;
    } catch (err) {
      notifError("Error", err.message || "Error al actualizar permisos");
      return false;
    }
  };

  const toggleEstadoRol = async (id) => {
    const idKey = String(id);
    if (togglingIdsRef.current.has(idKey)) return false;

    const rolActual = roles.find((r) => String(r.id) === idKey);
    if (!rolActual) return false;
    const nombreNorm = String(rolActual.nombre || "").trim().toLowerCase();
    if (nombreNorm === "administrador" || nombreNorm === "admin" || idKey === "1") {
      notifError("Acción no permitida", "El rol Administrador debe permanecer activo y no se puede desactivar.");
      return false;
    }
    const isActivoActual = isRolActivo(rolActual.estado);
    const nuevoEstado = isActivoActual ? "Inactivo" : "Activo";
    const isInactivar = nuevoEstado === "Inactivo";

    const confirmed = await confirm({
      type: isInactivar ? "danger" : "success",
      icon: isInactivar ? AlertTriangle : CheckCircle,
      title: isInactivar
        ? `¿Deseas inactivar el rol ${rolActual.nombre}?`
        : `¿Deseas activar el rol ${rolActual.nombre}?`,
      message: isInactivar
        ? `El rol quedará inactivo y los usuarios asociados no podrán acceder a sus módulos hasta que sea activado nuevamente.`
        : `El rol volverá a estar habilitado para sus usuarios con sus permisos configurados.`,
      confirmText: isInactivar ? "Inactivar" : "Activar",
      cancelText: "Cancelar"
    });

    if (!confirmed) return false;

    togglingIdsRef.current.add(idKey);
    try {
      const updated = await rolesService.updateRol(rolActual.id, { estado: nuevoEstado });
      const estadoFinal = updated?.estado ? (isRolActivo(updated.estado) ? "Activo" : "Inactivo") : nuevoEstado;
      setRoles((prev) =>
        prev.map((r) =>
          String(r.id) === idKey
            ? {
                ...r,
                ...(updated && typeof updated === "object" ? updated : {}),
                estado: estadoFinal
              }
            : r
        )
      );
      success("Estado Cambiado", `El rol "${rolActual.nombre}" ahora está ${estadoFinal}`);
      await fetchRoles({ forceRefresh: true, silent: true });
      return true;
    } catch (err) {
      notifError("Error", err.message || "Error al cambiar el estado del rol");
      return false;
    } finally {
      togglingIdsRef.current.delete(idKey);
    }
  };

  const deleteRol = async (id, nombre) => {
    const targetRol = roles.find((r) => r.id === id || r.nombre?.toLowerCase() === nombre?.toLowerCase());
    if (targetRol && (targetRol.nombre?.toLowerCase() === "administrador" || String(targetRol.id) === "1")) {
      notifError("Acción no permitida", "El rol Administrador no se puede eliminar bajo ninguna circunstancia.");
      return false;
    }
    if (targetRol && (targetRol.usuarios || 0) > 0) {
      notifError(
        "No se puede eliminar",
        `El rol "${targetRol.nombre}" no se puede eliminar porque tiene ${targetRol.usuarios} usuario(s) asociado(s). Debes reasignar o cambiar de rol a dichos usuarios antes de eliminarlo.`
      );
      return false;
    }
    const confirmed = await confirmDelete(
      `¿Eliminar rol ${nombre}?`,
      "Esta acción no se puede deshacer."
    );
    if (!confirmed) return false;
    try {
      await rolesService.deleteRol(id);
      success("Éxito", "Rol eliminado correctamente");
      await fetchRoles({ forceRefresh: true, silent: true });
      return true;
    } catch (err) {
      notifError("Error", err.message || "Error al eliminar el rol");
      return false;
    }
  };

  return {
    roles,
    filteredRoles,
    loading,
    searchTerm,
    setSearchTerm,
    refetch: fetchRoles,
    createRol,
    updateRol,
    updatePermisos,
    toggleEstadoRol,
    deleteRol
  };
}
