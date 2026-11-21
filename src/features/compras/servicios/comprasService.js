import { apiClient } from "@/shared/api/apiClient";

export const comprasService = {
  getCompras: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined && params.page !== null) query.append("page", String(params.page));
    if (params.limit !== undefined && params.limit !== null) query.append("limit", String(params.limit));
    if (params.estado && params.estado !== "Todos") query.append("estado", params.estado);
    if (params.search && String(params.search).trim()) query.append("search", String(params.search).trim());
    const qs = query.toString();
    return await apiClient.get(`/compras${qs ? `?${qs}` : ""}`);
  },

  getCompraById: async (id) => {
    return await apiClient.get(`/compras/${id}`);
  },

  createCompra: async (data) => {
    return await apiClient.post("/compras", data);
  },

  updateCompra: async (id, data) => {
    return await apiClient.put(`/compras/${id}`, data);
  },

  updateEstadoCompra: async (id, estado, extraData = {}) => {
    return await apiClient.put(`/compras/${id}/estado`, { estado, ...extraData });
  },

  cancelarCompra: async (id, cancelData = {}) => {
    return await apiClient.put(`/compras/${id}/cancelar`, cancelData);
  }
};
