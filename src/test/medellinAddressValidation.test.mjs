import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDireccionMedellin,
  verifyDireccionMedellinRealtime
} from "../shared/utils/validationUtils.js";

test("validateDireccionMedellin acepta formatos viales válidos de Medellín", () => {
  const validAddresses = [
    "Calle 10 # 43A-30, El Poblado",
    "Cra 70 # 44B-12, Laureles",
    "Circular 4 # 70-18",
    "Diagonal 75B # 32-40",
    "Calle 50 #30-20, Medellín",
    "Transversal 39B # 73-49 Apto 401"
  ];

  for (const addr of validAddresses) {
    const res = validateDireccionMedellin(addr, { required: true });
    assert.equal(res.isValid, true, `Debe aceptar: ${addr}. Error: ${res.error}`);
  }
});

test("validateDireccionMedellin rechaza textos sin nomenclatura o direcciones falsas", () => {
  const invalidAddresses = [
    "casa 123",
    "calle falsa 123",
    "medellin",
    "texto suelto sin direccion",
    "0 # 0-0",
    "asdf # 12-34"
  ];

  for (const addr of invalidAddresses) {
    const res = validateDireccionMedellin(addr, { required: true });
    assert.equal(res.isValid, false, `Debe rechazar: ${addr}`);
    assert.ok(res.error.length > 0);
  }

  assert.equal(validateDireccionMedellin("", { required: false }).isValid, true);
  assert.equal(validateDireccionMedellin("", { required: true }).isValid, false);
});

test("verifyDireccionMedellinRealtime verifica dirección real en ArcGIS y rechaza dirección inexistente", async () => {
  const realRes = await verifyDireccionMedellinRealtime("Calle 50 # 45-30");
  assert.equal(realRes.isValid, true);
  if (!realRes.offlineFallback) {
    assert.equal(realRes.verified, true);
    assert.match(String(realRes.ciudad || ""), /medell/i);
    assert.ok(realRes.score >= 78);
  }

  const bogusRes = await verifyDireccionMedellinRealtime("Calle 999 # 999-999");
  if (!bogusRes.offlineFallback) {
    assert.equal(bogusRes.isValid, false);
    assert.equal(bogusRes.verified, false);
  }
});
