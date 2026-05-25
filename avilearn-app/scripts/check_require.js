if (typeof global !== 'undefined' && !global.DOMMatrix) {
  global.DOMMatrix = class DOMMatrix {};
}
const p = require('pdf-parse');
console.log('type:', typeof p);
console.log('keys:', Object.keys(p));
console.log('PDFParse type:', typeof p.PDFParse);
if (typeof p === 'function') {
  console.log('p is function itself');
}
