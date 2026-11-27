import { apiClient } from "@/shared/api/apiClient";

export const rolesService = {
  getRoles: async ({ forceRefresh = false } = {}) => {
    return await apiClient.get("/roles", {
      noCache: true,
      cache: "no-store",
      ...(forceRefresh ? { params: { refresh: "true" } } : {})
    });
  },

  createRol: async (data) => {
    return await apiClient.post("/roles", data);
  },

  updateRol: async (id, data) => {
    return await apiClient.put(`/roles/${id}`, data);
  },

  updatePermisos: async (id, permisos) => {
    return await apiClient.put(`/roles/${id}/permisos`, { permisos });
  },

  deleteRol: async (id) => {
    return await apiClient.delete(`/roles/${id}`);
  }
};
