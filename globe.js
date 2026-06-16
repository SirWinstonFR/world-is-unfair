/**
 * globe.js
 * Globe 3D interactif — Scénario climatique 2050
 *
 * Dépendances (chargées dans index.html) :
 *   - Three.js r128
 *   - countries.js  (window.COUNTRIES)
 *
 * Architecture :
 *   1. Setup Three.js (scène, caméra, renderer)
 *   2. Décors (étoiles, océan, atmosphère)
 *   3. Chargement TopoJSON → construction des meshes pays
 *   4. Interactions (drag, zoom, clic, tooltip)
 *   5. Boucle d'animation
 */

(function () {
  "use strict";

  // ── 0. Attendre que le DOM soit prêt ──────────────────────────────────────
  window.addEventListener("DOMContentLoaded", init);

  // ── Constantes ─────────────────────────────────────────────────────────────
  const TOPO_URL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  // Couleur selon niveau de risque inondation
  function floodColor(level) {
    switch (level) {
      case 3: return new THREE.Color(0.72, 0.10, 0.04); // rouge  — critique
      case 2: return new THREE.Color(0.75, 0.42, 0.04); // orange — élevé
      case 1: return new THREE.Color(0.14, 0.42, 0.26); // vert   — modéré
      default:return new THREE.Color(0.12, 0.36, 0.60); // bleu   — résilient
    }
  }

  // Classe de risque pour le badge CSS
  function riskClass(level) {
    return ["safe", "moderate", "high", "critical"][level] || "safe";
  }

  // Libellé de risque
  function riskLabel(level) {
    return [
      "🛡️ Pays résilient",
      "✅ Risque modéré",
      "⚡ Risque ÉLEVÉ",
      "⚠️ Risque CRITIQUE — Submersion",
    ][level] || "—";
  }

  // ── 1. Variables globales du module ────────────────────────────────────────
  let renderer, scene, camera;
  let globeGroup;
  let allMeshes = [];
  let selectedMesh = null;

  // Rotation / zoom
  let rotX = 0.3, rotY = 0;
  let velX = 0,   velY = 0;
  let isDragging = false;
  let prevMouseX = 0, prevMouseY = 0;
  let zoom = 2.5;

  // ── 2. Point d'entrée ──────────────────────────────────────────────────────
  function init() {
    setupRenderer();
    setupScene();
    setupControls();
    loadGlobe();
  }

  // ── 3. Setup Three.js ──────────────────────────────────────────────────────
  function setupRenderer() {
    const canvas = document.getElementById("globe-canvas");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x030a18, 1);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function setupScene() {
    scene = new THREE.Scene();

    // Caméra
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      200
    );
    camera.position.z = zoom;

    // Lumières
    scene.add(new THREE.AmbientLight(0xffffff, 0.50));
    const sun = new THREE.DirectionalLight(0xfff0e0, 1.0);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x223355, 0.35);
    fill.position.set(-4, -2, -4);
    scene.add(fill);

    // Étoiles
    addStars();

    // Océan
    const ocean = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x071d3d,
        shininess: 90,
        specular: 0x1a4f88,
      })
    );
    scene.add(ocean);

    // Halo atmosphérique
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(1.018, 48, 48),
      new THREE.MeshPhongMaterial({
        color: 0x2288dd,
        transparent: true,
        opacity: 0.065,
        side: THREE.FrontSide,
      })
    );
    scene.add(atm);

    // Groupe qui tourne
    globeGroup = new THREE.Group();
    scene.add(globeGroup);
  }

  function addStars() {
    const positions = [];
    for (let i = 0; i < 1600; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      )
        .normalize()
        .multiplyScalar(40 + Math.random() * 20);
      positions.push(v.x, v.y, v.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    scene.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.055,
          transparent: true,
          opacity: 0.6,
        })
      )
    );
  }

  // ── 4. TopoJSON → GeoJSON ──────────────────────────────────────────────────
  function topoToGeoFeatures(topo) {
    const arcs = topo.arcs;
    const { scale, translate } = topo.transform;

    function decodeArc(i) {
      const arc = arcs[i < 0 ? ~i : i];
      let x = 0, y = 0;
      const pts = arc.map(([dx, dy]) => {
        x += dx;
        y += dy;
        return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
      });
      return i < 0 ? pts.reverse() : pts;
    }

    function buildRing(arcIndices) {
      return arcIndices.reduce((acc, i) => acc.concat(decodeArc(i)), []);
    }

    return topo.objects.countries.geometries
      .map((g) => {
        let geometry;
        if (g.type === "Polygon") {
          geometry = {
            type: "Polygon",
            coordinates: g.arcs.map(buildRing),
          };
        } else if (g.type === "MultiPolygon") {
          geometry = {
            type: "MultiPolygon",
            coordinates: g.arcs.map((poly) => poly.map(buildRing)),
          };
        } else {
          return null;
        }
        return {
          type: "Feature",
          geometry,
          properties: { name: g.properties?.name || "" },
        };
      })
      .filter(Boolean);
  }

  // ── 5. Géométrie sphérique ─────────────────────────────────────────────────

  // Convertit lat/lon en vecteur 3D sur la sphère de rayon r
  function ll2v(lat, lon, r = 1.003) {
    const phi   = ((90 - lat) * Math.PI) / 180;
    const theta = ((lon + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Triangulation en éventail depuis le centroïde
  function buildRingGeometry(ring) {
    // Fermeture du ring
    if (
      ring.length > 1 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
    ) {
      ring = ring.slice(0, -1);
    }
    if (ring.length < 3) return [];

    // Centroïde géographique
    let cx = 0, cy = 0;
    for (const [x, y] of ring) { cx += x; cy += y; }
    cx /= ring.length;
    cy /= ring.length;

    const center = ll2v(cy, cx);
    const positions = [];

    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const va = ll2v(a[1], a[0]);
      const vb = ll2v(b[1], b[0]);
      positions.push(
        center.x, center.y, center.z,
        va.x, va.y, va.z,
        vb.x, vb.y, vb.z
      );
    }
    return positions;
  }

  function buildCountryMesh(feature, color) {
    const geo = feature.geometry;
    const allPositions = [];

    function processRing(ring) {
      const pts = buildRingGeometry(ring);
      for (const p of pts) allPositions.push(p);
    }

    if (geo.type === "Polygon") {
      processRing(geo.coordinates[0]);
    } else if (geo.type === "MultiPolygon") {
      for (const poly of geo.coordinates) processRing(poly[0]);
    }

    if (!allPositions.length) return null;

    const bufGeo = new THREE.BufferGeometry();
    bufGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(allPositions, 3)
    );
    bufGeo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      color,
      shininess: 15,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(bufGeo, mat);
    mesh.userData.baseColor = color.clone();
    return mesh;
  }

  // ── 6. Chargement asynchrone ───────────────────────────────────────────────
  async function loadGlobe() {
    const loadingEl = document.getElementById("loading");
    const loadMsg   = document.getElementById("load-msg");

    try {
      loadMsg.textContent = "Téléchargement des frontières mondiales…";
      const res  = await fetch(TOPO_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const topo = await res.json();

      loadMsg.textContent = "Construction des pays…";
      // Laisser le navigateur respirer avant le gros travail
      await new Promise((r) => setTimeout(r, 50));

      const features = topoToGeoFeatures(topo);

      for (const feat of features) {
        const name = feat.properties.name;
        const data = window.COUNTRIES[name];

        // Couleur de base selon risque, avec légère variation aléatoire
        let color;
        if (data) {
          color = floodColor(data.flood);
          color.r = clamp(color.r + (Math.random() - 0.5) * 0.06);
          color.g = clamp(color.g + (Math.random() - 0.5) * 0.06);
          color.b = clamp(color.b + (Math.random() - 0.5) * 0.06);
        } else {
          // Pays sans données : vert neutre
          color = new THREE.Color(0.14, 0.40, 0.26);
        }

        const mesh = buildCountryMesh(feat, color);
        if (!mesh) continue;

        mesh.userData.name     = name;
        mesh.userData.data     = data || null;
        globeGroup.add(mesh);
        allMeshes.push(mesh);
      }

      loadMsg.textContent = "Prêt !";
      loadingEl.style.opacity = "0";
      loadingEl.style.transition = "opacity .4s";
      setTimeout(() => (loadingEl.style.display = "none"), 420);

      // Lancer la boucle d'animation
      animate();

    } catch (err) {
      loadMsg.textContent = "❌ Erreur : " + err.message;
      console.error(err);
    }
  }

  // ── 7. Panneau info ────────────────────────────────────────────────────────
  function showPanel(name, data) {
    document.getElementById("p-name").textContent =
      (data?.flag || "🌍") + " " + name;
    document.getElementById("p-sub").textContent =
      data ? (data.subregion || data.region || "") : "";

    const body = document.getElementById("p-body");

    if (!data) {
      body.innerHTML = `<p style="font-size:12px;color:rgba(100,160,255,0.4);margin-top:6px;">
        Aucune donnée disponible pour ce pays.</p>`;
      return;
    }

    const gdp2050   = Math.round(data.gdp * (1 - data.perte_gdp / 100));
    const refugees  = Math.round((data.pop * data.perte_pop) / 100 * 10) / 10;
    const cls       = riskClass(data.flood);
    const label     = riskLabel(data.flood);

    const resHtml = Object.entries(data.res)
      .map(([k, v]) => {
        const hue = Math.round(180 + v * 0.6);
        return `
          <div class="bar-label"><span>${k}</span><span>${v}/100</span></div>
          <div class="bar-bg">
            <div class="bar-fill" style="width:${v}%;background:hsl(${hue},45%,45%)"></div>
          </div>`;
      })
      .join("");

    body.innerHTML = `
      <div class="warn ${cls}">${label}</div>

      <div class="sec">Géographie</div>
      <div class="row"><span>Capitale</span><b>${data.capital}</b></div>
      <div class="row"><span>Population actuelle</span><b>${data.pop}M</b></div>

      <div class="sec">Impact économique 2050</div>
      <div class="row"><span>PIB actuel</span><b>${data.gdp.toLocaleString()}Md$</b></div>
      <div class="row">
        <span>PIB 2050 estimé</span>
        <b style="color:${data.perte_gdp > 15 ? "#ff7070" : "#ffaa40"}">
          ${gdp2050.toLocaleString()}Md$
        </b>
      </div>
      <div class="row">
        <span>Perte PIB</span>
        <b style="color:#ff9060">−${data.perte_gdp}%</b>
      </div>
      <div class="row">
        <span>Réfugiés climatiques</span>
        <b>${refugees}M personnes</b>
      </div>

      <div class="sec">Ressources 2050</div>
      ${resHtml}

      <div class="note">${data.note}</div>
    `;
  }

  // ── 8. Interaction ─────────────────────────────────────────────────────────
  function setupControls() {
    const canvas  = document.getElementById("globe-canvas");
    const tooltip = document.getElementById("tooltip");
    const ray     = new THREE.Raycaster();

    // ── Drag ──
    canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      velX = 0; velY = 0;
      canvas.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        velX = (e.clientY - prevMouseY) * 0.004;
        velY = (e.clientX - prevMouseX) * 0.004;
        rotX += velX;
        rotY += velY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        return;
      }

      // Tooltip au survol
      const hit = raycastFirst(e, ray);
      if (hit) {
        const name = hit.object.userData.name;
        const d    = hit.object.userData.data;
        tooltip.textContent =
          (d?.flag || "🌍") +
          " " +
          name +
          (d ? ` · −${d.perte_gdp}% PIB` : "");
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 14 + "px";
        tooltip.style.top  = e.clientY - 30 + "px";
        canvas.style.cursor = "pointer";
      } else {
        tooltip.style.display = "none";
        canvas.style.cursor = "grab";
      }
    });

    window.addEventListener("mouseup", (e) => {
      canvas.style.cursor = "grab";

      // Clic = pas de déplacement significatif
      const dx = Math.abs(e.clientX - prevMouseX);
      const dy = Math.abs(e.clientY - prevMouseY);
      if (isDragging && dx < 5 && dy < 5) {
        const hit = raycastFirst(e, ray);
        if (hit) selectCountry(hit.object);
      }

      isDragging = false;
    });

    // ── Scroll zoom ──
    canvas.addEventListener(
      "wheel",
      (e) => {
        zoom = clamp(zoom + e.deltaY * 0.003, 1.3, 7);
        camera.position.z = zoom;
        e.preventDefault();
      },
      { passive: false }
    );

    // ── Boutons zoom ──
    document.getElementById("btn-zoom-in").onclick  = () => {
      zoom = Math.max(1.3, zoom - 0.35);
      camera.position.z = zoom;
    };
    document.getElementById("btn-zoom-out").onclick = () => {
      zoom = Math.min(7, zoom + 0.35);
      camera.position.z = zoom;
    };
  }

  function raycastFirst(e, ray) {
    const canvas = document.getElementById("globe-canvas");
    const rect   = canvas.getBoundingClientRect();
    const mouse  = new THREE.Vector2(
      ((e.clientX - rect.left)  / canvas.width)  * 2 - 1,
      -((e.clientY - rect.top) / canvas.height) * 2 + 1
    );
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(allMeshes);
    return hits.length ? hits[0] : null;
  }

  function selectCountry(mesh) {
    // Désélectionner l'ancien
    if (selectedMesh) {
      selectedMesh.material.emissive.set(0, 0, 0);
    }
    selectedMesh = mesh;
    mesh.material.emissive.set(0.25, 0.22, 0.06);
    showPanel(mesh.userData.name, mesh.userData.data);
  }

  // ── 9. Boucle d'animation ──────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
      velX *= 0.92;
      velY *= 0.92;
      rotX += velX;
      rotY += velY;
      // Auto-rotation lente quand inactif
      if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) {
        rotY += 0.0008;
      }
    }

    // Limiter l'inclinaison verticale
    rotX = clamp(rotX, -Math.PI / 2, Math.PI / 2);

    globeGroup.rotation.x = rotX;
    globeGroup.rotation.y = rotY;
    renderer.render(scene, camera);
  }

  // ── Utilitaires ────────────────────────────────────────────────────────────
  function clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
  }
})();
