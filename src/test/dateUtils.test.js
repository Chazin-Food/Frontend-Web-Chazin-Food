import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLOMBIA_TZ,
  COLOMBIA_OFFSET,
  MS_PER_DAY,
  getColombiaDateISO,
  extractDateOnlyISO,
  parseDateOnlySafe,
  getColombiaTimestamp,
  getColombiaDateParts,
  addDaysColombiaISO,
  diffCalendarDaysColombia,
  formatDateSafe,
  formatDateLong,
  formatDateTime12h,
  calculateCountdown,
  isEventActiveInColombia,
  evaluateEventVigencia
} from '../shared/utils/dateUtils.js';

test('getColombiaDateISO resolves 8:30 PM Colombia (01:30Z next day) to current Colombia calendar day', () => {
  assert.equal(COLOMBIA_TZ, 'America/Bogota');
  assert.equal(COLOMBIA_OFFSET, '-05:00');
  assert.equal(MS_PER_DAY, 86400000);

  // 2026-11-20T01:30:00.000Z == 2026-11-19 20:30:00-05:00
  const eveningColombia = new Date('2026-11-20T01:30:00.000Z');
  assert.equal(getColombiaDateISO(eveningColombia), '2026-11-19');

  const parts = getColombiaDateParts(eveningColombia);
  assert.equal(parts.year, 2026);
  assert.equal(parts.month, 11);
  assert.equal(parts.day, 19);
  assert.equal(parts.hour, 20);
  assert.equal(parts.minute, 30);
});

test('DATEONLY formatting (formatDateSafe & formatDateLong) does not shift back 1 day in negative UTC offsets', () => {
  assert.equal(extractDateOnlyISO('2026-11-19'), '2026-11-19');
  assert.equal(extractDateOnlyISO('2026-11-20T01:30:00.000Z'), '2026-11-19');
  assert.equal(addDaysColombiaISO('2026-11-19', 1), '2026-11-20');
  assert.equal(addDaysColombiaISO('2026-11-19', -1), '2026-11-18');

  const safeParsed = parseDateOnlySafe('2026-11-19');
  assert.ok(safeParsed instanceof Date && !Number.isNaN(safeParsed.getTime()));

  const shortStr = formatDateSafe('2026-11-19');
  const longStr = formatDateLong('2026-11-19');
  assert.match(shortStr, /19/);
  assert.doesNotMatch(shortStr, /18/);
  assert.match(longStr, /19/);
  assert.doesNotMatch(longStr, /18/);

  const dt12 = formatDateTime12h('2026-11-20T01:30:00.000Z');
  assert.match(dt12, /19/);
  assert.match(dt12, /8:30/);
});

test('diffCalendarDaysColombia follows Rule #1 (vencimiento == hoy => 0, < hoy => negative)', () => {
  assert.equal(diffCalendarDaysColombia('2026-11-19', '2026-11-19'), 0);
  assert.equal(diffCalendarDaysColombia('2026-11-18', '2026-11-19'), -1);
  assert.equal(diffCalendarDaysColombia('2026-11-20', '2026-11-19'), 1);
});

test('getColombiaTimestamp returns exact -05:00 day start and end epoch timestamps', () => {
  const startMs = getColombiaTimestamp('2026-11-19', false);
  const endMs = getColombiaTimestamp('2026-11-19', true);

  assert.equal(new Date(startMs).toISOString(), '2026-11-19T05:00:00.000Z');
  assert.equal(new Date(endMs).toISOString(), '2026-11-20T04:59:59.999Z');
});

test('calculateCountdown ends at 23:59:59.999 Colombia (-05:00) on target date', () => {
  const almostMidnightCol = Date.parse('2026-11-19T23:00:00-05:00');
  const active = calculateCountdown('2026-11-19', almostMidnightCol);
  assert.equal(active.expirado, false);
  assert.equal(active.dias, 0);
  assert.equal(active.horas, 0);
  assert.equal(active.minutos, 59);

  const afterMidnightCol = Date.parse('2026-11-20T00:00:01-05:00');
  const expired = calculateCountdown('2026-11-19', afterMidnightCol);
  assert.equal(expired.expirado, true);
});

test('isEventActiveInColombia & evaluateEventVigencia classify active, scheduled, permanent, and expired events', () => {
  const nowNoonCol = Date.parse('2026-11-19T12:00:00-05:00');

  const activeEvt = {
    estado: true,
    fechaInicio: '2026-11-10',
    fechaFin: '2026-11-25'
  };
  assert.equal(isEventActiveInColombia(activeEvt, nowNoonCol), true);
  assert.equal(evaluateEventVigencia(activeEvt, nowNoonCol).estaVigente, true);
  assert.equal(evaluateEventVigencia(activeEvt, nowNoonCol).estadoVigencia, 'ACTIVO');

  const sameDayEndEvt = {
    estado: true,
    fechaInicio: '2026-11-10',
    fechaFin: '2026-11-19'
  };
  assert.equal(isEventActiveInColombia(sameDayEndEvt, Date.parse('2026-11-19T23:30:00-05:00')), true);

  const scheduledEvt = {
    estado: true,
    fechaInicio: '2026-11-25',
    fechaFin: '2026-11-30'
  };
  assert.equal(isEventActiveInColombia(scheduledEvt, nowNoonCol), false);
  assert.equal(evaluateEventVigencia(scheduledEvt, nowNoonCol).estadoVigencia, 'PROGRAMADO');

  const permanentEvt = {
    estado: true,
    fechaInicio: '2026-11-01',
    fechaFin: null
  };
  assert.equal(isEventActiveInColombia(permanentEvt, nowNoonCol), true);
  assert.equal(evaluateEventVigencia(permanentEvt, nowNoonCol).estaVigente, true);
  assert.equal(evaluateEventVigencia(permanentEvt, nowNoonCol).estadoVigencia, 'PERMANENTE');
  assert.equal(evaluateEventVigencia(permanentEvt, nowNoonCol).label, 'Vigencia Permanente');

  const endedYesterday = evaluateEventVigencia(
    { estado: true, fechaInicio: '2026-11-01', fechaFin: '2026-11-18' },
    nowNoonCol
  );
  assert.equal(endedYesterday.estaVigente, false);
  assert.equal(endedYesterday.estadoVigencia, 'EXPIRADO');
  assert.match(endedYesterday.label, /Finalizado hace 1 día$/);

  const endedDaysAgo = evaluateEventVigencia(
    { estado: true, fechaInicio: '2026-11-01', fechaFin: '2026-11-10' },
    nowNoonCol
  );
  assert.equal(endedDaysAgo.estaVigente, false);
  assert.equal(endedDaysAgo.estadoVigencia, 'EXPIRADO');
  assert.match(endedDaysAgo.label, /Finalizado hace 9 días/);
});
