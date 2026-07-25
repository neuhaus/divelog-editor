# divelog-editor

A lightweight, accessible, single-page web application to read, view, edit, and create scuba dive logs, and export them as valid **UDDF 3.2.1 (Universal Dive Data Format)** XML files.

## Features

- **Read & Edit Existing UDDF 3.2.1 Files**: Easily import and parse existing `.uddf` or `.xml` dive log files into the form to review, modify, or re-export them.
- **Simple Form Entry**: Quick upfront entry for essential dive log details (Dive Number, Date & Time, Site Name, Max Depth, Duration, Gas Mix, Start/End Pressures).
- **Progressive Disclosure**: Expandable sections for additional details (Diver & Buddy info, GPS coordinates, apparatus, water/air temperature, visibility, and dive notes).
- **Automatic Unit Conversion**: Seamlessly toggle between Metric (°C, m, bar) and Imperial (°F, ft, psi) units in the UI while automatically serialising values into strict UDDF 3.2.1 SI units (Kelvin, metres, Pascals, seconds, $m^3$).
- **Profile Waypoints Support**: Preserves detailed dive profile waypoints when editing imported dive computer logs, while generating clean, unbloated summary XML for manual entries.
- **UDDF 3.2.1 XML Export**: Export completed dive logs to `.uddf` XML files automatically named with the dive date, dive number, and site name (e.g. `2026-07-01_104_blue_hole.uddf`).

This project is built using standard HTML5, CSS3, and JavaScript without external build tools or framework dependencies. Zero compilation or build steps are required.

Simply open `index.html` directly in any browser.

## Licence

This project is licenced under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENCE](LICENCE.md) file for details.
