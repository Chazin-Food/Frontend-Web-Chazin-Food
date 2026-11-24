import { apiClient } from "@/shared/api/apiClient";

export const clientesService = {
  getClientes: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined && params.page !== null) query.append("page", String(params.page));
    if (params.limit !== undefined && params.limit !== null) query.append("limit", String(params.limit));
    if (params.search && String(params.search).trim()) query.append("search", String(params.search).trim());
    if (params.estado && params.estado !== "Todos") query.append("estado", params.estado);
    if (params.tipo && params.tipo !== "Todos") query.append("tipo", params.tipo);
    const qs = query.toString();
    return await apiClient.get(`/clientes${qs ? `?${qs}` : ""}`);
  },

  getStats: async () => {
    return await apiClient.get("/clientes/stats");
  },

  verificarDocumento: async (documento, tipoDocumento = "C.C.") => {
    const clean = String(documento || "").trim();
    if (!clean) return { existe: false, nombre: null };
    const qs = new URLSearchParams({
      documento: clean,
      tipoDocumento: tipoDocumento || "C.C."
    }).toString();
    try {
      const res = await apiClient.get(`/clientes/verificar-documento?${qs}`, { noCache: true });
      return {
        existe: Boolean(res?.existe || res?.exists || res?.conflict),
        nombre: res?.nombre || null,
        message: res?.message || ""
      };
    } catch (err) {
      // Respaldo inmediato contra /usuarios/verificar-documento si el endpoint dedicado aún se está desplegando
      const fallbackQs = new URLSearchParams({ numeroDocumento: clean }).toString();
      const fb = await apiClient.get(`/usuarios/verificar-documento?${fallbackQs}`, { noCache: true });
      return {
        existe: Boolean(fb?.exists || fb?.registered || fb?.conflict),
        nombre: fb?.nombre || null,
        message: fb?.message || ""
      };
    }
  },

  createCliente: async (data) => {
    return await apiClient.post("/clientes", data);
  },

  updateCliente: async (id, data) => {
    return await apiClient.put(`/clientes/${id}`, data);
  },

  deleteCliente: async (id) => {
    return await apiClient.delete(`/clientes/${id}`);
  }
};
