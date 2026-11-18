/*
 * Priority 2: export -> parse -> export stability.
 *
 * The most valuable checks for a format editor: no drift in units, gas
 * fractions, waypoint telemetry or timestamps across an edit cycle.
 */
'use strict';

process.env.TZ = 'Europe/Berlin';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModules } = require('./helpers/load-modules');

const { exporter, parser, schema } = loadModules();
const { exportToUddf } = exporter;
const { parseUddfXml } = parser;
const { UNITS } = schema;

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return match ? match[1] : null;
}

function beforeDive(xml) {
  return xml.match(/<informationbeforedive>[\s\S]*?<\/informationbeforedive>/)[0];
}

function samples(xml) {
  return xml.match(/<samples>[\s\S]*?<\/samples>/)[0];
}

// Mirror what app.js hands to the exporter after an import.
function toExportData(parsed) {
  return {
    diveNumber: parsed.diveNumber,
    dateTime: parsed.dateTime,
    siteName: parsed.siteName,
    siteLocation: parsed.siteLocation,
    siteCountry: parsed.siteCountry,
    maxDepth: parsed.maxDepth,
    duration: parsed.duration,
    gasName: parsed.gasName,
    gasO2: parsed.gasO2,
    gasHe: parsed.gasHe,
    gasFractions: {
      o2: parsed.gasO2Fraction,
      he: parsed.gasHeFraction,
      n2: parsed.gasN2Fraction
    },
    allMixes: parsed.allMixes,
    startPressure: parsed.startPressure,
    endPressure: parsed.endPressure,
    tankVolume: parsed.tankVolume,
    leadQuantity: parsed.leadQuantity,
    airTemp: parsed.airTemp,
    waterTemp: parsed.waterTemp,
    visibility: parsed.visibility,
    notes: parsed.notes,
    envNotes: parsed.envNotes,
    gasNotes: parsed.gasNotes,
    gearNotes: parsed.gearNotes,
    issuesNotes: parsed.issuesNotes,
    customWaypoints: parsed.customWaypoints
  };
}

const metricDive = {
  diveNumber: '104',
  dateTime: '2026-01-15T09:30',
  siteName: 'Shark Reef',
  maxDepth: '25.0',
  duration: '52',
  gasName: 'Air',
  gasO2: 21,
  gasHe: 0,
  startPressure: '200',
  endPressure: '50',
  tankVolume: '12',
  leadQuantity: '6.0',
  airTemp: '30',
  waterTemp: '25',
  visibility: '30',
  notes: 'Great dive'
};

describe('UDDF round trips', () => {
  it('keeps metric values stable', () => {
    const first = exportToUddf(metricDive, UNITS.METRIC);
    const second = exportToUddf(toExportData(parseUddfXml(first, UNITS.METRIC)), UNITS.METRIC);

    for (const name of [
      'divenumber', 'greatestdepth', 'tankpressurebegin', 'tankpressureend',
      'tankvolume', 'leadquantity', 'airtemperature', 'lowesttemperature',
      'visibility', 'diveduration', 'o2', 'n2', 'he'
    ]) {
      assert.equal(tag(second, name), tag(first, name), `${name} drifted`);
    }
    assert.equal(tag(second, 'divenumber'), '104');
    assert.match(beforeDive(second), /<datetime>2026-01-15T09:30:00\+01:00<\/datetime>/);
  });

  it('keeps imperial values stable', () => {
    const input = {
      ...metricDive,
      maxDepth: '82.0',
      startPressure: '3000',
      endPressure: '720',
      tankVolume: '80',
      leadQuantity: '13.2',
      airTemp: '86',
      waterTemp: '77',
      visibility: '98.0'
    };
    const first = exportToUddf(input, UNITS.IMPERIAL);
    const parsed = parseUddfXml(first, UNITS.IMPERIAL);
    const second = exportToUddf(toExportData(parsed), UNITS.IMPERIAL);

    assert.equal(tag(second, 'greatestdepth'), tag(first, 'greatestdepth'));
    assert.equal(tag(second, 'tankvolume'), '12.0');
    assert.equal(tag(second, 'tankpressurebegin'), tag(first, 'tankpressurebegin'));
    assert.equal(tag(second, 'leadquantity'), tag(first, 'leadquantity'));
    assert.equal(tag(second, 'airtemperature'), tag(first, 'airtemperature'));
    assert.equal(parsed.startPressure, '3000');
    assert.equal(parsed.endPressure, '720');
  });

  it('keeps waypoint telemetry stable', () => {
    const input = {
      ...metricDive,
      customWaypoints: [
        { time: 0, depth: 0, temp: 298.15, pressure: 20000000, heartRate: 120, setMarker: 'Start & Drop' },
        { time: 600, depth: 25, temp: 297.15, bodyTemp: 310.15, pulseRate: 110 },
        { time: 3120, depth: 5 }
      ]
    };
    const first = exportToUddf(input, UNITS.METRIC);
    const parsed = parseUddfXml(first, UNITS.METRIC);
    const second = exportToUddf(toExportData(parsed), UNITS.METRIC);

    assert.equal(parsed.customWaypoints.length, 3);
    assert.equal(parsed.customWaypoints[0].setMarker, 'Start & Drop');
    assert.equal(parsed.customWaypoints[0].pressure, 20000000);
    assert.equal(tag(second, 'heartrate'), '120');
    assert.equal(tag(second, 'pulserate'), '110');
    assert.equal(tag(second, 'bodytemperature'), '310.15');
    assert.match(second, /<setmarker>Start &amp; Drop<\/setmarker>/);
    assert.equal((samples(second).match(/<waypoint>/g) || []).length, 3);
  });

  it('keeps imported multi-mix definitions and exact fractions stable', () => {
    const input = {
      ...metricDive,
      gasName: 'EAN32',
      gasO2: 32,
      gasHe: 0,
      allMixes: [
        { id: 'mix_nitrox', name: 'EAN32', o2: 0.319, n2: 0.681, he: 0 },
        { id: 'mix_air', name: 'Air', o2: 0.21, n2: 0.79, he: 0 }
      ],
      customWaypoints: [{ time: 0, depth: 0 }, { time: 600, depth: 25 }]
    };
    const first = exportToUddf(input, UNITS.METRIC);
    const parsed = parseUddfXml(first, UNITS.METRIC);
    const second = exportToUddf(toExportData(parsed), UNITS.METRIC);

    assert.equal(parsed.allMixes.length, 2);
    assert.equal(parsed.allMixes[0].o2, 0.319);
    assert.match(second, /<mix id="mix_nitrox">/);
    assert.match(second, /<mix id="mix_air">/);
    assert.equal(tag(second, 'o2'), '0.3190');
    assert.equal(tag(second, 'n2'), '0.6810');
    const refs = [...samples(second).matchAll(/ref="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(refs, ['mix_nitrox']);
  });

  it('preserves the timestamp instant across daylight saving time', () => {
    const input = { ...metricDive, dateTime: '2026-06-15T09:30' };
    const first = exportToUddf(input, UNITS.METRIC);
    assert.match(beforeDive(first), /2026-06-15T09:30:00\+02:00/);

    const parsed = parseUddfXml(first, UNITS.METRIC);
    assert.equal(parsed.dateTime, '2026-06-15T09:30');

    const second = exportToUddf(toExportData(parsed), UNITS.METRIC);
    assert.match(beforeDive(second), /2026-06-15T09:30:00\+02:00/);
  });
});
