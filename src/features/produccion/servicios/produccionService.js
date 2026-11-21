import { apiClient } from "@/shared/api/apiClient";

export const produccionService = {
  getOrdenes: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined && params.page !== null) query.append("page", String(params.page));
    if (params.limit !== undefined && params.limit !== null) query.append("limit", String(params.limit));
    if (params.estado && params.estado !== "Todos") query.append("estado", params.estado);
    if (params.search && String(params.search).trim()) query.append("search", String(params.search).trim());
    const qs = query.toString();
    return await apiClient.get(`/produccion${qs ? `?${qs}` : ""}`);
  },

  createOrden: async (data) => {
    return await apiClient.post("/produccion", data);
  },

  updateEstadoOrden: async (id, estado, extraData = {}) => {
    return await apiClient.put(`/produccion/${id}/estado`, { estado, ...extraData });
  },

  deleteOrden: async (id) => {
    return await apiClient.delete(`/produccion/${id}`);
  }
};
