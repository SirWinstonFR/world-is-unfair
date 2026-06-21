/**
 * globe.js — Globe 3D interactif
 * ─────────────────────────────────────────────────────────────
 * - Three.js / WebGL pour un vrai rendu 3D
 * - Earcut intégré (triangulation correcte des polygones)
 * - TopoJSON pour les frontières (Natural Earth via world-atlas)
 * - Zoom progressif : pays → régions internes (admin-1) quand on
 *   zoome suffisamment sur un pays qui a des données de région
 *
 * Sources de données chargées au runtime :
 *   - Pays   : world-atlas countries-50m  (~750 pays/territoires)
 *   - Régions: Natural Earth admin-1 (states/provinces), chargé à
 *              la demande seulement pour le pays survolé/zoomé
 *
 * Aucune donnée pays affichée au clic pour l'instant — juste le nom.
 * ───────────────────────────────────────────────────────────── */

(function () {
"use strict";

/* ════════════════════════════════════════════════════════════
   EARCUT — triangulation de polygones (port mapbox/earcut, MIT)
════════════════════════════════════════════════════════════ */
function earcut(data, holeIndices, dim) {
  dim = dim || 2;
  var hasHoles = holeIndices && holeIndices.length,
    outerLen = hasHoles ? holeIndices[0] * dim : data.length,
    outerNode = linkedList(data, 0, outerLen, dim, true),
    triangles = [];
  if (!outerNode || outerNode.next === outerNode.prev) return triangles;
  var minX, minY, maxX, maxY, x, y, invSize;
  if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
  if (data.length > 80 * dim) {
    minX = maxX = data[0]; minY = maxY = data[1];
    for (var i = dim; i < outerLen; i += dim) {
      x = data[i]; y = data[i + 1];
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
    invSize = Math.max(maxX - minX, maxY - minY);
    invSize = invSize !== 0 ? 32767 / invSize : 0;
  }
  earcutLinked(outerNode, triangles, dim, minX, minY, invSize, 0);
  return triangles;
}
function linkedList(data, start, end, dim, clockwise) {
  var i, last;
  if (clockwise === (signedArea(data, start, end, dim) > 0)) {
    for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
  } else {
    for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
  }
  if (last && equals(last, last.next)) { removeNode(last); last = last.next; }
  return last;
}
function filterPoints(start, end) {
  if (!start) return start; if (!end) end = start;
  var p = start, again;
  do { again = false;
    if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
      removeNode(p); p = end = p.prev; if (p === p.next) break; again = true;
    } else p = p.next;
  } while (again || p !== end);
  return end;
}
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
  if (!ear) return;
  if (!pass && invSize) indexCurve(ear, minX, minY, invSize);
  var stop = ear, prev, next;
  while (ear.prev !== ear.next) {
    prev = ear.prev; next = ear.next;
    if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
      triangles.push(prev.i / dim | 0, ear.i / dim | 0, next.i / dim | 0);
      removeNode(ear); ear = next.next; stop = next.next; continue;
    }
    ear = next;
    if (ear === stop) {
      if (!pass) earcutLinked(filterPoints(ear, null), triangles, dim, minX, minY, invSize, 1);
      else if (pass === 1) {
        ear = cureLocalIntersections(filterPoints(ear, null), triangles, dim);
        earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
      } else if (pass === 2) splitEarcut(ear, triangles, dim, minX, minY, invSize);
      break;
    }
  }
}
function isEar(ear) {
  var a = ear.prev, b = ear, c = ear.next;
  if (area(a, b, c) >= 0) return false;
  var ax=a.x,bx=b.x,cx=c.x,ay=a.y,by=b.y,cy=c.y;
  var x0=ax<bx?(ax<cx?ax:cx):(bx<cx?bx:cx), y0=ay<by?(ay<cy?ay:cy):(by<cy?by:cy);
  var x1=ax>bx?(ax>cx?ax:cx):(bx>cx?bx:cx), y1=ay>by?(ay>cy?ay:cy):(by>cy?by:cy);
  var p = c.next;
  while (p !== a) {
    if (p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1 && pointInTriangle(ax,ay,bx,by,cx,cy,p.x,p.y) && area(p.prev,p,p.next)>=0) return false;
    p = p.next;
  }
  return true;
}
function isEarHashed(ear, minX, minY, invSize) {
  var a=ear.prev,b=ear,c=ear.next;
  if (area(a,b,c)>=0) return false;
  var ax=a.x,bx=b.x,cx=c.x,ay=a.y,by=b.y,cy=c.y;
  var x0=ax<bx?(ax<cx?ax:cx):(bx<cx?bx:cx), y0=ay<by?(ay<cy?ay:cy):(by<cy?by:cy);
  var x1=ax>bx?(ax>cx?ax:cx):(bx>cx?bx:cx), y1=ay>by?(ay>cy?ay:cy):(by>cy?by:cy);
  var minZ=zOrder(x0,y0,minX,minY,invSize), maxZ=zOrder(x1,y1,minX,minY,invSize);
  var p=ear.prevZ, n=ear.nextZ;
  while (p && p.z>=minZ && n && n.z<=maxZ) {
    if (p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1&&p!==a&&p!==c && pointInTriangle(ax,ay,bx,by,cx,cy,p.x,p.y) && area(p.prev,p,p.next)>=0) return false;
    p = p.prevZ;
    if (n.x>=x0&&n.x<=x1&&n.y>=y0&&n.y<=y1&&n!==a&&n!==c && pointInTriangle(ax,ay,bx,by,cx,cy,n.x,n.y) && area(n.prev,n,n.next)>=0) return false;
    n = n.nextZ;
  }
  while (p && p.z>=minZ) {
    if (p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1&&p!==a&&p!==c && pointInTriangle(ax,ay,bx,by,cx,cy,p.x,p.y) && area(p.prev,p,p.next)>=0) return false;
    p = p.prevZ;
  }
  while (n && n.z<=maxZ) {
    if (n.x>=x0&&n.x<=x1&&n.y>=y0&&n.y<=y1&&n!==a&&n!==c && pointInTriangle(ax,ay,bx,by,cx,cy,n.x,n.y) && area(n.prev,n,n.next)>=0) return false;
    n = n.nextZ;
  }
  return true;
}
function cureLocalIntersections(start, triangles, dim) {
  var p = start;
  do {
    var a=p.prev, b=p.next.next;
    if (!equals(a,b) && intersects(a,p,p.next,b) && locallyInside(a,b) && locallyInside(b,a)) {
      triangles.push(a.i/dim|0, p.i/dim|0, b.i/dim|0);
      removeNode(p); removeNode(p.next); p=start=b;
    }
    p = p.next;
  } while (p !== start);
  return filterPoints(p, null);
}
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
  var a = start;
  do {
    var b = a.next.next;
    while (b !== a.prev) {
      if (a.i !== b.i && isValidDiagonal(a, b)) {
        var c2 = splitPolygon(a, b);
        a = filterPoints(a, a.next); c2 = filterPoints(c2, c2.next);
        earcutLinked(a, triangles, dim, minX, minY, invSize, 0);
        earcutLinked(c2, triangles, dim, minX, minY, invSize, 0);
        return;
      }
      b = b.next;
    }
    a = a.next;
  } while (a !== start);
}
function eliminateHoles(data, holeIndices, outerNode, dim) {
  var queue=[], i, len, start, end, list;
  for (i=0,len=holeIndices.length; i<len; i++) {
    start = holeIndices[i]*dim; end = i<len-1?holeIndices[i+1]*dim:data.length;
    list = linkedList(data, start, end, dim, false);
    if (list===list.next) list.steiner=true;
    queue.push(getLeftmost(list));
  }
  queue.sort(function(a,b){return a.x-b.x;});
  for (i=0;i<queue.length;i++) outerNode = eliminateHole(queue[i], outerNode);
  return outerNode;
}
function eliminateHole(hole, outerNode) {
  var bridge = findHoleBridge(hole, outerNode);
  if (!bridge) return outerNode;
  var bridgeReverse = splitPolygon(bridge, hole);
  filterPoints(bridgeReverse, bridgeReverse.next);
  return filterPoints(bridge, bridge.next);
}
function findHoleBridge(hole, outerNode) {
  var p=outerNode, hx=hole.x, hy=hole.y, qx=-Infinity, m;
  do {
    if (hy<=p.y && hy>=p.next.y && p.next.y!==p.y) {
      var x = p.x + (hy-p.y)*(p.next.x-p.x)/(p.next.y-p.y);
      if (x<=hx && x>qx) { qx=x; m = p.x<p.next.x?p:p.next; if (x===hx) return m; }
    }
    p = p.next;
  } while (p !== outerNode);
  if (!m) return null;
  var stop=m, mx=m.x, my=m.y, tanMin=Infinity, tan;
  p = m;
  do {
    if (hx>=p.x && p.x>=mx && hx!==p.x && pointInTriangle(hy<my?hx:qx,hy,mx,my,hy<my?qx:hx,hy,p.x,p.y)) {
      tan = Math.abs(hy-p.y)/(hx-p.x);
      if (locallyInside(p,hole) && (tan<tanMin || (tan===tanMin && (p.x>m.x || (p.x===m.x && sectorContainsSector(m,p)))))) { m=p; tanMin=tan; }
    }
    p = p.next;
  } while (p !== stop);
  return m;
}
function sectorContainsSector(m,p){ return area(m.prev,m,p.prev)<0 && area(p.next,m,m.next)<0; }
function indexCurve(start, minX, minY, invSize) {
  var p = start;
  do { if (p.z===0) p.z=zOrder(p.x,p.y,minX,minY,invSize); p.prevZ=p.prev; p.nextZ=p.next; p=p.next; } while (p!==start);
  p.prevZ.nextZ=null; p.prevZ=null; sortLinked(p);
}
function sortLinked(list) {
  var i,p,q,e,tail,numMerges,pSize,qSize,inSize=1;
  do {
    p=list; list=null; tail=null; numMerges=0;
    while (p) {
      numMerges++; q=p; pSize=0;
      for (i=0;i<inSize;i++){pSize++;q=q.nextZ;if(!q)break;}
      qSize=inSize;
      while (pSize>0 || (qSize>0 && q)) {
        if (pSize!==0 && (qSize===0||!q||p.z<=q.z)) { e=p; p=p.nextZ; pSize--; } else { e=q; q=q.nextZ; qSize--; }
        if (tail) tail.nextZ=e; else list=e; e.prevZ=tail; tail=e;
      }
      p=q;
    }
    tail.nextZ=null; inSize*=2;
  } while (numMerges>1);
  return list;
}
function zOrder(x,y,minX,minY,invSize) {
  x=(x-minX)*invSize|0; y=(y-minY)*invSize|0;
  x=(x|(x<<8))&0x00FF00FF; x=(x|(x<<4))&0x0F0F0F0F; x=(x|(x<<2))&0x33333333; x=(x|(x<<1))&0x55555555;
  y=(y|(y<<8))&0x00FF00FF; y=(y|(y<<4))&0x0F0F0F0F; y=(y|(y<<2))&0x33333333; y=(y|(y<<1))&0x55555555;
  return x | (y<<1);
}
function getLeftmost(start){ var p=start,leftmost=start; do{ if(p.x<leftmost.x||(p.x===leftmost.x&&p.y<leftmost.y))leftmost=p; p=p.next; }while(p!==start); return leftmost; }
function pointInTriangle(ax,ay,bx,by,cx,cy,px,py){ return (cx-px)*(ay-py)>=(ax-px)*(cy-py) && (ax-px)*(by-py)>=(bx-px)*(ay-py) && (bx-px)*(cy-py)>=(cx-px)*(by-py); }
function isValidDiagonal(a,b){ return a.next.i!==b.i && a.prev.i!==b.i && !intersectsPolygon(a,b) && (locallyInside(a,b)&&locallyInside(b,a)&&middleInside(a,b)&&(area(a.prev,a,b.prev)||area(a,b.prev,b)) || equals(a,b)&&area(a.prev,a,a.next)>0&&area(b.prev,b,b.next)>0); }
function area(p,q,r){ return (q.y-p.y)*(r.x-q.x)-(q.x-p.x)*(r.y-q.y); }
function equals(p1,p2){ return p1.x===p2.x && p1.y===p2.y; }
function intersects(p1,q1,p2,q2){
  var o1=sign(area(p1,q1,p2)), o2=sign(area(p1,q1,q2)), o3=sign(area(p2,q2,p1)), o4=sign(area(p2,q2,q1));
  if (o1!==o2 && o3!==o4) return true;
  if (o1===0 && onSegment(p1,p2,q1)) return true;
  if (o2===0 && onSegment(p1,q2,q1)) return true;
  if (o3===0 && onSegment(p2,p1,q2)) return true;
  if (o4===0 && onSegment(p2,q1,q2)) return true;
  return false;
}
function onSegment(p,q,r){ return q.x<=Math.max(p.x,r.x) && q.x>=Math.min(p.x,r.x) && q.y<=Math.max(p.y,r.y) && q.y>=Math.min(p.y,r.y); }
function sign(num){ return num>0?1:num<0?-1:0; }
function intersectsPolygon(a,b){ var p=a; do{ if(p.i!==a.i&&p.next.i!==a.i&&p.i!==b.i&&p.next.i!==b.i&&intersects(p,p.next,a,b))return true; p=p.next; }while(p!==a); return false; }
function locallyInside(a,b){ return area(a.prev,a,a.next)<0 ? area(a,b,a.next)>=0 && area(a,a.prev,b)>=0 : area(a,b,a.prev)<0 || area(a,a.next,b)<0; }
function middleInside(a,b){ var p=a,inside=false,px=(a.x+b.x)/2,py=(a.y+b.y)/2; do{ if(((p.y>py)!==(p.next.y>py)) && p.next.y!==p.y && (px<(p.next.x-p.x)*(py-p.y)/(p.next.y-p.y)+p.x)) inside=!inside; p=p.next; }while(p!==a); return inside; }
function splitPolygon(a,b){ var a2=createNode(a.i,a.x,a.y), b2=createNode(b.i,b.x,b.y), an=a.next, bp=b.prev; a.next=b; b.prev=a; a2.next=an; an.prev=a2; b2.next=a2; a2.prev=b2; bp.next=b2; b2.prev=bp; return b2; }
function insertNode(i,x,y,last){ var p=createNode(i,x,y); if(!last){p.prev=p;p.next=p;}else{p.next=last.next;p.prev=last;last.next.prev=p;last.next=p;} return p; }
function removeNode(p){ p.next.prev=p.prev; p.prev.next=p.next; if(p.prevZ)p.prevZ.nextZ=p.nextZ; if(p.nextZ)p.nextZ.prevZ=p.prevZ; }
function createNode(i,x,y){ return {i,x,y,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:false}; }
function signedArea(data,start,end,dim){ var sum=0; for(var i=start,j=end-dim;i<end;i+=dim){ sum+=(data[j]-data[i])*(data[i+1]+data[j+1]); j=i; } return sum; }
/* ══ FIN EARCUT ══ */


/* ════════════════════════════════════════════════════════════
   CONFIGURATION
════════════════════════════════════════════════════════════ */
const URL_COUNTRIES = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
// Régions (admin-1) : un fichier JSON par pays dans regions_data/, généré depuis
// Natural Earth 10m et simplifié. Voir regions_data/_index.json pour la liste
// des pays disponibles (slug + nombre de régions).
const REGIONS_DIR = "regions_data";
let REGIONS_INDEX = null; // chargé au démarrage : { "France": {slug:"france",count:101}, ... }

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const COUNTRY_FILL   = [0.16, 0.20, 0.27];   // gris-bleu neutre
const COUNTRY_HOVER  = [0.24, 0.30, 0.40];
const COUNTRY_SELECT = [0.95, 0.75, 0.25];   // doré sélection
const REGION_FILL    = [0.18, 0.23, 0.31];
const REGION_HOVER   = [0.27, 0.34, 0.45];

const ZOOM_REGION_THRESHOLD = 1.55; // zoom (camera.z plus petit = plus proche) sous lequel on tente les régions

/* ════════════════════════════════════════════════════════════
   ÉTAT GLOBAL
════════════════════════════════════════════════════════════ */
let renderer, scene, camera, globeGroup;
let countryMeshes = [];     // { mesh, name, feature }
let regionGroup = null;     // THREE.Group des régions du pays actuellement zoomé
let regionsCache = {};      // name -> array of region meshes (cache par pays)

let hoveredMesh = null;
let selectedMesh = null;
let zoomedCountry = null;   // nom du pays actuellement "zoomé" en régions

let rotX = 0.25, rotY = 0.3, velX = 0, velY = 0;
let isDragging = false, dragStartX = 0, dragStartY = 0, prevMouseX = 0, prevMouseY = 0;
let zoom = 2.5;
const raycaster = new THREE.Raycaster();

window.addEventListener("DOMContentLoaded", init);

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
async function init() {
  setupRenderer();
  setupScene();
  setupControls();
  try {
    await loadCountries();
    animate();
  } catch (e) {
    setLoadMsg("❌ " + e.message);
    console.error(e);
  }
}

/* ════════════════════════════════════════════════════════════
   THREE.JS SETUP
════════════════════════════════════════════════════════════ */
function setupRenderer() {
  const canvas = document.getElementById("globe-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x05070d, 1);
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

function setupScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 300);
  camera.position.z = zoom;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfafaff, 0.9);
  sun.position.set(5,3,5); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x334466, 0.35);
  fill.position.set(-4,-2,-4); scene.add(fill);

  // Étoiles discrètes
  const sp = [];
  for (let i=0;i<1000;i++){
    const v = new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1)
      .normalize().multiplyScalar(40+Math.random()*15);
    sp.push(v.x,v.y,v.z);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp,3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff,size:0.04,transparent:true,opacity:0.4})));

  // Sphère de base (gris foncé/noir)
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshPhongMaterial({ color:0x0c0f16, shininess:40, specular:0x222833 })
  ));

  // Halo très subtil
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.015, 48, 48),
    new THREE.MeshPhongMaterial({ color:0x3a4a66, transparent:true, opacity:0.05, side:THREE.FrontSide })
  ));

  globeGroup = new THREE.Group();
  scene.add(globeGroup);
}

/* ════════════════════════════════════════════════════════════
   GÉOMÉTRIE SPHÉRIQUE
════════════════════════════════════════════════════════════ */
function ll2v(lon, lat, r) {
  const phi   = (90-lat)*Math.PI/180;
  const theta = (lon+180)*Math.PI/180;
  return new THREE.Vector3(
    -r*Math.sin(phi)*Math.cos(theta),
     r*Math.cos(phi),
     r*Math.sin(phi)*Math.sin(theta)
  );
}

function triangulateRing(ring, r) {
  if (!ring || ring.length < 4) return [];
  let pts = ring.slice();
  const f=pts[0], l=pts[pts.length-1];
  if (Math.abs(f[0]-l[0])<1e-9 && Math.abs(f[1]-l[1])<1e-9) pts = pts.slice(0,-1);
  if (pts.length < 3) return [];

  let cx=0, cy=0;
  for (const [x,y] of pts) { cx+=x; cy+=y; }
  cx/=pts.length; cy/=pts.length;
  const cosy = Math.cos(cy*Math.PI/180);

  const flat = [];
  for (const [lon,lat] of pts) flat.push((lon-cx)*cosy, lat-cy);

  let indices;
  try { indices = earcut(flat); } catch(e) { return []; }

  const verts = [];
  for (let i=0;i<indices.length;i+=3){
    const a=pts[indices[i]], b=pts[indices[i+1]], c=pts[indices[i+2]];
    if (!a||!b||!c) continue;
    const va=ll2v(a[0],a[1],r), vb=ll2v(b[0],b[1],r), vc=ll2v(c[0],c[1],r);
    verts.push(va.x,va.y,va.z, vb.x,vb.y,vb.z, vc.x,vc.y,vc.z);
  }
  return verts;
}

function buildFillMesh(feature, color, radius) {
  radius = radius || 1.003;
  const geo = feature.geometry;
  const all = [];
  const proc = ring => { const v = triangulateRing(ring, radius); for (const x of v) all.push(x); };
  if (geo.type === "Polygon")      proc(geo.coordinates[0]);
  if (geo.type === "MultiPolygon") geo.coordinates.forEach(p => proc(p[0]));
  if (!all.length) return null;

  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.Float32BufferAttribute(all, 3));
  bg.computeVertexNormals();
  const col = new THREE.Color(color[0], color[1], color[2]);
  const mat = new THREE.MeshPhongMaterial({ color: col, shininess: 10, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(bg, mat);
  mesh.userData.baseColor = col.clone();
  return mesh;
}

function buildBorderLines(feature, radius, colorHex, opacity) {
  radius = radius || 1.0045;
  const geo = feature.geometry;
  const group = new THREE.Group();
  function ringToLine(ring) {
    if (!ring || ring.length < 2) return;
    const pts = ring.map(([lon,lat]) => ll2v(lon, lat, radius));
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(lg, new THREE.LineBasicMaterial({
      color: colorHex, transparent: true, opacity: opacity ?? 0.5
    })));
  }
  if (geo.type === "Polygon")      geo.coordinates.forEach(ringToLine);
  if (geo.type === "MultiPolygon") geo.coordinates.forEach(p => p.forEach(ringToLine));
  return group;
}

/* ════════════════════════════════════════════════════════════
   TOPOJSON
════════════════════════════════════════════════════════════ */
function topoFeatures(topo, objName) {
  const col = topojson.feature(topo, topo.objects[objName]);
  return col.features || [];
}

/* ════════════════════════════════════════════════════════════
   CHARGEMENT PAYS (au démarrage)
════════════════════════════════════════════════════════════ */
async function loadCountries() {
  setLoadMsg("Chargement des frontières mondiales…");
  const res = await fetch(URL_COUNTRIES);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const topo = await res.json();

  setLoadMsg("Construction des pays…");
  await tick();

  const features = topoFeatures(topo, "countries");
  const N = features.length;

  for (let i=0;i<N;i++){
    const feat = features[i];
    const name = feat.properties?.name || "";
    if (!name) continue;

    // Légère variation de gris pour distinguer les pays
    const jitter = (Math.random()-0.5)*0.03;
    const color = [
      clamp01(COUNTRY_FILL[0]+jitter),
      clamp01(COUNTRY_FILL[1]+jitter),
      clamp01(COUNTRY_FILL[2]+jitter)
    ];

    const mesh = buildFillMesh(feat, color, 1.003);
    if (!mesh) continue;
    mesh.userData = { name, feature: feat, type: "country" };
    globeGroup.add(mesh);

    const borders = buildBorderLines(feat, 1.0045, 0x070a10, 0.65);
    globeGroup.add(borders);

    countryMeshes.push(mesh);

    if (i % 25 === 0) await tick();
  }

  hideLoading();
}

/** Charge l'index des pays disponibles pour le mode régions (une fois) */
async function loadRegionsIndex() {
  if (REGIONS_INDEX) return REGIONS_INDEX;
  try {
    const res = await fetch(`${REGIONS_DIR}/_index.json`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    REGIONS_INDEX = await res.json();
  } catch (e) {
    console.warn("Index des régions indisponible :", e.message);
    REGIONS_INDEX = {};
  }
  return REGIONS_INDEX;
}

/** Construit (ou récupère du cache) les meshes de régions pour un pays donné */
async function getRegionsForCountry(countryName) {
  if (regionsCache[countryName]) return regionsCache[countryName];

  const index = await loadRegionsIndex();
  const entry = index[countryName];
  if (!entry) { regionsCache[countryName] = []; return []; }

  let geo;
  try {
    const res = await fetch(`${REGIONS_DIR}/${entry.slug}.json`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    geo = await res.json();
  } catch (e) {
    console.warn(`Régions indisponibles pour ${countryName} :`, e.message);
    regionsCache[countryName] = [];
    return [];
  }

  const meshes = [];
  for (const feat of (geo.features || [])) {
    const name = feat.properties?.name || "Région";
    const jitter = (Math.random()-0.5)*0.035;
    const color = [
      clamp01(REGION_FILL[0]+jitter),
      clamp01(REGION_FILL[1]+jitter),
      clamp01(REGION_FILL[2]+jitter)
    ];
    const mesh = buildFillMesh(feat, color, 1.004);
    if (!mesh) continue;
    mesh.userData = { name, feature: feat, type: "region", country: countryName };

    const borders = buildBorderLines(feat, 1.0055, 0x070a10, 0.55);

    meshes.push({ mesh, borders });
  }

  regionsCache[countryName] = meshes;
  return meshes;
}

/** Active l'affichage des régions pour un pays (masque le pays plein, affiche régions) */
async function enterRegionMode(countryMesh) {
  const name = countryMesh.userData.name;
  if (zoomedCountry === name) return;

  // Sortir de l'ancien mode régions si actif
  exitRegionMode();

  const regions = await getRegionsForCountry(name);
  if (!regions.length) return; // pas de données région → on reste en mode pays

  zoomedCountry = name;
  countryMesh.visible = false;

  regionGroup = new THREE.Group();
  for (const { mesh, borders } of regions) {
    regionGroup.add(mesh);
    regionGroup.add(borders);
  }
  globeGroup.add(regionGroup);

  setModeBadge(`${name} — régions`);
  const btn = document.getElementById("btn-back");
  if (btn) btn.style.display = "block";
}

function exitRegionMode() {
  if (regionGroup) {
    globeGroup.remove(regionGroup);
    regionGroup = null;
  }
  if (zoomedCountry) {
    const cm = countryMeshes.find(m => m.userData.name === zoomedCountry);
    if (cm) cm.visible = true;
  }
  zoomedCountry = null;
  setModeBadge("Vue mondiale — pays");
  const btn = document.getElementById("btn-back");
  if (btn) btn.style.display = "none";
}

/* ════════════════════════════════════════════════════════════
   INTERACTIONS
════════════════════════════════════════════════════════════ */
function setupControls() {
  const canvas  = document.getElementById("globe-canvas");
  const tooltip = document.getElementById("tooltip");

  canvas.addEventListener("mousedown", e => {
    isDragging = true;
    dragStartX = prevMouseX = e.clientX;
    dragStartY = prevMouseY = e.clientY;
    velX = velY = 0;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", e => {
    if (isDragging) {
      velX = (e.clientY - prevMouseY) * 0.004;
      velY = (e.clientX - prevMouseX) * 0.004;
      rotX += velX; rotY += velY;
      prevMouseX = e.clientX; prevMouseY = e.clientY;
      tooltip.style.display = "none";
      return;
    }

    const hit = raycastFirst(e);
    if (hit) {
      if (hoveredMesh && hoveredMesh !== hit.object && hoveredMesh !== selectedMesh) {
        resetMeshColor(hoveredMesh);
      }
      hoveredMesh = hit.object;
      if (hoveredMesh !== selectedMesh) applyHoverColor(hoveredMesh);

      tooltip.textContent = hit.object.userData.name;
      tooltip.style.display = "block";
      tooltip.style.left = e.clientX + 14 + "px";
      tooltip.style.top  = e.clientY - 28 + "px";
      canvas.style.cursor = "pointer";
    } else {
      if (hoveredMesh && hoveredMesh !== selectedMesh) resetMeshColor(hoveredMesh);
      hoveredMesh = null;
      tooltip.style.display = "none";
      canvas.style.cursor = "grab";
    }
  });

  window.addEventListener("mouseup", e => {
    const moved = Math.abs(e.clientX-dragStartX) + Math.abs(e.clientY-dragStartY);
    if (moved < 5) {
      const hit = raycastFirst(e);
      if (hit) selectFeature(hit.object);
    }
    isDragging = false;
    canvas.style.cursor = "grab";
  });

  canvas.addEventListener("wheel", e => {
    const prevZoom = zoom;
    zoom = clamp(zoom + e.deltaY * 0.003, 1.15, 6);
    camera.position.z = zoom;
    e.preventDefault();

    // Si on dézoome au-delà du seuil, sortir du mode régions
    if (zoom > ZOOM_REGION_THRESHOLD + 0.3 && zoomedCountry) {
      exitRegionMode();
    }
  }, { passive: false });

  document.getElementById("btn-zi").onclick = () => {
    zoom = Math.max(1.15, zoom - 0.3);
    camera.position.z = zoom;
  };
  document.getElementById("btn-zo").onclick = () => {
    zoom = Math.min(6, zoom + 0.3);
    camera.position.z = zoom;
    if (zoom > ZOOM_REGION_THRESHOLD + 0.3 && zoomedCountry) exitRegionMode();
  };
  document.getElementById("btn-back")?.addEventListener("click", () => {
    exitRegionMode();
    animateZoomTo(2.5);
  });

  // Touch
  let lastTouchDist = 0;
  canvas.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStartX = prevMouseX = e.touches[0].clientX;
      dragStartY = prevMouseY = e.touches[0].clientY;
      velX = velY = 0;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX-e.touches[1].clientX, dy = e.touches[0].clientY-e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx*dx+dy*dy);
    }
    e.preventDefault();
  }, { passive:false });

  canvas.addEventListener("touchmove", e => {
    if (e.touches.length === 1 && isDragging) {
      velX = (e.touches[0].clientY-prevMouseY)*0.004;
      velY = (e.touches[0].clientX-prevMouseX)*0.004;
      rotX += velX; rotY += velY;
      prevMouseX = e.touches[0].clientX; prevMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX-e.touches[1].clientX, dy = e.touches[0].clientY-e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx+dy*dy);
      zoom = clamp(zoom - (dist-lastTouchDist)*0.005, 1.15, 6);
      camera.position.z = zoom;
      lastTouchDist = dist;
    }
    e.preventDefault();
  }, { passive:false });

  canvas.addEventListener("touchend", e => {
    if (e.touches.length === 0) isDragging = false;
  });
}

function raycastFirst(e) {
  const canvas = document.getElementById("globe-canvas");
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX-rect.left)/canvas.width)*2-1,
    -((e.clientY-rect.top)/canvas.height)*2+1
  );
  raycaster.setFromCamera(mouse, camera);

  // Cible : si on est en mode régions, on raycast les régions, sinon les pays visibles
  const targets = zoomedCountry && regionGroup
    ? regionGroup.children.filter(c => c.type === "Mesh")
    : countryMeshes.filter(m => m.visible);

  const hits = raycaster.intersectObjects(targets);
  return hits.length ? hits[0] : null;
}

function applyHoverColor(mesh) {
  const isRegion = mesh.userData.type === "region";
  const hc = isRegion ? REGION_HOVER : COUNTRY_HOVER;
  mesh.material.color.setRGB(hc[0], hc[1], hc[2]);
}
function resetMeshColor(mesh) {
  const bc = mesh.userData.baseColor || mesh.material.color;
  mesh.material.color.copy(mesh.userData.baseColor);
}

function selectFeature(mesh) {
  if (selectedMesh && selectedMesh !== mesh) resetMeshColor(selectedMesh);
  selectedMesh = mesh;
  mesh.material.color.setRGB(COUNTRY_SELECT[0], COUNTRY_SELECT[1], COUNTRY_SELECT[2]);

  document.getElementById("p-name").textContent = mesh.userData.name;
  document.getElementById("p-sub").textContent = mesh.userData.type === "region"
    ? (mesh.userData.country + " · Région")
    : "Pays";

  // Clic sur un pays → zoom automatique + tentative de passage en mode régions
  if (mesh.userData.type === "country") {
    animateZoomTo(ZOOM_REGION_THRESHOLD - 0.15);
    enterRegionMode(mesh);
  }
}

/** Anime le zoom de la caméra vers une valeur cible */
function animateZoomTo(target) {
  const start = zoom;
  const duration = 600; // ms
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    zoom = start + (target - start) * eased;
    camera.position.z = zoom;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ════════════════════════════════════════════════════════════
   ANIMATION
════════════════════════════════════════════════════════════ */
function animate() {
  requestAnimationFrame(animate);

  if (!isDragging) {
    velX *= 0.92; velY *= 0.92;
    rotX += velX; rotY += velY;
    if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) rotY += 0.0006;
  }
  rotX = clamp(rotX, -Math.PI/2, Math.PI/2);
  globeGroup.rotation.x = rotX;
  globeGroup.rotation.y = rotY;

  renderer.render(scene, camera);
}

/* ════════════════════════════════════════════════════════════
   UI HELPERS
════════════════════════════════════════════════════════════ */
function setLoadMsg(t) { const e=document.getElementById("load-msg"); if(e) e.textContent=t; }
function hideLoading() {
  const e = document.getElementById("loading");
  if (e) { e.classList.add("hidden"); setTimeout(()=>e.style.display="none", 450); }
}
function setModeBadge(t) { const e=document.getElementById("mode-badge"); if(e) e.textContent=t; }
function tick() { return new Promise(r => setTimeout(r, 0)); }

/* ════════════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════════════ */
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function clamp01(v){ return clamp(v,0,1); }

})();
