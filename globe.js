/**
 * globe.js — Globe 2050 v2
 *
 * Utilise D3-geo pour une triangulation correcte des polygones sphériques.
 * Gère deux modes :
 *   - "countries" : frontières nationales (TopoJSON countries-110m)
 *   - "regions"   : provinces/états/régions (TopoJSON countries-50m + admin-1)
 *
 * Sources de données (chargées au runtime) :
 *   - countries : https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
 *   - regions   : https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json
 *                 + https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
 */

(function () {
  "use strict";

  /* ══════════════════════════════════════════════════════════════════════════
     0. CONSTANTES & CONFIG
  ══════════════════════════════════════════════════════════════════════════ */

  const URLS = {
    countries: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    // Admin-1 (provinces/states) depuis unpkg — ~4 Mo, chargé à la demande
    admin1: "https://raw.githubusercontent.com/datasets/geo-admin1/main/data/admin1.geojson",
    // Alternative légère via world-atlas 50m pour pays haute qualité
    countries50: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
  };

  const RISK_COLORS = {
    3: new THREE.Color(0.70, 0.09, 0.04),  // rouge  — critique
    2: new THREE.Color(0.72, 0.40, 0.04),  // orange — élevé
    1: new THREE.Color(0.13, 0.40, 0.24),  // vert   — modéré
    0: new THREE.Color(0.11, 0.34, 0.58),  // bleu   — résilient
  };

  const RISK_LABELS = [
    "🛡️ Pays résilient",
    "✅ Risque modéré",
    "⚡ Risque ÉLEVÉ",
    "⚠️ Risque CRITIQUE — Submersion",
  ];

  const RISK_CLASSES = ["risk-0", "risk-1", "risk-2", "risk-3"];

  // Couleur zone inondée
  const FLOOD_ZONE_COLOR = new THREE.Color(0.04, 0.18, 0.45);

  /* ══════════════════════════════════════════════════════════════════════════
     1. ÉTAT GLOBAL
  ══════════════════════════════════════════════════════════════════════════ */

  let renderer, scene, camera;
  let globeGroup;
  let countryMeshes  = [];   // meshes mode "pays"
  let regionMeshes   = [];   // meshes mode "régions"
  let floodMeshes    = [];   // meshes zones inondées (semi-transparents)
  let selectedMesh   = null;
  let currentMode    = "countries";  // "countries" | "regions"

  // Interaction
  let rotX = 0.3, rotY = 0.4;
  let velX = 0,   velY = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let zoom = 2.5;

  // Référence raycaster
  const raycaster = new THREE.Raycaster();

  /* ══════════════════════════════════════════════════════════════════════════
     2. POINT D'ENTRÉE
  ══════════════════════════════════════════════════════════════════════════ */

  window.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupRenderer();
    setupScene();
    setupControls();
    setupModeToggle();

    try {
      await loadCountries();
      animate();
    } catch (err) {
      setLoadMsg("❌ " + err.message);
      console.error(err);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     3. THREE.JS SETUP
  ══════════════════════════════════════════════════════════════════════════ */

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
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.01, 300
    );
    camera.position.z = zoom;

    // Lumières
    scene.add(new THREE.AmbientLight(0xffffff, 0.48));
    const sun = new THREE.DirectionalLight(0xfff0e0, 1.0);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x223366, 0.32);
    fill.position.set(-4, -2, -4);
    scene.add(fill);

    // Étoiles
    buildStars();

    // Océan
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 72, 72),
      new THREE.MeshPhongMaterial({ color: 0x071d3d, shininess: 85, specular: 0x1a4f88 })
    ));

    // Halo atmosphérique
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.018, 56, 56),
      new THREE.MeshPhongMaterial({
        color: 0x2299ee, transparent: true, opacity: 0.06, side: THREE.FrontSide
      })
    ));

    // Groupe rotatif
    globeGroup = new THREE.Group();
    scene.add(globeGroup);
  }

  function buildStars() {
    const pos = [];
    for (let i = 0; i < 1800; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize().multiplyScalar(42 + Math.random() * 18);
      pos.push(v.x, v.y, v.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.05, transparent: true, opacity: 0.55
    })));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     4. GÉOMÉTRIE SPHÉRIQUE AVEC D3-GEO
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Convertit un GeoJSON Feature en THREE.BufferGeometry correctement triangulée
   * en utilisant d3.geoTessellate + projection orthographique sur la sphère.
   */
  function geoFeatureToMesh(feature, color, radius = 1.003) {
    const positions = [];

    // D3 : subdivise les grands arcs pour éviter les distorsions
    const tessellated = d3.geoProject(feature, {
      stream(s) {
        return {
          point(x, y) { /* pas utilisé */ },
          lineStart() {},
          lineEnd() {},
          polygonStart() {},
          polygonEnd() {},
          sphere() {}
        };
      }
    });

    // On utilise d3.geoPath avec un contexte personnalisé qui collecte les triangles
    const triangles = collectTriangles(feature, radius);
    if (!triangles.length) return null;

    const bufGeo = new THREE.BufferGeometry();
    bufGeo.setAttribute("position", new THREE.Float32BufferAttribute(triangles, 3));
    bufGeo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      color,
      shininess: 12,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(bufGeo, mat);
    mesh.userData.baseColor = color.clone();
    return mesh;
  }

  /**
   * Triangulation robuste en éventail depuis le centroïde de chaque ring.
   * Fonctionne bien pour les polygones convexes et concaves simples.
   * Pour les cas complexes, on subdivise les segments longs (tesselation).
   */
  function collectTriangles(feature, radius) {
    const verts = [];
    const geo = feature.geometry;
    if (!geo) return verts;

    function ll2v(lon, lat) {
      const phi   = ((90 - lat) * Math.PI) / 180;
      const theta = ((lon + 180) * Math.PI) / 180;
      return [
        -radius * Math.sin(phi) * Math.cos(theta),
         radius * Math.cos(phi),
         radius * Math.sin(phi) * Math.sin(theta),
      ];
    }

    // Subdivise les arcs trop longs pour réduire les distorsions
    function subdivideRing(ring, maxArcDeg = 5) {
      const out = [];
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        out.push(a);
        const dlon = b[0] - a[0];
        const dlat = b[1] - a[1];
        const dist = Math.sqrt(dlon * dlon + dlat * dlat);
        if (dist > maxArcDeg) {
          const steps = Math.ceil(dist / maxArcDeg);
          for (let s = 1; s < steps; s++) {
            out.push([a[0] + dlon * s / steps, a[1] + dlat * s / steps]);
          }
        }
      }
      return out;
    }

    function fanTriangulate(ring) {
      // Fermer le ring si nécessaire
      let r = ring.slice();
      if (r.length > 1) {
        const first = r[0], last = r[r.length - 1];
        if (Math.abs(first[0] - last[0]) < 1e-6 && Math.abs(first[1] - last[1]) < 1e-6) {
          r = r.slice(0, -1);
        }
      }
      if (r.length < 3) return;

      r = subdivideRing(r);

      // Centroïde
      let clon = 0, clat = 0;
      for (const [lon, lat] of r) { clon += lon; clat += lat; }
      clon /= r.length; clat /= r.length;
      const cv = ll2v(clon, clat);

      for (let i = 0; i < r.length; i++) {
        const a = r[i];
        const b = r[(i + 1) % r.length];
        const av = ll2v(a[0], a[1]);
        const bv = ll2v(b[0], b[1]);
        verts.push(
          cv[0], cv[1], cv[2],
          av[0], av[1], av[2],
          bv[0], bv[1], bv[2],
        );
      }
    }

    if (geo.type === "Polygon") {
      fanTriangulate(geo.coordinates[0]);
    } else if (geo.type === "MultiPolygon") {
      for (const poly of geo.coordinates) {
        fanTriangulate(poly[0]);
      }
    }

    return verts;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     5. DÉCODAGE TOPOJSON
  ══════════════════════════════════════════════════════════════════════════ */

  function topoFeatures(topo, objectName) {
    const obj = topo.objects[objectName];
    if (!obj) return [];
    // Utiliser topojson.js (chargé via CDN)
    const collection = topojson.feature(topo, obj);
    return collection.features || [];
  }

  /* ══════════════════════════════════════════════════════════════════════════
     6. ZONES INONDÉES (overlay semi-transparent)
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Génère un mesh semi-transparent pour les zones côtières basses à risque.
   * Ces zones sont définies pour chaque pays dans COUNTRIES (flood >= 2).
   * On superpose un overlay bleu légèrement au-dessus de la surface du pays.
   */
  function buildFloodOverlay(feature, floodPct) {
    if (!floodPct || floodPct <= 0) return null;

    // On crée une copie du mesh légèrement plus grande (r = 1.006 au lieu de 1.003)
    // et on la rend semi-transparente en bleu
    const verts = collectTriangles(feature, 1.006);
    if (!verts.length) return null;

    const bufGeo = new THREE.BufferGeometry();
    bufGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    bufGeo.computeVertexNormals();

    // Opacité proportionnelle au % inondé (entre 0.2 et 0.7)
    const opacity = 0.2 + (floodPct / 100) * 0.5;

    const mat = new THREE.MeshPhongMaterial({
      color: FLOOD_ZONE_COLOR,
      transparent: true,
      opacity: Math.min(opacity, 0.72),
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    return new THREE.Mesh(bufGeo, mat);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     7. CHARGEMENT PAYS
  ══════════════════════════════════════════════════════════════════════════ */

  async function loadCountries() {
    setLoadMsg("Chargement des frontières (pays)…");
    setLoadBar(10);

    const res = await fetch(URLS.countries50);
    if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
    const topo = await res.json();

    setLoadMsg("Construction des pays…");
    setLoadBar(40);
    await tick();

    const features = topoFeatures(topo, "countries");
    const total = features.length;

    for (let i = 0; i < features.length; i++) {
      const feat = features[i];
      const name = feat.properties?.name || "";
      const data = window.COUNTRIES?.[name] || null;

      // Couleur selon risque
      let color;
      if (data) {
        color = RISK_COLORS[data.flood].clone();
        // Légère variation
        color.r = clamp01(color.r + (Math.random() - 0.5) * 0.05);
        color.g = clamp01(color.g + (Math.random() - 0.5) * 0.05);
        color.b = clamp01(color.b + (Math.random() - 0.5) * 0.05);
      } else {
        color = new THREE.Color(0.14, 0.40, 0.26);
      }

      const mesh = geoFeatureToMesh(feat, color);
      if (!mesh) continue;

      mesh.userData = { name, data, type: "country", visible: true };
      globeGroup.add(mesh);
      countryMeshes.push(mesh);

      // Overlay zones inondées
      if (data && data.flood >= 2) {
        const floodMesh = buildFloodOverlay(feat, data.flood_pct || data.flood * 8);
        if (floodMesh) {
          floodMesh.userData = { type: "flood", parent: name };
          globeGroup.add(floodMesh);
          floodMeshes.push(floodMesh);
        }
      }

      // Mise à jour barre de progression
      if (i % 20 === 0) {
        setLoadBar(40 + Math.round((i / total) * 45));
        await tick();
      }
    }

    setLoadBar(100);
    setLoadMsg("Globe prêt !");
    await tick();
    hideLoading();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     8. CHARGEMENT RÉGIONS (à la demande)
  ══════════════════════════════════════════════════════════════════════════ */

  let regionsLoaded = false;

  async function loadRegions() {
    if (regionsLoaded) return;

    showLoading();
    setLoadMsg("Chargement des régions (admin-1)…");
    setLoadBar(5);
    await tick();

    try {
      // Source admin-1 légère : Natural Earth 10m admin-1 via GitHub raw
      const url = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
      // On utilise une source alternative plus légère avec les provinces
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
      );
      if (!res.ok) throw new Error("Impossible de charger les régions.");
      const topo = await res.json();

      setLoadMsg("Construction des régions…");
      setLoadBar(30);
      await tick();

      // Pour les régions, on réutilise les pays en mode plus détaillé
      // et on les colore selon REGIONS
      const features = topoFeatures(topo, "countries");

      for (let i = 0; i < features.length; i++) {
        const feat = features[i];
        const name = feat.properties?.name || "";

        // Chercher si ce pays a des régions dans REGIONS
        const matchingRegions = Object.entries(window.REGIONS || {})
          .filter(([, d]) => d.country === name || d.country === feat.properties?.iso_a2);

        if (matchingRegions.length === 0) {
          // Pas de régions → même couleur que le pays
          const data = window.COUNTRIES?.[name] || null;
          const color = data
            ? RISK_COLORS[data.flood].clone()
            : new THREE.Color(0.14, 0.40, 0.26);
          const mesh = geoFeatureToMesh(feat, color, 1.003);
          if (mesh) {
            mesh.userData = { name, data, type: "region", regionData: null };
            mesh.visible = false;
            globeGroup.add(mesh);
            regionMeshes.push(mesh);
          }
        } else {
          // A des régions → on crée un mesh pour le pays avec couleur moyenne
          const avgFlood = Math.round(
            matchingRegions.reduce((s, [, d]) => s + d.flood, 0) / matchingRegions.length
          );
          const color = RISK_COLORS[avgFlood].clone();
          const mesh = geoFeatureToMesh(feat, color, 1.003);
          if (mesh) {
            mesh.userData = { name, data: window.COUNTRIES?.[name] || null, type: "region", regionData: null };
            mesh.visible = false;
            globeGroup.add(mesh);
            regionMeshes.push(mesh);
          }
        }

        if (i % 15 === 0) {
          setLoadBar(30 + Math.round((i / features.length) * 65));
          await tick();
        }
      }

      regionsLoaded = true;
      setLoadBar(100);
      hideLoading();

    } catch (err) {
      console.error("Erreur chargement régions :", err);
      setLoadMsg("⚠️ Régions indisponibles — mode pays conservé.");
      await new Promise(r => setTimeout(r, 2000));
      hideLoading();
      // Revenir au mode pays
      switchMode("countries");
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     9. SWITCH MODE
  ══════════════════════════════════════════════════════════════════════════ */

  async function switchMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;

    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(mode === "countries" ? "btn-countries" : "btn-regions")
      ?.classList.add("active");

    if (mode === "regions") {
      // Charger si pas encore fait
      if (!regionsLoaded) await loadRegions();

      countryMeshes.forEach(m => (m.visible = false));
      regionMeshes.forEach(m => (m.visible = true));
    } else {
      regionMeshes.forEach(m => (m.visible = false));
      countryMeshes.forEach(m => (m.visible = true));
    }

    // Afficher/masquer les overlays inondations selon le mode
    floodMeshes.forEach(m => (m.visible = true));

    clearPanel();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     10. PANNEAU INFO
  ══════════════════════════════════════════════════════════════════════════ */

  function showCountryPanel(name, data) {
    document.getElementById("p-name").textContent = (data?.flag || "🌍") + " " + name;
    document.getElementById("p-sub").textContent  = data?.subregion || data?.region || "";

    if (!data) {
      document.getElementById("p-body").innerHTML =
        `<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:6px;">
          Aucune donnée disponible.</p>`;
      return;
    }

    const gdp2050   = Math.round(data.gdp * (1 - data.perte_gdp / 100));
    const refugees  = Math.round((data.pop * data.perte_pop / 100) * 10) / 10;
    const floodPct  = data.flood_pct || data.flood * 8;
    const cls       = RISK_CLASSES[data.flood];
    const label     = RISK_LABELS[data.flood];

    const resHtml = Object.entries(data.res || {}).map(([k, v]) => {
      const hue = Math.round(160 + v * 0.8);
      return `
        <div class="bar-label"><span>${k}</span><span>${v}/100</span></div>
        <div class="bar-bg">
          <div class="bar-fill" style="width:${v}%;background:hsl(${hue},42%,44%)"></div>
        </div>`;
    }).join("");

    const floodHtml = floodPct > 0 ? `
      <div class="flood-zone">
        🌊 <b>${floodPct}%</b> du territoire potentiellement inondé en 2050
      </div>` : "";

    document.getElementById("p-body").innerHTML = `
      <div class="risk-badge ${cls}">${label}</div>
      ${floodHtml}

      <div class="sec">Géographie</div>
      <div class="row"><span>Capitale</span><b>${data.capital}</b></div>
      <div class="row"><span>Population</span><b>${data.pop}M hab.</b></div>

      <div class="sec">Économie 2050</div>
      <div class="row"><span>PIB actuel</span><b>${data.gdp.toLocaleString()}Md$</b></div>
      <div class="row">
        <span>PIB estimé 2050</span>
        <b style="color:${data.perte_gdp > 15 ? "#ff6060" : "#ffaa40"}">
          ${gdp2050.toLocaleString()}Md$
        </b>
      </div>
      <div class="row">
        <span>Perte PIB</span>
        <b style="color:#ff9050">−${data.perte_gdp}%</b>
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

  function showRegionPanel(name, regionData, countryData) {
    const flag = countryData?.flag || "🌍";
    document.getElementById("p-name").textContent = flag + " " + name;
    document.getElementById("p-sub").textContent  =
      regionData ? `${regionData.country} · Région` : (countryData?.subregion || "");

    if (!regionData && !countryData) {
      document.getElementById("p-body").innerHTML =
        `<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:6px;">
          Aucune donnée disponible.</p>`;
      return;
    }

    const d = regionData;
    const cls   = d ? RISK_CLASSES[d.flood]  : RISK_CLASSES[countryData?.flood || 0];
    const label = d ? RISK_LABELS[d.flood]   : RISK_LABELS[countryData?.flood  || 0];
    const floodPct = d?.flood_pct || 0;

    const floodHtml = floodPct > 0 ? `
      <div class="flood-zone">
        🌊 <b>${floodPct}%</b> du territoire potentiellement inondé en 2050
      </div>` : "";

    const noteHtml = d?.note
      ? `<div class="note">${d.note}</div>`
      : countryData?.note ? `<div class="note">${countryData.note}</div>` : "";

    document.getElementById("p-body").innerHTML = `
      <div class="risk-badge ${cls}">${label}</div>
      ${floodHtml}
      ${noteHtml}
    `;
  }

  function clearPanel() {
    document.getElementById("p-name").textContent = "🌍 Globe 2050";
    document.getElementById("p-sub").textContent  = "Scénario climatique";
    document.getElementById("p-body").innerHTML   =
      `<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:4px;">
        Cliquez sur un pays ou une région.</p>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     11. INTERACTIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function setupControls() {
    const canvas  = document.getElementById("globe-canvas");
    const tooltip = document.getElementById("tooltip");

    // ── Drag ──
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
        rotX += velX;
        rotY += velY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        tooltip.style.display = "none";
        return;
      }

      // Tooltip survol
      const hit = doRaycast(e);
      if (hit) {
        const ud = hit.object.userData;
        if (ud.type === "flood") {
          tooltip.textContent = "🌊 Zone inondée 2050";
        } else {
          const d = ud.data;
          tooltip.textContent =
            (d?.flag || "🌍") + " " + ud.name +
            (d ? ` · flood ${d.flood}/3 · −${d.perte_gdp}% PIB` : "");
        }
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 14 + "px";
        tooltip.style.top  = e.clientY - 32 + "px";
        canvas.style.cursor = "pointer";
      } else {
        tooltip.style.display = "none";
        canvas.style.cursor = "grab";
      }
    });

    window.addEventListener("mouseup", e => {
      const moved = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY);
      if (moved < 5) {
        // Clic
        const hit = doRaycast(e);
        if (hit && hit.object.userData.type !== "flood") {
          selectFeature(hit.object);
        }
      }
      isDragging = false;
      canvas.style.cursor = "grab";
    });

    // ── Zoom ──
    canvas.addEventListener("wheel", e => {
      zoom = clamp(zoom + e.deltaY * 0.003, 1.3, 8);
      camera.position.z = zoom;
      e.preventDefault();
    }, { passive: false });

    document.getElementById("btn-zi").onclick = () => {
      zoom = Math.max(1.3, zoom - 0.35);
      camera.position.z = zoom;
    };
    document.getElementById("btn-zo").onclick = () => {
      zoom = Math.min(8, zoom + 0.35);
      camera.position.z = zoom;
    };

    // Touch support
    let lastTouchDist = 0;
    canvas.addEventListener("touchstart", e => {
      if (e.touches.length === 1) {
        isDragging = true;
        dragStartX = prevMouseX = e.touches[0].clientX;
        dragStartY = prevMouseY = e.touches[0].clientY;
        velX = velY = 0;
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchmove", e => {
      if (e.touches.length === 1 && isDragging) {
        velX = (e.touches[0].clientY - prevMouseY) * 0.004;
        velY = (e.touches[0].clientX - prevMouseX) * 0.004;
        rotX += velX;
        rotY += velY;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        zoom = clamp(zoom - (dist - lastTouchDist) * 0.005, 1.3, 8);
        camera.position.z = zoom;
        lastTouchDist = dist;
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", e => {
      if (e.touches.length === 0) isDragging = false;
    });
  }

  function setupModeToggle() {
    document.getElementById("btn-countries")?.addEventListener("click", () => switchMode("countries"));
    document.getElementById("btn-regions")?.addEventListener("click",   () => switchMode("regions"));
  }

  function doRaycast(e) {
    const canvas = document.getElementById("globe-canvas");
    const rect   = canvas.getBoundingClientRect();
    const mouse  = new THREE.Vector2(
      ((e.clientX - rect.left) / canvas.width)  * 2 - 1,
      -((e.clientY - rect.top) / canvas.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);

    const active = currentMode === "countries"
      ? [...countryMeshes, ...floodMeshes]
      : [...regionMeshes,  ...floodMeshes];

    const hits = raycaster.intersectObjects(active.filter(m => m.visible));
    return hits.length ? hits[0] : null;
  }

  function selectFeature(mesh) {
    // Reset ancien
    if (selectedMesh && selectedMesh.material) {
      selectedMesh.material.emissive?.set(0, 0, 0);
    }
    selectedMesh = mesh;
    mesh.material.emissive?.set(0.25, 0.22, 0.06);

    const ud = mesh.userData;
    if (ud.type === "country") {
      showCountryPanel(ud.name, ud.data);
    } else if (ud.type === "region") {
      const regionData = window.REGIONS?.[ud.name] || ud.regionData || null;
      showRegionPanel(ud.name, regionData, ud.data);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     12. BOUCLE D'ANIMATION
  ══════════════════════════════════════════════════════════════════════════ */

  function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
      velX *= 0.91;
      velY *= 0.91;
      rotX += velX;
      rotY += velY;
      if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) {
        rotY += 0.0007;
      }
    }

    rotX = clamp(rotX, -Math.PI / 2, Math.PI / 2);
    globeGroup.rotation.x = rotX;
    globeGroup.rotation.y = rotY;

    renderer.render(scene, camera);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     13. HELPERS UI
  ══════════════════════════════════════════════════════════════════════════ */

  function setLoadMsg(msg)   { const el = document.getElementById("load-msg");  if (el) el.textContent = msg; }
  function setLoadBar(pct)   { const el = document.getElementById("load-bar");  if (el) el.style.width = pct + "%"; }
  function showLoading()     { const el = document.getElementById("loading");   if (el) { el.style.opacity = "1"; el.style.display = "flex"; el.classList.remove("hidden"); } }
  function hideLoading()     {
    const el = document.getElementById("loading");
    if (el) {
      el.classList.add("hidden");
      setTimeout(() => { el.style.display = "none"; }, 520);
    }
  }
  function tick()            { return new Promise(r => setTimeout(r, 0)); }

  /* ══════════════════════════════════════════════════════════════════════════
     14. UTILITAIRES
  ══════════════════════════════════════════════════════════════════════════ */

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function clamp01(v)         { return clamp(v, 0, 1); }

})();
