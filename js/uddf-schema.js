/**
 * UDDF 3.2 Schema Constants & Unit Conversion Utilities
  Copyright (C) 2026 Sven Neuhaus

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
(function(window) {
  const UNITS = {
    METRIC: 'metric',
    IMPERIAL: 'imperial'
  };

  const CONVERSIONS = {
    // Depth / Distance (Metres & Feet)
    metresToFeet: (m) => m * 3.28084,
    feetToMetres: (ft) => ft / 3.28084,

    // Pressure (Bar & Pascal)
    barToPascal: (bar) => Math.round(bar * 100000),
    pascalToBar: (pa) => pa / 100000,
    psiToPascal: (psi) => psi * 6894.76,
    pascalToPsi: (pa) => pa / 6894.76,
    barToPsi: (bar) => bar * 14.5038,
    psiToBar: (psi) => psi / 14.5038,

    // Temperature (Celsius, Fahrenheit, Kelvin)
    celsiusToKelvin: (c) => c + 273.15,
    kelvinToCelsius: (k) => k - 273.15,
    fahrenheitToKelvin: (f) => (f - 32) * (5 / 9) + 273.15,
    kelvinToFahrenheit: (k) => (k - 273.15) * (9 / 5) + 32,
    celsiusToFahrenheit: (c) => (c * 9 / 5) + 32,
    fahrenheitToCelsius: (f) => (f - 32) * (5 / 9),

    // Volume (Litres & Scuba Tank cu ft Capacity, e.g., 12 L = 80 cu ft)
    litresToCuft: (l) => l * 6.67,
    cuftToLitres: (cuft) => cuft / 6.67,

    litresToCubicMeters: (l) => l / 1000,
    cubicMetersToLitres: (m3) => m3 * 1000,
    cuftToCubicMeters: (cuft) => (cuft / 6.67) / 1000,
    cubicMetersToCuft: (m3) => (m3 * 1000) * 6.67,

    // Weight / Ballast (Kilograms & Pounds)
    kgToLbs: (kg) => kg * 2.20462,
    lbsToKg: (lbs) => lbs / 2.20462
  };

  // Aliases for compatibility
  CONVERSIONS.metersToFeet = CONVERSIONS.metresToFeet;
  CONVERSIONS.feetToMeters = CONVERSIONS.feetToMetres;
  CONVERSIONS.litersToCubicMeters = CONVERSIONS.litresToCubicMeters;
  CONVERSIONS.cubicMetersToLiters = CONVERSIONS.cubicMetersToLitres;

  const pad2 = (n) => String(n).padStart(2, '0');

  // <input type="datetime-local"> holds local wall-clock time with no zone.
  const DATETIME = {
    // Format a Date for a datetime-local input, in the browser's local zone.
    formatLocal: (date) => {
      if (!(date instanceof Date) || isNaN(date.getTime())) return '';
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    },

    // Convert a datetime-local value into an xsd:dateTime with an explicit
    // offset, so the instant is correct rather than being mistaken for UTC.
    toUddf: (localValue) => {
      if (!localValue) return null;
      const date = new Date(localValue); // no zone in the string => local time
      if (isNaN(date.getTime())) return null;
      const offsetMinutes = -date.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMinutes);
      const offset = `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
      return `${DATETIME.formatLocal(date)}:${pad2(date.getSeconds())}${offset}`;
    },

    // Convert an imported xsd:dateTime (Z or offset) to a datetime-local
    // value, preserving the instant when it is edited and exported again.
    fromUddf: (value) => {
      if (!value) return '';
      return DATETIME.formatLocal(new Date(value));
    }
  };

  const STANDARD_GASES = {
    air: { id: 'air', name: 'Air', o2: 0.21, n2: 0.79, he: 0.0, ar: 0.0 },
    ean32: { id: 'ean32', name: 'EAN32 (Nitrox 32)', o2: 0.32, n2: 0.68, he: 0.0, ar: 0.0 },
    ean36: { id: 'ean36', name: 'EAN36 (Nitrox 36)', o2: 0.36, n2: 0.64, he: 0.0, ar: 0.0 },
    oxygen: { id: 'o2_100', name: '100% Oxygen', o2: 1.0, n2: 0.0, he: 0.0, ar: 0.0 },
    trimix2135: { id: 'trimix_21_35', name: 'Trimix 21/35', o2: 0.21, n2: 0.44, he: 0.35, ar: 0.0 }
  };

  window.UDDF_SCHEMA = {
    UNITS,
    CONVERSIONS,
    DATETIME,
    STANDARD_GASES
  };
})(window);
