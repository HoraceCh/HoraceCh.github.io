import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { transformSync } from 'esbuild';
const source = readFileSync('src/lib/continuousRect.ts','utf8');
const { continuousCorner, continuousRectPath } = await import('data:text/javascript;base64,' + Buffer.from(transformSync(source,{loader:'ts',format:'esm'}).code).toString('base64'));
const sub=(a,b)=>a.map((n,i)=>n-b[i]),mul=(a,n)=>a.map(x=>x*n),cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const derivative=(p,t)=>t===0?mul(sub(p[1],p[0]),3):mul(sub(p[3],p[2]),3);
const second=(p,t)=>t===0?mul(p[2].map((n,i)=>n-2*p[1][i]+p[0][i]),6):mul(p[3].map((n,i)=>n-2*p[2][i]+p[1][i]),6);
const close=(a,b)=>a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<1e-9));
test('corner joins straight segments with zero curvature and matches midpoint derivatives',()=>{
 for(const r of [1,15,22,28,35]) {
  const p=continuousCorner(r),a=p.slice(0,4),b=p.slice(3);
  for(const [curve,t] of [[a,0],[b,1]]) {
   const v=derivative(curve,t);assert.ok(Math.hypot(...v)>0);
   assert.ok(Math.abs(cross(v,second(curve,t)))<1e-9);
  }
  close(derivative(a,1),derivative(b,0));close(second(a,1),second(b,0));
 }
});
test('continuous rectangle remains finite and clamps corner extent at narrow sizes',()=>{
 for(const [width,height,radius]of [[1,1,28],[320,58,22],[1250,65,28],[340,410,24],[44,44,15]]) {
  const p=continuousRectPath({width,height,radius});
  assert.equal((p.match(/C /g)||[]).length,8);assert.ok(p.endsWith('Z'));assert.doesNotMatch(p,/NaN|Infinity/);
  const numbers=p.match(/-?[\d.]+/g).map(Number);
  for(let i=0;i<numbers.length;i++)assert.ok(numbers[i]>=0 && numbers[i]<=(i%2===0?Math.max(width,height):Math.max(width,height)));
 }
});

test('built SVG displacement maps have explicit nonzero extent before refraction setup',()=>{
 const html=readFileSync('.npm-cache/hc235-glass-r7-fixture/dist/hc235-light/index.html','utf8');
 const images=[...html.matchAll(/<feImage\b([^>]*)>/gi)];
 assert.equal(images.length,2);
 for(const [,attrs] of images)for(const dim of ['width','height'])assert.match(attrs,new RegExp(dim+'="100%"'));
 for(const svg of html.matchAll(/<svg[^>]*class="hc-header__filter"([^>]*)>/g))assert.doesNotMatch(svg[1],/(?:width|height)="0"/);
});
