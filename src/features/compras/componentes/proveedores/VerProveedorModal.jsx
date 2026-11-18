import { useState, useEffect } from "react";
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ShoppingCart,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit,
  ExternalLink,
  Hash,
  Tag,
  ShieldCheck,
  Building,
  Layers,
  DollarSign,
  XCircle,
  Receipt
} from "lucide-react";
import { proveedoresService } from "../../servicios/proveedoresService";
import { comprasService } from "../../servicios/comprasService";

export function VerProveedorModal({ isOpen, onClose, proveedor, onEdit }) {
  const [activeTab, setActiveTab] = useState("general"); // "general" | "compras"
  const [detalles, setDetalles] = useState(null);
  const [comprasProveedor, setComprasProveedor] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompras, setLoadingCompras] = useState(false);

  useEffect(() => {
    if (!isOpen || !proveedor) return;

    setActiveTab("general");
    setDetalles(proveedor);

    const id = proveedor.idProveedor || proveedor.id;
    if (!id) return;

    const fetchDetalles = async () => {
      try {
        setLoading(true);
        const res = await proveedoresService.getProveedores();
        const lista = Array.isArray(res) ? res : res?.data || [];
        const encontrado = lista.find((p) => (p.idProveedor || p.id) === id);
        if (encontrado) {
          setDetalles((prev) => ({ ...prev, ...encontrado }));
        }
      } catch (err) {
        console.error("Error al obtener detalles del proveedor:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCompras = async () => {
      try {
        setLoadingCompras(true);
        const res = await comprasService.getCompras();
        const lista = Array.isArray(res) ? res : res?.data || [];
        const idStr = String(id);
        const filtradas = lista.filter(
          (c) => String(c.idProveedor) === idStr || String(c.proveedor?.idProveedor) === idStr
        );
        setComprasProveedor(filtradas);
      } catch (err) {
        console.error("Error al obtener compras del proveedor:", err);
      } finally {
        setLoadingCompras(false);
      }
    };

    fetchDetalles();
    fetchCompras();
  }, [isOpen, proveedor]);

  if (!isOpen || !proveedor) return null;

  const data = detalles || proveedor;
  const isJuridica = data.tipoPersona === "Jurídica" || data.idTipoDocumento === 3 || data.tipoDocumento === "NIT";
  const docTipo = isJuridica ? "NIT" : (data.tipoDocumento || "CC");
  const docNumero = data.nit || data.numeroDocumento || "Sin registrar";
  const isActivo = data.estado === "Activo" || data.estado === 1;

  const clasificaciones = Array.isArray(data.tiposProveedor)
    ? data.tiposProveedor
    : (data.tipoProveedor ? [data.tipoProveedor] : ["Mayorista"]);

  const comprasCount = comprasProveedor.length || data.comprasCount || (data.ultimasCompras?.length || 0);

  // Calcular el total histórico comprado con este proveedor
  const totalHistoricoComprado = comprasProveedor.reduce((acc, c) => {
    const estado = String(c.estado || "").toUpperCase();
    if (estado !== "CANCELADA" && estado !== "ANULADA") {
      return acc + (Number(c.total) || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92dvh] overflow-hidden"
        style={{ animation: "fadeInScale 0.2s ease-out" }}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 dark:from-gray-850 dark:via-gray-900 dark:to-gray-850">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {data.nombre}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActivo
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {isActivo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {docTipo}: {docNumero}
                </span>
                <span>•</span>
                <span>Persona {isJuridica ? "Jurídica" : "Natural"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de navegación */}
        <div className="px-6 pt-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-gray-900 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "general"
                ? "border-[#F05454] text-[#F05454]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Datos Principales</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compras")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "compras"
                ? "border-[#F05454] text-[#F05454]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Compras & Operaciones</span>
            {comprasCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                {comprasCount}
              </span>
            )}
          </button>
        </div>

        {/* Body scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === "general" ? (
            <div className="space-y-4">
              {/* Tarjetas de Datos Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Documento y Persona */}
                <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-850/40 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    Identificación Fiscal
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {docTipo}: {docNumero}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tipo de persona: <strong className="text-gray-700 dark:text-gray-300">{isJuridica ? "Jurídica (Empresa)" : "Natural"}</strong>
                  </p>
                </div>

                {/* Clasificación Comercial */}
                <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-850/40 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-500" />
                    Tipo de Proveedor
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {clasificaciones.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Clasificación comercial asignada en el catálogo
                  </p>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-850 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Contacto & Ubicación
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Persona de Contacto */}
                  <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50">
                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5">Persona de Contacto:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {data.contacto || data.nombreContacto || "No registrado"}
                    </span>
                  </div>

                  {/* Teléfono */}
                  <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50">
                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Teléfono / Celular:
                    </span>
                    {data.telefono ? (
                      <a
                        href={`tel:${data.telefono}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {data.telefono}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-400">No registrado</span>
                    )}
                  </div>

                  {/* Correo Electrónico */}
                  <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50">
                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Correo Electrónico:
                    </span>
                    {data.email || data.correo ? (
                      <a
                        href={`mailto:${data.email || data.correo}`}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {data.email || data.correo}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-400">No registrado</span>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50">
                    <span className="text-gray-400 dark:text-gray-500 block mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Dirección Comercial:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {data.direccion || "No registrada"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador de integridad y trazabilidad */}
              <div className="p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {comprasCount > 0 ? (
                      <>
                        Este proveedor cuenta con <strong>{comprasCount} compra(s) registrada(s)</strong>. Por integridad contable y tributaria, no se permite su eliminación.
                      </>
                    ) : (
                      <>
                        Proveedor sin compras registradas actualmente en el sistema.
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* KPIs de compras (Indicador de Insumos Asociados eliminado) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4" />
                    Compras Registradas
                  </span>
                  <p className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
                    {comprasCount}
                  </p>
                  <p className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-0.5">
                    Facturas procesadas con este proveedor
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    Total Comprado (Facturado)
                  </span>
                  <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
                    ${totalHistoricoComprado.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">
                    Monto total en compras confirmadas
                  </p>
                </div>
              </div>

              {/* Lista Detallada con Vista Rápida de Compras e Insumos */}
              {loadingCompras ? (
                <div className="py-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-[#F05454]" />
                  <span>Cargando historial de compras del proveedor...</span>
                </div>
              ) : comprasProveedor.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#F05454]" />
                      Historial de Compras & Vista Rápida de Insumos ({comprasProveedor.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {comprasProveedor.map((c) => {
                      const estaConfirmada =
                        String(c.estado || "").toUpperCase() === "RECIBIDA" ||
                        String(c.estado || "").toUpperCase() === "COMPLETADA";
                      const estaCancelada =
                        String(c.estado || "").toUpperCase() === "CANCELADA" ||
                        String(c.estado || "").toUpperCase() === "ANULADA";

                      const fechaFacturaStr = c.fechaFactura
                        ? new Date(c.fechaFactura).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : c.fechaCompra
                        ? new Date(c.fechaCompra).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "Sin fecha";

                      const detallesCompra = c.detalles || [];

                      return (
                        <div
                          key={c.id || c.idCompra}
                          className="border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-850 shadow-xs"
                        >
                          {/* Cabecera de la Compra */}
                          <div className="bg-gray-50/90 dark:bg-gray-800/60 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                                    Factura: {c.numeroFactura || `#${c.id || c.idCompra}`}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      estaConfirmada
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                        : estaCancelada
                                        ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                                    }`}
                                  >
                                    {estaConfirmada && <CheckCircle2 className="w-3 h-3" />}
                                    {estaCancelada && <XCircle className="w-3 h-3" />}
                                    {estaConfirmada ? "Confirmada" : estaCancelada ? "Anulada" : c.estado}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Fecha: {fechaFacturaStr}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                                Total Compra
                              </span>
                              <span className="text-sm font-black text-[#F05454]">
                                ${Number(c.total || 0).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>

                          {/* Tabla de Insumos Adquiridos (Vista Rápida idéntica a Gestión de Compras) */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                  <th className="px-4 py-2">Insumo</th>
                                  <th className="px-4 py-2 text-center">Cantidad</th>
                                  <th className="px-4 py-2 text-right">Precio Unitario</th>
                                  <th className="px-4 py-2 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {detallesCompra.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-3 text-center text-gray-400 text-xs">
                                      Sin insumos detallados
                                    </td>
                                  </tr>
                                ) : (
                                  detallesCompra.map((d, di) => {
                                    const insNombre = d.insumo?.nombre || d.nombreInsumo || `Insumo #${d.idInsumo}`;
                                    const unidad = d.insumo?.unidadMedida || "";
                                    const lotesArr = Array.isArray(d.lotes) && d.lotes.length > 0
                                      ? d.lotes
                                      : (d.numeroLote ? [{ numeroLote: d.numeroLote, fechaVencimiento: d.fechaVencimiento }] : []);

                                    return (
                                      <tr key={di} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/30">
                                        <td className="px-4 py-2.5">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                                            {insNombre}
                                          </span>
                                          {lotesArr.length > 0 && (
                                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                              {lotesArr.map((lot, li) => (
                                                <span
                                                  key={li}
                                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-medium"
                                                >
                                                  <Layers className="w-2.5 h-2.5" />
                                                  Lote: {lot.numeroLote}
                                                  {lot.fechaVencimiento && ` · Vence: ${lot.fechaVencimiento}`}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                            {Number(d.cantidad).toLocaleString("es-CO")} {unidad}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                                          ${Number(d.precioUnitario).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <span className="font-bold text-gray-900 dark:text-gray-100 block">
                                            ${Number(d.subtotal || (d.cantidad * d.precioUnitario)).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                                          </span>
                                          {Boolean(d.incluyeIva || Number(d.iva) > 0) ? (
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                                              +IVA ({d.porcentajeIva || 19}%): ${Number(d.iva || 0).toLocaleString("es-CO")}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-gray-400 block">
                                              Exento de IVA
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Footer de la Compra con Resumen de IVA */}
                          <div className="px-4 py-2.5 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                              <span>Subtotal base: <strong>${Number(c.subtotal || c.total || 0).toLocaleString("es-CO")}</strong></span>
                              {Boolean(c.incluyeIva || Number(c.iva) > 0) ? (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  IVA Total: +${Number(c.iva || 0).toLocaleString("es-CO")}
                                </span>
                              ) : (
                                <span className="text-gray-400">Sin IVA</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                Total: <strong className="text-[#F05454]">${Number(c.total || 0).toLocaleString("es-CO")}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-850/30">
                  <ShoppingCart className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    No hay compras registradas para este proveedor
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Las compras generadas a este proveedor aparecerán aquí con su detalle de insumos, facturas y costos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <span className="text-[11px] text-gray-400 font-medium">
            ID de Registro: #{data.idProveedor || data.id}
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(data);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar Proveedor</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerProveedorModal;
