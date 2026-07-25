# divelog-editor

A lightweight, accessible, single-page web application to read, view, edit, and create scuba dive logs, and export them as valid **UDDF 3.2.1 (Universal Dive Data Format)** XML files.

## Features

- Compatible with [Shearwater Cloud](https://shearwater.com/pages/shearwater-cloud). Tested with macOS client 2.12.10.
  - Known issue: Shearwater cloud does not recognise the `<suittype>` element.
- **Read & Edit Existing UDDF 3.2.1 Files**: Easily import and parse existing `.uddf` or `.xml` dive log files into the form to review, modify, or re-export them.
- **Simple Form Entry**: Quick upfront entry for essential dive log details (Dive Number, Date & Time, Site Name, Max Depth, Duration, Gas Mix, Start/End Pressures).
- **Progressive Disclosure**: Expandable sections for additional details (Diver & Buddy info, GPS coordinates, apparatus, water/air temperature, visibility, and dive notes).
- **Automatic Unit Conversion**: Seamlessly toggle between Metric (°C, m, bar) and Imperial (°F, ft, psi) units in the UI while automatically serialising values into strict UDDF 3.2.1 SI units (Kelvin, metres, Pascals, seconds, $m^3$).
- **Profile Waypoints Support**: Preserves detailed dive profile waypoints when editing imported dive computer logs, while generating clean, unbloated summary XML for manual entries.

It's standard HTML5, CSS3, and JavaScript, no external frameworks and no assembly required.

Simply open `index.html` directly in any browser.

Pull requests welcome, in particular to estabilish interoperability with other software 
while remaining UDDF compliant.

## Licence

This project is licenced under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENCE](LICENCE.md) file for details.
