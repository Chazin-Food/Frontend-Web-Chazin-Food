import { apiClient } from "@/shared/api/apiClient";
import { notifyCatalogUpdated } from "@/shared/utils/secureStorage";

export const productosService = {
  getProductos: async (params = null) => {
    const query = params && typeof params === "object"
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return await apiClient.get(`/productos${query}`);
  },

  getPapeleraProductos: async () => {
    return await apiClient.get("/productos/papelera");
  },

  getCategorias: async () => {
    return await apiClient.get("/categorias-producto");
  },

  createProducto: async (data) => {
    const res = await apiClient.post("/productos", data);
    notifyCatalogUpdated();
    return res;
  },

  updateProducto: async (id, data) => {
    const res = await apiClient.put(`/productos/${id}`, data);
    notifyCatalogUpdated();
    return res;
  },

  deleteProducto: async (id) => {
    const res = await apiClient.delete(`/productos/${id}`);
    notifyCatalogUpdated();
    return res;
  },

  restoreProducto: async (id) => {
    const res = await apiClient.put(`/productos/${id}/restaurar`);
    notifyCatalogUpdated();
    return res;
  },

  hardDeleteProducto: async (id) => {
    const res = await apiClient.delete(`/productos/${id}/fisico`);
    notifyCatalogUpdated();
    return res;
  },

  toggleVarianteEstado: async (idProducto, idVariante, estado) => {
    const res = await apiClient.patch(`/productos/${idProducto}/variantes/${idVariante}/estado`, { estado });
    notifyCatalogUpdated();
    return res;
  }
};
