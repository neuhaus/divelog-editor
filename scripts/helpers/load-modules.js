/*
 * Load the browser modules into a Node sandbox for testing.
 * The modules attach themselves to `window`, so the sandbox itself acts as
 * the global object. app.js is intentionally not loaded (it needs a real DOM).
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { DOMParser } = require('./fake-dom');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const MODULES = ['uddf-schema.js', 'uddf-exporter.js', 'uddf-parser.js'];

function loadModules() {
  const sandbox = {
    console,
    Date,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    JSON,
    Promise,
    Error,
    parseFloat,
    parseInt,
    isNaN,
    isFinite,
    DOMParser
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  for (const file of MODULES) {
    const source = fs.readFileSync(path.join(PROJECT_ROOT, 'js', file), 'utf8');
    vm.runInContext(source, sandbox, { filename: file });
  }

  return {
    schema: sandbox.UDDF_SCHEMA,
    exporter: sandbox.UDDF_EXPORTER,
    parser: sandbox.UDDF_PARSER
  };
}

module.exports = { loadModules };
