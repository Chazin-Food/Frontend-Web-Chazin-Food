import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeVariantExtras,
  buildVariantChangesSummary
} from "../features/ventas/utils/variantFichaUtils.js";

test("summarizeVariantExtras captures QUITAR deltas, delta-only additions, and omitted base ingredients", () => {
  const baseDetalles = [
    { idInsumo: 1, cantidad: 1, unidadMedida: "und", insumo: { idInsumo: 1, nombre: "Pan Brioche", unidadMedida: "und" } },
    { idInsumo: 2, cantidad: 1, unidadMedida: "und", insumo: { idInsumo: 2, nombre: "Cebolla", unidadMedida: "und" } }
  ];

  // Delta-only case (no varDetalles expanded)
  const deltaOnly = summarizeVariantExtras(
    [],
    baseDetalles,
    [
      { tipoAccion: "AGREGAR", idInsumo: 9, cantidad: 30, unidadMedida: "g", insumo: { idInsumo: 9, nombre: "Tocineta", unidadMedida: "g" } },
      { tipoAccion: "QUITAR", idInsumo: 2, cantidad: 1, unidadMedida: "und", insumo: { idInsumo: 2, nombre: "Cebolla", unidadMedida: "und" } }
    ],
    false,
    "Sin Cebolla + Tocineta"
  );

  assert.equal(deltaOnly.extrasCount, 2);
  assert.ok(deltaOnly.extraItems.some((e) => e.idInsumo === 9 && e.kind === "extra_nuevo"));
  assert.ok(deltaOnly.extraItems.some((e) => e.idInsumo === 2 && e.kind === "quitado"));

  // Base omitted from varDetalles without explicit delta
  const omittedInFicha = summarizeVariantExtras(
    [{ idInsumo: 1, cantidad: 1, unidadMedida: "und", insumo: { idInsumo: 1, nombre: "Pan Brioche", unidadMedida: "und" } }],
    baseDetalles,
    [],
    false,
    "Sin Cebolla"
  );
  assert.equal(omittedInFicha.extrasCount, 1);
  assert.equal(omittedInFicha.extraItems[0].kind, "quitado");
  assert.equal(omittedInFicha.extraItems[0].nombre, "Cebolla");
});

test("buildVariantChangesSummary builds changes, effective ingredients, and specifications", () => {
  const producto = {
    idProducto: 5,
    nombre: "Hamburguesa Clásica",
    precio: 19000,
    descripcion: "Burger artesanal",
    fichaTecnica: {
      especificaciones: "Sellado en plancha caliente",
      detalles: [
        { idInsumo: 1, cantidad: 1, unidadMedida: "und", insumo: { idInsumo: 1, nombre: "Pan Brioche", unidadMedida: "und" } },
        { idInsumo: 2, cantidad: 150, unidadMedida: "g", insumo: { idInsumo: 2, nombre: "Carne Res", unidadMedida: "g" } }
      ]
    }
  };

  const variant = {
    idVariante: 55,
    nombre: "Edición Tocineta Fest",
    precio: 23500,
    descripcion: "Con tocineta ahumada crocante",
    creadaPorEvento: 1,
    idEvento: 12,
    fichaTecnica: {
      especificaciones: "Servir salsas aparte",
      detalles: [
        { idInsumo: 1, cantidad: 1, unidadMedida: "und", insumo: { idInsumo: 1, nombre: "Pan Brioche", unidadMedida: "und" } },
        { idInsumo: 2, cantidad: 200, unidadMedida: "g", insumo: { idInsumo: 2, nombre: "Carne Res", unidadMedida: "g" } },
        { idInsumo: 8, cantidad: 40, unidadMedida: "g", insumo: { idInsumo: 8, nombre: "Tocineta Ahumada", unidadMedida: "g" } }
      ]
    },
    insumosModificados: [
      { tipoAccion: "AGREGAR", idInsumo: 8, cantidad: 40, unidadMedida: "g", insumo: { idInsumo: 8, nombre: "Tocineta Ahumada", unidadMedida: "g" } }
    ]
  };

  const summary = buildVariantChangesSummary(variant, producto, false);
  assert.equal(summary.changesCount, 2);
  assert.ok(summary.changes.some((c) => c.kind === "extra_cantidad" && c.nombre === "Carne Res"));
  assert.ok(summary.changes.some((c) => c.kind === "extra_nuevo" && c.nombre === "Tocineta Ahumada"));
  assert.equal(summary.finalIngredients.length, 3);
  assert.match(summary.especificaciones, /Servir salsas aparte/);
  assert.match(summary.especificaciones, /Sellado en plancha caliente/);
});
