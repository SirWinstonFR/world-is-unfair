/**
 * countries.js
 * Données climatiques et économiques des pays en 2050.
 *
 * Structure de chaque pays :
 *   flag        → emoji drapeau
 *   capital     → capitale
 *   pop         → population actuelle (millions)
 *   gdp         → PIB actuel (milliards $)
 *   flood       → niveau de risque inondation : 0=résilient 1=modéré 2=élevé 3=critique
 *   perte_gdp   → % de PIB perdu d'ici 2050
 *   perte_pop   → % de population déplacée d'ici 2050
 *   res         → ressources restantes en 2050 (score /100)
 *   note        → description de la situation 2050
 *   region      → région du monde (pour regroupement futur)
 *   subregion   → sous-région (ex: "Europe de l'Ouest")
 */

window.COUNTRIES = {

  // ── EUROPE DE L'OUEST ──────────────────────────────────────────────────────
  "France": {
    flag:"🇫🇷", capital:"Paris", pop:68, gdp:2780,
    flood:1, perte_gdp:3, perte_pop:1,
    res:{ agriculture:70, industrie:68, tourisme:80, énergie:55 },
    note:"Côtes atlantiques et méditerranéennes partiellement menacées. Canicules fréquentes.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },
  "Germany": {
    flag:"🇩🇪", capital:"Berlin", pop:84, gdp:4070,
    flood:0, perte_gdp:2, perte_pop:0,
    res:{ industrie:90, technologie:85, agriculture:58, énergie:48 },
    note:"Peu de côtes. Impact limité. Vagues de chaleur problématiques.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },
  "United Kingdom": {
    flag:"🇬🇧", capital:"Londres", pop:67, gdp:3070,
    flood:2, perte_gdp:8, perte_pop:3,
    res:{ finance:88, énergie:50, technologie:78, agriculture:40 },
    note:"Londres et côtes est menacées. Thames Barrier dépassée.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },
  "Netherlands": {
    flag:"🇳🇱", capital:"Amsterdam", pop:17, gdp:1010,
    flood:3, perte_gdp:25, perte_pop:15,
    res:{ finance:70, agriculture:55, ports:60, technologie:72 },
    note:"⚠️ 26% du territoire sous le niveau de la mer. Digues critiques.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },
  "Belgium": {
    flag:"🇧🇪", capital:"Bruxelles", pop:11, gdp:590,
    flood:1, perte_gdp:5, perte_pop:2,
    res:{ industrie:68, finance:72, chimie:75 },
    note:"Côtes flamandes partiellement menacées.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },
  "Spain": {
    flag:"🇪🇸", capital:"Madrid", pop:47, gdp:1420,
    flood:1, perte_gdp:9, perte_pop:2,
    res:{ tourisme:78, agriculture:60, énergie:52, industrie:55 },
    note:"Désertification du sud. Côtes méditerranéennes menacées.",
    region:"Europe", subregion:"Europe du Sud"
  },
  "Italy": {
    flag:"🇮🇹", capital:"Rome", pop:60, gdp:2010,
    flood:2, perte_gdp:11, perte_pop:4,
    res:{ tourisme:80, agriculture:62, mode:80, industrie:60 },
    note:"Venise submergée. Côtes adriatiques et Sicile menacées.",
    region:"Europe", subregion:"Europe du Sud"
  },
  "Portugal": {
    flag:"🇵🇹", capital:"Lisbonne", pop:10, gdp:240,
    flood:1, perte_gdp:7, perte_pop:2,
    res:{ tourisme:78, poisson:65, vin:72, énergie:60 },
    note:"Lisbonne côtière partiellement menacée. Sécheresses fréquentes.",
    region:"Europe", subregion:"Europe du Sud"
  },
  "Greece": {
    flag:"🇬🇷", capital:"Athènes", pop:11, gdp:220,
    flood:1, perte_gdp:8, perte_pop:3,
    res:{ tourisme:82, olives:72, pêche:60 },
    note:"Incendies et sécheresses fréquents. Îles menacées.",
    region:"Europe", subregion:"Europe du Sud"
  },
  "Sweden": {
    flag:"🇸🇪", capital:"Stockholm", pop:10, gdp:590,
    flood:0, perte_gdp:1, perte_pop:0,
    res:{ bois:88, minerais:68, technologie:78, eau:85 },
    note:"Rebond isostatique protège les côtes. Peu affecté.",
    region:"Europe", subregion:"Europe du Nord"
  },
  "Norway": {
    flag:"🇳🇴", capital:"Oslo", pop:5, gdp:480,
    flood:0, perte_gdp:0, perte_pop:0,
    res:{ pétrole:95, gaz:90, poisson:78, eau:95 },
    note:"Fjords protègent les côtes. Économie très stable.",
    region:"Europe", subregion:"Europe du Nord"
  },
  "Finland": {
    flag:"🇫🇮", capital:"Helsinki", pop:5, gdp:280,
    flood:0, perte_gdp:1, perte_pop:0,
    res:{ bois:88, technologie:75, eau:90 },
    note:"Peu affecté. Nouvelles terres agricoles possibles.",
    region:"Europe", subregion:"Europe du Nord"
  },
  "Denmark": {
    flag:"🇩🇰", capital:"Copenhague", pop:6, gdp:370,
    flood:2, perte_gdp:8, perte_pop:3,
    res:{ agriculture:68, éolien:90, poisson:60 },
    note:"Pays plat très vulnérable. Copenhague menacée.",
    region:"Europe", subregion:"Europe du Nord"
  },
  "Poland": {
    flag:"🇵🇱", capital:"Varsovie", pop:38, gdp:680,
    flood:1, perte_gdp:3, perte_pop:1,
    res:{ agriculture:65, industrie:65, charbon:55 },
    note:"Côte baltique légèrement menacée. Impact modéré.",
    region:"Europe", subregion:"Europe de l'Est"
  },
  "Ukraine": {
    flag:"🇺🇦", capital:"Kiev", pop:44, gdp:160,
    flood:1, perte_gdp:4, perte_pop:1,
    res:{ agriculture:78, acier:62, charbon:55 },
    note:"Peu de côtes. Mer Noire légèrement montante.",
    region:"Europe", subregion:"Europe de l'Est"
  },
  "Switzerland": {
    flag:"🇨🇭", capital:"Berne", pop:9, gdp:800,
    flood:0, perte_gdp:2, perte_pop:0,
    res:{ finance:92, pharmacie:85, tourisme:72 },
    note:"Pas de côtes. Fonte des glaciers. Économie stable.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },
  "Austria": {
    flag:"🇦🇹", capital:"Vienne", pop:9, gdp:480,
    flood:0, perte_gdp:2, perte_pop:0,
    res:{ tourisme:78, acier:62, agriculture:58, eau:82 },
    note:"Pays enclavé. Fonte des Alpes. Impact modéré.",
    region:"Europe", subregion:"Europe de l'Ouest"
  },

  // ── AMÉRIQUE DU NORD ───────────────────────────────────────────────────────
  "United States of America": {
    flag:"🇺🇸", capital:"Washington D.C.", pop:331, gdp:25460,
    flood:2, perte_gdp:5, perte_pop:2,
    res:{ technologie:92, agriculture:80, pétrole:75, finance:90 },
    note:"Floride, Louisiane et côte Est partiellement inondées. Ouragans plus intenses.",
    region:"Amérique du Nord", subregion:"Amérique du Nord"
  },
  "Canada": {
    flag:"🇨🇦", capital:"Ottawa", pop:38, gdp:2140,
    flood:0, perte_gdp:1, perte_pop:0,
    res:{ bois:92, pétrole:78, minerais:74, eau:95 },
    note:"Bénéficie du réchauffement. Nouvelles terres agricoles au nord.",
    region:"Amérique du Nord", subregion:"Amérique du Nord"
  },
  "Mexico": {
    flag:"🇲🇽", capital:"Mexico", pop:130, gdp:1290,
    flood:2, perte_gdp:10, perte_pop:5,
    res:{ pétrole:58, agriculture:62, tourisme:65, argent:55 },
    note:"Côtes Caraïbes et Pacifique vulnérables. Sécheresses intérieures.",
    region:"Amérique du Nord", subregion:"Amérique Centrale"
  },

  // ── AMÉRIQUE DU SUD ────────────────────────────────────────────────────────
  "Brazil": {
    flag:"🇧🇷", capital:"Brasilia", pop:213, gdp:1920,
    flood:1, perte_gdp:6, perte_pop:2,
    res:{ forêt:80, agriculture:78, minerais:78, pétrole:60 },
    note:"Amazonie affectée par sécheresses. Côtes nord menacées.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },
  "Argentina": {
    flag:"🇦🇷", capital:"Buenos Aires", pop:45, gdp:490,
    flood:1, perte_gdp:5, perte_pop:2,
    res:{ agriculture:85, élevage:85, minerais:62, vin:72 },
    note:"Buenos Aires côtière partiellement menacée.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },
  "Colombia": {
    flag:"🇨🇴", capital:"Bogotá", pop:51, gdp:310,
    flood:1, perte_gdp:9, perte_pop:4,
    res:{ café:85, pétrole:58, fleurs:80, or:55 },
    note:"Côtes Caraïbes et Pacifique menacées.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },
  "Chile": {
    flag:"🇨🇱", capital:"Santiago", pop:19, gdp:300,
    flood:1, perte_gdp:5, perte_pop:2,
    res:{ cuivre:88, vin:75, lithium:85 },
    note:"Côtes pacifiques partiellement menacées. Fonte des glaciers.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },
  "Peru": {
    flag:"🇵🇪", capital:"Lima", pop:33, gdp:220,
    flood:1, perte_gdp:8, perte_pop:3,
    res:{ minerais:82, or:72, pêche:65 },
    note:"Fonte des glaciers andins. Pénuries d'eau.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },
  "Venezuela": {
    flag:"🇻🇪", capital:"Caracas", pop:29, gdp:95,
    flood:2, perte_gdp:15, perte_pop:8,
    res:{ pétrole:88, gaz:75 },
    note:"Côtes très menacées. Crise économique aggravée.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },
  "Bolivia": {
    flag:"🇧🇴", capital:"Sucre", pop:12, gdp:43,
    flood:0, perte_gdp:8, perte_pop:4,
    res:{ lithium:90, gaz:68, zinc:62 },
    note:"Pays enclavé. Lac Titicaca en baisse. Sécheresses.",
    region:"Amérique du Sud", subregion:"Amérique du Sud"
  },

  // ── ASIE DE L'EST ──────────────────────────────────────────────────────────
  "China": {
    flag:"🇨🇳", capital:"Pékin", pop:1412, gdp:17960,
    flood:2, perte_gdp:8, perte_pop:5,
    res:{ industrie:90, agriculture:72, terres_rares:88, technologie:82 },
    note:"Shanghai et Pearl River Delta menacés. 50M de personnes déplacées.",
    region:"Asie", subregion:"Asie de l'Est"
  },
  "Japan": {
    flag:"🇯🇵", capital:"Tokyo", pop:125, gdp:4230,
    flood:2, perte_gdp:7, perte_pop:3,
    res:{ technologie:92, pêche:65, industrie:85, culture:82 },
    note:"Côtes basses de Tokyo et Osaka partiellement inondées.",
    region:"Asie", subregion:"Asie de l'Est"
  },
  "South Korea": {
    flag:"🇰🇷", capital:"Séoul", pop:52, gdp:1800,
    flood:1, perte_gdp:4, perte_pop:1,
    res:{ technologie:88, électronique:92, industrie:82, pêche:55 },
    note:"Quelques zones côtières menacées. Économie résistante.",
    region:"Asie", subregion:"Asie de l'Est"
  },
  "Mongolia": {
    flag:"🇲🇳", capital:"Oulan-Bator", pop:3, gdp:14,
    flood:0, perte_gdp:5, perte_pop:2,
    res:{ charbon:72, cuivre:68, or:62, élevage:75 },
    note:"Désertification accrue. Dzuds (hivers catastrophiques) plus fréquents.",
    region:"Asie", subregion:"Asie de l'Est"
  },

  // ── ASIE DU SUD ────────────────────────────────────────────────────────────
  "India": {
    flag:"🇮🇳", capital:"New Delhi", pop:1380, gdp:3390,
    flood:2, perte_gdp:12, perte_pop:8,
    res:{ agriculture:68, IT:82, textile:72, charbon:60 },
    note:"Mumbai et côtes du Bengale très vulnérables. Vagues de chaleur mortelles.",
    region:"Asie", subregion:"Asie du Sud"
  },
  "Bangladesh": {
    flag:"🇧🇩", capital:"Dacca", pop:167, gdp:460,
    flood:3, perte_gdp:40, perte_pop:35,
    res:{ textile:60, agriculture:40, gaz:30, pêche:45 },
    note:"⚠️ 17% du territoire submergé. 30M de réfugiés climatiques.",
    region:"Asie", subregion:"Asie du Sud"
  },
  "Pakistan": {
    flag:"🇵🇰", capital:"Islamabad", pop:220, gdp:340,
    flood:2, perte_gdp:18, perte_pop:10,
    res:{ agriculture:55, textile:62, coton:65 },
    note:"Inondations massives du fleuve Indus. Crises alimentaires récurrentes.",
    region:"Asie", subregion:"Asie du Sud"
  },
  "Afghanistan": {
    flag:"🇦🇫", capital:"Kaboul", pop:40, gdp:20,
    flood:0, perte_gdp:12, perte_pop:8,
    res:{ minerais:58, lithium:72, agriculture:30 },
    note:"Sécheresses extrêmes. Insécurité alimentaire critique.",
    region:"Asie", subregion:"Asie du Sud"
  },

  // ── ASIE DU SUD-EST ────────────────────────────────────────────────────────
  "Indonesia": {
    flag:"🇮🇩", capital:"Jakarta", pop:273, gdp:1190,
    flood:3, perte_gdp:30, perte_pop:18,
    res:{ pétrole:55, agriculture:65, bois:60, minerais:65 },
    note:"⚠️ Jakarta abandonnée. Des îles entières disparaissent.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },
  "Vietnam": {
    flag:"🇻🇳", capital:"Hanoï", pop:97, gdp:410,
    flood:3, perte_gdp:35, perte_pop:20,
    res:{ agriculture:55, pêche:50, industrie:58 },
    note:"⚠️ Delta du Mékong submergé. Ho Chi Minh City menacée.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },
  "Thailand": {
    flag:"🇹🇭", capital:"Bangkok", pop:70, gdp:540,
    flood:3, perte_gdp:28, perte_pop:15,
    res:{ tourisme:65, agriculture:60, pêche:55 },
    note:"⚠️ Bangkok inondée régulièrement. Delta Chao Phraya submergé.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },
  "Philippines": {
    flag:"🇵🇭", capital:"Manille", pop:113, gdp:400,
    flood:3, perte_gdp:32, perte_pop:22,
    res:{ agriculture:58, pêche:60, minerais:52 },
    note:"⚠️ Manille inondable. Typhons plus intenses. Îles disparaissent.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },
  "Myanmar": {
    flag:"🇲🇲", capital:"Naypyidaw", pop:54, gdp:80,
    flood:3, perte_gdp:30, perte_pop:18,
    res:{ jade:72, rubis:65, bois:60 },
    note:"⚠️ Delta de l'Irrawaddy submergé. Yangon menacée.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },
  "Malaysia": {
    flag:"🇲🇾", capital:"Kuala Lumpur", pop:32, gdp:440,
    flood:2, perte_gdp:15, perte_pop:7,
    res:{ pétrole:58, palmier:75, bois:65 },
    note:"Côtes de Bornéo et Péninsule malaise menacées.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },
  "Cambodia": {
    flag:"🇰🇭", capital:"Phnom Penh", pop:17, gdp:30,
    flood:2, perte_gdp:25, perte_pop:14,
    res:{ riz:68, pêche:58, tourisme:50 },
    note:"Lac Tonlé Sap perturbé. Inondations côtières croissantes.",
    region:"Asie", subregion:"Asie du Sud-Est"
  },

  // ── ASIE CENTRALE ──────────────────────────────────────────────────────────
  "Russia": {
    flag:"🇷🇺", capital:"Moscou", pop:144, gdp:1860,
    flood:0, perte_gdp:1, perte_pop:0,
    res:{ pétrole:95, gaz:92, bois:88, minerais:84 },
    note:"Peu impacté par les inondations. Arctique exploitable. Permafrost en dégel.",
    region:"Eurasie", subregion:"Eurasie du Nord"
  },
  "Kazakhstan": {
    flag:"🇰🇿", capital:"Astana", pop:19, gdp:180,
    flood:0, perte_gdp:3, perte_pop:1,
    res:{ pétrole:78, uranium:85, blé:68, minerais:72 },
    note:"Pas de côtes. Mer Caspienne fluctuante. Sécheresses.",
    region:"Asie", subregion:"Asie Centrale"
  },
  "Uzbekistan": {
    flag:"🇺🇿", capital:"Tachkent", pop:35, gdp:70,
    flood:0, perte_gdp:10, perte_pop:5,
    res:{ coton:72, or:65, gaz:58 },
    note:"Mer d'Aral asséchée. Sécheresses chroniques.",
    region:"Asie", subregion:"Asie Centrale"
  },

  // ── MOYEN-ORIENT ──────────────────────────────────────────────────────────
  "Turkey": {
    flag:"🇹🇷", capital:"Ankara", pop:84, gdp:820,
    flood:1, perte_gdp:7, perte_pop:3,
    res:{ agriculture:65, tourisme:72, industrie:60, textile:68 },
    note:"Istanbul et côtes égéennes partiellement menacées.",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "Iran": {
    flag:"🇮🇷", capital:"Téhéran", pop:85, gdp:360,
    flood:1, perte_gdp:12, perte_pop:6,
    res:{ pétrole:82, gaz:80, agriculture:42 },
    note:"Chaleur extrême. Lac Urmia asséché. Sécheresses chroniques.",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "Saudi Arabia": {
    flag:"🇸🇦", capital:"Riyad", pop:35, gdp:870,
    flood:1, perte_gdp:15, perte_pop:5,
    res:{ pétrole:92, gaz:85, finance:60 },
    note:"Chaleur extrême. Certaines zones inhabitables l'été (>55°C).",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "Iraq": {
    flag:"🇮🇶", capital:"Bagdad", pop:40, gdp:210,
    flood:3, perte_gdp:20, perte_pop:12,
    res:{ pétrole:82, gaz:70 },
    note:"⚠️ Basra submergée. Chaleur extrême. Réfugiés climatiques massifs.",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "UAE": {
    flag:"🇦🇪", capital:"Abu Dhabi", pop:10, gdp:500,
    flood:2, perte_gdp:18, perte_pop:8,
    res:{ pétrole:82, gaz:80, finance:80, tourisme:70 },
    note:"Dubaï côtière menacée. Chaleur extrême en été.",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "Qatar": {
    flag:"🇶🇦", capital:"Doha", pop:3, gdp:220,
    flood:2, perte_gdp:20, perte_pop:10,
    res:{ gaz:95, pétrole:82, finance:68 },
    note:"Péninsule basse très vulnérable. Chaleur extrême.",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "Israel": {
    flag:"🇮🇱", capital:"Jérusalem", pop:9, gdp:520,
    flood:1, perte_gdp:6, perte_pop:2,
    res:{ technologie:90, agriculture:72 },
    note:"Côte méditerranéenne menacée. Pénuries d'eau.",
    region:"Moyen-Orient", subregion:"Moyen-Orient"
  },
  "Egypt": {
    flag:"🇪🇬", capital:"Le Caire", pop:102, gdp:440,
    flood:3, perte_gdp:20, perte_pop:12,
    res:{ tourisme:65, gaz:55, agriculture:35, pétrole:45 },
    note:"⚠️ Delta du Nil partiellement submergé. Alexandrie menacée.",
    region:"Afrique du Nord", subregion:"Afrique du Nord"
  },

  // ── AFRIQUE ────────────────────────────────────────────────────────────────
  "Nigeria": {
    flag:"🇳🇬", capital:"Abuja", pop:211, gdp:440,
    flood:2, perte_gdp:14, perte_pop:8,
    res:{ pétrole:75, gaz:62, agriculture:55, or:45 },
    note:"Delta du Niger submergé. Lagos partiellement inondée.",
    region:"Afrique", subregion:"Afrique de l'Ouest"
  },
  "South Africa": {
    flag:"🇿🇦", capital:"Pretoria", pop:60, gdp:420,
    flood:1, perte_gdp:6, perte_pop:2,
    res:{ or:82, diamants:78, platine:88, charbon:65 },
    note:"Sécheresses au Cap. Côtes est modérément menacées.",
    region:"Afrique", subregion:"Afrique du Sud"
  },
  "Ethiopia": {
    flag:"🇪🇹", capital:"Addis-Abeba", pop:117, gdp:120,
    flood:1, perte_gdp:15, perte_pop:8,
    res:{ café:85, agriculture:52, eau:55 },
    note:"Sécheresses massives. Insécurité alimentaire critique.",
    region:"Afrique", subregion:"Afrique de l'Est"
  },
  "Kenya": {
    flag:"🇰🇪", capital:"Nairobi", pop:54, gdp:110,
    flood:1, perte_gdp:10, perte_pop:5,
    res:{ thé:80, tourisme:65, fleurs:75 },
    note:"Côte de Mombasa menacée. Sécheresses intérieures.",
    region:"Afrique", subregion:"Afrique de l'Est"
  },
  "Morocco": {
    flag:"🇲🇦", capital:"Rabat", pop:37, gdp:130,
    flood:1, perte_gdp:8, perte_pop:3,
    res:{ phosphate:85, tourisme:65, agriculture:55 },
    note:"Casablanca et Rabat partiellement menacées. Désertification.",
    region:"Afrique du Nord", subregion:"Afrique du Nord"
  },
  "Algeria": {
    flag:"🇩🇿", capital:"Alger", pop:44, gdp:170,
    flood:1, perte_gdp:7, perte_pop:3,
    res:{ pétrole:78, gaz:82, phosphate:52 },
    note:"Côtes nord menacées. Sahara en expansion.",
    region:"Afrique du Nord", subregion:"Afrique du Nord"
  },
  "Libya": {
    flag:"🇱🇾", capital:"Tripoli", pop:7, gdp:40,
    flood:1, perte_gdp:10, perte_pop:5,
    res:{ pétrole:82, gaz:72 },
    note:"Côtes méditerranéennes menacées. Chaleur extrême.",
    region:"Afrique du Nord", subregion:"Afrique du Nord"
  },
  "Ghana": {
    flag:"🇬🇭", capital:"Accra", pop:32, gdp:75,
    flood:2, perte_gdp:12, perte_pop:6,
    res:{ or:70, cacao:82, pétrole:50 },
    note:"Côtes d'Accra menacées. Érosion côtière sévère.",
    region:"Afrique", subregion:"Afrique de l'Ouest"
  },
  "Angola": {
    flag:"🇦🇴", capital:"Luanda", pop:33, gdp:90,
    flood:2, perte_gdp:10, perte_pop:5,
    res:{ pétrole:82, diamants:68, agriculture:42 },
    note:"Côtes de Luanda menacées. Sécheresses dans le sud.",
    region:"Afrique", subregion:"Afrique Centrale"
  },
  "Tanzania": {
    flag:"🇹🇿", capital:"Dodoma", pop:61, gdp:68,
    flood:1, perte_gdp:10, perte_pop:5,
    res:{ or:62, tourisme:68, tanzanite:88 },
    note:"Côtes de Dar es-Salaam menacées. Kilimandjaro sans neige.",
    region:"Afrique", subregion:"Afrique de l'Est"
  },
  "Sudan": {
    flag:"🇸🇩", capital:"Khartoum", pop:44, gdp:35,
    flood:2, perte_gdp:18, perte_pop:10,
    res:{ pétrole:52, or:62, agriculture:38 },
    note:"Inondations du Nil et sécheresses alternées.",
    region:"Afrique", subregion:"Afrique de l'Est"
  },
  "Tunisia": {
    flag:"🇹🇳", capital:"Tunis", pop:12, gdp:46,
    flood:1, perte_gdp:8, perte_pop:3,
    res:{ phosphate:72, tourisme:68 },
    note:"Côtes tunisiennes menacées. Désertification accrue.",
    region:"Afrique du Nord", subregion:"Afrique du Nord"
  },

  // ── OCÉANIE ────────────────────────────────────────────────────────────────
  "Australia": {
    flag:"🇦🇺", capital:"Canberra", pop:26, gdp:1710,
    flood:1, perte_gdp:10, perte_pop:2,
    res:{ minerais:88, élevage:70, blé:60, tourisme:55 },
    note:"Grande Barrière de Corail détruite. Sécheresses et feux extrêmes.",
    region:"Océanie", subregion:"Océanie"
  },
  "New Zealand": {
    flag:"🇳🇿", capital:"Wellington", pop:5, gdp:240,
    flood:1, perte_gdp:6, perte_pop:2,
    res:{ agriculture:75, tourisme:68, pêche:65, géothermie:72 },
    note:"Côtes basses menacées. Réfugiés du Pacifique accueillis.",
    region:"Océanie", subregion:"Océanie"
  },

};
