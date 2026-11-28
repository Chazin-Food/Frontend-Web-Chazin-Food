import { apiClient } from "@/shared/api/apiClient";

// Respaldo de continuidad con los IDs oficiales de base de datos (tabla insumo esAdicion=1)
// únicamente si el endpoint /adiciones presenta indisponibilidad temporal durante migraciones
const ADICIONES_CONTINUITY_FALLBACK = [
  { idAdicion: 17, id: 17, idInsumo: 17, nombre: "Salchicha Suiza Ahumada", precio: 2000, stock: 55, unidadMedida: "und", porcionMinimaCantidad: 1, porcionMinimaUnidad: "und", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://www.ensumesa.com/pix/ingredientes/salchichas-suizas.jpg" },
  { idAdicion: 18, id: 18, idInsumo: 18, nombre: "Tocineta Ahumada en Tiras", precio: 3500, stock: 30, unidadMedida: "kg", porcionMinimaCantidad: 1, porcionMinimaUnidad: "und", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=80" },
  { idAdicion: 19, id: 19, idInsumo: 19, nombre: "Queso Cheddar en Lonchas", precio: 2500, stock: 188, unidadMedida: "und", porcionMinimaCantidad: 1, porcionMinimaUnidad: "und", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://res.cloudinary.com/dckwtknmq/image/upload/v1788966113/ugcycexl6ja8xriso4ni.webp" },
  { idAdicion: 21, id: 21, idInsumo: 21, nombre: "Papas a la Francesa Corte Delgado", precio: 5000, stock: 45, unidadMedida: "kg", porcionMinimaCantidad: 150, porcionMinimaUnidad: "gr", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80" },
  { idAdicion: 24, id: 24, idInsumo: 24, nombre: "Cebolla Cabezona Blanca", precio: 2000, stock: 40, unidadMedida: "kg", porcionMinimaCantidad: 1, porcionMinimaUnidad: "porción", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://res.cloudinary.com/dckwtknmq/image/upload/v1788959741/dsogrxmfoohur2tscbgq.jpg" },
  { idAdicion: 25, id: 25, idInsumo: 25, nombre: "Jalapeños en Rodajas", precio: 2000, stock: 30, unidadMedida: "kg", porcionMinimaCantidad: 1, porcionMinimaUnidad: "porción", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://res.cloudinary.com/dckwtknmq/image/upload/v1788959869/sejgbjeuranc6quitnug.jpg" },
  { idAdicion: 26, id: 26, idInsumo: 26, nombre: "Salsa de Tomate Heinz", precio: 1500, stock: 35, unidadMedida: "kg", porcionMinimaCantidad: 30, porcionMinimaUnidad: "ml", estado: 1, esAdicion: 1, controlarStock: true, imagen: "" },
  { idAdicion: 27, id: 27, idInsumo: 27, nombre: "Mostaza Americana", precio: 1500, stock: 30, unidadMedida: "kg", porcionMinimaCantidad: 30, porcionMinimaUnidad: "ml", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://i.blogs.es/8674ce/salsa-de-mostaza/650_1200.jpg" },
  { idAdicion: 40, id: 40, idInsumo: 40, nombre: "Guacamole Fresco Artesanal", precio: 2500, stock: 35, unidadMedida: "kg", porcionMinimaCantidad: 50, porcionMinimaUnidad: "gr", estado: 1, esAdicion: 1, controlarStock: true, imagen: "" },
  { idAdicion: 41, id: 41, idInsumo: 41, nombre: "Suero Costeño Cremoso Artesanal", precio: 1500, stock: 35, unidadMedida: "kg", porcionMinimaCantidad: 35, porcionMinimaUnidad: "ml", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgWatVVl6qluz15bRYYJReKKv3ToT_NMnO2vZcXDByPh4o7b8iXgv5JoKaH-AKgickn_oEVxMPzAyuRvaZmbZVCPRx3810PKcs2pQHAYytIEnKkNyQ4oXgwkyo-jaWzRTFY3wJdcs03S4F6_l3uL3Jom8aXi8omkLxvTqdGQ7AsyMHlVT-FgjZJzem2bKg/s16000" },
  { idAdicion: 43, id: 43, idInsumo: 43, nombre: "Salsa de Queso Cheddar Fundido", precio: 2500, stock: 45, unidadMedida: "kg", porcionMinimaCantidad: 40, porcionMinimaUnidad: "gr", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://cdn.elcocinerocasero.com/imagen/receta/1000/2025-02-20-09-43-01/salsa-de-queso-cheddar.jpeg" },
  { idAdicion: 44, id: 44, idInsumo: 44, nombre: "Salsa BBQ Ahumada Artesanal", precio: 1500, stock: 40, unidadMedida: "kg", porcionMinimaCantidad: 35, porcionMinimaUnidad: "ml", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://http2.mlstatic.com/D_NQ_NP_935346-MCO78698224890_092024-O.webp" },
  { idAdicion: 45, id: 45, idInsumo: 45, nombre: "Salsa Tártara Casera Especial", precio: 1500, stock: 35, unidadMedida: "kg", porcionMinimaCantidad: 35, porcionMinimaUnidad: "ml", estado: 1, esAdicion: 1, controlarStock: true, imagen: "https://www.pasionthermomix.co/wp-content/uploads/2022/04/Captura-de-pantalla-2022-04-07-a-las-5.00.34-p.-m.-600x333.png" }
];

export const adicionesService = {
  getAdiciones: async () => {
    try {
      const res = await apiClient.get('/adiciones');
      if (Array.isArray(res) && res.length > 0) return res;
      if (Array.isArray(res?.data) && res.data.length > 0) return res.data;
      return Array.isArray(res) ? res : ADICIONES_CONTINUITY_FALLBACK;
    } catch (_) {
      return ADICIONES_CONTINUITY_FALLBACK;
    }
  },

  getAdicionById: async (id) => {
    return await apiClient.get(`/adiciones/${id}`);
  },

  createAdicion: async (data) => {
    return await apiClient.post('/adiciones', data);
  },

  updateAdicion: async (id, data) => {
    return await apiClient.put(`/adiciones/${id}`, data);
  },

  deleteAdicion: async (id) => {
    return await apiClient.delete(`/adiciones/${id}`);
  }
};

