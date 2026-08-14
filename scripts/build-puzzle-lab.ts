/**
 * Build content/puzzle-lab.html — a self-contained browser tool to review and tweak the
 * whole 400-puzzle catalog WITHOUT playing it. Reads the editable source files
 * (content/<id>/region.gen.json) and embeds them.
 *
 * Features: contact sheet of every silhouette grouped by subject (filter by
 * region/tier/search + "capstones only"), a click-to-edit grid with live clues, a live tier +
 * uniqueness readout (the engine ported to in-page JS), a "needs work" flag, and per-region
 * export of an updated region.gen.json to save back (then `npm run build-regions`).
 *
 * Usage: npm run build-puzzle-lab
 */
import * as fs from 'fs';
import * as path from 'path';
import { REGION_THEMES } from '@/../content/generator/regions';
import type { GenRegion } from '@/../content/generator/assembleRegion';

const ROOT = process.cwd();

const regions: GenRegion[] = [];
for (const theme of REGION_THEMES) {
  const p = path.join(ROOT, 'content', theme.id, 'region.gen.json');
  if (!fs.existsSync(p)) {
    console.error(`! missing ${path.relative(ROOT, p)} — run generate-puzzles first`);
    process.exit(2);
  }
  regions.push(JSON.parse(fs.readFileSync(p, 'utf8')) as GenRegion);
}

const DATA = JSON.stringify(regions);

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Puzzle Lab — Cryptid Picross</title>
<style>
  :root { --bg:#211c15; --panel:#2b241b; --ink:#f1e8d3; --muted:#b3a487; --line:#4a4030; --accent:#c98a3c; --red:#9b3b2e; --green:#5d6b4e; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Courier New",monospace; }
  header { position:sticky; top:0; z-index:5; background:var(--panel); border-bottom:1px solid var(--line); padding:10px 16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  header h1 { font-size:16px; margin:0 12px 0 0; letter-spacing:2px; text-transform:uppercase; }
  select, input, button { background:var(--bg); color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:6px 8px; font-family:inherit; font-size:13px; }
  button { cursor:pointer; }
  button.primary { background:var(--accent); color:#1a1610; border-color:var(--accent); font-weight:bold; }
  .count { color:var(--muted); font-size:13px; margin-left:auto; }
  #grid { padding:16px; }
  .group { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; margin-bottom:18px; }
  .group-head { grid-column:1/-1; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--line); padding-bottom:4px; margin-bottom:2px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:8px; cursor:pointer; position:relative; }
  .card:hover { border-color:var(--accent); }
  .card.flagged { border-color:var(--red); box-shadow:0 0 0 1px var(--red) inset; }
  .card canvas { width:100%; height:auto; image-rendering:pixelated; background:#f1e8d3; border-radius:4px; display:block; }
  .card .nm { font-size:11px; margin-top:6px; line-height:1.3; height:28px; overflow:hidden; }
  .card .meta { font-size:10px; color:var(--muted); margin-top:2px; display:flex; justify-content:space-between; }
  .tier { text-transform:uppercase; letter-spacing:1px; }
  .tier.Easy{color:#7f8f66} .tier.Medium{color:var(--accent)} .tier.Hard{color:#c96b4c} .tier.Expert{color:var(--red)}
  .cap { position:absolute; top:6px; right:6px; background:var(--accent); color:#1a1610; font-size:9px; padding:1px 4px; border-radius:3px; }
  /* modal */
  #modal { position:fixed; inset:0; background:rgba(0,0,0,.7); display:none; align-items:center; justify-content:center; z-index:10; padding:16px; }
  #modal.open { display:flex; }
  .sheet { background:var(--panel); border:1px solid var(--line); border-radius:10px; max-width:1000px; width:100%; max-height:92vh; overflow:auto; padding:16px; }
  .sheet-top { display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; }
  .edwrap { display:grid; gap:2px; background:var(--line); border:2px solid var(--line); }
  .cellrow { display:flex; gap:2px; }
  .cell { background:#f1e8d3; cursor:pointer; }
  .cell.on { background:#2b241b; }
  .info { flex:1; min-width:220px; }
  .info h2 { margin:0 0 4px; font-size:16px; }
  .row { margin:4px 0; font-size:13px; color:var(--muted); }
  .status.ok { color:#7f8f66; } .status.bad { color:var(--red); }
  .clue { color:var(--muted); font-size:11px; word-break:break-word; }
  .actions { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  textarea { width:100%; height:70px; background:var(--bg); color:var(--ink); border:1px solid var(--line); border-radius:6px; font-family:inherit; font-size:12px; padding:6px; }
</style>
</head>
<body>
<header>
  <h1>Puzzle Lab</h1>
  <select id="fRegion"><option value="">All regions</option></select>
  <select id="fTier"><option value="">All tiers</option><option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option></select>
  <input id="fSearch" placeholder="search name…" />
  <label style="font-size:12px;color:var(--muted)"><input type="checkbox" id="fCap" style="width:auto"> capstones</label>
  <label style="font-size:12px;color:var(--muted)"><input type="checkbox" id="fFlag" style="width:auto"> flagged</label>
  <label style="font-size:12px;color:var(--muted)"><input type="checkbox" id="fGroup" style="width:auto" checked> group by subject</label>
  <button id="export" class="primary">Export edited region…</button>
  <span class="count" id="count"></span>
</header>
<div id="grid"></div>

<div id="modal"><div class="sheet">
  <div class="sheet-top">
    <div><div id="editor"></div><div class="row" style="font-size:11px;margin-top:6px">Click cells to toggle fill.</div></div>
    <div class="info">
      <h2 id="mName"></h2>
      <div class="row" id="mMeta"></div>
      <div class="row">Computed: <span id="mStatus" class="status"></span></div>
      <div class="row">Rows: <span class="clue" id="mRows"></span></div>
      <div class="row">Cols: <span class="clue" id="mCols"></span></div>
      <div class="row">Name: <input id="mNameEdit" style="width:100%"></div>
      <div class="row">Entry: <textarea id="mBody"></textarea></div>
      <div class="actions">
        <button id="mFlag">Flag needs-work</button>
        <button id="mReset">Reset grid</button>
        <button class="primary" id="mSave">Apply changes</button>
        <button id="mClose">Close</button>
      </div>
    </div>
  </div>
</div></div>

<script>
const REGIONS = ${DATA};
</script>
<script>
/* ---- engine port (deriveClues / analyze / scoreDifficulty) ---- */
function lineClue(cells){ const r=[]; let n=0; for(const v of cells){ if(v===1)n++; else if(n>0){r.push(n);n=0;} } if(n>0)r.push(n); return r.length?r:[0]; }
function deriveClues(g){ const row=g.map(lineClue); const col=[]; for(let c=0;c<g[0].length;c++) col.push(lineClue(g.map(r=>r[c]))); return {row,col}; }
function possibleLines(clue,length){ const runs=(clue.length===1&&clue[0]===0)?[]:clue; const out=[]; function place(idx,from,acc){ if(idx===runs.length){ const line=acc.slice(); while(line.length<length)line.push(0); out.push(line); return; } const rest=runs.slice(idx); const minTail=rest.reduce((a,b)=>a+b,0)+(rest.length-1); const maxStart=length-minTail; for(let s=from;s<=maxStart;s++){ const nx=acc.slice(); while(nx.length<s)nx.push(0); for(let k=0;k<runs[idx];k++)nx.push(1); const last=idx===runs.length-1; if(!last)nx.push(0); place(idx+1,s+runs[idx]+(last?0:1),nx);} } place(0,0,[]); return out; }
function intersect(cands){ if(!cands.length)return[]; const L=cands[0].length; const o=[]; for(let i=0;i<L;i++){ const f=cands[0][i]; o.push(cands.every(c=>c[i]===f)?f:null);} return o; }
function analyze(rowClues,colClues){ const rows=rowClues.length,cols=colClues.length; const g=Array.from({length:rows},()=>new Array(cols).fill(null)); let rc=rowClues.map(c=>possibleLines(c,cols)); let cc=colClues.map(c=>possibleLines(c,rows)); const match=(cand,known)=>{for(let i=0;i<known.length;i++)if(known[i]!==null&&known[i]!==cand[i])return false;return true;}; for(let d=1;d<=50;d++){ let ch=false; for(let r=0;r<rows;r++){ rc[r]=rc[r].filter(c=>match(c,g[r])); if(!rc[r].length)return{unique:false,depth:d}; const it=intersect(rc[r]); for(let c=0;c<cols;c++)if(it[c]!==null&&g[r][c]===null){g[r][c]=it[c];ch=true;} } for(let c=0;c<cols;c++){ const kn=g.map(r=>r[c]); cc[c]=cc[c].filter(x=>match(x,kn)); if(!cc[c].length)return{unique:false,depth:d}; const it=intersect(cc[c]); for(let r=0;r<rows;r++)if(it[r]!==null&&g[r][c]===null){g[r][c]=it[r];ch=true;} } if(g.every(r=>r.every(c=>c!==null)))return{unique:true,depth:d}; if(!ch)return{unique:false,depth:d}; } return{unique:false,depth:50}; }
function scoreTier(g,rc,cc,unique,depth){ const rows=g.length,cols=g[0].length,area=rows*cols; const size=area<=25?1:area>=625?5:1+4*(area-25)/600; const filled=g.reduce((s,l)=>s+l.reduce((a,b)=>a+b,0),0); const dev=Math.abs(filled/area-0.5)*2; const density=Math.min(5,dev*5); const runs=[...rc,...cc].flat().filter(r=>r>0); const avg=runs.length?runs.reduce((a,b)=>a+b,0)/runs.length:0; const seg=avg>=6?0:Math.max(0,Math.min(5,6-avg)); let hd=0,vd=0; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){ if(g[r][c]!==g[r][cols-1-c])hd++; if(g[r][c]!==g[rows-1-r][c])vd++; } const asym=Math.min(5,(Math.min(hd,vd)/area)*10); const sd=!unique?5:Math.max(0,Math.min(5,(depth-1)*0.8)); const total=size+density+seg+asym+sd; const tier=total<8?'Easy':total<14?'Medium':total<19?'Hard':'Expert'; return {total,tier}; }
const toGrid = a => a.map(r => r.split('').map(ch => ch==='#'?1:0));
const toAscii = g => g.map(r => r.map(c => c?'#':'.').join(''));

/* ---- state ---- */
const flags = JSON.parse(localStorage.getItem('pl-flags')||'{}');
const edits = JSON.parse(localStorage.getItem('pl-edits')||'{}'); // id -> {grid?:string[], name?, body?}
const all = [];
REGIONS.forEach(reg => reg.puzzles.forEach(p => all.push({ ...p, region: reg.id, regionName: reg.name })));
const byId = Object.fromEntries(all.map(p => [p.id, p]));
function curGrid(p){ return (edits[p.id]&&edits[p.id].grid) || p.grid; }
function saveLS(){ localStorage.setItem('pl-flags',JSON.stringify(flags)); localStorage.setItem('pl-edits',JSON.stringify(edits)); }

/* ---- gallery ---- */
const gridEl = document.getElementById('grid');
const rsel = document.getElementById('fRegion');
REGIONS.forEach(r => { const o=document.createElement('option'); o.value=r.id; o.textContent=r.name+(r.isFree?' (free)':' (paid)'); rsel.appendChild(o); });
function drawMini(cv, g){ const rows=g.length, cols=g[0].length, s=Math.max(2,Math.floor(56/Math.max(rows,cols))); cv.width=cols*s; cv.height=rows*s; const x=cv.getContext('2d'); x.fillStyle='#f1e8d3'; x.fillRect(0,0,cv.width,cv.height); x.fillStyle='#2b241b'; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(g[r][c])x.fillRect(c*s,r*s,s,s); }
/**
 * Best-effort "subject" key for grouping same-creature/same-icon variants.
 * Puzzle names are generated from one of three templates around an art
 * library entry's label — "The {descriptor} {label}", "{label} of {place}",
 * or "The {label}" (see content/generator/lore.ts nameForEntry) — and the
 * LAST word of {label} survives unchanged in all three forms. Strip a
 * trailing " (2)" dedupe suffix and an " of {place}" tail, then take the
 * last remaining word as the grouping key.
 */
function subjectKey(name){
  let n = name.replace(/\s*\(\d+\)\s*$/, '');
  const ofIdx = n.indexOf(' of ');
  if (ofIdx !== -1) n = n.slice(0, ofIdx);
  const words = n.trim().split(/\s+/);
  return (words[words.length - 1] || n).toLowerCase();
}
function drawCard(p, nm, g){
  const card=document.createElement('div'); card.className='card'+(flags[p.id]?' flagged':''); card.onclick=()=>openEditor(p.id);
  const cv=document.createElement('canvas'); drawMini(cv,g); card.appendChild(cv);
  if(p.isCapstone){ const b=document.createElement('div'); b.className='cap'; b.textContent='CAPSTONE'; card.appendChild(b); }
  const nmd=document.createElement('div'); nmd.className='nm'; nmd.textContent=nm; card.appendChild(nmd);
  const meta=document.createElement('div'); meta.className='meta'; meta.innerHTML='<span>'+p.id+'</span><span>'+g.length+'×'+g[0].length+'</span>'; card.appendChild(meta);
  const t=document.createElement('div'); t.className='meta'; t.innerHTML='<span class="tier '+p.tier+'">'+p.tier+'</span>'+(edits[p.id]?'<span style="color:var(--accent)">edited</span>':''); card.appendChild(t);
  return card;
}
function render(){
  const fr=rsel.value, ft=document.getElementById('fTier').value, fs=document.getElementById('fSearch').value.toLowerCase(), fc=document.getElementById('fCap').checked, ff=document.getElementById('fFlag').checked, fg=document.getElementById('fGroup').checked;
  gridEl.innerHTML='';
  const rows=[];
  for(const p of all){
    if(fr&&p.region!==fr)continue; if(ft&&p.tier!==ft)continue; if(fc&&!p.isCapstone)continue; if(ff&&!flags[p.id])continue;
    const nm=((edits[p.id]&&edits[p.id].name)||p.name);
    if(fs&&!nm.toLowerCase().includes(fs))continue;
    rows.push({ p, nm, key: subjectKey(nm) });
  }
  // Secondary sort: same-subject variants sit together, original catalog order otherwise.
  if(fg){
    rows.forEach((r,i)=>{ r.i=i; });
    rows.sort((a,b)=> a.key===b.key ? a.i-b.i : a.key<b.key ? -1 : 1);
  }
  let shown=0, group=null, lastKey=null;
  for(const {p,nm,key} of rows){
    shown++;
    const g=toGrid(curGrid(p));
    if(fg){
      if(key!==lastKey){
        lastKey=key;
        group=document.createElement('div'); group.className='group';
        const head=document.createElement('div'); head.className='group-head'; head.textContent=key+' ('+rows.filter(r=>r.key===key).length+')'; group.appendChild(head);
        gridEl.appendChild(group);
      }
    } else if(!group){
      group=document.createElement('div'); group.className='group';
      gridEl.appendChild(group);
    }
    group.appendChild(drawCard(p, nm, g));
  }
  document.getElementById('count').textContent=shown+' / '+all.length+' puzzles';
}
['fRegion','fTier','fSearch','fCap','fFlag','fGroup'].forEach(id=>document.getElementById(id).addEventListener('input',render));

/* ---- editor ---- */
let cur=null, workGrid=null;
function openEditor(id){ cur=byId[id]; workGrid=toGrid(curGrid(cur)); drawEditor(); document.getElementById('mName').textContent=cur.id; document.getElementById('mMeta').textContent=cur.regionName+' · order '+cur.order+' · target '+cur.tier+(cur.isCapstone?' · CAPSTONE':''); document.getElementById('mNameEdit').value=(edits[id]&&edits[id].name)||cur.name; document.getElementById('mBody').value=(edits[id]&&edits[id].body)||cur.entry.body; document.getElementById('mFlag').textContent=flags[id]?'Unflag':'Flag needs-work'; document.getElementById('modal').classList.add('open'); recompute(); }
function drawEditor(){ const wrap=document.getElementById('editor'); const rows=workGrid.length,cols=workGrid[0].length; const cs=Math.max(8,Math.min(20,Math.floor(420/cols))); wrap.className='edwrap'; wrap.innerHTML=''; for(let r=0;r<rows;r++){ const rd=document.createElement('div'); rd.className='cellrow'; for(let c=0;c<cols;c++){ const cell=document.createElement('div'); cell.className='cell'+(workGrid[r][c]?' on':''); cell.style.width=cs+'px'; cell.style.height=cs+'px'; cell.onclick=()=>{ workGrid[r][c]=workGrid[r][c]?0:1; cell.classList.toggle('on'); recompute(); }; rd.appendChild(cell);} wrap.appendChild(rd);} }
function recompute(){ const {row,col}=deriveClues(workGrid); const a=analyze(row,col); const s=scoreTier(workGrid,row,col,a.unique,a.depth); const st=document.getElementById('mStatus'); st.textContent=(a.unique?'unique ✓':'NOT unique ✗')+' · '+s.tier+' ('+s.total.toFixed(1)+')'+' · depth '+a.depth; st.className='status '+(a.unique?'ok':'bad'); document.getElementById('mRows').textContent=row.map(r=>r.join(' ')).join('  |  '); document.getElementById('mCols').textContent=col.map(c=>c.join(' ')).join('  |  '); }
document.getElementById('mFlag').onclick=()=>{ flags[cur.id]=!flags[cur.id]; if(!flags[cur.id])delete flags[cur.id]; saveLS(); document.getElementById('mFlag').textContent=flags[cur.id]?'Unflag':'Flag needs-work'; };
document.getElementById('mReset').onclick=()=>{ workGrid=toGrid(cur.grid); drawEditor(); recompute(); };
document.getElementById('mClose').onclick=()=>document.getElementById('modal').classList.remove('open');
document.getElementById('mSave').onclick=()=>{ const e=edits[cur.id]||{}; e.grid=toAscii(workGrid); e.name=document.getElementById('mNameEdit').value; e.body=document.getElementById('mBody').value; edits[cur.id]=e; saveLS(); document.getElementById('modal').classList.remove('open'); render(); };

/* ---- export ---- */
document.getElementById('export').onclick=()=>{ const rid=rsel.value; if(!rid){ alert('Pick a single region in the filter first, then export its updated source.'); return; } const reg=JSON.parse(JSON.stringify(REGIONS.find(r=>r.id===rid))); reg.puzzles.forEach(p=>{ const e=edits[p.id]; if(e){ if(e.grid)p.grid=e.grid; if(e.name)p.name=e.name; if(e.body)p.entry.body=e.body; } }); const blob=new Blob([JSON.stringify(reg,null,2)+'\\n'],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='region.gen.json'; a.click(); URL.revokeObjectURL(url); alert('Saved region.gen.json for '+rid+'.\\nReplace content/'+rid+'/region.gen.json with it, then run:  npm run build-regions -- '+rid); };

render();
</script>
</body>
</html>
`;

const out = path.join(ROOT, 'content', 'puzzle-lab.html');
fs.writeFileSync(out, HTML);
const puzzles = regions.reduce((n, r) => n + r.puzzles.length, 0);
console.log(`Wrote ${path.relative(ROOT, out)} (${puzzles} puzzles, ${(HTML.length / 1024 / 1024).toFixed(2)} MB)`);
