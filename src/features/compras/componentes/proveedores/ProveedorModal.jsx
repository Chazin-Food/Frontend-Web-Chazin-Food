import { useState, useEffect } from "react";
import { X, Building, User, AlertCircle, Lock } from "lucide-react";
import { validateEmail } from "@/shared/utils/validationUtils";

const TIPOS_PROVEEDOR = [
  { id: 1, nombre: "Mayorista" },
  { id: 2, nombre: "Distribuidor" },
  { id: 3, nombre: "Fabricante" }
];

const getInputCls = (hasError) =>
  `w-full px-4 py-2 border rounded-xl focus:ring-2 focus:border-transparent transition-colors text-sm dark:bg-gray-800 dark:text-gray-100 ${
    hasError
      ? "border-red-500 focus:ring-red-400 bg-red-50 dark:bg-red-950/30"
      : "border-gray-200 dark:border-gray-700 focus:ring-[#F05454]"
  }`;

const getImmutableCls = () =>
  "w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none text-sm font-medium";

const labelCls = "block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1";

const errorMsgCls = "text-xs text-red-500 mt-1 font-medium flex items-center gap-1";

export function ProveedorModal({ isOpen, onClose, onSave, proveedor = null, proveedores = [] }) {
  const isEditing = !!proveedor;

  const [form, setForm] = useState({
    tipoPersona: "Jurídica", // "Jurídica" | "Natural"
    idTipoProveedor: 1, // 1: Mayorista, 2: Distribuidor, 3: Fabricante
    tipoProveedor: "Mayorista",
    tiposProveedor: ["Mayorista"],
    idTipoDocumento: 3, // 3: NIT, 1: CC, 2: CE, 4: Pasaporte
    nombre: "",
    nit: "",
    contacto: "",
    email: "",
    telefono: "",
    direccion: "",
    estado: "Activo",
  });

  // Errores por campo y campos tocados
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (proveedor) {
      const isJuridica =
        proveedor.tipoPersona === "Jurídica" ||
        proveedor.idTipoDocumento === 3 ||
        (proveedor.tipoDocumento && String(proveedor.tipoDocumento).toUpperCase() === "NIT");

      let parsedTipoProv = Number(proveedor.idTipoProveedor);
      if (!parsedTipoProv || isNaN(parsedTipoProv)) {
        if (proveedor.tipoProveedor === "Distribuidor") parsedTipoProv = 2;
        else if (proveedor.tipoProveedor === "Fabricante") parsedTipoProv = 3;
        else parsedTipoProv = 1;
      }

      // Sanitizar documento y teléfono eliminando caracteres no numéricos
      const rawDoc = proveedor.nit || proveedor.numeroDocumento || "";
      const cleanNit = String(rawDoc).replace(/\D/g, "");
      const cleanTel = String(proveedor.telefono || "").replace(/\D/g, "");

      setForm({
        tipoPersona: isJuridica ? "Jurídica" : "Natural",
        idTipoProveedor: parsedTipoProv,
        tipoProveedor: proveedor.tipoProveedor || (parsedTipoProv === 2 ? "Distribuidor" : parsedTipoProv === 3 ? "Fabricante" : "Mayorista"),
        idTipoDocumento: proveedor.idTipoDocumento || (isJuridica ? 3 : 1),
        nombre: proveedor.nombre || "",
        nit: cleanNit,
        contacto: proveedor.contacto || proveedor.nombreContacto || "",
        email: proveedor.email || proveedor.correo || "",
        telefono: cleanTel,
        direccion: proveedor.direccion || "",
        estado: proveedor.estado || "Activo",
      });
    } else {
      setForm({
        tipoPersona: "Jurídica",
        idTipoProveedor: 1,
        tipoProveedor: "Mayorista",
        idTipoDocumento: 3,
        nombre: "",
        nit: "",
        contacto: "",
        email: "",
        telefono: "",
        direccion: "",
        estado: "Activo",
      });
    }
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [proveedor, isOpen]);

  if (!isOpen) return null;

  const esJuridica = form.tipoPersona === "Jurídica";

  // Reglas de inmutabilidad en edición:
  // Persona Natural: CC y Nombre inmutables; Teléfono, Tipo de Proveedor, Correo, Dirección editables.
  // Persona Jurídica: Razón Social, NIT y Correo inmutables; Teléfono, Tipo de Proveedor, Contacto, Dirección editables.
  const isDocInmutable = isEditing;
  const isNombreInmutable = isEditing;
  const isEmailInmutable = isEditing && esJuridica;

  // ── Validaciones individuales ───────────────────────────────────────────────

  const validate = (fields) => {
    const errs = {};
    const esJur = fields.tipoPersona === "Jurídica";

    // Nombre: si es inmutable en edición no se valida
    if (!isNombreInmutable) {
      if (!fields.nombre.trim()) {
        errs.nombre = esJur
          ? "El nombre / razón social es obligatorio."
          : "El nombre completo es obligatorio.";
      } else if (/[^a-zA-Z0-9\u00C0-\u024F\s.,&-]/.test(fields.nombre.trim())) {
        errs.nombre = "La razón social no puede contener caracteres especiales como @, #, $, %, etc.";
      }
    }

    // NIT/CC: si es inmutable en edición no se valida
    if (!isDocInmutable) {
      if (!fields.nit.trim()) {
        errs.nit = esJur
          ? "El NIT es obligatorio."
          : "El número de cédula (CC) es obligatorio.";
      } else if (!/^\d+$/.test(fields.nit.trim())) {
        errs.nit = esJur
          ? "El NIT solo debe contener dígitos, sin puntos ni guiones."
          : "La cédula solo debe contener números.";
      } else {
        // Verificación de duplicado (#70)
        const currentId = proveedor?.id || proveedor?.idProveedor;
        const nitLimpiado = fields.nit.trim().replace(/\D/g, "");
        const existeDuplicado = proveedores.some((p) => {
          const pId = p.id || p.idProveedor;
          if (isEditing && String(pId) === String(currentId)) return false;
          const pDoc = String(p.nit || p.numeroDocumento || "").replace(/\D/g, "").trim();
          return pDoc === nitLimpiado;
        });
        if (existeDuplicado) {
          errs.nit = `Ya existe otro proveedor registrado con este número de ${esJur ? "NIT" : "cédula (CC)"}.`;
        }
      }
    }

    // Contacto: Obligatorio para Persona Jurídica, Opcional para Persona Natural
    if (esJur && !fields.contacto.trim()) {
      errs.contacto = "La persona de contacto es obligatoria para empresas.";
    } else if (fields.contacto.trim() && /\d/.test(fields.contacto)) {
      errs.contacto = "El nombre de contacto no puede contener números.";
    }

    // Teléfono: solo dígitos numéricos (entre 7 y 10)
    const telDigits = String(fields.telefono || "").replace(/\D/g, "");
    if (!telDigits) {
      errs.telefono = "El teléfono / celular es obligatorio.";
    } else if (!/^\d{7,10}$/.test(telDigits)) {
      errs.telefono = "El teléfono debe tener entre 7 y 10 dígitos numéricos.";
    }

    // Email: si es inmutable en Jurídica se conserva tal cual
    if (!isEmailInmutable && fields.email && fields.email.trim()) {
      const emailRes = validateEmail(fields.email.trim());
      if (!emailRes.isValid) {
        errs.email = emailRes.error;
      }
    }

    return errs;
  };

  const handleTipoPersonaChange = (nuevoTipo) => {
    if (isEditing) return; // Inmutable en edición
    const newForm = {
      ...form,
      tipoPersona: nuevoTipo,
      idTipoDocumento: nuevoTipo === "Jurídica" ? 3 : 1
    };
    setForm(newForm);
    const updatedErrors = validate(newForm);
    setErrors(updatedErrors);
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  // ── Manejadores de cambio con filtrado en tiempo real ──────────────────────

  const handleNitChange = (e) => {
    if (isDocInmutable) return;
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 20);
    const newForm = { ...form, nit: value };
    setForm(newForm);
    setTouched((prev) => ({ ...prev, nit: true }));
    const errs = validate(newForm);
    setErrors((prev) => ({ ...prev, nit: errs.nit }));
  };

  const handleNombreChange = (e) => {
    if (isNombreInmutable) return;
    const value = e.target.value.replace(/[^a-zA-Z0-9\u00C0-\u024F\s.,&-]/g, "");
    const newForm = { ...form, nombre: value };
    setForm(newForm);
    setTouched((prev) => ({ ...prev, nombre: true }));
    const errs = validate(newForm);
    setErrors((prev) => ({ ...prev, nombre: errs.nombre }));
  };

  const handleEmailChange = (e) => {
    if (isEmailInmutable) return;
    const value = e.target.value;
    const newForm = { ...form, email: value };
    setForm(newForm);
    setTouched((prev) => ({ ...prev, email: true }));
    const errs = validate(newForm);
    setErrors((prev) => ({ ...prev, email: errs.email }));
  };

  const handleContactoChange = (e) => {
    const value = e.target.value.replace(/[0-9]/g, "");
    const newForm = { ...form, contacto: value };
    setForm(newForm);
    setTouched((prev) => ({ ...prev, contacto: true }));
    const errs = validate(newForm);
    setErrors((prev) => ({ ...prev, contacto: errs.contacto }));
  };

  const handleTelefonoChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    const newForm = { ...form, telefono: value };
    setForm(newForm);
    setTouched((prev) => ({ ...prev, telefono: true }));
    const errs = validate(newForm);
    setErrors((prev) => ({ ...prev, telefono: errs.telefono }));
  };

  const handleGenericChange = (field) => (e) => {
    const newForm = { ...form, [field]: e.target.value };
    setForm(newForm);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched({
      nombre: true,
      nit: true,
      contacto: true,
      email: true,
      telefono: true,
      direccion: true
    });
    const errs = validate(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    // Sanitizar antes de guardar
    const cleanDoc = String(form.nit || "").replace(/\D/g, "");
    const cleanTel = String(form.telefono || "").replace(/\D/g, "");

    onSave({
      ...form,
      nit: cleanDoc,
      numeroDocumento: cleanDoc,
      telefono: cleanTel,
      nombreContacto: form.contacto,
      correo: form.email,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#F05454]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80dvh] overflow-y-auto" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Switch / Selector Tipo de Persona */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Tipo de Persona</label>
                {isEditing && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Inmutable en edición
                  </span>
                )}
              </div>
              <div className={`grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl ${isEditing ? "opacity-75 cursor-not-allowed" : ""}`}>
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => handleTipoPersonaChange("Jurídica")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    esJuridica
                      ? "bg-white dark:bg-gray-900 text-[#F05454] shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  } ${isEditing ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Building className="w-4 h-4" />
                  <span>Persona Jurídica (Empresa)</span>
                </button>
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => handleTipoPersonaChange("Natural")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    !esJuridica
                      ? "bg-white dark:bg-gray-900 text-[#F05454] shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  } ${isEditing ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <User className="w-4 h-4" />
                  <span>Persona Natural</span>
                </button>
              </div>
            </div>

            {/* NIT / Documento - PRIMERO (#70) */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                {esJuridica ? (
                  <>
                    NIT <span className="text-gray-400 font-normal">(Número de Identificación Tributaria)</span>
                  </>
                ) : (
                  <>
                    CC <span className="text-gray-400 font-normal">(Cédula de Ciudadanía)</span>
                  </>
                )}{" "}
                <span className="text-red-500">*</span>
                {isDocInmutable && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <Lock className="w-2.5 h-2.5" /> Inmutable
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.nit}
                onChange={handleNitChange}
                disabled={isDocInmutable}
                readOnly={isDocInmutable}
                onKeyDown={(e) => {
                  if (['.', '-', 'e', 'E', '+', ','].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onBlur={() => handleFieldBlur("nit")}
                className={isDocInmutable ? getImmutableCls() : getInputCls(touched.nit && !!errors.nit)}
                placeholder={esJuridica ? "Ej. 900123456" : "Ej. 1043673457"}
                maxLength={15}
              />
              {!isDocInmutable && touched.nit && errors.nit && (
                <p className={errorMsgCls}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.nit}
                </p>
              )}
              {!isDocInmutable && (!touched.nit || !errors.nit) && form.nit.trim() && (
                <p className="text-xs text-gray-400 mt-1">
                  {esJuridica ? "Solo dígitos, sin puntos ni guiones" : "Solo números de cédula"}
                </p>
              )}
            </div>

            {/* Nombre / Razón Social (#71) */}
            <div>
              <label className={labelCls}>
                {esJuridica ? "Razón Social / Nombre Empresa" : "Nombre Completo"}{" "}
                <span className="text-red-500">*</span>
                {isNombreInmutable && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <Lock className="w-2.5 h-2.5" /> Inmutable
                  </span>
                )}
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={handleNombreChange}
                disabled={isNombreInmutable}
                readOnly={isNombreInmutable}
                onBlur={() => handleFieldBlur("nombre")}
                className={isNombreInmutable ? getImmutableCls() : getInputCls(touched.nombre && !!errors.nombre)}
                placeholder={esJuridica ? "Ej. Distribuidora Avícola S.A.S." : "Ej. Juan Carlos Pérez"}
              />
              {!isNombreInmutable && touched.nombre && errors.nombre && (
                <p className={errorMsgCls}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.nombre}
                </p>
              )}
            </div>

            {/* Tipo de Proveedor (Siempre Editable) */}
            <div>
              <label className={labelCls}>
                Tipo de Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={form.idTipoProveedor}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const tpObj = TIPOS_PROVEEDOR.find((t) => t.id === val);
                  const newForm = {
                    ...form,
                    idTipoProveedor: val,
                    tipoProveedor: tpObj?.nombre || "Mayorista"
                  };
                  setForm(newForm);
                  if (submitted) setErrors(validate(newForm));
                }}
                className={getInputCls(false)}
              >
                {TIPOS_PROVEEDOR.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Teléfono / Celular (Siempre Editable) */}
            <div>
              <label className={labelCls}>
                Teléfono / Celular <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={form.telefono}
                onChange={handleTelefonoChange}
                onBlur={() => handleFieldBlur("telefono")}
                className={getInputCls(touched.telefono && !!errors.telefono)}
                placeholder="Ej. 3109876543"
              />
              {touched.telefono && errors.telefono && (
                <p className={errorMsgCls}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.telefono}
                </p>
              )}
            </div>

            {/* Persona de Contacto (Siempre Editable) */}
            <div>
              <label className={labelCls}>
                Persona de Contacto {esJuridica ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(Opcional)</span>}
              </label>
              <input
                type="text"
                value={form.contacto}
                onChange={handleContactoChange}
                onBlur={() => handleFieldBlur("contacto")}
                className={getInputCls(touched.contacto && !!errors.contacto)}
                placeholder="Ej. Carlos Mendoza"
              />
              {touched.contacto && errors.contacto && (
                <p className={errorMsgCls}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.contacto}
                </p>
              )}
            </div>

            {/* Correo Electrónico (#73) - Inmutable en Jurídica, Editable en Natural */}
            <div>
              <label className={labelCls}>
                Correo Electrónico
                {isEmailInmutable && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <Lock className="w-2.5 h-2.5" /> Inmutable
                  </span>
                )}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleEmailChange}
                disabled={isEmailInmutable}
                readOnly={isEmailInmutable}
                onBlur={() => handleFieldBlur("email")}
                className={isEmailInmutable ? getImmutableCls() : getInputCls(touched.email && !!errors.email)}
                placeholder="contacto@empresa.com"
              />
              {!isEmailInmutable && touched.email && errors.email && (
                <p className={errorMsgCls}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            {/* Dirección (Siempre Editable) */}
            <div>
              <label className={labelCls}>Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={handleGenericChange("direccion")}
                className={getInputCls(false)}
                placeholder="Ej. Av. Central #12-34"
              />
            </div>

            {/* Estado (Siempre Editable) */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Estado</label>
              <select
                value={form.estado}
                onChange={handleGenericChange("estado")}
                className={getInputCls(false)}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Hint campos requeridos */}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Los campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios.
          </p>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-[#F05454] hover:bg-[#d84343] rounded-xl transition-colors shadow-md cursor-pointer"
            >
              {isEditing ? "Guardar Cambios" : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
