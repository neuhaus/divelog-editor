/*
 * Priority 3: parser edge cases.
 *
 * Uses the small XML shim so the parser's selectors and conversions can be
 * exercised without a real browser or an external DOM dependency.
 */
'use strict';

process.env.TZ = 'Europe/Berlin';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModules } = require('./helpers/load-modules');

const { parser, schema } = loadModules();
const { parseUddfXml } = parser;
const { UNITS } = schema;

const GAS = '  <gasdefinitions><mix id="mix_1"><name>EAN32</name><o2>0.319</o2><n2>0.681</n2><he>0</he></mix></gasdefinitions>';
const SITE = '  <divesite><site id="site_1"><name>Shark Reef</name><geography><location>Red Sea</location><country>Egypt</country><latitude>27.7345</latitude><longitude>34.2561</longitude></geography></site></divesite>';
const DIVER = '  <diver><owner id="owner_1"><personal><firstname>Alex</firstname><lastname>Ocean</lastname></personal><equipment><suit id="suit_1"><name>5mm</name><suittype>wet-suit</suittype></suit></equipment></owner><buddy id="buddy_1"><personal><firstname>Sam</firstname><lastname>Diver</lastname></personal></buddy></diver>';
const BEFORE = '    <informationbeforedive><divenumber>104</divenumber><datetime>2026-01-15T08:30:00Z</datetime><airtemperature>303.15</airtemperature><apparatus>open-scuba</apparatus><platform>charter-boat</platform><purpose>sightseeing</purpose></informationbeforedive>';
const SAMPLES = `    <samples>
      <waypoint><divetime>0</divetime><depth>0.00</depth><temperature>298.15</temperature></waypoint>
      <waypoint><divetime>600</divetime><depth>25.00</depth><temperature>297.15</temperature><tankpressure>5000000</tankpressure></waypoint>
      <waypoint><divetime>3120</divetime><depth>5.00</depth></waypoint>
    </samples>`;
const TANK = '    <tankdata><link ref="mix_1"/><tankvolume>0.012</tankvolume><tankpressurebegin>20000000</tankpressurebegin><tankpressureend>5000000</tankpressureend></tankdata>';
const AFTER = '    <informationafterdive><lowesttemperature>298.15</lowesttemperature><greatestdepth>25.00</greatestdepth><visibility>30.00</visibility><current>mild-current</current><notes><para>Summary: Great dive</para><para>Environment: Sunny</para><para>Gas: EAN32</para><para>Gear: 5mm suit</para><para>Issues: None</para></notes><diveduration>3120</diveduration></informationafterdive>';

function buildUddf(parts = {}) {
  const {
    gas = GAS,
    site = SITE,
    diver = DIVER,
    before = BEFORE,
    samples = SAMPLES,
    tank = TANK,
    after = AFTER
  } = parts;
  return `<?xml version="1.0" encoding="utf-8"?>
<uddf xmlns="http://www.streit.cc/uddf/3.2/" version="3.2.3">
${gas}
${site}
${diver}
  <profiledata><repetitiongroup id="rg_1"><dive id="dive_1">
${before}
${samples}
${tank}
${after}
  </dive></repetitiongroup></profiledata>
</uddf>`;
}

describe('UDDF parser', () => {
  it('extracts dive, site, diver and buddy fields', () => {
    const data = parseUddfXml(buildUddf(), UNITS.METRIC);
    assert.equal(data.diveNumber, '104');
    assert.equal(data.siteName, 'Shark Reef');
    assert.equal(data.siteLocation, 'Red Sea');
    assert.equal(data.siteCountry, 'Egypt');
    assert.equal(data.diverFirstName, 'Alex');
    assert.equal(data.diverLastName, 'Ocean');
    assert.equal(data.buddyFirstName, 'Sam');
    assert.equal(data.buddyLastName, 'Diver');
    assert.equal(data.apparatus, 'open-scuba');
    assert.equal(data.platform, 'charter-boat');
    assert.equal(data.purpose, 'sightseeing');
    assert.equal(data.current, 'mild-current');
    assert.equal(data.suitType, 'wetsuit_5mm');
  });

  it('keeps exact gas fractions alongside the rounded display value', () => {
    const data = parseUddfXml(buildUddf(), UNITS.METRIC);
    assert.equal(data.gasO2, 32);
    assert.equal(data.gasHe, 0);
    assert.equal(data.gasO2Fraction, 0.319);
    assert.equal(data.gasHeFraction, 0);
    assert.equal(data.gasN2Fraction, 0.681);
    assert.equal(data.allMixes[0].id, 'mix_1');
    assert.equal(data.allMixes[0].o2, 0.319);
  });

  it('falls back to a computed nitrogen fraction', () => {
    const gas = '  <gasdefinitions><mix id="m"><name>EAN32</name><o2>0.32</o2><he>0</he></mix></gasdefinitions>';
    const data = parseUddfXml(buildUddf({ gas }), UNITS.METRIC);
    assert.ok(Math.abs(data.gasN2Fraction - 0.68) < 1e-9);
    assert.ok(Math.abs(data.allMixes[0].n2 - 0.68) < 1e-9);
  });

  it('converts SI units to the requested display units', () => {
    const metric = parseUddfXml(buildUddf(), UNITS.METRIC);
    assert.equal(metric.maxDepth, '25.0');
    assert.equal(metric.tankVolume, '12.0');
    assert.equal(metric.startPressure, '200');
    assert.equal(metric.endPressure, '50');
    assert.equal(metric.airTemp, 30);
    assert.equal(metric.waterTemp, 25);
    assert.equal(metric.visibility, '30.0');
    assert.equal(metric.leadQuantity, '6.0');
    assert.equal(metric.duration, '52');

    const imperial = parseUddfXml(buildUddf(), UNITS.IMPERIAL);
    assert.equal(imperial.maxDepth, '82.0');
    assert.equal(imperial.tankVolume, '80');
    assert.equal(imperial.startPressure, '2901');
    assert.equal(imperial.endPressure, '725');
    assert.equal(imperial.airTemp, 86);
    assert.equal(imperial.waterTemp, 77);
    assert.equal(imperial.visibility, '98.4');
    assert.equal(imperial.leadQuantity, '13.2');
  });

  it('converts an ISO timestamp with a zone to local form time', () => {
    const data = parseUddfXml(buildUddf(), UNITS.METRIC);
    assert.equal(data.dateTime, '2026-01-15T09:30');

    const withOffset = BEFORE.replace('08:30:00Z', '08:30:00+01:00');
    const offsetData = parseUddfXml(buildUddf({ before: withOffset }), UNITS.METRIC);
    assert.equal(offsetData.dateTime, '2026-01-15T08:30');
  });

  it('splits labelled notes into their separate fields', () => {
    const data = parseUddfXml(buildUddf(), UNITS.METRIC);
    assert.equal(data.notes, 'Great dive');
    assert.equal(data.envNotes, 'Sunny');
    assert.equal(data.gasNotes, 'EAN32');
    assert.equal(data.gearNotes, '5mm suit');
    assert.equal(data.issuesNotes, 'None');
  });

  it('preserves all waypoint telemetry', () => {
    const samples = `    <samples>
      <waypoint><divetime>0</divetime><depth>0.00</depth><temperature>298.15</temperature><tankpressure>20000000</tankpressure><setmarker>Start &amp; Drop</setmarker></waypoint>
      <waypoint><divetime>600</divetime><depth>25.00</depth><bodytemperature>310.15</bodytemperature><heartrate>120</heartrate><pulserate>110</pulserate></waypoint>
    </samples>`;
    const data = parseUddfXml(buildUddf({ samples }), UNITS.METRIC);
    assert.equal(data.customWaypoints.length, 2);
    assert.equal(data.customWaypoints[0].temp, 298.15);
    assert.equal(data.customWaypoints[0].pressure, 20000000);
    assert.equal(data.customWaypoints[0].setMarker, 'Start & Drop');
    assert.equal(data.customWaypoints[1].bodyTemp, 310.15);
    assert.equal(data.customWaypoints[1].heartRate, 120);
    assert.equal(data.customWaypoints[1].pulseRate, 110);
  });

  it('derives depth and duration from waypoints when summary values are missing', () => {
    const samples = `    <samples>
      <waypoint><divetime>0</divetime><depth>25.00</depth></waypoint>
      <waypoint><divetime>3120</divetime><depth>5.00</depth></waypoint>
    </samples>`;
    const after = AFTER.replace('<greatestdepth>25.00</greatestdepth>', '').replace('<diveduration>3120</diveduration>', '');
    const data = parseUddfXml(buildUddf({ samples, after }), UNITS.METRIC);
    assert.equal(data.maxDepth, '25.0');
    assert.equal(data.duration, '52');
  });

  it('falls back to waypoint tank pressures when tank data is absent', () => {
    const samples = `    <samples>
      <waypoint><divetime>0</divetime><depth>0.00</depth><tankpressure>20000000</tankpressure></waypoint>
      <waypoint><divetime>600</divetime><depth>25.00</depth><tankpressure>5000000</tankpressure></waypoint>
    </samples>`;
    const data = parseUddfXml(buildUddf({ samples, tank: '' }), UNITS.METRIC);
    assert.equal(data.startPressure, '200');
    assert.equal(data.endPressure, '50');
  });

  it('uses the same default end pressure as a new dive', () => {
    const tank = '<tankdata><tankpressurebegin>20000000</tankpressurebegin></tankdata>';
    const data = parseUddfXml(buildUddf({ tank }), UNITS.IMPERIAL);
    assert.equal(data.endPressure, '720');
  });

  it('detects exposure protection from nosuit and suittype', () => {
    const noSuitDiver = DIVER.replace('<suittype>wet-suit</suittype>', '<nosuit/>');
    assert.equal(parseUddfXml(buildUddf({ diver: noSuitDiver }), UNITS.METRIC).suitType, 'none');

    const drySuitDiver = DIVER.replace('wet-suit', 'dry-suit');
    assert.equal(parseUddfXml(buildUddf({ diver: drySuitDiver }), UNITS.METRIC).suitType, 'drysuit');
  });

  it('rejects malformed XML', () => {
    assert.throws(
      () => parseUddfXml('<uddf><unclosed></uddf>', UNITS.METRIC),
      /Invalid XML file/
    );
  });
});
