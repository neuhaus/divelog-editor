/*
 * Priority 1: the UDDF export contract.
 *
 * Guards the namespace/version, SI/base units in the XML, gas fraction
 * precision, gas references, waypoint telemetry and well-formedness.
 */
'use strict';

process.env.TZ = 'Europe/Berlin';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModules } = require('./helpers/load-modules');
const { DOMParser } = require('./helpers/fake-dom');

const { exporter, schema } = loadModules();
const { exportToUddf } = exporter;
const { UNITS } = schema;

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return match ? match[1] : null;
}

const metricDive = {
  diveNumber: '104',
  dateTime: '2026-01-15T09:30',
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
  visibility: '30'
};

const imperialDive = {
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

describe('UDDF export', () => {
  it('declares the UDDF 3.2.3 namespace and current generator version', () => {
    const xml = exportToUddf(metricDive, UNITS.METRIC);
    assert.match(xml, /<uddf[^>]*xmlns="http:\/\/www\.streit\.cc\/uddf\/3\.2\/"/);
    assert.match(xml, /version="3\.2\.3"/);
    assert.equal(tag(xml, 'version'), '1.1.0');
    assert.equal(tag(xml, 'name'), 'divelog-editor');
  });

  it('writes metric form values in UDDF base units', () => {
    const xml = exportToUddf(metricDive, UNITS.METRIC);
    assert.equal(tag(xml, 'divenumber'), '104');
    assert.equal(tag(xml, 'greatestdepth'), '25.00');
    assert.equal(tag(xml, 'tankpressurebegin'), '20000000');
    assert.equal(tag(xml, 'tankpressureend'), '5000000');
    assert.equal(tag(xml, 'tankvolume'), '12.0');
    assert.equal(tag(xml, 'leadquantity'), '6.0');
    assert.equal(tag(xml, 'airtemperature'), '303.15');
    assert.equal(tag(xml, 'lowesttemperature'), '298.15');
    assert.equal(tag(xml, 'visibility'), '30.00');
    assert.equal(tag(xml, 'diveduration'), '3120');
  });

  it('writes imperial form values in the same UDDF base units', () => {
    const xml = exportToUddf(imperialDive, UNITS.IMPERIAL);
    assert.equal(tag(xml, 'greatestdepth'), '24.99');
    assert.equal(tag(xml, 'tankpressurebegin'), '20684280');
    assert.equal(tag(xml, 'tankpressureend'), '4964227');
    assert.equal(tag(xml, 'tankvolume'), '12.0');
    assert.equal(tag(xml, 'leadquantity'), '6.0');
    assert.equal(tag(xml, 'airtemperature'), '303.15');
    assert.equal(tag(xml, 'lowesttemperature'), '298.15');
    assert.equal(tag(xml, 'visibility'), '29.87');
  });

  it('emits the dive time with an explicit UTC offset, not as UTC', () => {
    const xml = exportToUddf(metricDive, UNITS.METRIC);
    const beforeDive = xml.match(/<informationbeforedive>[\s\S]*?<\/informationbeforedive>/)[0];
    assert.match(beforeDive, /<datetime>2026-01-15T09:30:00\+01:00<\/datetime>/);
  });

  it('keeps exact gas fractions instead of the rounded display value', () => {
    const exact = exportToUddf({
      ...metricDive,
      gasName: 'Custom 31.9',
      gasO2: 32,
      gasHe: 0,
      gasFractions: { o2: 0.319, he: 0, n2: 0.681 }
    }, UNITS.METRIC);
    assert.equal(tag(exact, 'o2'), '0.3190');
    assert.equal(tag(exact, 'he'), '0.0000');
    assert.equal(tag(exact, 'n2'), '0.6810');

    const rounded = exportToUddf(metricDive, UNITS.METRIC);
    assert.equal(tag(rounded, 'o2'), '0.2100');
  });

  it('emits all imported mixes and references only mix ids that exist', () => {
    const xml = exportToUddf({
      ...metricDive,
      gasName: 'EAN32',
      gasO2: 32,
      gasHe: 0,
      allMixes: [
        { id: 'mix_nitrox', name: 'EAN32', o2: 0.32, n2: 0.68, he: 0 },
        { id: 'mix_air', name: 'Air', o2: 0.21, n2: 0.79, he: 0 }
      ],
      customWaypoints: [
        { time: 0, depth: 0 },
        { time: 300, depth: 15 },
        { time: 600, depth: 5 }
      ]
    }, UNITS.METRIC);

    assert.match(xml, /<mix id="mix_nitrox">/);
    assert.match(xml, /<mix id="mix_air">/);
    const tankData = xml.match(/<tankdata>[\s\S]*?<\/tankdata>/)[0];
    assert.match(tankData, /<link ref="mix_nitrox"\/>/);

    const samples = xml.match(/<samples>[\s\S]*?<\/samples>/)[0];
    const switchmixes = samples.match(/<switchmix /g) || [];
    assert.equal(switchmixes.length, 1, 'one mix switch at the start of the dive');
    const refs = [...samples.matchAll(/ref="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(refs, ['mix_nitrox']);
  });

  it('preserves waypoint telemetry and escapes text', () => {
    const xml = exportToUddf({
      ...metricDive,
      customWaypoints: [{
        time: 0,
        depth: 0,
        temp: 298.15,
        pressure: 20000000,
        bodyTemp: 310.15,
        heartRate: 120,
        pulseRate: 110,
        setMarker: 'Mark & Drop'
      }]
    }, UNITS.METRIC);

    assert.match(xml, /<temperature>298\.15<\/temperature>/);
    assert.match(xml, /<tankpressure>20000000<\/tankpressure>/);
    assert.match(xml, /<bodytemperature>310\.15<\/bodytemperature>/);
    assert.match(xml, /<heartrate>120<\/heartrate>/);
    assert.match(xml, /<pulserate>110<\/pulserate>/);
    assert.match(xml, /<setmarker>Mark &amp; Drop<\/setmarker>/);
  });

  it('always emits a mandatory dive duration', () => {
    const xml = exportToUddf({ duration: '' }, UNITS.METRIC);
    assert.match(xml, /<diveduration>0<\/diveduration>/);
  });

  it('produces well-formed XML', () => {
    const xml = exportToUddf(metricDive, UNITS.METRIC);
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    assert.equal(doc.querySelector('parsererror'), null);
    const root = doc.querySelector('uddf');
    assert.notEqual(root, null);
    assert.equal(root.getAttribute('version'), '3.2.3');
  });
});
