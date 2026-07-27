# divelog-editor

A lightweight, accessible, single-page web application to read, view, edit, and create scuba dive logs, and export them as valid **UDDF 3.2.3 (Universal Dive Data Format)** XML files.

## Features

- Everything happens only in your browser. Your dive data is not sent to a server.
- Compatible with [Shearwater Cloud](https://shearwater.com/pages/shearwater-cloud). Tested with macOS client 2.12.10
  - Known issue: Shearwater cloud does not recognise the `<suittype>` element
- Read & edit existing UDDF 3.2.3 files, preserving dive profile waypoints and telemetry when editing imported dive computer logs
- Automatic unit conversion between metric and imperial

It's standard HTML5, CSS3, and JavaScript, no external frameworks and no assembly required.

Simply open [index.html](https://neuhaus.github.io/divelog-editor/index.html) directly in your browser.

Pull requests welcome, in particular to estabilish interoperability with other software 
while remaining UDDF compliant.

## Licence

This project is licenced under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENCE](LICENCE.md) file for details.
