const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Source-level CSS guards only; these do not measure browser layout or zoom.
const css=fs.readFileSync(path.join(__dirname,'../dist/style.css'),'utf8');
const stability=css.slice(css.indexOf('/* Writing/TOC stability:'));

test('writing grids allow their contents to shrink instead of forcing horizontal overflow',()=>{
  assert.match(stability,/\.worksheet-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(stability,/\.worksheet-grid>\*[^}]*\{min-width:0\}/);
  assert.match(stability,/\.tab-content textarea\{[^}]*min-width:0;max-width:100%/);
  assert.match(stability,/overflow-wrap:anywhere/);
});

test('TOC summary can wrap its progress text without floats or overlap',()=>{
  assert.match(stability,/\.steps-panel>summary\{display:flex;flex-wrap:wrap/);
  assert.match(stability,/\.steps-panel>summary \.tiny\{float:none/);
  assert.match(stability,/@media\(max-width:690px\)[\s\S]*\.tiny\{flex-basis:100%/);
});

test('mobile writing keeps single-column fields and readable non-zoom-triggering textarea text',()=>{
  assert.match(stability,/html\{scrollbar-gutter:stable;overflow-anchor:none\}/);
  assert.match(stability,/@media\(max-width:800px\)[\s\S]*\.worksheet-grid,\.comparison\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(stability,/@media\(max-width:800px\)[\s\S]*\.tab-content textarea\{font-size:16px\}/);
});
