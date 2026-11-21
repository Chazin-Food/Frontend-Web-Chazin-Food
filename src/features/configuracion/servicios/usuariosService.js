import { apiClient } from "@/shared/api/apiClient";

export const usuariosService = {
  getUsuarios: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined && params.page !== null) query.append("page", String(params.page));
    if (params.limit !== undefined && params.limit !== null) query.append("limit", String(params.limit));
    if (params.search && String(params.search).trim()) query.append("search", String(params.search).trim());
    if (params.rol && params.rol !== "Todos") query.append("rol", params.rol);
    if (params.estado && params.estado !== "Todos") query.append("estado", params.estado);
    const qs = query.toString();
    return await apiClient.get(`/usuarios${qs ? `?${qs}` : ""}`);
  },

  getRoles: async () => {
    return await apiClient.get("/roles");
  },

  createUsuario: async (data) => {
    return await apiClient.post("/usuarios", data);
  },

  updateUsuario: async (id, data) => {
    return await apiClient.put(`/usuarios/${id}`, data);
  },

  deleteUsuario: async (id) => {
    return await apiClient.delete(`/usuarios/${id}`);
  },

  changePassword: async (id, passwordData) => {
    return await apiClient.put(`/usuarios/${id}/password`, passwordData);
  },

  toggleEstado: async (id, nuevoEstado) => {
    return await apiClient.put(`/usuarios/${id}/estado`, { estado: nuevoEstado });
  },

  getResenasUsuario: async (idUsuario) => {
    return await apiClient.get(`/resenas/usuario/${idUsuario}`);
  }
};
