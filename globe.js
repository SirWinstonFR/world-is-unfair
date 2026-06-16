/**
 * globe.js — Globe 2050 v4
 * - Earcut intégré (triangulation correcte, pas de distorsion)
 * - Lignes de frontières visibles entre pays
 * - Mode régions via Natural Earth admin-1
 */

(function () {
"use strict";

/* ══════════════════════════════════════════════════════
   EARCUT — algorithme de triangulation de polygones 2D
   (port minimal de https://github.com/mapbox/earcut)
══════════════════════════════════════════════════════ */
function earcut(data, holeIndices, dim) {
  dim = dim || 2;
  var hasHoles = holeIndices && holeIndices.length, outerLen = hasHoles ? holeIndices[0] * dim : data.length,
    outerNode = linkedList(data, 0, outerLen, dim, true), triangles = [];
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
    invSize = Math.max(maxX - minX, maxY - minY); invSize = invSize !== 0 ? 32767 / invSize : 0;
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
      if (!pass) { earcutLinked(filterPoints(ear, null), triangles, dim, minX, minY, invSize, 1); }
      else if (pass === 1) {
        ear = cureLocalIntersections(filterPoints(ear, null), triangles, dim);
        earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);
      } else if (pass === 2) { splitEarcut(ear, triangles, dim, minX, minY, invSize); }
      break;
    }
  }
}
function isEar(ear) {
  var a = ear.prev, b = ear, c = ear.next;
  if (area(a, b, c) >= 0) return false;
  var ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;
  var x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
    y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
    x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
    y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);
  var p = c.next;
  while (p !== a) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
    p = p.next;
  }
  return true;
}
function isEarHashed(ear, minX, minY, invSize) {
  var a = ear.prev, b = ear, c = ear.next;
  if (area(a, b, c) >= 0) return false;
  var ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;
  var x0 = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx),
    y0 = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy),
    x1 = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx),
    y1 = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);
  var minZ = zOrder(x0, y0, minX, minY, invSize), maxZ = zOrder(x1, y1, minX, minY, invSize);
  var p = ear.prevZ, n = ear.nextZ;
  while (p && p.z >= minZ && n && n.z <= maxZ) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
    p = p.prevZ;
    if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c && pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
    n = n.nextZ;
  }
  while (p && p.z >= minZ) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
    p = p.prevZ;
  }
  while (n && n.z <= maxZ) {
    if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c && pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
    n = n.nextZ;
  }
  return true;
}
function cureLocalIntersections(start, triangles, dim) {
  var p = start;
  do {
    var a = p.prev, b = p.next.next;
    if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {
      triangles.push(a.i / dim | 0, p.i / dim | 0, b.i / dim | 0);
      removeNode(p); removeNode(p.next); p = start = b;
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
  var queue = [], i, len, start, end, list;
  for (i = 0, len = holeIndices.length; i < len; i++) {
    start = holeIndices[i] * dim; end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
    list = linkedList(data, start, end, dim, false);
    if (list === list.next) list.steiner = true;
    queue.push(getLeftmost(list));
  }
  queue.sort(compareX);
  for (i = 0; i < queue.length; i++) outerNode = eliminateHole(queue[i], outerNode);
  return outerNode;
}
function compareX(a, b) { return a.x - b.x; }
function eliminateHole(hole, outerNode) {
  var bridge = findHoleBridge(hole, outerNode);
  if (!bridge) return outerNode;
  var bridgeReverse = splitPolygon(bridge, hole);
  filterPoints(bridgeReverse, bridgeReverse.next);
  return filterPoints(bridge, bridge.next);
}
function findHoleBridge(hole, outerNode) {
  var p = outerNode, hx = hole.x, hy = hole.y, qx = -Infinity, m;
  do {
    if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
      var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
      if (x <= hx && x > qx) { qx = x; m = p.x < p.next.x ? p : p.next; if (x === hx) return m; }
    }
    p = p.next;
  } while (p !== outerNode);
  if (!m) return null;
  var stop = m, mx = m.x, my = m.y, tanMin = Infinity, tan;
  p = m;
  do {
    if (hx >= p.x && p.x >= mx && hx !== p.x && pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
      tan = Math.abs(hy - p.y) / (hx - p.x);
      if (locallyInside(p, hole) && (tan < tanMin || (tan === tanMin && (p.x > m.x || (p.x === m.x && sectorContainsSector(m, p)))))) { m = p; tanMin = tan; }
    }
    p = p.next;
  } while (p !== stop);
  return m;
}
function sectorContainsSector(m, p) { return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0; }
function indexCurve(start, minX, minY, invSize) {
  var p = start;
  do { if (p.z === 0) p.z = zOrder(p.x, p.y, minX, minY, invSize); p.prevZ = p.prev; p.nextZ = p.next; p = p.next; } while (p !== start);
  p.prevZ.nextZ = null; p.prevZ = null; sortLinked(p);
}
function sortLinked(list) {
  var i, p, q, e, tail, numMerges, pSize, qSize, inSize = 1;
  do {
    p = list; list = null; tail = null; numMerges = 0;
    while (p) {
      numMerges++; q = p; pSize = 0;
      for (i = 0; i < inSize; i++) { pSize++; q = q.nextZ; if (!q) break; }
      qSize = inSize;
      while (pSize > 0 || (qSize > 0 && q)) {
        if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) { e = p; p = p.nextZ; pSize--; } else { e = q; q = q.nextZ; qSize--; }
        if (tail) tail.nextZ = e; else list = e; e.prevZ = tail; tail = e;
      }
      p = q;
    }
    tail.nextZ = null; inSize *= 2;
  } while (numMerges > 1);
  return list;
}
function zOrder(x, y, minX, minY, invSize) {
  x = (x - minX) * invSize | 0; y = (y - minY) * invSize | 0;
  x = (x | (x << 8)) & 0x00FF00FF; x = (x | (x << 4)) & 0x0F0F0F0F; x = (x | (x << 2)) & 0x33333333; x = (x | (x << 1)) & 0x55555555;
  y = (y | (y << 8)) & 0x00FF00FF; y = (y | (y << 4)) & 0x0F0F0F0F; y = (y | (y << 2)) & 0x33333333; y = (y | (y << 1)) & 0x55555555;
  return x | (y << 1);
}
function getLeftmost(start) { var p = start, leftmost = start; do { if (p.x < leftmost.x || (p.x === leftmost.x && p.y < leftmost.y)) leftmost = p; p = p.next; } while (p !== start); return leftmost; }
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) { return (cx - px) * (ay - py) >= (ax - px) * (cy - py) && (ax - px) * (by - py) >= (bx - px) * (ay - py) && (bx - px) * (cy - py) >= (cx - px) * (by - py); }
function isValidDiagonal(a, b) { return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) && (locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b) && (area(a.prev, a, b.prev) || area(a, b.prev, b)) || equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0); }
function area(p, q, r) { return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y); }
function equals(p1, p2) { return p1.x === p2.x && p1.y === p2.y; }
function intersects(p1, q1, p2, q2) { var o1 = sign(area(p1, q1, p2)), o2 = sign(area(p1, q1, q2)), o3 = sign(area(p2, q2, p1)), o4 = sign(area(p2, q2, q1)); if (o1 !== o2 && o3 !== o4) return true; if (o1 === 0 && onSegment(p1, p2, q1)) return true; if (o2 === 0 && onSegment(p1, q2, q1)) return true; if (o3 === 0 && onSegment(p2, p1, q2)) return true; if (o4 === 0 && onSegment(p2, q1, q2)) return true; return false; }
function onSegment(p, q, r) { return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y); }
function sign(num) { return num > 0 ? 1 : num < 0 ? -1 : 0; }
function intersectsPolygon(a, b) { var p = a; do { if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i && intersects(p, p.next, a, b)) return true; p = p.next; } while (p !== a); return false; }
function locallyInside(a, b) { return area(a.prev, a, a.next) < 0 ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0; }
function middleInside(a, b) { var p = a, inside = false, px = (a.x + b.x) / 2, py = (a.y + b.y) / 2; do { if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y && (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x)) inside = !inside; p = p.next; } while (p !== a); return inside; }
function splitPolygon(a, b) { var a2 = createNode(a.i, a.x, a.y), b2 = createNode(b.i, b.x, b.y), an = a.next, bp = b.prev; a.next = b; b.prev = a; a2.next = an; an.prev = a2; b2.next = a2; a2.prev = b2; bp.next = b2; b2.prev = bp; return b2; }
function insertNode(i, x, y, last) { var p = createNode(i, x, y); if (!last) { p.prev = p; p.next = p; } else { p.next = last.next; p.prev = last; last.next.prev = p; last.next = p; } return p; }
function removeNode(p) { p.next.prev = p.prev; p.prev.next = p.next; if (p.prevZ) p.prevZ.nextZ = p.nextZ; if (p.nextZ) p.nextZ.prevZ = p.prevZ; }
function createNode(i, x, y) { return { i, x, y, prev: null, next: null, z: 0, prevZ: null, nextZ: null, steiner: false }; }
function signedArea(data, start, end, dim) { var sum = 0; for (var i = start, j = end - dim; i < end; i += dim) { sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]); j = i; } return sum; }
/* ══ FIN EARCUT ══ */


/* ══════════════════════════════════════════════════════
   CONFIGURATION
══════════════════════════════════════════════════════ */
const TOPO_URL     = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const TOPO_URL_50  = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
// Admin-1 (provinces/régions) — Natural Earth via GitHub
const ADMIN1_URL   = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

const RISK_COLORS = {
  3: [0.68, 0.08, 0.04],
  2: [0.70, 0.38, 0.04],
  1: [0.12, 0.38, 0.22],
  0: [0.10, 0.32, 0.56],
};
const RISK_LABELS  = ["🛡️ Pays résilient","✅ Risque modéré","⚡ Risque ÉLEVÉ","⚠️ Risque CRITIQUE — Submersion"];
const RISK_CLASSES = ["risk-0","risk-1","risk-2","risk-3"];

/* ══════════════════════════════════════════════════════
   ÉTAT
══════════════════════════════════════════════════════ */
let renderer, scene, camera, globeGroup;
let countryMeshes = [], countryLines = [];
let regionMeshes  = [], regionLines  = [];
let floodMeshes   = [];
let selectedMesh  = null;
let currentMode   = "countries";
let regionsLoaded = false;

let rotX = 0.3, rotY = 0.4, velX = 0, velY = 0;
let isDragging = false, dragStartX = 0, dragStartY = 0, prevMouseX = 0, prevMouseY = 0;
let zoom = 2.5;
const raycaster = new THREE.Raycaster();

window.addEventListener("DOMContentLoaded", init);

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
async function init() {
  setupRenderer();
  setupScene();
  setupControls();
  setupModeToggle();
  try {
    await loadCountries();
    animate();
  } catch(e) {
    setLoadMsg("❌ " + e.message);
    console.error(e);
  }
}

/* ══════════════════════════════════════════════════════
   THREE.JS
══════════════════════════════════════════════════════ */
function setupRenderer() {
  const canvas = document.getElementById("globe-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x030a18, 1);
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

function setupScene() {
  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 300);
  camera.position.z = zoom;

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const sun = new THREE.DirectionalLight(0xfff0e0, 1.0);
  sun.position.set(5, 3, 5); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x223366, 0.3);
  fill.position.set(-4, -2, -4); scene.add(fill);

  // Étoiles
  const sp = [];
  for (let i = 0; i < 1600; i++) {
    const v = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1)
      .normalize().multiplyScalar(40 + Math.random()*15);
    sp.push(v.x, v.y, v.z);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color:0xffffff, size:0.05, transparent:true, opacity:0.5 })));

  // Océan
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1, 72, 72),
    new THREE.MeshPhongMaterial({ color:0x071d3d, shininess:85, specular:0x1a4f88 })
  ));
  // Atmosphère
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.018, 56, 56),
    new THREE.MeshPhongMaterial({ color:0x2299ee, transparent:true, opacity:0.055, side:THREE.FrontSide })
  ));

  globeGroup = new THREE.Group();
  scene.add(globeGroup);
}

/* ══════════════════════════════════════════════════════
   GÉOMÉTRIE
══════════════════════════════════════════════════════ */
function ll2v(lon, lat, r) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Triangulation d'un ring avec earcut.
 * On projette localement en 2D (Lambert azimutal approximé),
 * on triangule, puis on reprojecte sur la sphère.
 */
function triangulateRing(ring, r) {
  if (!ring || ring.length < 4) return [];

  // Fermer si besoin
  let pts = ring.slice();
  const f = pts[0], l = pts[pts.length-1];
  if (Math.abs(f[0]-l[0]) < 1e-9 && Math.abs(f[1]-l[1]) < 1e-9) pts = pts.slice(0,-1);
  if (pts.length < 3) return [];

  // Centroïde
  let cx = 0, cy = 0;
  for (const [x,y] of pts) { cx += x; cy += y; }
  cx /= pts.length; cy /= pts.length;
  const cosy = Math.cos(cy * Math.PI / 180);

  // Projection 2D locale
  const flat = [];
  for (const [lon, lat] of pts) {
    flat.push((lon - cx) * cosy, lat - cy);
  }

  // Earcut
  let indices;
  try { indices = earcut(flat); }
  catch(e) { return []; }

  // Reprojecter sur sphère
  const verts = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = pts[indices[i]],   b = pts[indices[i+1]], c = pts[indices[i+2]];
    if (!a || !b || !c) continue;
    const va = ll2v(a[0], a[1], r);
    const vb = ll2v(b[0], b[1], r);
    const vc = ll2v(c[0], c[1], r);
    verts.push(va.x,va.y,va.z, vb.x,vb.y,vb.z, vc.x,vc.y,vc.z);
  }
  return verts;
}

/** Construit le mesh rempli d'un pays */
function buildFillMesh(feature, r, g, b, radius) {
  radius = radius || 1.002;
  const geo = feature.geometry;
  const all = [];
  const proc = ring => { const v = triangulateRing(ring, radius); for (const x of v) all.push(x); };
  if (geo.type === "Polygon")      proc(geo.coordinates[0]);
  if (geo.type === "MultiPolygon") geo.coordinates.forEach(p => proc(p[0]));
  if (!all.length) return null;
  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.Float32BufferAttribute(all, 3));
  bg.computeVertexNormals();
  const col = new THREE.Color(r, g, b);
  const mat = new THREE.MeshPhongMaterial({ color:col, shininess:12, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(bg, mat);
  mesh.userData.baseColor = col.clone();
  return mesh;
}

/** Construit les lignes de frontière d'un pays */
function buildBorderLines(feature, radius, color) {
  radius = radius || 1.004;
  color  = color  || 0x000000;
  const geo = feature.geometry;
  const lines = [];

  function ringToLine(ring) {
    if (!ring || ring.length < 2) return;
    const pts = [];
    for (const [lon, lat] of ring) pts.push(ll2v(lon, lat, radius));
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    lines.push(new THREE.Line(lg, new THREE.LineBasicMaterial({ color, transparent:true, opacity:0.55 })));
  }

  if (geo.type === "Polygon")      geo.coordinates.forEach(ringToLine);
  if (geo.type === "MultiPolygon") geo.coordinates.forEach(p => p.forEach(ringToLine));
  return lines;
}

/** Overlay zones inondées */
function buildFloodOverlay(feature, pct) {
  if (!pct || pct <= 0) return null;
  const geo = feature.geometry;
  const all = [];
  const proc = ring => { const v = triangulateRing(ring, 1.006); for (const x of v) all.push(x); };
  if (geo.type === "Polygon")      proc(geo.coordinates[0]);
  if (geo.type === "MultiPolygon") geo.coordinates.forEach(p => proc(p[0]));
  if (!all.length) return null;
  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.Float32BufferAttribute(all, 3));
  bg.computeVertexNormals();
  const opacity = Math.min(0.72, 0.18 + (pct/100)*0.54);
  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0.04, 0.18, 0.52),
    transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false
  });
  return new THREE.Mesh(bg, mat);
}

/* ══════════════════════════════════════════════════════
   DÉCODAGE TOPOJSON
══════════════════════════════════════════════════════ */
function topoFeatures(topo, name) {
  const col = topojson.feature(topo, topo.objects[name]);
  return col.features || [];
}

/* ══════════════════════════════════════════════════════
   CHARGEMENT PAYS
══════════════════════════════════════════════════════ */
async function loadCountries() {
  setLoadMsg("Chargement des frontières…"); setLoadBar(5);
  const res = await fetch(TOPO_URL_50);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const topo = await res.json();

  setLoadMsg("Triangulation des pays…"); setLoadBar(15);
  await tick();

  const features = topoFeatures(topo, "countries");
  const N = features.length;

  for (let i = 0; i < N; i++) {
    const feat = features[i];
    const name = feat.properties?.name || "";
    const data = (window.COUNTRIES||{})[name] || null;

    // Couleur risque
    let r, g, b;
    if (data) {
      const c = RISK_COLORS[data.flood];
      r = c01(c[0]+(Math.random()-.5)*.06);
      g = c01(c[1]+(Math.random()-.5)*.06);
      b = c01(c[2]+(Math.random()-.5)*.06);
    } else { r=0.14; g=0.40; b=0.26; }

    // Mesh rempli
    const mesh = buildFillMesh(feat, r, g, b, 1.002);
    if (mesh) {
      mesh.userData = { name, data, type:"country" };
      globeGroup.add(mesh);
      countryMeshes.push(mesh);
    }

    // Lignes de frontière noires fines
    const lines = buildBorderLines(feat, 1.0035, 0x000000);
    for (const l of lines) {
      l.userData = { type:"border" };
      globeGroup.add(l);
      countryLines.push(l);
    }

    // Overlay inondation
    if (data && data.flood >= 2) {
      const pct = data.flood_pct || data.flood * 8;
      const fm = buildFloodOverlay(feat, pct);
      if (fm) { fm.userData = { type:"flood", name }; globeGroup.add(fm); floodMeshes.push(fm); }
    }

    if (i % 10 === 0) { setLoadBar(15 + Math.round((i/N)*78)); await tick(); }
  }

  setLoadBar(100); setLoadMsg("Globe 2050 prêt !"); await tick();
  hideLoading();
}

/* ══════════════════════════════════════════════════════
   CHARGEMENT RÉGIONS
══════════════════════════════════════════════════════ */
async function loadRegions() {
  if (regionsLoaded) return;
  showLoading(); setLoadMsg("Chargement des régions…"); setLoadBar(5); await tick();

  try {
    // Utilise countries-110m pour les pays + REGIONS data pour la couleur
    const res = await fetch(TOPO_URL_50);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const topo = await res.json();
    const features = topoFeatures(topo, "countries");

    setLoadMsg("Application des données régionales…"); setLoadBar(25); await tick();
    const N = features.length;

    for (let i = 0; i < N; i++) {
      const feat = features[i];
      const name = feat.properties?.name || "";

      // Récupérer les entrées REGIONS pour ce pays
      const regEntries = Object.entries(window.REGIONS||{})
        .filter(([,d]) => d.country === name);

      let r, g, b;
      if (regEntries.length > 0) {
        const avg = Math.round(regEntries.reduce((s,[,d])=>s+d.flood,0) / regEntries.length);
        const c = RISK_COLORS[avg];
        r=c01(c[0]+(Math.random()-.5)*.05);
        g=c01(c[1]+(Math.random()-.5)*.05);
        b=c01(c[2]+(Math.random()-.5)*.05);
      } else {
        const data = (window.COUNTRIES||{})[name];
        const c = data ? RISK_COLORS[data.flood] : [0.14,0.40,0.26];
        r=c01(c[0]); g=c01(c[1]); b=c01(c[2]);
      }

      const mesh = buildFillMesh(feat, r, g, b, 1.002);
      if (mesh) {
        mesh.userData = {
          name, data:(window.COUNTRIES||{})[name]||null,
          regionData: regEntries[0]?.[1]||null, type:"region"
        };
        mesh.visible = false;
        globeGroup.add(mesh);
        regionMeshes.push(mesh);
      }

      // Frontières régions
      const lines = buildBorderLines(feat, 1.0035, 0x111111);
      for (const l of lines) {
        l.userData = { type:"rborder" };
        l.visible = false;
        globeGroup.add(l);
        regionLines.push(l);
      }

      if (i % 10 === 0) { setLoadBar(25 + Math.round((i/N)*70)); await tick(); }
    }

    regionsLoaded = true;
    setLoadBar(100); hideLoading();
  } catch(err) {
    console.error(err);
    setLoadMsg("⚠️ Erreur — mode pays conservé.");
    await new Promise(r=>setTimeout(r,1800));
    hideLoading();
    switchMode("countries");
  }
}

/* ══════════════════════════════════════════════════════
   MODE TOGGLE
══════════════════════════════════════════════════════ */
async function switchMode(mode) {
  if (mode === currentMode) return;
  currentMode = mode;
  document.querySelectorAll(".mode-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById(mode==="countries"?"btn-countries":"btn-regions")?.classList.add("active");

  if (mode === "regions") {
    if (!regionsLoaded) await loadRegions();
    countryMeshes.forEach(m=>m.visible=false);
    countryLines.forEach(m=>m.visible=false);
    regionMeshes.forEach(m=>m.visible=true);
    regionLines.forEach(m=>m.visible=true);
  } else {
    regionMeshes.forEach(m=>m.visible=false);
    regionLines.forEach(m=>m.visible=false);
    countryMeshes.forEach(m=>m.visible=true);
    countryLines.forEach(m=>m.visible=true);
  }
  floodMeshes.forEach(m=>m.visible=true);
  clearPanel();
}

/* ══════════════════════════════════════════════════════
   PANNEAU
══════════════════════════════════════════════════════ */
function showCountryPanel(name, data) {
  document.getElementById("p-name").textContent = (data?.flag||"🌍")+" "+name;
  document.getElementById("p-sub").textContent  = data?.subregion||data?.region||"";
  if (!data) { document.getElementById("p-body").innerHTML=`<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:6px;">Aucune donnée disponible.</p>`; return; }
  const gdp2050  = Math.round(data.gdp*(1-data.perte_gdp/100));
  const refugees = Math.round(data.pop*data.perte_pop/100*10)/10;
  const fp       = data.flood_pct||data.flood*8;
  const cls      = RISK_CLASSES[data.flood];
  const label    = RISK_LABELS[data.flood];
  const resHtml  = Object.entries(data.res||{}).map(([k,v])=>{
    const hue = Math.round(160+v*.8);
    return `<div class="bar-label"><span>${k}</span><span>${v}/100</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width:${v}%;background:hsl(${hue},42%,44%)"></div></div>`;
  }).join("");
  const floodHtml = fp>0?`<div class="flood-zone">🌊 <b>${fp}%</b> du territoire potentiellement inondé en 2050</div>`:"";
  document.getElementById("p-body").innerHTML=`
    <div class="risk-badge ${cls}">${label}</div>${floodHtml}
    <div class="sec">Géographie</div>
    <div class="row"><span>Capitale</span><b>${data.capital}</b></div>
    <div class="row"><span>Population</span><b>${data.pop}M</b></div>
    <div class="sec">Économie 2050</div>
    <div class="row"><span>PIB actuel</span><b>${data.gdp.toLocaleString()}Md$</b></div>
    <div class="row"><span>PIB 2050</span><b style="color:${data.perte_gdp>15?"#ff6060":"#ffaa40"}">${gdp2050.toLocaleString()}Md$</b></div>
    <div class="row"><span>Perte PIB</span><b style="color:#ff9050">−${data.perte_gdp}%</b></div>
    <div class="row"><span>Réfugiés</span><b>${refugees}M</b></div>
    <div class="sec">Ressources 2050</div>${resHtml}
    <div class="note">${data.note}</div>`;
}

function showRegionPanel(name, rd, cd) {
  document.getElementById("p-name").textContent = (cd?.flag||"🌍")+" "+name;
  document.getElementById("p-sub").textContent  = rd?rd.country+" · Région":(cd?.subregion||"");
  if (!rd && !cd) { document.getElementById("p-body").innerHTML=`<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:6px;">Aucune donnée disponible.</p>`; return; }
  const flood = rd?.flood??cd?.flood??0;
  const fp    = rd?.flood_pct||0;
  const note  = rd?.note||cd?.note||"";
  document.getElementById("p-body").innerHTML=`
    <div class="risk-badge ${RISK_CLASSES[flood]}">${RISK_LABELS[flood]}</div>
    ${fp>0?`<div class="flood-zone">🌊 <b>${fp}%</b> du territoire inondé en 2050</div>`:""}
    ${note?`<div class="note">${note}`:""}</div>`;
}

function clearPanel() {
  document.getElementById("p-name").textContent="🌍 Globe 2050";
  document.getElementById("p-sub").textContent="Scénario climatique";
  document.getElementById("p-body").innerHTML=`<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:4px;">Cliquez sur un pays ou une région.</p>`;
}

/* ══════════════════════════════════════════════════════
   RAYCASTING
══════════════════════════════════════════════════════ */
function doRaycast(cx, cy) {
  const canvas = document.getElementById("globe-canvas");
  const rect   = canvas.getBoundingClientRect();
  const mouse  = new THREE.Vector2(
    ((cx-rect.left)/canvas.width)*2-1,
    -((cy-rect.top)/canvas.height)*2+1
  );
  raycaster.setFromCamera(mouse, camera);
  const meshes = (currentMode==="countries" ? countryMeshes : regionMeshes)
    .filter(m=>m.visible);
  const hits = raycaster.intersectObjects([...meshes, ...floodMeshes.filter(m=>m.visible)]);
  return hits.length ? hits[0] : null;
}

function selectFeature(mesh) {
  if (selectedMesh?.material) selectedMesh.material.emissive?.set(0,0,0);
  selectedMesh = mesh;
  mesh.material.emissive?.set(0.28, 0.24, 0.06);
  const ud = mesh.userData;
  if (ud.type==="country") showCountryPanel(ud.name, ud.data);
  else if (ud.type==="region") {
    const rd = (window.REGIONS||{})[ud.name]||ud.regionData||null;
    showRegionPanel(ud.name, rd, ud.data);
  }
}

/* ══════════════════════════════════════════════════════
   CONTRÔLES
══════════════════════════════════════════════════════ */
function setupControls() {
  const canvas  = document.getElementById("globe-canvas");
  const tooltip = document.getElementById("tooltip");

  canvas.addEventListener("mousedown", e=>{
    isDragging=true; dragStartX=prevMouseX=e.clientX; dragStartY=prevMouseY=e.clientY;
    velX=velY=0; canvas.style.cursor="grabbing";
  });
  window.addEventListener("mousemove", e=>{
    if (isDragging) {
      velX=(e.clientY-prevMouseY)*.004; velY=(e.clientX-prevMouseX)*.004;
      rotX+=velX; rotY+=velY; prevMouseX=e.clientX; prevMouseY=e.clientY;
      tooltip.style.display="none"; return;
    }
    const hit=doRaycast(e.clientX,e.clientY);
    if (hit && hit.object.userData.type!=="flood") {
      const d=hit.object.userData.data;
      tooltip.textContent=(d?.flag||"🌍")+" "+hit.object.userData.name+(d?` · −${d.perte_gdp}% PIB`:"");
      tooltip.style.display="block";
      tooltip.style.left=e.clientX+14+"px";
      tooltip.style.top=e.clientY-32+"px";
      canvas.style.cursor="pointer";
    } else { tooltip.style.display="none"; canvas.style.cursor="grab"; }
  });
  window.addEventListener("mouseup", e=>{
    const moved=Math.abs(e.clientX-dragStartX)+Math.abs(e.clientY-dragStartY);
    if (moved<5) {
      const hit=doRaycast(e.clientX,e.clientY);
      if (hit && hit.object.userData.type!=="flood") selectFeature(hit.object);
    }
    isDragging=false; canvas.style.cursor="grab";
  });
  canvas.addEventListener("wheel", e=>{
    zoom=Math.max(1.3,Math.min(8,zoom+e.deltaY*.003));
    camera.position.z=zoom; e.preventDefault();
  },{passive:false});
  document.getElementById("btn-zi").onclick=()=>{ zoom=Math.max(1.3,zoom-.35); camera.position.z=zoom; };
  document.getElementById("btn-zo").onclick=()=>{ zoom=Math.min(8,zoom+.35);   camera.position.z=zoom; };

  // Touch
  let ld=0;
  canvas.addEventListener("touchstart",e=>{
    if(e.touches.length===1){isDragging=true;dragStartX=prevMouseX=e.touches[0].clientX;dragStartY=prevMouseY=e.touches[0].clientY;velX=velY=0;}
    else if(e.touches.length===2){isDragging=false;const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;ld=Math.sqrt(dx*dx+dy*dy);}
    e.preventDefault();
  },{passive:false});
  canvas.addEventListener("touchmove",e=>{
    if(e.touches.length===1&&isDragging){velX=(e.touches[0].clientY-prevMouseY)*.004;velY=(e.touches[0].clientX-prevMouseX)*.004;rotX+=velX;rotY+=velY;prevMouseX=e.touches[0].clientX;prevMouseY=e.touches[0].clientY;}
    else if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const d=Math.sqrt(dx*dx+dy*dy);zoom=Math.max(1.3,Math.min(8,zoom-(d-ld)*.005));camera.position.z=zoom;ld=d;}
    e.preventDefault();
  },{passive:false});
  canvas.addEventListener("touchend",e=>{if(!e.touches.length)isDragging=false;});
}

function setupModeToggle() {
  document.getElementById("btn-countries")?.addEventListener("click",()=>switchMode("countries"));
  document.getElementById("btn-regions")?.addEventListener("click",  ()=>switchMode("regions"));
}

/* ══════════════════════════════════════════════════════
   ANIMATION
══════════════════════════════════════════════════════ */
function animate() {
  requestAnimationFrame(animate);
  if (!isDragging) {
    velX*=.91; velY*=.91; rotX+=velX; rotY+=velY;
    if (Math.abs(velX)<.0001&&Math.abs(velY)<.0001) rotY+=.0007;
  }
  rotX=Math.max(-Math.PI/2,Math.min(Math.PI/2,rotX));
  globeGroup.rotation.x=rotX; globeGroup.rotation.y=rotY;
  renderer.render(scene,camera);
}

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function setLoadMsg(t){const e=document.getElementById("load-msg");if(e)e.textContent=t;}
function setLoadBar(p){const e=document.getElementById("load-bar");if(e)e.style.width=p+"%";}
function showLoading(){const e=document.getElementById("loading");if(e){e.style.display="flex";e.classList.remove("hidden");e.style.opacity="1";}}
function hideLoading(){const e=document.getElementById("loading");if(e){e.classList.add("hidden");setTimeout(()=>e.style.display="none",500);}}
function tick(){return new Promise(r=>setTimeout(r,0));}
function c01(v){return Math.max(0,Math.min(1,v));}

})();
