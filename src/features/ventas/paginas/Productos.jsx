import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { Plus, Search, Package, Star, TrendingUp, Sparkles, Trash2, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { hasPrivilege } from "@/shared/utils/privilegiosUtils";
import { useProductos } from "../hooks/useProductos";
import { ProductosTable } from "../componentes/productos/ProductosTable";
import { eventosService } from "../servicios/eventosService";
import { ChazinLoader } from "@/shared/components/ui/ChazinLoader";

const PapeleraProductosView = lazy(() => import("../componentes/productos/PapeleraProductosView").then((m) => ({ default: m.PapeleraProductosView })));
const ProductoModal = lazy(() => import("../componentes/productos/ProductoModal").then((m) => ({ default: m.ProductoModal })));
const VerProductoModal = lazy(() => import("../componentes/productos/VerProductoModal").then((m) => ({ default: m.VerProductoModal })));
const EventosModal = lazy(() => import("../componentes/productos/EventosModal").then((m) => ({ default: m.EventosModal })));
const CrearEventoModal = lazy(() => import("../componentes/productos/CrearEventoModal").then((m) => ({ default: m.CrearEventoModal })));

export function Productos() {
  const { user } = useAuth();
  const canCreate = hasPrivilege(user, "Productos", "crear");
  const canEdit = hasPrivilege(user, "Productos", "editar");
  const canDelete = hasPrivilege(user, "Productos", "eliminar");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [eventosModalOpen, setEventosModalOpen] = useState(false);
  const [crearEventoModalOpen, setCrearEventoModalOpen] = useState(false);
  const [productoParaEvento, setProductoParaEvento] = useState(null);
  const [eventoParaEditar, setEventoParaEditar] = useState(null);
  const [eventos, setEventos] = useState([]);

  const {
    productos,
    papeleraProductos,
    filteredProductos,
    categorias,
    loading,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterCategoria,
    setFilterCategoria,
    filterEstado,
    setFilterEstado,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    lastDeletedProducto,
    dismissLastDeleted,
    createProducto,
    updateProducto,
    toggleEstadoProducto,
    deleteProducto,
    restoreProducto,
    deleteDefinitivoProducto,
    refetch
  } = useProductos(eventos);

  const fetchEventos = useCallback(async () => {
    try {
      const data = await eventosService.getEventos();
      setEventos(data || []);
    } catch (err) {
      console.error("Error al cargar eventos:", err);
      setEventos([]);
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = productos.length;
    const sorted = [...productos].sort((a, b) => (b.ventas || 0) - (a.ventas || 0));
    const masVendido = sorted[0] || { nombre: "—", ventas: 0 };
    const totalVendidos = productos.reduce((acc, p) => acc + (p.ventas || 0), 0);
    const eventosActivos = productos.reduce((acc, p) => acc + (p.eventos && p.eventos.length > 0 ? 1 : 0), 0);

    const masVendidoMonto = (masVendido.ventas || 0) * (Number(masVendido.precio) || 0);

    return {
      total,
      masVendidoNombre: masVendido.nombre || "—",
      masVendidoVentas: masVendido.ventas || 0,
      masVendidoMonto,
      totalVendidos,
      eventosActivos
    };
  }, [productos]);

  const handleOpenCreate = () => {
    setEditingProducto(null);
    setIsViewMode(false);
    setIsDuplicateMode(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProducto(p);
    setIsViewMode(false);
    setIsDuplicateMode(false);
    setModalOpen(true);
  };

  const handleOpenView = (p) => {
    setEditingProducto(p);
    setIsViewMode(true);
    setIsDuplicateMode(false);
    setModalOpen(true);
  };

  const handleOpenDuplicate = (p) => {
    // Generar nombre sugerido sin colisiones de nombre único
    const cleanBase = (p.nombre || "").replace(/\s*\(Copia(\s*\d+)?\)$/i, "").trim();
    const existingNames = new Set((productos || []).map((prod) => (prod.nombre || "").trim().toLowerCase()));

    let candidateName = `${cleanBase} (Copia)`;
    let counter = 2;
    while (existingNames.has(candidateName.toLowerCase())) {
      candidateName = `${cleanBase} (Copia ${counter})`;
      counter++;
    }

    const cloned = {
      ...p,
      id: null,
      idProducto: null,
      nombre: candidateName,
      originalNombre: p.nombre,
      isDuplicate: true,
      tieneVentas: false,
      ventas: 0,
      variantes: (p.variantes || []).map((v) => ({
        ...v,
        idVariante: null,
        idProducto: null
      })),
      fichaTecnica: p.fichaTecnica
        ? {
            ...p.fichaTecnica,
            idFichaTecnica: null,
            idProducto: null
          }
        : null
    };

    setEditingProducto(cloned);
    setIsDuplicateMode(true);
    setIsViewMode(false);
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    let ok = false;
    if (editingProducto && !isDuplicateMode) {
      ok = await updateProducto(editingProducto.id, form);
    } else {
      ok = await createProducto(form);
    }
    if (ok) {
      setModalOpen(false);
      setEditingProducto(null);
      setIsDuplicateMode(false);
    }
  };

  const handleCreateEvento = (producto, existingEvento = null) => {
    let hydratedEvento = existingEvento || null;
    if (existingEvento) {
      const targetId = Number(existingEvento.id || existingEvento.idEvento);
      const fullMatch = (eventos || []).find((e) => Number(e.id || e.idEvento) === targetId);
      if (fullMatch) {
        hydratedEvento = { ...existingEvento, ...fullMatch };
      }
      if (!hydratedEvento.producto && producto) {
        hydratedEvento = {
          ...hydratedEvento,
          producto: {
            id: producto.id || producto.idProducto,
            idProducto: producto.idProducto || producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen
          }
        };
      }
    }
    setProductoParaEvento(producto);
    setEventoParaEditar(hydratedEvento);
    setCrearEventoModalOpen(true);
  };

  const handleEventoCreated = () => {
    fetchEventos();
    refetch();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Productos
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Administra el menú y productos del negocio
        </p>
      </div>

      {/* Separator */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Stat Cards - Grid Balanceado 2x2 en móvil, 4 Columnas en escritorio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Productos */}
        <div className="flex items-center gap-2.5 sm:gap-4 bg-white dark:bg-gray-900 rounded-2xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">Total Productos</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{stats.total}</p>
            <p className="text-[11px] sm:text-xs text-green-500 font-medium truncate">en catálogo</p>
          </div>
        </div>

        {/* Card 2: Más Vendido */}
        <div className="flex items-center gap-2.5 sm:gap-4 bg-white dark:bg-gray-900 rounded-2xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">Más Vendido</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{stats.masVendidoNombre}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 truncate">{stats.masVendidoVentas} und {stats.masVendidoMonto > 0 ? `• $${stats.masVendidoMonto.toLocaleString("es-CO")}` : ""}</p>
          </div>
        </div>

        {/* Card 3: Total Vendidos */}
        <div className="flex items-center gap-2.5 sm:gap-4 bg-white dark:bg-gray-900 rounded-2xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">Total Vendidos</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{stats.totalVendidos}</p>
            <p className="text-[11px] sm:text-xs text-green-500 font-medium truncate">unidades</p>
          </div>
        </div>

        {/* Card 4: Eventos Activos */}
        <div className="flex items-center gap-2.5 sm:gap-4 bg-white dark:bg-gray-900 rounded-2xl p-3.5 sm:p-5 border border-orange-200/80 dark:border-orange-900/40 shadow-sm shadow-orange-500/5 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">Con Evento</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{stats.eventosActivos}</p>
            <p className="text-[11px] sm:text-xs text-orange-600 dark:text-orange-400 font-bold truncate">promociones</p>
          </div>
        </div>
      </div>

      {/* VIEW MODE: PAPELERA VS ACTIVOS */}
      {viewMode === "papelera" ? (
        <Suspense fallback={<ChazinLoader text="CARGANDO PAPELERA" size="sm" />}>
          <PapeleraProductosView
            papeleraProductos={papeleraProductos}
            onVolverActivos={() => setViewMode("activos")}
            onRestaurarProducto={restoreProducto}
            onEliminarDefinitivoProducto={deleteDefinitivoProducto}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </Suspense>
      ) : (
        <div className="space-y-6">
          {/* Quick Trash / Recover Banner right after deleting a product */}
          {lastDeletedProducto && (
            <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-sm text-amber-900 dark:text-amber-100">
                <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong className="font-semibold">"{lastDeletedProducto.nombre}"</strong> se envió a la papelera de reciclaje.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => restoreProducto(lastDeletedProducto)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recuperar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewMode("papelera")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ir a la papelera ({papeleraProductos.length})</span>
                </button>
                <button
                  type="button"
                  onClick={dismissLastDeleted}
                  className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 rounded-lg transition-colors cursor-pointer"
                  aria-label="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Search + Filter + Actions Bar */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 sm:gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#F05454] focus:border-transparent transition-colors"
                />
              </div>

              {/* Category Filter Select */}
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="px-3.5 sm:px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#F05454] focus:border-transparent transition-colors shrink-0 cursor-pointer"
              >
                <option value="Todas">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id || c.nombre} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Papelera Button */}
                <button
                  type="button"
                  onClick={() => setViewMode("papelera")}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Ver productos eliminados y recuperarlos"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                  <span>Papelera ({papeleraProductos.length})</span>
                </button>

                {/* Eventos Button */}
                <button
                  onClick={() => setEventosModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/25 ring-2 ring-orange-400/30 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100 shrink-0" />
                  <span>Eventos</span>
                </button>

                {/* Nuevo Producto Button */}
                {canCreate && (
                  <button
                    onClick={handleOpenCreate}
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F05454] hover:bg-[#d84343] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>Nuevo Producto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <ChazinLoader text="CARGANDO PRODUCTOS" size="md" />
          ) : (
            <ProductosTable
              productos={filteredProductos}
              eventos={eventos}
              onEdit={handleOpenEdit}
              onDelete={(id, nombre) =>
                deleteProducto(id, nombre, {
                  onGoToTrash: () => setViewMode("papelera")
                })
              }
              onToggleEstado={toggleEstadoProducto}
              onView={handleOpenView}
              onDuplicate={handleOpenDuplicate}
              onCreateEvento={handleCreateEvento}
              canEdit={canEdit}
              canDelete={canDelete}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      )}

      {/* Producto Modal (Create/Edit/Duplicate) */}
      {modalOpen && !isViewMode && (
        <Suspense fallback={null}>
          <ProductoModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setIsDuplicateMode(false);
            }}
            onSave={handleSave}
            producto={editingProducto}
            categorias={categorias}
            isDuplicate={isDuplicateMode}
            onVariantToggled={() => {
              refetch();
              fetchEventos();
            }}
          />
        </Suspense>
      )}

      {/* Ver Producto Modal (Read Only) */}
      {modalOpen && isViewMode && (
        <Suspense fallback={null}>
          <VerProductoModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setIsDuplicateMode(false);
            }}
            producto={editingProducto}
            onEdit={canEdit ? (prod) => handleOpenEdit(prod) : undefined}
            onDuplicate={canEdit ? handleOpenDuplicate : undefined}
            onVariantToggled={() => {
              refetch();
              fetchEventos();
            }}
          />
        </Suspense>
      )}

      {/* Eventos Modal */}
      {eventosModalOpen && (
        <Suspense fallback={null}>
          <EventosModal
            isOpen={eventosModalOpen}
            onClose={() => setEventosModalOpen(false)}
            eventos={eventos}
            onOpenCrearEvento={() => {
              setEventosModalOpen(false);
              setProductoParaEvento(null);
              setEventoParaEditar(null);
              setCrearEventoModalOpen(true);
            }}
            onEditEvento={(evt) => {
              setEventosModalOpen(false);
              const relatedProd = productos.find(p => p.id === (evt.idProducto || evt.producto?.id)) || evt.producto || null;
              setProductoParaEvento(relatedProd);
              setEventoParaEditar(evt);
              setCrearEventoModalOpen(true);
            }}
            onRefresh={() => {
              fetchEventos();
              refetch();
            }}
          />
        </Suspense>
      )}

      {/* Crear / Editar Evento Modal */}
      {crearEventoModalOpen && (
        <Suspense fallback={null}>
          <CrearEventoModal
            isOpen={crearEventoModalOpen}
            onClose={() => {
              setCrearEventoModalOpen(false);
              setProductoParaEvento(null);
              setEventoParaEditar(null);
            }}
            producto={productoParaEvento}
            eventoToEdit={eventoParaEditar}
            onCreated={handleEventoCreated}
          />
        </Suspense>
      )}
    </div>
  );
}
