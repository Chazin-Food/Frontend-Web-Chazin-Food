import test from "node:test";
import assert from "node:assert/strict";
import {
  isDummyOrBaseVariant,
  isVariantActive,
  isVariantFromEvent,
  getDisplayProductVariants,
  getProductVariantSummary
} from "../shared/utils/productVariantUtils.js";

test("isDummyOrBaseVariant identifies tautological base variants cleanly", () => {
  assert.equal(isDummyOrBaseVariant("", "Hamburguesa Clásica"), true);
  assert.equal(isDummyOrBaseVariant("Hamburguesa Clásica", "Hamburguesa Clásica"), true);
  assert.equal(isDummyOrBaseVariant("Base", "Hamburguesa Clásica"), true);
  assert.equal(isDummyOrBaseVariant("Hamburguesa Clásica - base", "Hamburguesa Clásica"), true);
  assert.equal(isDummyOrBaseVariant("Individual BBQ Bacon 150g", "Hamburguesa BBQ Bacon Chazin"), true);
  assert.equal(isDummyOrBaseVariant("Mexicana Clásica", "Hamburguesa Mexicana Chazin"), true);
  assert.equal(isDummyOrBaseVariant("Porción Personal Grande", "Salchipapa Criolla Chazin"), true);
  assert.equal(isDummyOrBaseVariant("Carne Picante", "Hamburguesa Clásica"), false);
  assert.equal(isDummyOrBaseVariant("Doble", "Hamburguesa Clásica"), false);
  assert.equal(isDummyOrBaseVariant("BBQ Bacon Cheddar & Jalapeño", "Hamburguesa BBQ Bacon Chazin"), false);
});

test("getDisplayProductVariants excludes combos, dummy variants, and duplicate names", () => {
  const combo = {
    nombre: "Combo Pareja",
    configuracionCombo: { esCombo: true },
    variantes: [{ idVariante: 1, nombre: "Grande", precio: 45000 }]
  };
  assert.deepEqual(getDisplayProductVariants(combo), []);

  const burger = {
    nombre: "Hamburguesa Clásica",
    precio: 18000,
    variantes: [
      { idVariante: 1, nombre: "Hamburguesa Clásica", precio: 18000 },
      { idVariante: 2, nombre: "Carne Picante", precio: 20000 },
      { idVariante: 3, nombre: "  Carne Picante  ", precio: 20000 },
      { idVariante: 4, nombre: "Doble", precio: 24000 },
      { idVariante: 5, nombre: "Base", precio: 18000 }
    ]
  };

  const display = getDisplayProductVariants(burger);
  assert.deepEqual(
    display.map((v) => v.nombre),
    ["Carne Picante", "Doble"]
  );
});

test("getProductVariantSummary summarizes variant count, names, and custom price ranges", () => {
  const samePriceProduct = {
    nombre: "Gaseosa 400ml",
    precio: 4500,
    variantes: [
      { idVariante: 10, nombre: "Uva", precio: 0 },
      { idVariante: 11, nombre: "Naranja", precio: 4500 }
    ]
  };

  const sameSummary = getProductVariantSummary(samePriceProduct);
  assert.equal(sameSummary.hasVariants, true);
  assert.equal(sameSummary.count, 2);
  assert.deepEqual(sameSummary.names, ["Uva", "Naranja"]);
  assert.equal(sameSummary.hasDifferentPrices, false);
  assert.equal(sameSummary.minPrice, 4500);
  assert.equal(sameSummary.maxPrice, 4500);

  const variedPriceProduct = {
    nombre: "Hamburguesa Clásica",
    precio: 18000,
    variantes: [
      { idVariante: 20, nombre: "Carne Picante", precio: 18000 },
      { idVariante: 21, nombre: "Doble Carne", precio: 25000 }
    ]
  };

  const diffSummary = getProductVariantSummary(variedPriceProduct);
  assert.equal(diffSummary.hasVariants, true);
  assert.equal(diffSummary.count, 2);
  assert.equal(diffSummary.hasDifferentPrices, true);
  assert.equal(diffSummary.minPrice, 18000);
  assert.equal(diffSummary.maxPrice, 25000);

  const noVariants = getProductVariantSummary({ nombre: "Papas", precio: 7000, variantes: [] });
  assert.equal(noVariants.hasVariants, false);
  assert.equal(noVariants.count, 0);
});

test("isVariantActive & isVariantFromEvent filter inactive variants for customers unless includeInactive is true", () => {
  assert.equal(isVariantActive({ estado: 1 }), true);
  assert.equal(isVariantActive({ estado: 0 }), false);
  assert.equal(isVariantActive({ estado: "Inactivo" }), false);
  assert.equal(isVariantActive({ activo: false }), false);

  assert.equal(isVariantFromEvent({ creadaPorEvento: true }), true);
  assert.equal(isVariantFromEvent({ idEvento: 14 }), true);
  assert.equal(isVariantFromEvent({ creadaPorEvento: false }), false);

  const burger = {
    nombre: "Hamburguesa Clásica",
    precio: 19000,
    variantes: [
      { idVariante: 101, nombre: "Edición Tocineta", precio: 22000, estado: 1, creadaPorEvento: 1, idEvento: 9 },
      { idVariante: 102, nombre: "Edición Pausada", precio: 23000, estado: 0, creadaPorEvento: 1, idEvento: 10 }
    ]
  };

  const clientVisible = getDisplayProductVariants(burger);
  assert.equal(clientVisible.length, 1);
  assert.equal(clientVisible[0].nombre, "Edición Tocineta");
  assert.equal(clientVisible[0].creadaPorEvento, true);

  const adminVisible = getDisplayProductVariants(burger, { includeInactive: true });
  assert.equal(adminVisible.length, 2);
  assert.equal(adminVisible[1].estado, 0);

  const clientSummary = getProductVariantSummary(burger);
  assert.equal(clientSummary.count, 1);
  assert.deepEqual(clientSummary.names, ["Edición Tocineta"]);
});

