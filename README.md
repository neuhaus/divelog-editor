# divelog-editor

A lightweight, accessible, single-page web application to read, view, edit, and create scuba dive logs, and export them as valid **UDDF 3.2.3 (Universal Dive Data Format)** XML files.

## Features

- Everything happens only in your browser. Your dive data is not sent to a server.
- Compatible with [Shearwater Cloud](https://shearwater.com/pages/shearwater-cloud). Tested with macOS client 2.12.10
  - Known issue: Shearwater cloud does not recognise the `<suittype>` element
- Read & edit existing UDDF 3.2.3 files, preserving dive profile waypoints and telemetry when editing imported dive computer logs
- Automatic unit conversion between metric and imperial

## UDDF output conventions

Exported files declare version `3.2.3` and use the default UDDF 3.2 namespace:

```xml
<uddf xmlns="http://www.streit.cc/uddf/3.2/" version="3.2.3">
```

The metric/imperial choice only affects the form and its labels. Values in the XML are always written in the base units required by the UDDF schema:

| Value | UDDF element | Unit in the XML |
| --- | --- | --- |
| Depth, visibility | `greatestdepth`, `visibility`, `depth` | metres |
| Pressure | `tankpressurebegin`, `tankpressureend`, `tankpressure` | pascal |
| Temperature | `airtemperature`, `lowesttemperature`, `temperature`, `bodytemperature` | kelvin |
| Tank volume | `tankvolume` | litres |
| Ballast weight | `leadquantity` | kilograms |
| Dive duration / waypoint time | `diveduration`, `divetime` | seconds |
| Gas fractions | `o2`, `n2`, `he` | fractions from 0 to 1 |

Dive times are emitted as ISO 8601 timestamps with an explicit UTC offset, for example `2026-03-14T09:30:00+01:00`.

It's standard HTML5, CSS3, and JavaScript, no external frameworks and no assembly required.

Simply open [index.html](https://neuhaus.github.io/divelog-editor/index.html) directly in your browser.

Pull requests welcome, in particular to establish interoperability with other software
while remaining UDDF compliant.

## Licence

This project is licenced under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENCE](LICENCE.md) file for details.
