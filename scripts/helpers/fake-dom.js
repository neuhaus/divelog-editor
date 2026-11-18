/*
 * Minimal XML DOM shim for the parser tests.
 *
 * It implements just enough of DOMParser/Element for uddf-parser.js:
 * element/tree building, textContent, getAttribute, outerHTML and
 * querySelector/All with descendant and child combinators plus
 * :first-child / :last-child. No external dependencies.
 */
'use strict';

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'"
};

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1] === 'x' || entity[1] === 'X';
      const code = parseInt(hex ? entity.slice(2) : entity.slice(1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity] || match;
  });
}

function encodeText(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function encodeAttribute(value) {
  return encodeText(value).replace(/"/g, '&quot;');
}

function parseAttributes(source) {
  const attrs = {};
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    attrs[match[1]] = decodeEntities(match[2] !== undefined ? match[2] : match[3] || '');
  }
  return attrs;
}

function parentElement(el) {
  const parent = el && el.parentNode;
  return parent && parent.nodeType === 1 ? parent : null;
}

function elementSiblings(el) {
  const parent = parentElement(el);
  return parent ? parent.children.filter((child) => child.nodeType === 1) : [el];
}

function matchesSimple(el, step) {
  if (el.nodeType !== 1 || el.tagName !== step.tag) return false;
  if (step.pseudo === ':first-child') return elementSiblings(el)[0] === el;
  if (step.pseudo === ':last-child') {
    const siblings = elementSiblings(el);
    return siblings[siblings.length - 1] === el;
  }
  return true;
}

function matchesSteps(el, steps) {
  if (!matchesSimple(el, steps[steps.length - 1])) return false;
  let current = el;
  for (let i = steps.length - 2; i >= 0; i -= 1) {
    let parent = parentElement(current);
    if (steps[i + 1].direct) {
      if (!parent || !matchesSimple(parent, steps[i])) return false;
      current = parent;
    } else {
      while (parent && !matchesSimple(parent, steps[i])) parent = parentElement(parent);
      if (!parent) return false;
      current = parent;
    }
  }
  return true;
}

function tokenize(selector) {
  const parts = String(selector).trim().split(/\s+/);
  const steps = [];
  let direct = false;
  for (const part of parts) {
    if (part === '>') {
      direct = true;
      continue;
    }
    const match = part.match(/^([^\s:]+)(:first-child|:last-child)?$/);
    if (!match) throw new Error(`Unsupported test selector: ${selector}`);
    steps.push({ tag: match[1], pseudo: match[2] || '', direct });
    direct = false;
  }
  if (steps.length === 0) throw new Error(`Empty test selector: ${selector}`);
  return steps;
}

function forEachElement(root, callback) {
  for (const child of root.children) {
    if (child.nodeType !== 1) continue;
    if (callback(child) === true) return true;
    if (forEachElement(child, callback) === true) return true;
  }
  return false;
}

function query(root, selector, all) {
  const steps = tokenize(selector);
  const found = [];
  forEachElement(root, (el) => {
    if (!matchesSteps(el, steps)) return false;
    found.push(el);
    return !all;
  });
  return all ? found : found.length > 0 ? found[0] : null;
}

function createElement(tagName, attrs = {}) {
  return {
    nodeType: 1,
    tagName,
    attrs,
    children: [],
    parentNode: null,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    get textContent() {
      return this.children
        .map((child) => (child.nodeType === 3 ? child.data : child.textContent))
        .join('');
    },
    get outerHTML() {
      const attributes = Object.entries(this.attrs)
        .map(([name, value]) => ` ${name}="${encodeAttribute(value)}"`)
        .join('');
      if (this.children.length === 0) return `<${this.tagName}${attributes}/>`;
      const content = this.children
        .map((child) => (child.nodeType === 3 ? encodeText(child.data) : child.outerHTML))
        .join('');
      return `<${this.tagName}${attributes}>${content}</${this.tagName}>`;
    },
    querySelector(selector) {
      return query(this, selector, false);
    },
    querySelectorAll(selector) {
      return query(this, selector, true);
    }
  };
}

function parseXml(xml) {
  const source = String(xml)
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '');

  const document = createElement('#document');
  const stack = [document];
  const token = /<(\/)?([A-Za-z_][\w:.\-]*)([^>]*?)(\/?)>|([^<]+)/g;
  let match;
  let error = null;

  while ((match = token.exec(source)) !== null) {
    if (match[5] !== undefined) {
      const data = decodeEntities(match[5]);
      if (data) {
        const parent = stack[stack.length - 1];
        parent.children.push({ nodeType: 3, data, parentNode: parent });
      }
      continue;
    }

    const closing = Boolean(match[1]);
    const tagName = match[2];
    if (closing) {
      const open = stack[stack.length - 1];
      if (open.tagName !== tagName) {
        error = error || `Mismatched closing tag: ${tagName}`;
      } else {
        stack.pop();
      }
      continue;
    }

    const el = createElement(tagName, parseAttributes(match[3] || ''));
    const parent = stack[stack.length - 1];
    el.parentNode = parent;
    parent.children.push(el);
    if (!match[4]) stack.push(el);
  }

  if (stack.length > 1) error = error || 'Unclosed XML element';

  if (error) {
    const errorDocument = createElement('#document');
    const parserError = createElement('parsererror');
    parserError.parentNode = errorDocument;
    parserError.children.push({ nodeType: 3, data: error, parentNode: parserError });
    errorDocument.children.push(parserError);
    return errorDocument;
  }

  return document;
}

class DOMParser {
  parseFromString(xml) {
    return parseXml(xml);
  }
}

module.exports = { DOMParser, parseXml, createElement };
