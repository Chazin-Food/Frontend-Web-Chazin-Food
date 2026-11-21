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
