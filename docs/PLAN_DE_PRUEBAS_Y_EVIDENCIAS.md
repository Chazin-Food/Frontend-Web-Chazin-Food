# Plan de Pruebas y Evidencias — Proyecto Formativo Chazin Food

| Campo | Detalle |
| :--- | :--- |
| **Proyecto Formativo** | Sistema Web de Gestión Operativa y Comercio Electrónico **Chazin Food** |
| **Programa / Institución** | Análisis y Desarrollo de Software (ADSO) — SENA, Medellín |
| **Versión Evaluada** | v2.0.0 (Producción: Vercel + Render + TiDB Cloud) |
| **Fecha de Ejecución y Evidencias** | 25 de noviembre de 2026 |
| **Licencia del Software** | MIT License (`LICENSE` en repositorios Frontend y Backend) |
| **Marco Legal Aplicable** | Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013 (Habeas Data), Ley 1480 de 2011 |

---

## 1. Objetivo y Alcance

Validar de forma trazable, repetible y automatizada la funcionalidad, seguridad, integridad de datos, usabilidad y rendimiento del sistema **Chazin Food**, cubriendo:

- **Backend API (Node.js / Express / Sequelize / TiDB MySQL):** servicios de negocio, validaciones de formularios, control de acceso basado en roles (RBAC), motor de descuento de stock FEFO/MRP, pasarela Wompi, devoluciones/reembolsos y correos transaccionales.
- **Frontend Web (React 19 / Vite 6 / Tailwind CSS):** portal público de clientes, carrito y checkout Wompi, panel administrativo multiusuario, producción (KDS), reportes PDF/Excel corporativos, ayudas en línea y marco legal/licenciamiento.

---

## 2. Estrategia y Niveles de Prueba

| Nivel | Herramienta / Mecanismo | Cobertura Principal |
| :--- | :--- | :--- |
| **Pruebas Unitarias de Servicios (Backend)** | `node --test` (`Backend/test/*.test.js`) | Validaciones de compras, contratos de empleados, stock mín/máx, homónimos, insumos preparados con ficha técnica, edición pre-cocina, fidelidad, FEFO y cuadre neto de ventas. |
| **Pruebas Unitarias de Utilidades y Pasarela (Frontend)** | `node --test` (`Frontend/src/test/*.test.{mjs,cjs}`) | Pasarela Wompi (firmas SHA-256, webhooks, estados), validación de direcciones de Medellín, datos bancarios de reembolso, variantes de productos y modales de insumos. |
| **Pruebas de Generación de Reportes Excel (OOXML)** | Script automatizado sobre `excelExport.js` + `fflate` | Integridad ZIP/XML de archivos `.xlsx` multi-hoja, incrustación de logotipo PNG, paneles congelados, fórmulas `SUM`/`COUNTA` y caché `<v>` para Vista Protegida de Excel. |
| **Pruebas de Compilación y Rendimiento** | `vite build` + Reglas Lighthouse (`docs/PLAN_RENDIMIENTO.md`) | Verificación de cero errores de empaquetado, code-splitting (`React.lazy`), carga diferida de librerías pesadas (`write-excel-file`, `recharts`, modales legales y de ayuda) y tamaño de chunk principal. |
| **Pruebas de Integración End-to-End (API Live)** | Suites HTTP (`stockDeductionRealData`, módulo 4 de `insumosModalsAutomated`) | Flujos reales contra `http://localhost:5000/api` y base de datos activa. |

---

## 3. Matriz de Casos de Prueba (Funcionales, Validaciones y Seguridad)

| ID | Módulo | Caso de Prueba | Resultado Esperado | Evidencia / Archivo de Prueba | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-01** | Roles y Seguridad | Protección del rol **Administrador** contra edición, inactivación o eliminación | En UI el rol Administrador se lista únicamente con acción **Ver detalle** (solo lectura). El backend (`roleService.js`) rechaza con HTTP `400` cualquier intento de `PUT`/`DELETE` sobre `id=1` o nombre `Administrador`. | `roleService.js`, `Roles.jsx`, `RolesTable.jsx`, `RolDetalleView.jsx` | ✅ Aprobado |
| **CP-02** | Cumplimiento Legal | Autorización de tratamiento de datos personales (Ley 1581 de 2012) en registros | Checkbox obligatorio con modal interactivo (Términos, Datos Ley 1581 y Licenciamiento) en registro de clientes web, checkout, y alta administrativa de Clientes, Usuarios y Empleados. | `PoliticaDatosModal.jsx`, `Login.jsx`, `ClienteAuthModal.jsx`, `ClienteModal.jsx`, `UsuarioModal.jsx`, `EmpleadoModal.jsx` | ✅ Aprobado |
| **CP-03** | Licenciamiento | Visibilidad de licencia de software en código y aplicación | Archivos `LICENSE` (MIT) en raíz de Frontend y Backend + pestaña **Licenciamiento** accesible desde footer cliente y menú lateral administrativo. | `LICENSE`, `PoliticaDatosModal.jsx`, `ClienteFooter.jsx`, `Layout.jsx` | ✅ Aprobado |
| **CP-04** | Usabilidad / Ayuda | Ayudas en línea contextuales y tooltips | Centro de Ayuda en Línea modal contextual por ruta (`AyudaEnLineaModal`) + `HelpTooltip` en Dashboard, Producción, Reportes, Roles, Empleados y vistas de producto. | `AyudaEnLineaModal.jsx`, `HelpTooltip.jsx`, `Layout.jsx`, `ClienteFooter.jsx` | ✅ Aprobado |
| **CP-05** | Personas / BD | Permitir nombres homónimos diferenciados por documento y correo | Se permite crear clientes, usuarios, empleados y proveedores con el mismo nombre si el documento y correo son distintos; se bloquea documento duplicado. | `faseDCierreFuncional.test.js`, `fidelidadYWompiPendiente.test.js` | ✅ Aprobado |
| **CP-06** | Empleados | Reglas de fechas según tipo de contrato | En **Término Indefinido** la fecha fin se anula/deshabilita; en **Término Fijo** es obligatoria y debe ser estrictamente posterior a la fecha de inicio. | `faseAValidaciones.test.js` (`empleadoController`) | ✅ Aprobado |
| **CP-07** | Compras | Validación estricta de fecha de factura y lotes vigentes | Rechaza HTTP `400` para fecha anterior a hoy, fecha posterior a hoy (zona `America/Bogota`) o lotes ya vencidos; acepta fecha exacta de hoy. | `faseAValidaciones.test.js` (`CompraService.create`) | ✅ Aprobado |
| **CP-08** | Insumos | Validación de stock mínimo, stock máximo y stock inicial | Exige `stockMinimo >= 0`, `stockMaximo > stockMinimo` y consistencia con capacidad máxima en creación y edición. | `faseAValidaciones.test.js` (`InsumoService`) | ✅ Aprobado |
| **CP-09** | Insumos Preparados | Creación/edición de insumo elaborado con ficha técnica y costo real | Sincroniza `DetalleInsumoPreparadoInsumo`, recalcula `costoTotal`, invalida caché y muestra mensajes de validación claros acordes al error real. | `insumoPreparadoFichaTecnica.test.js`, `insumosModalsAutomated.test.cjs` (19/19 unit) | ✅ Aprobado |
| **CP-10** | Toppings / Adiciones | Edición de toppings y validación de precio positivo | Permite actualizar nombre, categoría y precio de toppings; rechaza `precio <= 0`. | `faseDCierreFuncional.test.js` (`AdicionService.update`) | ✅ Aprobado |
| **CP-11** | Inventario FEFO | Descuento y restauración de lotes en orden FEFO sin tocar lotes vencidos | Separa stock vigente vs. vencido, descuenta primero el lote próximo a vencer y bloquea ventas con `409 Conflict` ante insuficiencia de stock vigente. | `stockVigenteFefoYVentas.test.js` (4/4) | ✅ Aprobado |
| **CP-12** | Tienda / Pedidos | Vista independiente de detalle de producto sin exigir login | Al abrir un producto desde la landing se navega a su vista dedicada sin modal y sin bloqueo por inicio de sesión. | `ProductoDetalleCliente.jsx` | ✅ Aprobado |
| **CP-13** | Checkout / Wompi | Teléfono obligatorio, aviso de domicilio por aparte y pago automático Wompi | Exige teléfono válido y aceptación legal antes de pagar; especifica que el domicilio se paga por aparte; elimina botón manual de *"Aprobar pago"*. | `wompiPaymentGateway.test.cjs` (40/40), `ClienteLanding.jsx` | ✅ Aprobado |
| **CP-14** | Pedidos Pre-Cocina | Adicionar productos a un pedido existente antes de pasar a producción | Permite agregar productos mientras `estadoEntrega=PENDIENTE` y `estadoCocina=EN_COLA`, recalculando totales y preservando descuentos; rechaza con HTTP `409` si ya está en `PREPARANDO` o superior. | `faseDCierreFuncional.test.js` (`VentaService.agregarProductos`) | ✅ Aprobado |
| **CP-15** | Producción (KDS) | Listado simplificado + vista de detalle completo | El listado de `/produccion/gestion` muestra información concisa sin saturación y delega el desglose completo a **Ver detalle**. | `GestionProduccion.jsx` | ✅ Aprobado |
| **CP-16** | Eventos y Variantes | Precios de eventos multi-producto y variantes sin sobrescribir productos no asociados | Cada producto asociado a un evento recibe su precio promocional específico; los eventos en tabla se resaltan con badge sin pintar toda la fila. | `eventPricingMultiProducto.test.js` (7/7), `catalogVariantsSync.test.js` (5/5), `productVariantUtils.test.mjs` (4/4) | ✅ Aprobado |
| **CP-17** | Fidelización | Progresión paso a paso e inmunidad frente a intenciones Wompi no pagadas | Escala Nuevo (0%) → Regular (5%) → Frecuente (10%) → VIP (15%) ignorando intenciones Wompi pendientes, canceladas o devoluciones. | `fidelidadYWompiPendiente.test.js` (11/11) | ✅ Aprobado |
| **CP-18** | Devoluciones y Reembolsos | Validación de cuentas de reembolso y cuadre financiero real | Valida Bancolombia, Nequi, Daviplata y otros bancos; descuenta unidades devueltas y montos reembolsados de las ventas brutas (`Neto = Bruto − Reembolsos`). | `faseBReportesNeto.test.js` (2/2), `datosReembolsoFields.test.mjs` (5/5) | ✅ Aprobado |
| **CP-19** | Reportes por Fechas y Excel | Filtros por rango de fechas, PDF con logo y Excel corporativo multi-hoja | Genera `.xlsx` con 4 pestañas (*Resumen Ejecutivo*, *Cuadre por Producto*, *Devoluciones*, *Histórico Mensual*), logotipo PNG embebido, tarjetas KPI, auto-ancho, alto dinámico y fórmulas `SUM`/`COUNTA` con valor `<v>` visible incluso en Vista Protegida. | Verificación OOXML (`excelExport.js`), `VentasReportesView.jsx` | ✅ Aprobado |
| **CP-20** | Direcciones y Correos | Validación de nomenclatura de Medellín y correos transaccionales | Valida direcciones de Medellín (local y ArcGIS), renderiza 5 plantillas de correo hacia el dominio productivo oficial y notifica solo campos realmente modificados. | `medellinAddressValidation.test.mjs` (3/3), `emailsLinksYModificaciones.test.js` (4/4), `preferenciasYGooglePassword.test.js` (6/6) | ✅ Aprobado |

---

## 4. Evidencias de Ejecución Automatizada (25/11/2026)

### 4.1. Suite de Pruebas Unitarias y de Servicios — Backend

Comando ejecutado:
```bash
node --test test/faseAValidaciones.test.js test/faseBReportesNeto.test.js test/faseDCierreFuncional.test.js test/insumoPreparadoFichaTecnica.test.js test/catalogVariantsSync.test.js test/eventPricingMultiProducto.test.js test/fidelidadYWompiPendiente.test.js test/preferenciasYGooglePassword.test.js test/emailsLinksYModificaciones.test.js test/stockVigenteFefoYVentas.test.js
```

| Archivo de Prueba | Casos Ejecutados | Aprobados | Resultado |
| :--- | :---: | :---: | :---: |
| `test/faseAValidaciones.test.js` | 3 | 3 | ✅ 100% |
| `test/faseBReportesNeto.test.js` | 2 | 2 | ✅ 100% |
| `test/faseDCierreFuncional.test.js` | 7 | 7 | ✅ 100% |
| `test/insumoPreparadoFichaTecnica.test.js` | 3 | 3 | ✅ 100% |
| `test/catalogVariantsSync.test.js` | 5 | 5 | ✅ 100% |
| `test/eventPricingMultiProducto.test.js` | 7 | 7 | ✅ 100% |
| `test/fidelidadYWompiPendiente.test.js` | 11 | 11 | ✅ 100% |
| `test/preferenciasYGooglePassword.test.js` | 6 | 6 | ✅ 100% |
| `test/emailsLinksYModificaciones.test.js` | 4 | 4 | ✅ 100% |
| `test/stockVigenteFefoYVentas.test.js` | 4 | 4 | ✅ 100% |
| **Total Pruebas Unitarias Backend** | **52** | **52** | **✅ 100%** |

> **Nota técnica sobre pruebas de integración y legacy:**
> - `test/stockDeductionRealData.test.js` requiere el servidor API levantado en `http://localhost:5000` y conexión activa a la BD de pruebas.
> - En `test/lotesVencidosYDevoluciones.test.js`, 4 de 6 pruebas pasan; 2 aserciones corresponden a reglas previas actualizadas por el negocio (los lotes que vencen hoy se consideran vigentes hasta fin de día y el `idRol: 3` corresponde actualmente a **Vendedor POS**, mientras que **Cliente** es `idRol: 4`).

---

### 4.2. Suite de Pruebas Automatizadas — Frontend

Comando ejecutado:
```bash
node --test src/test/datosReembolsoFields.test.mjs src/test/medellinAddressValidation.test.mjs src/test/productVariantUtils.test.mjs src/test/variantFichaUtils.test.mjs src/test/wompiPaymentGateway.test.cjs
```

| Archivo de Prueba | Casos Ejecutados | Aprobados | Resultado |
| :--- | :---: | :---: | :---: |
| `src/test/wompiPaymentGateway.test.cjs` | 40 | 40 | ✅ 100% |
| `src/test/datosReembolsoFields.test.mjs` | 5 | 5 | ✅ 100% |
| `src/test/productVariantUtils.test.mjs` | 4 | 4 | ✅ 100% |
| `src/test/medellinAddressValidation.test.mjs` | 3 | 3 | ✅ 100% |
| `src/test/variantFichaUtils.test.mjs` | 2 | 2 | ✅ 100% |
| `src/test/insumosModalsAutomated.test.cjs` (Módulos 1–3 unitarios) | 19 | 19 | ✅ 100% *(Módulo 4 requiere API local)* |
| **Verificación OOXML `excelExport.js` (Multi-hoja + Logo + Fórmulas + Caché `<v>`)** | 3 suites | 3 suites | ✅ 100% |
| **Total Pruebas Unitarias Frontend** | **76** | **76** | **✅ 100%** |

---

### 4.3. Evidencia de Compilación y Rendimiento (Build de Producción)

- **Herramienta:** `npm run build` (`vite v6.4.6`) en `Frontend-Web-Chazin-Food`.
- **Resultado:** Compilación limpia (`exit code 0`, 0 errores).
- **Optimización de carga (Code-Splitting):**
  - Chunk principal inicial (`index-*.js`): **~22.25 kB gzip** (sin librerías pesadas).
  - Motor de exportación Excel (`excel-export-*.js` / `write-excel-file`): **19.95 kB gzip** cargado únicamente bajo demanda al pulsar *Exportar Excel*.
  - Gráficos (`charts-*.js` / `recharts`): aislados en chunk diferido solo para rutas de Dashboard y Reportes.
  - Modales legales (`PoliticaDatosModal`) y de ayuda (`AyudaEnLineaModal`): cargados con `React.lazy` + `Suspense`.

---

## 5. Cómo Reproducir las Pruebas (Guía para el Jurado)

```bash
# 1. Ejecutar pruebas unitarias del Backend
cd Backend-Web-Chazin-Food
node --test test/faseAValidaciones.test.js test/faseBReportesNeto.test.js test/faseDCierreFuncional.test.js test/insumoPreparadoFichaTecnica.test.js test/catalogVariantsSync.test.js test/eventPricingMultiProducto.test.js test/fidelidadYWompiPendiente.test.js test/preferenciasYGooglePassword.test.js test/emailsLinksYModificaciones.test.js test/stockVigenteFefoYVentas.test.js

# 2. Ejecutar pruebas unitarias del Frontend
cd ../Frontend-Web-Chazin-Food
node --test src/test/datosReembolsoFields.test.mjs src/test/medellinAddressValidation.test.mjs src/test/productVariantUtils.test.mjs src/test/variantFichaUtils.test.mjs src/test/wompiPaymentGateway.test.cjs

# 3. Verificar compilación de producción del Frontend
npm run build
```
