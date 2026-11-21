import { apiClient } from "@/shared/api/apiClient";

export const dashboardService = {
  getStats: async (params = {}) => {
    return await apiClient.get("/dashboard/stats", { params });
  },

  getVentasChart: async (params = {}) => {
    return await apiClient.get("/dashboard/ventas-chart", { params });
  },

  getProductosPopulares: async (params = {}) => {
    return await apiClient.get("/dashboard/productos-populares", { params });
  },

  getAlertasStock: async (params = {}) => {
    return await apiClient.get("/dashboard/alertas-stock", { params });
  },

  getVentasRecientes: async (params = {}) => {
    return await apiClient.get("/dashboard/ventas-recientes", { params });
  },

  getComentariosObservaciones: async (params = {}) => {
    const res = await apiClient.get("/dashboard/comentarios-observaciones", { params });
    return {
      promedioGlobal: Number(res?.promedioGlobal || 0),
      totalResenas: Number(res?.totalResenas || 0),
      resenas: Array.isArray(res?.resenas) ? res.resenas : [],
      observaciones: Array.isArray(res?.observaciones) ? res.observaciones : []
    };
  },

  getDevolucionesPendientes: async () => {
    const res = await apiClient.get("/dashboard/devoluciones-pendientes", { noCache: true });
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
  }
};
