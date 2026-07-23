# divelog-editor

A lightweight, accessible, single-page web application to read, view, edit, and create scuba dive logs, and export them as valid **UDDF 3.2 (Universal Dive Data Format)** XML files.

## Features

- **Read & Edit Existing UDDF Files**: Easily import and parse existing `.uddf` or `.xml` dive log files into the form to review, modify, or re-export them.
- **Simple Form Entry**: Quick upfront entry for essential dive log details (Dive Number, Date & Time, Site Name, Max Depth, Duration, Gas Mix, Start/End Pressures).
- **Progressive Disclosure**: Expandable sections for additional details (Diver & Buddy info, GPS coordinates, apparatus, water/air temperature, visibility, and dive notes).
- **Automatic Unit Conversion**: Seamlessly toggle between Metric (°C, m, bar) and Imperial (°F, ft, psi) units in the UI while automatically serialising values into strict UDDF SI units (Kelvin, metres, Pascals, seconds, $m^3$).
- **Automatic Profile Generation**: Generates standard dive profile waypoints (descent, bottom stay, safety stop, surface ascent) from max depth and duration.
- **UDDF XML Export**: Export completed dive logs to `.uddf` XML files automatically named with the dive date and site name (e.g. `2026-07-01_blue_hole.uddf`).

This project is built using standard HTML5, CSS3, and JavaScript without external build tools or framework dependencies. Zero compilation or build steps are required.

Simply open `index.html` directly in any browser.

## Licence

This project is licenced under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENCE](LICENCE.md) file for details.
