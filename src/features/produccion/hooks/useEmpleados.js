import { useState, useEffect, useCallback, useMemo } from "react";
import { empleadosService } from "../servicios/empleadosService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { matchesSmartSearch, formatStatusTokens, formatIdTokens, formatCurrencyTokens } from "@/shared/utils/searchUtils";
import { getColombiaDateISO, extractDateOnlyISO, formatDateLong } from "@/shared/utils/dateUtils";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const EMPLEADOS_URL_DEFAULTS = {
  q: "",
  estado: "Todos",
  rol: "Todos"
};

const cleanMojibake = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã /g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã /g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‘/g, "Ñ");
};

const normalizeDate = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return extractDateOnlyISO(s) || "";
};

const sanitizeEmpleado = (emp) => {
  if (!emp) return emp;

  let estadoNormalizado = "Activo";
  if (emp.estado === "Incapacitado" || emp.estado === 2 || emp.estado === "2") {
    estadoNormalizado = "Incapacitado";
  } else if (emp.estado === 0 || emp.estado === "0" || emp.estado === "Inactivo" || emp.estado === false) {
    estadoNormalizado = "Inactivo";
  } else {
    estadoNormalizado = "Activo";
  }

  // Regla de negocio de contratación: si tiene fechaFin y ya pasó la fecha (Colombia), su contrato finalizó
  const fInicio = normalizeDate(emp.fechaInicio || emp.fechaContratacion);
  const fFin = normalizeDate(emp.fechaFin);
  const todayStr = getColombiaDateISO();
  const contratoVencido = Boolean(fFin && todayStr > fFin);

  if (contratoVencido && estadoNormalizado === "Activo") {
    estadoNormalizado = "Inactivo";
  }

  const rolLimpio = cleanMojibake(emp.cargo || emp.rol || "Cocinero");

  return {
    ...emp,
    nombre: cleanMojibake(emp.nombre),
    apellidos: cleanMojibake(emp.apellidos),
    cargo: rolLimpio,
    rol: rolLimpio,
    tipoContrato: cleanMojibake(emp.tipoContrato) || "Término Fijo",
    turno: cleanMojibake(emp.turno) || "Completo",
    direccion: cleanMojibake(emp.direccion) || "",
    fechaInicio: fInicio,
    fechaFin: fFin || null,
    fechaContratacion: fInicio,
    contratoVencido,
    estado: estadoNormalizado
  };
};

export function useEmpleados() {
  const notify = useNotifications();
  const { filters, setFilter } = useUrlFilters(EMPLEADOS_URL_DEFAULTS);
  const [empleados, setEmpleados] = useState([]);
  const [papeleraEmpleados, setPapeleraEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchTerm = filters.q;
  const filterEstado = filters.estado;
  const filterRol = filters.rol;

  const setSearchTerm = useCallback((v) => setFilter("q", v), [setFilter]);
  const setFilterEstado = useCallback((v) => setFilter("estado", v), [setFilter]);
  const setFilterRol = useCallback((v) => setFilter("rol", v), [setFilter]);

  const fetchEmpleados = useCallback(async () => {
    try {
      setLoading(true);
      const [activosData, papeleraData] = await Promise.all([
        empleadosService.getEmpleados({ papelera: false }),
        empleadosService.getEmpleados({ papelera: true }).catch(() => [])
      ]);
      setEmpleados(Array.isArray(activosData) ? activosData.map(sanitizeEmpleado) : []);
      setPapeleraEmpleados(Array.isArray(papeleraData) ? papeleraData.map(sanitizeEmpleado) : []);
    } catch (err) {
      console.error(err);
      notify.error("Error", err.message || "Error al cargar los empleados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  // Roles únicos disponibles en la organización
  const rolesDisponibles = useMemo(() => {
    const defaultRoles = ["Administrador", "Cocinero", "Vendedor"];
    const fromData = empleados.map((e) => e.rol || e.cargo).filter(Boolean);
    return Array.from(new Set([...defaultRoles, ...fromData]));
  }, [empleados]);

  // Estadísticas del módulo (KPIs)
  const stats = useMemo(() => {
    const total = empleados.length;
    const activos = empleados.filter((e) => e.estado === "Activo").length;
    const incapacitados = empleados.filter((e) => e.estado === "Incapacitado").length;
    const inactivos = empleados.filter((e) => e.estado === "Inactivo").length;
    const papelera = papeleraEmpleados.length;
    return { total, activos, incapacitados, inactivos, papelera };
  }, [empleados, papeleraEmpleados]);

  // Lista filtrada
  const filteredEmpleados = useMemo(() => {
    return empleados.filter((emp) => {
      // Filtrado por estado
      if (filterEstado !== "Todos" && emp.estado !== filterEstado) return false;

      // Filtrado por rol
      if (filterRol !== "Todos" && emp.rol !== filterRol && emp.cargo !== filterRol) return false;

      if (!searchTerm || !searchTerm.trim()) return true;

      const rawQuery = searchTerm.trim();

      const numSalario = Number(emp.salario) || 0;
      const formatCompactDate = (dateVal) => {
        if (!dateVal) return "";
        const str = String(dateVal).split("T")[0];
        const parts = str.split("-");
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return `${d}/${m}/${y} ${Number(d)}/${Number(m)}/${y} ${str}`;
        }
        return str;
      };

      const fechaInicioStr = emp.fechaInicio ? formatDateLong(emp.fechaInicio, "") : "";
      const fechaFinStr = emp.fechaFin ? formatDateLong(emp.fechaFin, "") : "";
      const fechaInicioCompact = formatCompactDate(emp.fechaInicio);
      const fechaFinCompact = formatCompactDate(emp.fechaFin);

      const rolVal = emp.rol || emp.cargo || "Cocinero";
      const turnoVal = emp.turno || "Completo";
      const rolAliases = rolVal.toLowerCase() === "administrador" ? "Admin Administrador" : rolVal;
      const tipoContratoVal = emp.tipoContrato || "Término Fijo";

      return matchesSmartSearch(
        [
          // Documento
          emp.numeroDocumento,
          emp.tipoDocumento,
          `${emp.tipoDocumento || "C.C."} ${emp.numeroDocumento || ""}`,
          `${emp.tipoDocumento || "C.C."}. ${emp.numeroDocumento || ""}`,
          // Empleado + ID
          ...formatIdTokens(emp.idEmpleado),
          emp.nombre,
          emp.apellidos,
          `${emp.nombre || ""} ${emp.apellidos || ""}`.trim(),
          // Rol y Turno (por separado y combinados exactamente como se visualizan)
          rolVal,
          rolAliases,
          emp.cargo,
          turnoVal,
          `Rol ${rolVal}`,
          `Turno ${turnoVal}`,
          `${rolVal} ${turnoVal}`,
          `Rol ${rolVal} Turno ${turnoVal}`,
          // Contacto
          emp.correo,
          emp.telefono,
          emp.telefono ? String(emp.telefono).replace(/\D/g, "") : "",
          emp.direccion,
          // Contratación (tipo y fechas en todos los formatos mostrados)
          tipoContratoVal,
          !emp.fechaFin ? "Indefinido (Indef.) Indef" : "",
          emp.fechaInicio,
          emp.fechaFin,
          fechaInicioCompact,
          fechaFinCompact,
          fechaInicioStr,
          fechaFinStr,
          emp.contratoVencido ? "Contrato Vencido Vencido" : "",
          // Estado (estricto Activo / Inactivo / Incapacitado)
          formatStatusTokens(emp.estado),
          emp.estado,
          // Salario flexible + periodicidad
          ...formatCurrencyTokens(numSalario),
          "COP Mensual",
          "Mensual"
        ],
        rawQuery
      );
    });
  }, [empleados, filterEstado, filterRol, searchTerm]);

  const createEmpleado = async (formData) => {
    try {
      await empleadosService.createEmpleado(formData);
      notify.success("Éxito", "Empleado registrado correctamente");
      await fetchEmpleados();
      return true;
    } catch (err) {
      notify.error("Error", err.response?.data?.message || err.message || "Error al registrar el empleado");
      return false;
    }
  };

  const updateEmpleado = async (id, formData) => {
    try {
      await empleadosService.updateEmpleado(id, formData);
      notify.success("Éxito", "Empleado actualizado correctamente");
      await fetchEmpleados();
      return true;
    } catch (err) {
      notify.error("Error", err.response?.data?.message || err.message || "Error al actualizar el empleado");
      return false;
    }
  };

  const deleteEmpleado = async (id) => {
    try {
      await empleadosService.deleteEmpleado(id);
      notify.success("Eliminado", "Empleado enviado a la papelera");
      await fetchEmpleados();
      return true;
    } catch (err) {
      notify.error("Error", err.response?.data?.message || err.message || "Error al eliminar el empleado");
      return false;
    }
  };

  const restoreEmpleado = async (id) => {
    try {
      await empleadosService.restoreEmpleado(id);
      notify.success("Restaurado", "Empleado restaurado con éxito");
      await fetchEmpleados();
      return true;
    } catch (err) {
      notify.error("Error", err.response?.data?.message || err.message || "Error al restaurar el empleado");
      return false;
    }
  };

  return {
    empleados,
    papeleraEmpleados,
    filteredEmpleados,
    rolesDisponibles,
    cargosDisponibles: rolesDisponibles,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterRol,
    setFilterRol,
    filterCargo: filterRol,
    setFilterCargo: setFilterRol,
    fetchEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    restoreEmpleado
  };
}
