/**
 * UDDF 3.2.1 XML Exporter
 * Serialises dive log state to valid UDDF 3.2.1 XML
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
(function (window) {
  const { CONVERSIONS, UNITS } = window.UDDF_SCHEMA;

  function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function exportToUddf(diveLogData, displayUnits = UNITS.METRIC) {
    const isImperial = displayUnits === UNITS.IMPERIAL;

    const depthSI = isImperial
      ? CONVERSIONS.feetToMetres(parseFloat(diveLogData.maxDepth || 0))
      : parseFloat(diveLogData.maxDepth || 0);

    const durationMin = parseFloat(diveLogData.duration || 0);
    const durationSec = durationMin * 60;

    const hasStartP = diveLogData.startPressure !== '' && diveLogData.startPressure !== undefined;
    const startPressureSI = hasStartP
      ? (isImperial ? CONVERSIONS.psiToPascal(parseFloat(diveLogData.startPressure)) : CONVERSIONS.barToPascal(parseFloat(diveLogData.startPressure)))
      : null;

    const hasEndP = diveLogData.endPressure !== '' && diveLogData.endPressure !== undefined;
    const endPressureSI = hasEndP
      ? (isImperial ? CONVERSIONS.psiToPascal(parseFloat(diveLogData.endPressure)) : CONVERSIONS.barToPascal(parseFloat(diveLogData.endPressure)))
      : null;

    const tankVolSI = isImperial
      ? CONVERSIONS.cuftToCubicMeters(parseFloat(diveLogData.tankVolume || 0))
      : CONVERSIONS.litresToCubicMeters(parseFloat(diveLogData.tankVolume || 0));

    const hasLead = diveLogData.leadQuantity !== '' && diveLogData.leadQuantity !== undefined;
    const leadKg = hasLead
      ? (isImperial ? CONVERSIONS.lbsToKg(parseFloat(diveLogData.leadQuantity)) : parseFloat(diveLogData.leadQuantity))
      : null;

    const airTempSI = diveLogData.airTemp !== '' && diveLogData.airTemp !== undefined
      ? (isImperial ? CONVERSIONS.fahrenheitToKelvin(parseFloat(diveLogData.airTemp)) : CONVERSIONS.celsiusToKelvin(parseFloat(diveLogData.airTemp)))
      : null;

    const waterTempSI = diveLogData.waterTemp !== '' && diveLogData.waterTemp !== undefined
      ? (isImperial ? CONVERSIONS.fahrenheitToKelvin(parseFloat(diveLogData.waterTemp)) : CONVERSIONS.celsiusToKelvin(parseFloat(diveLogData.waterTemp)))
      : null;

    const visibilitySI = diveLogData.visibility !== '' && diveLogData.visibility !== undefined
      ? (isImperial ? CONVERSIONS.feetToMetres(parseFloat(diveLogData.visibility)) : parseFloat(diveLogData.visibility))
      : null;

    const hasGasDefinitions = Boolean(diveLogData.gasName && diveLogData.gasO2 !== null && diveLogData.gasO2 !== undefined);
    const o2Fraction = hasGasDefinitions ? (parseFloat(diveLogData.gasO2) / 100).toFixed(4) : '0.2100';
    const heFraction = hasGasDefinitions ? (parseFloat(diveLogData.gasHe || 0) / 100).toFixed(4) : '0.0000';
    const n2Fraction = hasGasDefinitions ? (1.0 - parseFloat(o2Fraction) - parseFloat(heFraction)).toFixed(4) : '0.7900';
    const gasId = hasGasDefinitions ? `gas_${diveLogData.gasName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : 'gas_1';

    const siteNameStr = diveLogData.siteName ? diveLogData.siteName.trim() : '';
    const locParts = [diveLogData.siteLocation, diveLogData.siteCountry].filter(Boolean);
    const locationStr = locParts.join(', ');
    const siteId = siteNameStr ? `site_${siteNameStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : 'site_1';
    const hasSiteInfo = Boolean(siteNameStr || locationStr || diveLogData.latitude || diveLogData.longitude);

    const ownerId = 'diver_owner';
    const hasBuddyInfo = Boolean(diveLogData.buddyFirstName || diveLogData.buddyLastName);
    const buddyNameStr = [diveLogData.buddyFirstName, diveLogData.buddyLastName].filter(Boolean).join('_');
    const buddyId = hasBuddyInfo ? `buddy_${buddyNameStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : '';
    const suitId = 'suit_1';
    const tankId = 'tank_1';

    const hasSuitEquipment = Boolean(diveLogData.suitType && diveLogData.suitType !== 'none');
    const hasOwnerPersonal = Boolean(diveLogData.diverFirstName || diveLogData.diverLastName);
    const hasOwnerInfo = hasOwnerPersonal || hasSuitEquipment;
    const hasDiverBlock = hasOwnerInfo || Boolean(buddyId);

    const nowIso = new Date().toISOString().split('.')[0] + 'Z';
    let diveDateTime = nowIso;
    if (diveLogData.dateTime) {
      let dt = diveLogData.dateTime.length === 16 ? `${diveLogData.dateTime}:00` : diveLogData.dateTime;
      if (!dt.endsWith('Z')) dt += 'Z';
      diveDateTime = dt;
    }

    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<uddf xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="3.2.3" xmlns="http://www.streit.cc/uddf/3.2/">\n`;

    // 1. Generator
    xml += `  <generator>\n`;
    xml += `    <name>divelog-editor</name>\n`;
    xml += `    <type>logbook</type>\n`;
    xml += `    <version>1.0.0</version>\n`;
    xml += `    <datetime>${nowIso}</datetime>\n`;
    xml += `  </generator>\n`;

    // 2. Diver (Omitted if no owner/buddy/suit information)
    if (hasDiverBlock) {
      xml += `  <diver>\n`;
      if (hasOwnerInfo) {
        xml += `    <owner id="${ownerId}">\n`;
        xml += `      <personal>\n`;
        xml += `        <firstname>${escapeXml(diveLogData.diverFirstName || '')}</firstname>\n`;
        xml += `        <lastname>${escapeXml(diveLogData.diverLastName || '')}</lastname>\n`;
        xml += `      </personal>\n`;

        // Equipment Definitions (Suit & Protection)
        if (hasSuitEquipment) {
          let suitName = 'Wetsuit';
          let suitCategory = 'wet-suit';
          if (diveLogData.suitType === 'drysuit') { suitName = 'Drysuit'; suitCategory = 'dry-suit'; }
          else if (diveLogData.suitType === 'shorty') { suitName = 'Shorty Wetsuit'; suitCategory = 'wet-suit'; }
          else if (diveLogData.suitType === 'wetsuit_3mm') { suitName = '3mm Wetsuit'; suitCategory = 'wet-suit'; }
          else if (diveLogData.suitType === 'wetsuit_5mm') { suitName = '5mm Wetsuit'; suitCategory = 'wet-suit'; }
          else if (diveLogData.suitType === 'wetsuit_7mm') { suitName = '7mm Wetsuit / Semi-Dry'; suitCategory = 'wet-suit'; }

          xml += `      <equipment>\n`;
          xml += `        <suit id="${suitId}">\n`;
          xml += `          <name>${escapeXml(suitName)}</name>\n`;
          xml += `          <suittype>${suitCategory}</suittype>\n`;
          xml += `        </suit>\n`;
          xml += `      </equipment>\n`;
        }
        xml += `    </owner>\n`;
      }

      if (buddyId) {
        xml += `    <buddy id="${buddyId}">\n`;
        xml += `      <personal>\n`;
        xml += `        <firstname>${escapeXml(diveLogData.buddyFirstName || '')}</firstname>\n`;
        xml += `        <lastname>${escapeXml(diveLogData.buddyLastName || '')}</lastname>\n`;
        xml += `      </personal>\n`;
        xml += `    </buddy>\n`;
      }
      xml += `  </diver>\n`;
    }

    // 3. Divesite (Omitted if no site name, location or coordinates)
    if (hasSiteInfo) {
      xml += `  <divesite>\n`;
      xml += `    <site id="${escapeXml(siteId)}">\n`;
      xml += `      <name>${escapeXml(siteNameStr || 'Dive Site')}</name>\n`;
      if (locationStr || diveLogData.latitude || diveLogData.longitude) {
        xml += `      <geography>\n`;
        if (locationStr) xml += `        <location>${escapeXml(locationStr)}</location>\n`;
        if (diveLogData.latitude) xml += `        <latitude>${parseFloat(diveLogData.latitude).toFixed(6)}</latitude>\n`;
        if (diveLogData.longitude) xml += `        <longitude>${parseFloat(diveLogData.longitude).toFixed(6)}</longitude>\n`;
        xml += `      </geography>\n`;
      }
      xml += `    </site>\n`;
      xml += `  </divesite>\n`;
    }

    // 4. Gas Definitions (Omitted if gas mixture is unspecified/unknown)
    if (diveLogData.allMixes && diveLogData.allMixes.length > 0) {
      xml += `  <gasdefinitions>\n`;
      diveLogData.allMixes.forEach(mix => {
        const mixId = mix.id || `gas_${mix.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        xml += `    <mix id="${escapeXml(mixId)}">\n`;
        xml += `      <name>${escapeXml(mix.name)}</name>\n`;
        xml += `      <o2>${parseFloat(mix.o2).toFixed(4)}</o2>\n`;
        xml += `      <n2>${parseFloat(mix.n2).toFixed(4)}</n2>\n`;
        xml += `      <he>${parseFloat(mix.he).toFixed(4)}</he>\n`;
        xml += `    </mix>\n`;
      });
      xml += `  </gasdefinitions>\n`;
    } else if (hasGasDefinitions) {
      xml += `  <gasdefinitions>\n`;
      xml += `    <mix id="${gasId}">\n`;
      xml += `      <name>${escapeXml(diveLogData.gasName)}</name>\n`;
      xml += `      <o2>${o2Fraction}</o2>\n`;
      xml += `      <n2>${n2Fraction}</n2>\n`;
      xml += `      <he>${heFraction}</he>\n`;
      xml += `    </mix>\n`;
      xml += `  </gasdefinitions>\n`;
    }

    // 5. Profile Data
    xml += `  <profiledata>\n`;
    xml += `    <repetitiongroup id="rg_1">\n`;
    xml += `      <dive id="dive_1">\n`;

    // Information Before Dive
    xml += `        <informationbeforedive>\n`;
    if (buddyId) {
      xml += `          <link ref="${buddyId}"/>\n`;
    }
    if (hasSiteInfo) {
      xml += `          <link ref="${escapeXml(siteId)}"/>\n`;
    }
    if (diveLogData.diveNumber) {
      xml += `          <divenumber>${parseInt(diveLogData.diveNumber, 10)}</divenumber>\n`;
    }
    xml += `          <datetime>${diveDateTime}</datetime>\n`;
    if (airTempSI !== null) {
      xml += `          <airtemperature>${airTempSI.toFixed(2)}</airtemperature>\n`;
    }
    const hasLeadKg = leadKg !== null && !isNaN(leadKg) && leadKg > 0;
    if (hasSuitEquipment || hasLeadKg) {
      xml += `          <equipmentused>\n`;
      if (hasLeadKg) {
        xml += `            <leadquantity>${leadKg.toFixed(1)}</leadquantity>\n`;
      }
      if (hasSuitEquipment) {
        xml += `            <link ref="${suitId}"/>\n`;
      }
      xml += `          </equipmentused>\n`;
    }
    if (diveLogData.apparatus) {
      xml += `          <apparatus>${escapeXml(diveLogData.apparatus)}</apparatus>\n`;
    }
    if (diveLogData.platform) {
      xml += `          <platform>${escapeXml(diveLogData.platform)}</platform>\n`;
    }
    if (diveLogData.purpose) {
      xml += `          <purpose>${escapeXml(diveLogData.purpose)}</purpose>\n`;
    }
    if (diveLogData.suitType === 'none') {
      xml += `          <nosuit/>\n`;
    }
    xml += `        </informationbeforedive>\n`;

    // Waypoints (Only include <samples> if real waypoints exist, e.g. from imported dive file)
    const waypoints = diveLogData.customWaypoints;
    if (waypoints && waypoints.length > 0) {
      xml += `        <samples>\n`;
      waypoints.forEach((wp) => {
        xml += `          <waypoint>\n`;
        xml += `            <divetime>${Math.round(wp.time)}</divetime>\n`;
        xml += `            <depth>${parseFloat(wp.depth).toFixed(2)}</depth>\n`;
        if (wp.temp !== null && wp.temp !== undefined) {
          xml += `            <temperature>${parseFloat(wp.temp).toFixed(2)}</temperature>\n`;
        }
        if (hasGasDefinitions) {
          xml += `            <switchmix ref="${gasId}"/>\n`;
        }
        if (wp.pressure) {
          xml += `            <tankpressure>${Math.round(wp.pressure)}</tankpressure>\n`;
        }
        if (wp.bodyTemp !== null && wp.bodyTemp !== undefined) {
          xml += `            <bodytemperature>${parseFloat(wp.bodyTemp).toFixed(2)}</bodytemperature>\n`;
        }
        if (wp.heartRate !== null && wp.heartRate !== undefined) {
          xml += `            <heartrate>${parseFloat(wp.heartRate).toFixed(0)}</heartrate>\n`;
        }
        if (wp.pulseRate !== null && wp.pulseRate !== undefined) {
          xml += `            <pulserate>${parseFloat(wp.pulseRate).toFixed(0)}</pulserate>\n`;
        }
        if (wp.setMarker) {
          xml += `            <setmarker>${escapeXml(wp.setMarker)}</setmarker>\n`;
        }
        xml += `          </waypoint>\n`;
      });
      xml += `        </samples>\n`;
    }

    // Tank Data (Omitted if no gas, volume, or pressures defined)
    const hasTankVol = diveLogData.tankVolume !== '' && diveLogData.tankVolume !== undefined;
    const hasTankData = hasGasDefinitions || hasTankVol || startPressureSI !== null || endPressureSI !== null;
    if (hasTankData) {
      xml += `        <tankdata>\n`;
      if (hasGasDefinitions) {
        xml += `          <link ref="${gasId}"/>\n`;
      }
      if (hasTankVol) {
        const tankVolRaw = parseFloat(diveLogData.tankVolume);
        if (!isNaN(tankVolRaw) && tankVolRaw > 0) {
          xml += `          <tankvolume>${tankVolRaw.toFixed(1)}</tankvolume>\n`;
        }
      }
      const startP = startPressureSI !== null ? startPressureSI : 0;
      xml += `          <tankpressurebegin>${Math.round(startP)}</tankpressurebegin>\n`;
      if (endPressureSI !== null) {
        xml += `          <tankpressureend>${Math.round(endPressureSI)}</tankpressureend>\n`;
      }
      xml += `        </tankdata>\n`;
    }

    // Information After Dive (Ordered according to strict XSD sequence)
    xml += `        <informationafterdive>\n`;
    if (waterTempSI !== null) {
      xml += `          <lowesttemperature>${waterTempSI.toFixed(2)}</lowesttemperature>\n`;
    }
    xml += `          <greatestdepth>${depthSI.toFixed(2)}</greatestdepth>\n`;
    if (visibilitySI !== null) {
      xml += `          <visibility>${visibilitySI.toFixed(2)}</visibility>\n`;
    }
    if (diveLogData.current) {
      xml += `          <current>${escapeXml(diveLogData.current)}</current>\n`;
    }
    const hasSummary = Boolean(diveLogData.notes && diveLogData.notes.trim());
    const hasEnv = Boolean(diveLogData.envNotes && diveLogData.envNotes.trim());
    const hasGas = Boolean(diveLogData.gasNotes && diveLogData.gasNotes.trim());
    const hasGear = Boolean(diveLogData.gearNotes && diveLogData.gearNotes.trim());
    const hasIssues = Boolean(diveLogData.issuesNotes && diveLogData.issuesNotes.trim());

    if (hasSummary || hasEnv || hasGas || hasGear || hasIssues) {
      xml += `          <notes>\n`;
      if (hasSummary) {
        xml += `            <para>Summary:\n${escapeXml(diveLogData.notes.trim())}</para>\n`;
      }
      if (hasEnv) {
        xml += `            <para>Environment:\n${escapeXml(diveLogData.envNotes.trim())}</para>\n`;
      }
      if (hasGas) {
        xml += `            <para>Gas:\n${escapeXml(diveLogData.gasNotes.trim())}</para>\n`;
      }
      if (hasGear) {
        xml += `            <para>Gear:\n${escapeXml(diveLogData.gearNotes.trim())}</para>\n`;
      }
      if (hasIssues) {
        xml += `            <para>Issues:\n${escapeXml(diveLogData.issuesNotes.trim())}</para>\n`;
      }
      xml += `          </notes>\n`;
    }
    const validDurationSec = durationSec > 0 ? Math.round(durationSec) : 0;
    xml += `          <diveduration>${validDurationSec}</diveduration>\n`;
    xml += `        </informationafterdive>\n`;

    xml += `      </dive>\n`;
    xml += `    </repetitiongroup>\n`;
    xml += `  </profiledata>\n`;

    xml += `</uddf>`;

    return xml;
  }

  window.UDDF_EXPORTER = { exportToUddf };
})(window);
