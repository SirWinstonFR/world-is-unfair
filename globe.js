/**
 * globe.js — Globe 2050 v3
 * Triangulation pure JS sans D3, avec TopoJSON via CDN.
 * Corrige les artefacts par subdivision des grands arcs.
 */

(function () {
  "use strict";

  const URLS = {
    countries: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    countries50: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
  };

  const RISK_COLORS = {
    3: [0.70, 0.09, 0.04],
    2: [0.72, 0.40, 0.04],
    1: [0.13, 0.40, 0.24],
    0: [0.11, 0.34, 0.58],
  };

  const RISK_LABELS = [
    "🛡️ Pays résilient",
    "✅ Risque modéré",
    "⚡ Risque ÉLEVÉ",
    "⚠️ Risque CRITIQUE — Submersion",
  ];

  const RISK_CLASSES = ["risk-0", "risk-1", "risk-2", "risk-3"];

  let renderer, scene, camera, globeGroup;
  let countryMeshes = [], regionMeshes = [], floodMeshes = [];
  let selectedMesh = null;
  let currentMode = "countries";
  let regionsLoaded = false;

  let rotX = 0.3, rotY = 0.4;
  let velX = 0, velY = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let zoom = 2.5;
  const raycaster = new THREE.Raycaster();

  window.addEventListener("DOMContentLoaded", init);

  /* ── Init ── */
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

  /* ── Renderer & Scène ── */
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
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 300);
    camera.position.z = zoom;

    scene.add(new THREE.AmbientLight(0xffffff, 0.48));
    const sun = new THREE.DirectionalLight(0xfff0e0, 1.0);
    sun.position.set(5, 3, 5); scene.add(sun);
    const fill = new THREE.DirectionalLight(0x223366, 0.32);
    fill.position.set(-4, -2, -4); scene.add(fill);

    // Étoiles
    const pos = [];
    for (let i = 0; i < 1800; i++) {
      const v = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1)
        .normalize().multiplyScalar(42 + Math.random()*18);
      pos.push(v.x, v.y, v.z);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color:0xffffff, size:0.05, transparent:true, opacity:0.55 })));

    // Océan
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 72, 72),
      new THREE.MeshPhongMaterial({ color:0x071d3d, shininess:85, specular:0x1a4f88 })
    ));
    // Atmosphère
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.018, 56, 56),
      new THREE.MeshPhongMaterial({ color:0x2299ee, transparent:true, opacity:0.06, side:THREE.FrontSide })
    ));

    globeGroup = new THREE.Group();
    scene.add(globeGroup);
  }

  /* ── Conversion lat/lon → vecteur 3D ── */
  function ll2v(lon, lat, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ── Interpolation sphérique pour subdiviser les grands arcs ── */
  function subdivideSeg(a, b, maxDeg) {
    const pts = [];
    const dlon = b[0] - a[0], dlat = b[1] - a[1];
    const dist = Math.sqrt(dlon*dlon + dlat*dlat);
    const steps = Math.max(1, Math.ceil(dist / maxDeg));
    for (let s = 0; s < steps; s++) {
      pts.push([a[0] + dlon*(s/steps), a[1] + dlat*(s/steps)]);
    }
    return pts;
  }

  function subdivideRing(ring, maxDeg) {
    const out = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i+1) % ring.length];
      const pts = subdivideSeg(a, b, maxDeg);
      for (const p of pts) out.push(p);
    }
    return out;
  }

  /* ── Triangulation en éventail depuis le centroïde ── */
  function fanTriangulate(ring, radius, maxDeg) {
    // Nettoyer le ring
    let r = ring.slice();
    if (r.length > 1) {
      const f = r[0], l = r[r.length-1];
      if (Math.abs(f[0]-l[0]) < 1e-6 && Math.abs(f[1]-l[1]) < 1e-6) r = r.slice(0,-1);
    }
    if (r.length < 3) return [];

    // Subdiviser pour réduire les distorsions
    r = subdivideRing(r, maxDeg || 3);

    // Centroïde géographique
    let clon = 0, clat = 0;
    for (const [lon,lat] of r) { clon += lon; clat += lat; }
    clon /= r.length; clat /= r.length;
    const cv = ll2v(clon, clat, radius);

    const verts = [];
    for (let i = 0; i < r.length; i++) {
      const av = ll2v(r[i][0], r[i][1], radius);
      const bv = ll2v(r[(i+1)%r.length][0], r[(i+1)%r.length][1], radius);
      verts.push(
        cv.x, cv.y, cv.z,
        av.x, av.y, av.z,
        bv.x, bv.y, bv.z
      );
    }
    return verts;
  }

  /* ── Construction d'un mesh depuis un GeoJSON Feature ── */
  function featureToMesh(feature, r, g, b, radius) {
    radius = radius || 1.003;
    const geo = feature.geometry;
    const allVerts = [];

    function processRing(ring) {
      const v = fanTriangulate(ring, radius);
      for (const x of v) allVerts.push(x);
    }

    if (geo.type === "Polygon") {
      processRing(geo.coordinates[0]);
    } else if (geo.type === "MultiPolygon") {
      for (const poly of geo.coordinates) processRing(poly[0]);
    }

    if (!allVerts.length) return null;

    const bufGeo = new THREE.BufferGeometry();
    bufGeo.setAttribute("position", new THREE.Float32BufferAttribute(allVerts, 3));
    bufGeo.computeVertexNormals();

    const color = new THREE.Color(r, g, b);
    const mat = new THREE.MeshPhongMaterial({ color, shininess:14, side:THREE.DoubleSide });
    const mesh = new THREE.Mesh(bufGeo, mat);
    mesh.userData.baseColor = color.clone();
    return mesh;
  }

  /* ── Overlay zone inondée ── */
  function buildFloodOverlay(feature, floodPct) {
    if (!floodPct || floodPct <= 0) return null;
    const geo = feature.geometry;
    const allVerts = [];
    function processRing(ring) {
      const v = fanTriangulate(ring, 1.007);
      for (const x of v) allVerts.push(x);
    }
    if (geo.type === "Polygon") processRing(geo.coordinates[0]);
    else if (geo.type === "MultiPolygon") for (const p of geo.coordinates) processRing(p[0]);
    if (!allVerts.length) return null;

    const bufGeo = new THREE.BufferGeometry();
    bufGeo.setAttribute("position", new THREE.Float32BufferAttribute(allVerts, 3));
    bufGeo.computeVertexNormals();
    const opacity = Math.min(0.75, 0.15 + (floodPct/100)*0.6);
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.04, 0.20, 0.55),
      transparent: true, opacity, side:THREE.DoubleSide, depthWrite:false
    });
    return new THREE.Mesh(bufGeo, mat);
  }

  /* ── Décodage TopoJSON (sans lib externe, juste topojson.js) ── */
  function topoFeatures(topo, objName) {
    // topojson.js est chargé dans index.html via cdnjs
    const collection = topojson.feature(topo, topo.objects[objName]);
    return collection.features || [];
  }

  /* ── Chargement pays ── */
  async function loadCountries() {
    setLoadMsg("Chargement des frontières…");
    setLoadBar(5);

    const res = await fetch(URLS.countries50);
    if (!res.ok) throw new Error("Impossible de charger les données (HTTP " + res.status + ")");
    const topo = await res.json();

    setLoadMsg("Construction des pays…");
    setLoadBar(20);
    await tick();

    const features = topoFeatures(topo, "countries");

    for (let i = 0; i < features.length; i++) {
      const feat = features[i];
      const name = feat.properties?.name || "";
      const data = (window.COUNTRIES || {})[name] || null;

      let r, g, b;
      if (data) {
        const c = RISK_COLORS[data.flood];
        r = c[0] + (Math.random()-.5)*.05;
        g = c[1] + (Math.random()-.5)*.05;
        b = c[2] + (Math.random()-.5)*.05;
      } else {
        r = 0.14; g = 0.40; b = 0.26;
      }
      r = clamp01(r); g = clamp01(g); b = clamp01(b);

      const mesh = featureToMesh(feat, r, g, b, 1.003);
      if (!mesh) continue;
      mesh.userData = { name, data, type:"country" };
      globeGroup.add(mesh);
      countryMeshes.push(mesh);

      // Overlay inondation
      if (data && data.flood >= 2) {
        const fp = data.flood_pct || data.flood * 8;
        const fm = buildFloodOverlay(feat, fp);
        if (fm) {
          fm.userData = { type:"flood", name };
          globeGroup.add(fm);
          floodMeshes.push(fm);
        }
      }

      if (i % 15 === 0) {
        setLoadBar(20 + Math.round((i / features.length)*75));
        await tick();
      }
    }

    setLoadBar(100);
    setLoadMsg("Globe 2050 prêt !");
    await tick();
    hideLoading();
  }

  /* ── Chargement régions ── */
  async function loadRegions() {
    if (regionsLoaded) return;
    showLoading();
    setLoadMsg("Chargement des régions…");
    setLoadBar(5);
    await tick();

    try {
      // On utilise countries-50m pour plus de détail
      const res = await fetch(URLS.countries50);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const topo = await res.json();
      const features = topoFeatures(topo, "countries");

      setLoadMsg("Coloration des régions…");
      setLoadBar(30);
      await tick();

      for (let i = 0; i < features.length; i++) {
        const feat = features[i];
        const name = feat.properties?.name || "";

        // Trouver les régions correspondantes
        const regionEntries = Object.entries(window.REGIONS || {})
          .filter(([, d]) => d.country === name);

        let r, g, b;
        if (regionEntries.length > 0) {
          const avgFlood = Math.round(
            regionEntries.reduce((s,[,d]) => s+d.flood, 0) / regionEntries.length
          );
          const c = RISK_COLORS[avgFlood];
          r = clamp01(c[0]+(Math.random()-.5)*.04);
          g = clamp01(c[1]+(Math.random()-.5)*.04);
          b = clamp01(c[2]+(Math.random()-.5)*.04);
        } else {
          const data = (window.COUNTRIES||{})[name];
          const c = data ? RISK_COLORS[data.flood] : [0.14, 0.40, 0.26];
          r = clamp01(c[0]); g = clamp01(c[1]); b = clamp01(c[2]);
        }

        const mesh = featureToMesh(feat, r, g, b, 1.003);
        if (!mesh) continue;

        mesh.userData = {
          name,
          data: (window.COUNTRIES||{})[name] || null,
          regionData: regionEntries[0]?.[1] || null,
          type: "region"
        };
        mesh.visible = false;
        globeGroup.add(mesh);
        regionMeshes.push(mesh);

        if (i % 15 === 0) {
          setLoadBar(30 + Math.round((i/features.length)*65));
          await tick();
        }
      }

      regionsLoaded = true;
      setLoadBar(100);
      hideLoading();
    } catch (err) {
      console.error(err);
      setLoadMsg("⚠️ Erreur régions — mode pays conservé.");
      await new Promise(r => setTimeout(r, 1800));
      hideLoading();
      switchMode("countries");
    }
  }

  /* ── Switch mode ── */
  async function switchMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(mode === "countries" ? "btn-countries" : "btn-regions")
      ?.classList.add("active");

    if (mode === "regions") {
      if (!regionsLoaded) await loadRegions();
      countryMeshes.forEach(m => m.visible = false);
      regionMeshes.forEach(m => m.visible = true);
    } else {
      regionMeshes.forEach(m => m.visible = false);
      countryMeshes.forEach(m => m.visible = true);
    }
    floodMeshes.forEach(m => m.visible = true);
    clearPanel();
  }

  /* ── Panneau info ── */
  function showCountryPanel(name, data) {
    document.getElementById("p-name").textContent = (data?.flag || "🌍") + " " + name;
    document.getElementById("p-sub").textContent  = data?.subregion || data?.region || "";
    if (!data) {
      document.getElementById("p-body").innerHTML =
        `<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:6px;">Aucune donnée disponible.</p>`;
      return;
    }
    const gdp2050  = Math.round(data.gdp * (1 - data.perte_gdp/100));
    const refugees = Math.round(data.pop * data.perte_pop/100 * 10)/10;
    const floodPct = data.flood_pct || data.flood*8;
    const cls   = RISK_CLASSES[data.flood];
    const label = RISK_LABELS[data.flood];

    const resHtml = Object.entries(data.res||{}).map(([k,v]) => {
      const hue = Math.round(160 + v*.8);
      return `<div class="bar-label"><span>${k}</span><span>${v}/100</span></div>
              <div class="bar-bg"><div class="bar-fill" style="width:${v}%;background:hsl(${hue},42%,44%)"></div></div>`;
    }).join("");

    const floodHtml = floodPct > 0
      ? `<div class="flood-zone">🌊 <b>${floodPct}%</b> du territoire potentiellement inondé en 2050</div>` : "";

    document.getElementById("p-body").innerHTML = `
      <div class="risk-badge ${cls}">${label}</div>
      ${floodHtml}
      <div class="sec">Géographie</div>
      <div class="row"><span>Capitale</span><b>${data.capital}</b></div>
      <div class="row"><span>Population</span><b>${data.pop}M</b></div>
      <div class="sec">Économie 2050</div>
      <div class="row"><span>PIB actuel</span><b>${data.gdp.toLocaleString()}Md$</b></div>
      <div class="row"><span>PIB 2050</span><b style="color:${data.perte_gdp>15?"#ff6060":"#ffaa40"}">${gdp2050.toLocaleString()}Md$</b></div>
      <div class="row"><span>Perte PIB</span><b style="color:#ff9050">−${data.perte_gdp}%</b></div>
      <div class="row"><span>Réfugiés</span><b>${refugees}M</b></div>
      <div class="sec">Ressources 2050</div>
      ${resHtml}
      <div class="note">${data.note}</div>`;
  }

  function showRegionPanel(name, regionData, countryData) {
    document.getElementById("p-name").textContent = (countryData?.flag||"🌍") + " " + name;
    document.getElementById("p-sub").textContent  = regionData
      ? regionData.country + " · Région"
      : (countryData?.subregion || "");

    const d = regionData;
    if (!d && !countryData) {
      document.getElementById("p-body").innerHTML =
        `<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:6px;">Aucune donnée disponible.</p>`;
      return;
    }
    const flood = d?.flood ?? countryData?.flood ?? 0;
    const cls   = RISK_CLASSES[flood];
    const label = RISK_LABELS[flood];
    const fp    = d?.flood_pct || 0;
    const note  = d?.note || countryData?.note || "";

    document.getElementById("p-body").innerHTML = `
      <div class="risk-badge ${cls}">${label}</div>
      ${fp > 0 ? `<div class="flood-zone">🌊 <b>${fp}%</b> du territoire inondé en 2050</div>` : ""}
      ${note ? `<div class="note">${note}</div>` : ""}`;
  }

  function clearPanel() {
    document.getElementById("p-name").textContent = "🌍 Globe 2050";
    document.getElementById("p-sub").textContent  = "Scénario climatique";
    document.getElementById("p-body").innerHTML   =
      `<p style="font-size:12px;color:rgba(100,160,255,.4);margin-top:4px;">Cliquez sur un pays ou une région.</p>`;
  }

  /* ── Raycasting & sélection ── */
  function doRaycast(clientX, clientY) {
    const canvas = document.getElementById("globe-canvas");
    const rect   = canvas.getBoundingClientRect();
    const mouse  = new THREE.Vector2(
      ((clientX - rect.left) / canvas.width)  * 2 - 1,
      -((clientY - rect.top) / canvas.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const active = [
      ...(currentMode==="countries" ? countryMeshes : regionMeshes),
      ...floodMeshes
    ].filter(m => m.visible);
    const hits = raycaster.intersectObjects(active);
    return hits.length ? hits[0] : null;
  }

  function selectFeature(mesh) {
    if (selectedMesh?.material) selectedMesh.material.emissive?.set(0,0,0);
    selectedMesh = mesh;
    mesh.material.emissive?.set(0.25, 0.22, 0.06);
    const ud = mesh.userData;
    if (ud.type === "country") {
      showCountryPanel(ud.name, ud.data);
    } else if (ud.type === "region") {
      const rd = (window.REGIONS||{})[ud.name] || ud.regionData || null;
      showRegionPanel(ud.name, rd, ud.data);
    }
  }

  /* ── Contrôles ── */
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
        velX = (e.clientY - prevMouseY)*.004;
        velY = (e.clientX - prevMouseX)*.004;
        rotX += velX; rotY += velY;
        prevMouseX = e.clientX; prevMouseY = e.clientY;
        tooltip.style.display = "none";
        return;
      }
      const hit = doRaycast(e.clientX, e.clientY);
      if (hit && hit.object.userData.type !== "flood") {
        const d = hit.object.userData.data;
        tooltip.textContent = (d?.flag||"🌍") + " " + hit.object.userData.name
          + (d ? ` · −${d.perte_gdp}% PIB` : "");
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX+14+"px";
        tooltip.style.top  = e.clientY-32+"px";
        canvas.style.cursor = "pointer";
      } else {
        tooltip.style.display = "none";
        canvas.style.cursor = "grab";
      }
    });

    window.addEventListener("mouseup", e => {
      const moved = Math.abs(e.clientX-dragStartX)+Math.abs(e.clientY-dragStartY);
      if (moved < 5) {
        const hit = doRaycast(e.clientX, e.clientY);
        if (hit && hit.object.userData.type !== "flood") selectFeature(hit.object);
      }
      isDragging = false;
      canvas.style.cursor = "grab";
    });

    canvas.addEventListener("wheel", e => {
      zoom = Math.max(1.3, Math.min(8, zoom + e.deltaY*.003));
      camera.position.z = zoom;
      e.preventDefault();
    }, { passive:false });

    document.getElementById("btn-zi").onclick = () => { zoom=Math.max(1.3,zoom-.35); camera.position.z=zoom; };
    document.getElementById("btn-zo").onclick = () => { zoom=Math.min(8,zoom+.35);   camera.position.z=zoom; };

    // Touch
    let lastDist = 0;
    canvas.addEventListener("touchstart", e => {
      if (e.touches.length===1) {
        isDragging=true; dragStartX=prevMouseX=e.touches[0].clientX; dragStartY=prevMouseY=e.touches[0].clientY; velX=velY=0;
      } else if (e.touches.length===2) {
        isDragging=false;
        const dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
        lastDist=Math.sqrt(dx*dx+dy*dy);
      }
      e.preventDefault();
    }, {passive:false});

    canvas.addEventListener("touchmove", e => {
      if (e.touches.length===1 && isDragging) {
        velX=(e.touches[0].clientY-prevMouseY)*.004; velY=(e.touches[0].clientX-prevMouseX)*.004;
        rotX+=velX; rotY+=velY; prevMouseX=e.touches[0].clientX; prevMouseY=e.touches[0].clientY;
      } else if (e.touches.length===2) {
        const dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
        const dist=Math.sqrt(dx*dx+dy*dy);
        zoom=Math.max(1.3,Math.min(8,zoom-(dist-lastDist)*.005)); camera.position.z=zoom; lastDist=dist;
      }
      e.preventDefault();
    }, {passive:false});

    canvas.addEventListener("touchend", e => { if(!e.touches.length) isDragging=false; });
  }

  function setupModeToggle() {
    document.getElementById("btn-countries")?.addEventListener("click", ()=>switchMode("countries"));
    document.getElementById("btn-regions")?.addEventListener("click",   ()=>switchMode("regions"));
  }

  /* ── Animation ── */
  function animate() {
    requestAnimationFrame(animate);
    if (!isDragging) {
      velX*=.91; velY*=.91;
      rotX+=velX; rotY+=velY;
      if (Math.abs(velX)<.0001 && Math.abs(velY)<.0001) rotY+=.0007;
    }
    rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotX));
    globeGroup.rotation.x = rotX;
    globeGroup.rotation.y = rotY;
    renderer.render(scene, camera);
  }

  /* ── UI helpers ── */
  function setLoadMsg(t) { const e=document.getElementById("load-msg"); if(e) e.textContent=t; }
  function setLoadBar(p) { const e=document.getElementById("load-bar"); if(e) e.style.width=p+"%"; }
  function showLoading() { const e=document.getElementById("loading"); if(e){e.style.display="flex";e.classList.remove("hidden");e.style.opacity="1";} }
  function hideLoading() {
    const e=document.getElementById("loading");
    if(e){e.classList.add("hidden");setTimeout(()=>e.style.display="none",520);}
  }
  function tick() { return new Promise(r=>setTimeout(r,0)); }
  function clamp01(v) { return Math.max(0,Math.min(1,v)); }

})();
