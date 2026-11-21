import { apiClient } from "@/shared/api/apiClient";
import { notifyCatalogUpdated } from "@/shared/utils/secureStorage";

export const eventosService = {
  getEventos: async () => {
    return await apiClient.get("/eventos");
  },

  getById: async (id) => {
    return await apiClient.get(`/eventos/${id}`);
  },

  createEvento: async (data) => {
    const res = await apiClient.post("/eventos", data);
    notifyCatalogUpdated();
    return res;
  },

  updateEvento: async (id, data) => {
    const res = await apiClient.put(`/eventos/${id}`, data);
    notifyCatalogUpdated();
    return res;
  },

  deleteEvento: async (id) => {
    const res = await apiClient.delete(`/eventos/${id}`);
    notifyCatalogUpdated();
    return res;
  },

  getInsumos: async () => {
    return await apiClient.get("/insumos");
  },

  getProductos: async () => {
    return await apiClient.get("/productos");
  }
};
