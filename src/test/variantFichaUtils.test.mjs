import assert from "node:assert/strict";
import test from "node:test";
import {
  detectVariantSizeInfo,
  scaleQuantityByFactor,
  buildVariantDetallesFromBase,
  reconstructVariantDetallesFromDeltas,
  computeInsumosModificadosDeltas,
  resolveDrinkInsumoId,
  buildDefaultDrinkVariantDetalles,
  classifyVariantCategory,
  classifyVariantIngredientStatus,
  summarizeVariantExtras
} from "../features/ventas/utils/variantFichaUtils.js";
import { resolveRecetaUnidadYCantidad } from "../features/fichas-tecnicas/utils/costoUtils.js";

test("detectVariantSizeInfo detects sizes vs flavors accurately", () => {
  assert.deepEqual(detectVariantSizeInfo("Grande"), {
    isSize: true,
    factor: 1.5,
    label: "1.5x (Grande)"
  });
  assert.deepEqual(detectVariantSizeInfo("Mediana"), {
    isSize: true,
    factor: 1.25,
    label: "1.25x (Mediana)"
  });
  assert.deepEqual(detectVariantSizeInfo("Familiar"), {
    isSize: true,
    factor: 2,
    label: "2x (Familiar / Mega)"
  });
  assert.deepEqual(detectVariantSizeInfo("Mega 2.5L"), {
    isSize: true,
    factor: 2.5,
    label: "2.5x (Mega / 2.5L)"
  });
  assert.deepEqual(detectVariantSizeInfo("Doble Carne"), {
    isSize: true,
    factor: 2,
    label: "2x (Doble)"
  });
  assert.deepEqual(detectVariantSizeInfo("Triple"), {
    isSize: true,
    factor: 3,
    label: "3x (Triple)"
  });
  assert.deepEqual(detectVariantSizeInfo("Combo 4 personas"), {
    isSize: true,
    factor: 4,
    label: "4x (4 personas)"
  });
  assert.deepEqual(detectVariantSizeInfo("BBQ Ahumada"), {
    isSize: false,
    factor: 1,
    label: "1x (Estándar)"
  });
  assert.deepEqual(detectVariantSizeInfo("Zero"), {
    isSize: false,
    factor: 1,
    label: "1x (Estándar)"
  });
});

test("buildVariantDetallesFromBase preloads base insumos and scales cleanly without double-multiplication", () => {
  const baseRecipe = [
    { idInsumo: 1, nombre: "Pan Brioche", cantidad: 1, unidadMedida: "und" },
    { idInsumo: 2, nombre: "Carne de Res 80/20", cantidad: 0.15, unidadMedida: "kg" },
    { idInsumo: 3, nombre: "Queso Cheddar", cantidad: 1, unidadMedida: "und" }
  ];

  // Flavor variant (factor 1): keeps exact base quantities
  const bbq = buildVariantDetallesFromBase(baseRecipe, 1);
  assert.equal(bbq.length, 3);
  assert.equal(bbq[0].cantidad, 1);
  assert.equal(bbq[1].cantidad, 0.15);
  assert.equal(bbq[1].baseCantidad, 0.15);
  assert.equal(bbq[2].cantidad, 1);

  // Size variant (Grande = 1.5x): multiplies each base insumo cleanly
  const grande = buildVariantDetallesFromBase(baseRecipe, 1.5);
  assert.equal(grande[0].cantidad, 1.5);
  assert.equal(grande[1].cantidad, 0.23); // 0.15 * 1.5 = 0.225 -> rounded 0.23
  assert.equal(grande[1].baseCantidad, 0.15);

  // Re-scaling from Grande (1.5x) to Familiar (2x) uses baseCantidad so there is NO 1.5 * 2 = 3x bug
  const rescaled = grande.map((d) => ({
    ...d,
    cantidad: scaleQuantityByFactor(d.baseCantidad, 2)
  }));
  assert.equal(rescaled[0].cantidad, 2);
  assert.equal(rescaled[1].cantidad, 0.3);
  assert.equal(rescaled[2].cantidad, 2);
});

test("computeInsumosModificadosDeltas and reconstructVariantDetallesFromDeltas round-trip cleanly", () => {
  const baseRecipe = [
    { idInsumo: 10, nombre: "Pan", cantidad: 1, unidadMedida: "und" },
    { idInsumo: 11, nombre: "Carne", cantidad: 150, unidadMedida: "g" },
    { idInsumo: 12, nombre: "Cebolla", cantidad: 20, unidadMedida: "g" }
  ];

  const editedVariantRecipe = [
    { idInsumo: 10, nombre: "Pan", cantidad: 1, unidadMedida: "und" },
    { idInsumo: 11, nombre: "Carne", cantidad: 300, unidadMedida: "g" }, // modified qty
    // Cebolla (12) removed -> QUITAR
    { idInsumo: 13, nombre: "Jalapeños", cantidad: 25, unidadMedida: "g" } // added -> AGREGAR
  ];

  const deltas = computeInsumosModificadosDeltas(editedVariantRecipe, baseRecipe);
  assert.equal(deltas.length, 3);
  assert.deepEqual(
    deltas.find((d) => d.idInsumo === 11),
    {
      idVarianteInsumo: null,
      tipoAccion: "MODIFICAR_CANTIDAD",
      idInsumo: 11,
      idInsumoReemplazado: null,
      cantidad: 300,
      unidadMedida: "gr"
    }
  );
  assert.deepEqual(
    deltas.find((d) => d.idInsumo === 12),
    {
      idVarianteInsumo: null,
      tipoAccion: "QUITAR",
      idInsumo: 12,
      idInsumoReemplazado: null,
      cantidad: 0,
      unidadMedida: "gr"
    }
  );
  assert.deepEqual(
    deltas.find((d) => d.idInsumo === 13),
    {
      idVarianteInsumo: null,
      tipoAccion: "AGREGAR",
      idInsumo: 13,
      idInsumoReemplazado: null,
      cantidad: 25,
      unidadMedida: "gr"
    }
  );

  const catalog = [
    { idInsumo: 10, nombre: "Pan", unidadMedida: "und" },
    { idInsumo: 11, nombre: "Carne", unidadMedida: "g" },
    { idInsumo: 12, nombre: "Cebolla", unidadMedida: "g" },
    { idInsumo: 13, nombre: "Jalapeños", unidadMedida: "g" }
  ];
  const reconstructed = reconstructVariantDetallesFromDeltas(baseRecipe, deltas, catalog);
  assert.equal(reconstructed.length, 3);
  assert.equal(reconstructed.find((r) => r.idInsumo === 10).cantidad, 1);
  assert.equal(reconstructed.find((r) => r.idInsumo === 11).cantidad, 300);
  assert.equal(reconstructed.find((r) => r.idInsumo === 12), undefined);
  assert.equal(reconstructed.find((r) => r.idInsumo === 13).cantidad, 25);
});

test("REEMPLAZAR insumo emits single REEMPLAZAR delta without duplicate QUITAR/AGREGAR and preserves reemplazaA", () => {
  const baseRecipe = [
    { idInsumo: 10, nombre: "Pan", cantidad: 1, unidadMedida: "und" },
    { idInsumo: 15, nombre: "Queso Cheddar", cantidad: 1, unidadMedida: "und" }
  ];

  const replacedRecipe = [
    { idInsumo: 10, nombre: "Pan", cantidad: 1, unidadMedida: "und" },
    {
      idInsumo: 16,
      nombre: "Queso Mozzarella",
      cantidad: 30,
      unidadMedida: "g",
      reemplazaA: { idInsumo: 15, nombre: "Queso Cheddar" }
    }
  ];

  const deltas = computeInsumosModificadosDeltas(replacedRecipe, baseRecipe);
  assert.equal(deltas.length, 1);
  assert.deepEqual(deltas[0], {
    idVarianteInsumo: null,
    tipoAccion: "REEMPLAZAR",
    idInsumo: 16,
    idInsumoReemplazado: 15,
    cantidad: 30,
    unidadMedida: "gr"
  });

  const catalog = [
    { idInsumo: 10, nombre: "Pan", unidadMedida: "und" },
    { idInsumo: 15, nombre: "Queso Cheddar", unidadMedida: "und" },
    { idInsumo: 16, nombre: "Queso Mozzarella", unidadMedida: "gr" }
  ];
  const reconstructed = reconstructVariantDetallesFromDeltas(baseRecipe, deltas, catalog);
  assert.equal(reconstructed.length, 2);
  assert.equal(reconstructed.find((r) => r.idInsumo === 15), undefined);
  const moz = reconstructed.find((r) => r.idInsumo === 16);
  assert.ok(moz);
  assert.equal(moz.cantidad, 30);
  assert.equal(moz.unidadMedida, "gr");
  assert.deepEqual(moz.reemplazaA, { idInsumo: 15, nombre: "Queso Cheddar" });
});

test("resolveRecetaUnidadYCantidad respeta unidades und/Unidad aunque el nombre incluya 400ml", () => {
  assert.deepEqual(
    resolveRecetaUnidadYCantidad({
      nombre: "Coca-Cola Sin Azúcar / Light 400ml",
      unidadMedida: "und"
    }),
    { cantidad: 1, unidadMedida: "und" }
  );

  assert.deepEqual(
    resolveRecetaUnidadYCantidad({
      nombre: "Gaseosa Uva Postobón 400ml",
      unidadMedida: "Unidad"
    }),
    { cantidad: 1, unidadMedida: "und" }
  );

  assert.deepEqual(
    resolveRecetaUnidadYCantidad({
      nombre: "Carne con carolina reapper 150g",
      unidadMedida: "kg"
    }),
    { cantidad: 150, unidadMedida: "gr" }
  );
});

test("resolveDrinkInsumoId y buildDefaultDrinkVariantDetalles mapean correctamente sabores y tamaños de gaseosas", () => {
  assert.equal(resolveDrinkInsumoId("Sin Azúcar / Light 400ml", "Gaseosa Coca-Cola 400ml", 8), 32);
  assert.equal(resolveDrinkInsumoId("Botella 1.5 Litros", "Gaseosa Coca-Cola 400ml", 8), 29);
  assert.equal(resolveDrinkInsumoId("Con Azúcar 400ml", "Gaseosa Coca-Cola Sin Azúcar / Light 400ml", 16), 29);
  assert.equal(resolveDrinkInsumoId("Botella 1.5 Litros", "Gaseosa Coca-Cola Sin Azúcar / Light 400ml", 16), 32);
  assert.equal(resolveDrinkInsumoId("Sin Azúcar / Light 400ml", "Gaseosa Pepsi 400ml", 11), 34);
  assert.equal(resolveDrinkInsumoId("Botella 1.5 Litros", "Gaseosa Pepsi 400ml", 11), 33);
  assert.equal(resolveDrinkInsumoId("Sabor Uva 400ml", "Gaseosa Manzana Postobón 400ml", 9), 47);
  assert.equal(resolveDrinkInsumoId("Botella 1.5 Litros", "Gaseosa Manzana Postobón 400ml", 9), 30);
  assert.equal(resolveDrinkInsumoId("Sabor Colombiana 400ml", "Gaseosa Naranja Postobón 400ml", 39), 35);
  assert.equal(resolveDrinkInsumoId("Botella 1.5 Litros", "Gaseosa Sprite 400ml", 13), 36);
  assert.equal(resolveDrinkInsumoId("Mega Botella 2.5 Litros", "Gaseosa Quatro Toronja 400ml", 14), 37);
  assert.equal(resolveDrinkInsumoId("Botella 1.5 Litros", "Agua Cristal sin Gas 600ml", 10), 31);

  const catalog = [
    { idInsumo: 32, nombre: "Coca-Cola Sin Azúcar / Light 400ml", unidadMedida: "und", precioUnitario: 2500, stock: 59 }
  ];
  const dets = buildDefaultDrinkVariantDetalles("Sin Azúcar / Light 400ml", "Gaseosa Coca-Cola 400ml", 8, catalog);
  assert.equal(dets.length, 1);
  assert.equal(dets[0].idInsumo, 32);
  assert.equal(dets[0].cantidad, 1);
  assert.equal(dets[0].unidadMedida, "und");
  assert.equal(dets[0].precioUnitario, 2500);
  assert.equal(dets[0].nombre, "Coca-Cola Sin Azúcar / Light 400ml");
});

test("classifyVariantIngredientStatus, summarizeVariantExtras y classifyVariantCategory etiquetan y agrupan categorías correctamente", () => {
  const base = [
    { idInsumo: 12, nombre: "Pan Brioche", cantidad: 1, unidadMedida: "und" },
    { idInsumo: 14, nombre: "Carne de Res 80/20", cantidad: 0.15, unidadMedida: "kg" },
    { idInsumo: 21, nombre: "Papas a la Francesa", cantidad: 0.25, unidadMedida: "kg" }
  ];

  // 1. Misma cantidad que base -> "base"
  const panStatus = classifyVariantIngredientStatus({ idInsumo: 12, cantidad: 1, unidadMedida: "und" }, base);
  assert.equal(panStatus.kind, "base");
  assert.equal(panStatus.isExtra, false);

  // 2. Mayor cantidad (incluso en otra unidad compatible: 300g vs 0.15kg) -> "extra_cantidad" (Tamaño o porción)
  const doubleMeatStatus = classifyVariantIngredientStatus({ idInsumo: 14, cantidad: 300, unidadMedida: "g" }, base);
  assert.equal(doubleMeatStatus.kind, "extra_cantidad");
  assert.equal(doubleMeatStatus.isExtra, true);
  assert.equal(doubleMeatStatus.category, "tamano_porcion");
  assert.equal(doubleMeatStatus.diffQty, 150);
  assert.match(doubleMeatStatus.badgeText, /▲ Porción \(\+150 gr · Base: 150 gr\)/);

  // 3. Insumo agregado -> "extra_nuevo" (Sabor o salsa)
  const salsaStatus = classifyVariantIngredientStatus({ idInsumo: 55, nombre: "Salsa Miel Mostaza Artesanal", cantidad: 0.03, unidadMedida: "kg" }, base);
  assert.equal(salsaStatus.kind, "extra_nuevo");
  assert.equal(salsaStatus.isExtra, true);
  assert.equal(salsaStatus.category, "sabor_salsa");
  assert.equal(salsaStatus.shortBadge, "★ Sabor / Salsa");

  // 4. Insumo reemplazado -> "reemplazo" (Base o proteína)
  const cascoStatus = classifyVariantIngredientStatus(
    { idInsumo: 38, nombre: "Papas en Casco", cantidad: 0.25, unidadMedida: "kg" },
    base,
    [{ tipoAccion: "REEMPLAZAR", idInsumo: 38, idInsumoReemplazado: 21, cantidad: 0.25, unidadMedida: "kg" }]
  );
  assert.equal(cascoStatus.kind, "reemplazo");
  assert.equal(cascoStatus.isExtra, true);
  assert.equal(cascoStatus.category, "base_proteina");
  assert.match(cascoStatus.badgeText, /⇄ Reemplaza: Papas a la Francesa/);

  // 5. Resumen completo de cambios (porción + salsa + reemplazo)
  const summary = summarizeVariantExtras(
    [
      { idInsumo: 12, nombre: "Pan Brioche", cantidad: 1, unidadMedida: "und" },
      { idInsumo: 14, nombre: "Carne de Res 80/20", cantidad: 0.3, unidadMedida: "kg" },
      { idInsumo: 55, nombre: "Salsa Miel Mostaza Artesanal", cantidad: 0.03, unidadMedida: "kg" },
      { idInsumo: 38, nombre: "Papas en Casco", cantidad: 0.25, unidadMedida: "kg" }
    ],
    base,
    [{ tipoAccion: "REEMPLAZAR", idInsumo: 38, idInsumoReemplazado: 21, cantidad: 0.25, unidadMedida: "kg" }],
    false,
    "Costeña con Papas en Casco Rústicas"
  );
  assert.equal(summary.extrasCount, 3);
  assert.deepEqual(summary.extraItems.map((e) => e.idInsumo), [14, 55, 38]);
  assert.equal(summary.variantCategory.id, "base_proteina");

  // 6. classifyVariantCategory para los 3 tipos en comida y bebida
  assert.equal(
    classifyVariantCategory(
      { nombre: "Doble Carne Clásica (300g)", insumosModificados: [{ tipoAccion: "MODIFICAR_CANTIDAD", idInsumo: 14, cantidad: 0.3, unidadMedida: "kg" }] },
      base,
      false
    ).id,
    "tamano_porcion"
  );
  assert.equal(classifyVariantCategory({ nombre: "Proteína Carne Angus Certified (180g)" }, base, false).id, "base_proteina");
  assert.equal(classifyVariantCategory({ nombre: "En Pan Integral Artesanal con Semillas" }, base, false).id, "base_proteina");
  assert.equal(classifyVariantCategory({ nombre: "Sabor Salsa Buffalo Picante Artesanal" }, base, false).id, "sabor_salsa");
  assert.equal(classifyVariantCategory({ nombre: "Familiar Costeña (2 Personas)" }, base, false).id, "tamano_porcion");
  assert.equal(classifyVariantCategory({ nombre: "Botella 1.5 Litros" }, [], true).id, "tamano_porcion");
  assert.equal(classifyVariantCategory({ nombre: "Sin Azúcar / Light 400ml" }, [], true).id, "sabor_salsa");
});


