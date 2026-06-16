/**
 * regions.js
 * Données climatiques 2050 par région interne (états, provinces, régions).
 *
 * La clé correspond au champ "name" dans les données Natural Earth admin-1.
 * flood       : 0=résilient 1=modéré 2=élevé 3=critique
 * elev_risk   : altitude moyenne (m) — zones <5m sont à risque submersion
 * flood_pct   : % du territoire potentiellement inondé en 2050
 * note        : situation spécifique 2050
 */

window.REGIONS = {

  // ══════════════════════════════════════════════════════════════════
  // FRANCE — Régions administratives
  // ══════════════════════════════════════════════════════════════════
  "Île-de-France":          { country:"France", flood:0, flood_pct:1,  note:"Paris et la Seine menacées par des crues centennales plus fréquentes." },
  "Bretagne":               { country:"France", flood:2, flood_pct:8,  note:"Submersions côtières. Saint-Malo et Brest partiellement menacées." },
  "Normandie":              { country:"France", flood:2, flood_pct:10, note:"Falaises en érosion. Marais du Cotentin submergés." },
  "Pays de la Loire":       { country:"France", flood:2, flood_pct:12, note:"Estuaire de la Loire élargi. Zones basses inondées." },
  "Nouvelle-Aquitaine":     { country:"France", flood:2, flood_pct:9,  note:"Bassin d'Arcachon menacé. Dunes de Gascogne en recul." },
  "Occitanie":              { country:"France", flood:1, flood_pct:5,  note:"Camargue submergée. Côtes languedociennes menacées." },
  "Provence-Alpes-Côte d'Azur": { country:"France", flood:2, flood_pct:7, note:"Côte d'Azur partiellement inondée. Camargue critique." },
  "Grand Est":              { country:"France", flood:0, flood_pct:2,  note:"Peu de côtes. Crues du Rhin plus fréquentes." },
  "Hauts-de-France":        { country:"France", flood:2, flood_pct:11, note:"Dunkerque et Calais menacées. Plaines inondables." },
  "Auvergne-Rhône-Alpes":   { country:"France", flood:0, flood_pct:1,  note:"Massif Central protège. Fonte des glaciers alpins." },
  "Bourgogne-Franche-Comté":{ country:"France", flood:0, flood_pct:1,  note:"Peu affectée. Crues de la Saône accrues." },
  "Centre-Val de Loire":    { country:"France", flood:1, flood_pct:4,  note:"Crues de la Loire plus sévères." },

  // ══════════════════════════════════════════════════════════════════
  // ÉTATS-UNIS — États
  // ══════════════════════════════════════════════════════════════════
  "Florida":      { country:"US", flood:3, flood_pct:35, note:"⚠️ Sud de la Floride submergé. Miami inondable. 2M+ réfugiés." },
  "Louisiana":    { country:"US", flood:3, flood_pct:40, note:"⚠️ La Nouvelle-Orléans abandonnée partiellement. Delta du Mississippi." },
  "Texas":        { country:"US", flood:2, flood_pct:12, note:"Houston et Galveston menacées. Ouragans intenses." },
  "California":   { country:"US", flood:1, flood_pct:5,  note:"Sacramento Delta menacé. Sécheresses et feux extrêmes." },
  "New York":     { country:"US", flood:2, flood_pct:8,  note:"Manhattan partiellement inondée. Staten Island évacuée." },
  "Virginia":     { country:"US", flood:2, flood_pct:10, note:"Norfolk s'enfonce. Côtes est menacées." },
  "North Carolina":{ country:"US", flood:2, flood_pct:9, note:"Outer Banks submergées. Wilmington menacée." },
  "South Carolina":{ country:"US", flood:2, flood_pct:11,note:"Charleston régulièrement inondée. Côtes basses." },
  "Georgia":      { country:"US", flood:1, flood_pct:6,  note:"Savannah et côtes menacées." },
  "Alabama":      { country:"US", flood:1, flood_pct:7,  note:"Mobile Bay élargi. Côtes du Golfe." },
  "Mississippi":  { country:"US", flood:2, flood_pct:15, note:"Delta du Mississippi très vulnérable." },
  "Washington":   { country:"US", flood:1, flood_pct:4,  note:"Seattle peu menacée. Îles San Juan submergées." },
  "Oregon":       { country:"US", flood:1, flood_pct:4,  note:"Côtes pacifiques en érosion." },
  "Alaska":       { country:"US", flood:1, flood_pct:3,  note:"Permafrost en dégel. Villages côtiers évacués." },
  "Hawaii":       { country:"US", flood:3, flood_pct:20, note:"⚠️ Plages disparaissent. Honolulu côtière menacée." },
  "Maine":        { country:"US", flood:1, flood_pct:5,  note:"Côtes rocheuses résistantes. Quelques zones basses." },
  "Massachusetts":{ country:"US", flood:2, flood_pct:9,  note:"Cape Cod submergée à 30%. Boston côtière menacée." },
  "New Jersey":   { country:"US", flood:2, flood_pct:14, note:"Atlantic City submergée. Barrières insulaires disparaissent." },
  "Delaware":     { country:"US", flood:3, flood_pct:25, note:"⚠️ État le plus bas des USA. 25% submergé." },
  "Maryland":     { country:"US", flood:2, flood_pct:12, note:"Chesapeake Bay élargie. Annapolis inondée." },
  "Colorado":     { country:"US", flood:0, flood_pct:0,  note:"État montagneux. Sécheresses, fonte des neiges." },
  "Montana":      { country:"US", flood:0, flood_pct:0,  note:"Glaciers du Glacier NP disparus en 2050." },
  "Wyoming":      { country:"US", flood:0, flood_pct:0,  note:"Yellowstone peu affecté. Sécheresses." },
  "Nevada":       { country:"US", flood:0, flood_pct:0,  note:"Las Vegas en stress hydrique critique." },
  "Arizona":      { country:"US", flood:0, flood_pct:0,  note:"Chaleur extrême. Phoenix à 50°C+ en été." },
  "Utah":         { country:"US", flood:0, flood_pct:0,  note:"Grand Lac Salé réduit de 90%." },
  "Idaho":        { country:"US", flood:0, flood_pct:0,  note:"Peu affecté. Ressources en eau sous pression." },
  "Minnesota":    { country:"US", flood:0, flood_pct:1,  note:"Pays des 10 000 lacs bénéficie du réchauffement." },
  "Wisconsin":    { country:"US", flood:0, flood_pct:2,  note:"Grands Lacs en hausse. Inondations intérieures." },
  "Michigan":     { country:"US", flood:0, flood_pct:2,  note:"Grands Lacs fluctuants. Detroit peu affecté." },
  "Illinois":     { country:"US", flood:1, flood_pct:3,  note:"Chicago peu menacée. Crues du Mississippi." },
  "Ohio":         { country:"US", flood:0, flood_pct:1,  note:"Peu affecté. Quelques crues de l'Ohio." },
  "Pennsylvania": { country:"US", flood:1, flood_pct:3,  note:"Philadelphie côtière légèrement menacée." },
  "Indiana":      { country:"US", flood:0, flood_pct:1,  note:"État intérieur, peu affecté." },
  "Iowa":         { country:"US", flood:0, flood_pct:1,  note:"Crues du Missouri accrues." },
  "Missouri":     { country:"US", flood:1, flood_pct:4,  note:"Inondations du Mississippi plus fréquentes." },
  "Arkansas":     { country:"US", flood:1, flood_pct:6,  note:"Delta de l'Arkansas inondable." },
  "Tennessee":    { country:"US", flood:0, flood_pct:2,  note:"Peu affecté. Crues de Tennessee River." },
  "Kentucky":     { country:"US", flood:0, flood_pct:2,  note:"État intérieur. Crues accrues." },
  "West Virginia":{ country:"US", flood:0, flood_pct:1,  note:"État montagneux. Peu de risques côtiers." },
  "Connecticut":  { country:"US", flood:2, flood_pct:10, note:"Côtes Long Island Sound menacées." },
  "Rhode Island": { country:"US", flood:2, flood_pct:12, note:"Providence partiellement inondée." },
  "Vermont":      { country:"US", flood:0, flood_pct:1,  note:"État intérieur montagneux. Peu affecté." },
  "New Hampshire":{ country:"US", flood:1, flood_pct:3,  note:"Courte côte atlantique menacée." },
  "Nebraska":     { country:"US", flood:0, flood_pct:0,  note:"Nappe phréatique Ogallala en déclin." },
  "Kansas":       { country:"US", flood:0, flood_pct:0,  note:"Sécheresses accrues. Agriculture sous pression." },
  "Oklahoma":     { country:"US", flood:0, flood_pct:1,  note:"Tornades plus intenses. Sécheresses." },
  "New Mexico":   { country:"US", flood:0, flood_pct:0,  note:"Chaleur et sécheresse extrêmes." },
  "South Dakota": { country:"US", flood:0, flood_pct:0,  note:"Sécheresses des Grandes Plaines." },
  "North Dakota": { country:"US", flood:0, flood_pct:0,  note:"Terres agricoles en stress hydrique." },

  // ══════════════════════════════════════════════════════════════════
  // ALLEMAGNE — Länder
  // ══════════════════════════════════════════════════════════════════
  "Schleswig-Holstein": { country:"Germany", flood:2, flood_pct:15, note:"Côtes de la Mer du Nord et Baltique menacées. Iles submergées." },
  "Hamburg":            { country:"Germany", flood:2, flood_pct:12, note:"Hambourg portuaire menacée. Elbe en crue." },
  "Bremen":             { country:"Germany", flood:2, flood_pct:10, note:"Zones portuaires inondées. Weser en crue." },
  "Niedersachsen":      { country:"Germany", flood:2, flood_pct:8,  note:"Plaines côtières basses inondables." },
  "Mecklenburg-Vorpommern":{ country:"Germany", flood:2, flood_pct:12, note:"Côte baltique en érosion. Usedom menacée." },
  "Brandenburg":        { country:"Germany", flood:0, flood_pct:2,  note:"Sécheresses accrues. Spree asséchée en été." },
  "Berlin":             { country:"Germany", flood:0, flood_pct:1,  note:"Canicules fréquentes. Peu de risques côtiers." },
  "Nordrhein-Westfalen":{ country:"Germany", flood:1, flood_pct:5,  note:"Inondations de l'Ahrtal (type 2021) plus fréquentes." },
  "Rheinland-Pfalz":    { country:"Germany", flood:1, flood_pct:4,  note:"Vallée du Rhin inondable." },
  "Saarland":           { country:"Germany", flood:0, flood_pct:1,  note:"Peu affecté. Crues de la Sarre." },
  "Hessen":             { country:"Germany", flood:0, flood_pct:1,  note:"Francfort peu menacée. Crues du Main." },
  "Thüringen":          { country:"Germany", flood:0, flood_pct:1,  note:"Etat intérieur. Peu affecté." },
  "Sachsen":            { country:"Germany", flood:0, flood_pct:2,  note:"Crues de l'Elbe accrues. Dresde menacée." },
  "Sachsen-Anhalt":     { country:"Germany", flood:0, flood_pct:2,  note:"Plaines de l'Elbe inondables." },
  "Bayern":             { country:"Germany", flood:0, flood_pct:1,  note:"Alpes bavaroises : fonte des glaciers. Munich peu menacée." },
  "Baden-Württemberg":  { country:"Germany", flood:0, flood_pct:1,  note:"Peu affecté. Canicules plus intenses." },

  // ══════════════════════════════════════════════════════════════════
  // ROYAUME-UNI — Nations et régions
  // ══════════════════════════════════════════════════════════════════
  "England":   { country:"United Kingdom", flood:2, flood_pct:8,  note:"Côtes est en érosion. Thames Barrier dépassée." },
  "Scotland":  { country:"United Kingdom", flood:1, flood_pct:4,  note:"Highlands protègent. Iles menacées. Éoliennes accrues." },
  "Wales":     { country:"United Kingdom", flood:1, flood_pct:5,  note:"Côtes ouest menacées. Cardiff en risque modéré." },
  "Northern Ireland":{ country:"United Kingdom", flood:1, flood_pct:4, note:"Belfast côtière légèrement menacée. Lough Neagh." },

  // ══════════════════════════════════════════════════════════════════
  // CHINE — Provinces
  // ══════════════════════════════════════════════════════════════════
  "Guangdong":  { country:"China", flood:3, flood_pct:20, note:"⚠️ Pearl River Delta. Guangzhou et Shenzhen menacées." },
  "Shanghai":   { country:"China", flood:3, flood_pct:30, note:"⚠️ Shanghai partiellement submergée. 10M évacués." },
  "Jiangsu":    { country:"China", flood:3, flood_pct:18, note:"⚠️ Delta du Yangtze. Nanjing menacée." },
  "Zhejiang":   { country:"China", flood:2, flood_pct:12, note:"Côtes en érosion. Hangzhou Bay menacée." },
  "Shandong":   { country:"China", flood:2, flood_pct:10, note:"Golfe de Bohai en montée." },
  "Hebei":      { country:"China", flood:1, flood_pct:5,  note:"Tianjin côtière menacée." },
  "Liaoning":   { country:"China", flood:1, flood_pct:6,  note:"Côtes de Mandchourie. Dalian en risque." },
  "Fujian":     { country:"China", flood:2, flood_pct:8,  note:"Côtes rocheuses mais typhons plus intenses." },
  "Hainan":     { country:"China", flood:3, flood_pct:25, note:"⚠️ Île tropicale. Côtes basses submergées." },
  "Sichuan":    { country:"China", flood:0, flood_pct:1,  note:"Intérieur montagneux. Sécheresses accrues." },
  "Xinjiang":   { country:"China", flood:0, flood_pct:0,  note:"Désertification. Glaciers du Tian Shan en fonte." },
  "Tibet":      { country:"China", flood:0, flood_pct:0,  note:"Plateau du Tibet. Glaciers himalayens en fonte critique." },
  "Yunnan":     { country:"China", flood:0, flood_pct:2,  note:"Biodiversité menacée. Crues des fleuves." },
  "Heilongjiang":{ country:"China", flood:0, flood_pct:1, note:"Permafrost en dégel. Peu de côtes." },

  // ══════════════════════════════════════════════════════════════════
  // INDE — États
  // ══════════════════════════════════════════════════════════════════
  "West Bengal":     { country:"India", flood:3, flood_pct:25, note:"⚠️ Delta du Gange-Brahmapoutre. Kolkata menacée." },
  "Odisha":          { country:"India", flood:3, flood_pct:20, note:"⚠️ Côtes très basses. Cyclones intenses." },
  "Andhra Pradesh":  { country:"India", flood:2, flood_pct:12, note:"Delta du Krishna et Godavari menacés." },
  "Tamil Nadu":      { country:"India", flood:2, flood_pct:10, note:"Chennai inondée régulièrement. Côtes menacées." },
  "Kerala":          { country:"India", flood:2, flood_pct:12, note:"Backwaters submergés. Inondations + glissements." },
  "Maharashtra":     { country:"India", flood:2, flood_pct:8,  note:"Mumbai : zones basses inondées. Dharavi menacé." },
  "Gujarat":         { country:"India", flood:2, flood_pct:10, note:"Golfe de Khambhat en montée. Ahmedabad canicules." },
  "Karnataka":       { country:"India", flood:1, flood_pct:5,  note:"Bengaluru peu menacée. Côtes sud à risque modéré." },
  "Rajasthan":       { country:"India", flood:0, flood_pct:0,  note:"Désert en expansion. Canicules extrêmes." },
  "Uttar Pradesh":   { country:"India", flood:1, flood_pct:4,  note:"Crues du Gange accrues. Varanasi menacée." },
  "Bihar":           { country:"India", flood:2, flood_pct:15, note:"Plaines inondables du Gange. Crues récurrentes." },
  "Assam":           { country:"India", flood:2, flood_pct:18, note:"Brahmapoutre en crue. Inondations chroniques." },

  // ══════════════════════════════════════════════════════════════════
  // BRÉSIL — États
  // ══════════════════════════════════════════════════════════════════
  "São Paulo":       { country:"Brazil", flood:1, flood_pct:3,  note:"Ville intérieure. Pluies extrêmes + îlots de chaleur." },
  "Rio de Janeiro":  { country:"Brazil", flood:2, flood_pct:10, note:"Zones côtières menacées. Favelas en risque glissement." },
  "Bahia":           { country:"Brazil", flood:1, flood_pct:5,  note:"Salvador côtière. Sécheresse du Nordeste accrues." },
  "Pará":            { country:"Brazil", flood:1, flood_pct:6,  note:"Estuaire de l'Amazone. Belém partiellement menacée." },
  "Amazonas":        { country:"Brazil", flood:1, flood_pct:4,  note:"Sécheresses de l'Amazonie (point de bascule 2040)." },
  "Minas Gerais":    { country:"Brazil", flood:0, flood_pct:2,  note:"Intérieur. Barrages en risque. Sécheresses." },
  "Rio Grande do Sul":{ country:"Brazil", flood:2, flood_pct:8, note:"Inondations catastrophiques accrues (type 2024)." },
  "Ceará":           { country:"Brazil", flood:1, flood_pct:5,  note:"Fortaleza côtière. Nordeste en crise hydrique." },
  "Maranhão":        { country:"Brazil", flood:2, flood_pct:12, note:"Delta du Parnaíba menacé. Côtes basses." },
  "Pernambuco":      { country:"Brazil", flood:2, flood_pct:8,  note:"Recife partiellement inondée. Côtes nord-est." },

  // ══════════════════════════════════════════════════════════════════
  // RUSSIE — Régions principales
  // ══════════════════════════════════════════════════════════════════
  "Moscow":          { country:"Russia", flood:0, flood_pct:1,  note:"Canicules plus fréquentes. Peu de risques côtiers." },
  "Saint Petersburg":{ country:"Russia", flood:2, flood_pct:10, note:"Golfe de Finlande. Digue de Saint-Pétersbourg sous pression." },
  "Krasnodar Krai":  { country:"Russia", flood:1, flood_pct:6,  note:"Mer Noire et Mer d'Azov en montée." },
  "Astrakhan Oblast":{ country:"Russia", flood:2, flood_pct:15, note:"Delta de la Volga submergé. Mer Caspienne fluctuante." },
  "Yakutia":         { country:"Russia", flood:0, flood_pct:0,  note:"Permafrost en dégel massif. Infrastructures effondrées." },
  "Murmansk Oblast": { country:"Russia", flood:1, flood_pct:3,  note:"Arctique accessible. Ressources exploitables." },
  "Sakhalin Oblast": { country:"Russia", flood:1, flood_pct:5,  note:"Île côtière. Tsunamis et montée des eaux." },
  "Primorsky Krai":  { country:"Russia", flood:1, flood_pct:4,  note:"Vladivostok côtière. Typhons plus intenses." },

  // ══════════════════════════════════════════════════════════════════
  // AUSTRALIE — États
  // ══════════════════════════════════════════════════════════════════
  "Queensland":           { country:"Australia", flood:2, flood_pct:8,  note:"Grande Barrière de Corail détruite. Cairns menacée. Cyclones." },
  "New South Wales":      { country:"Australia", flood:1, flood_pct:5,  note:"Sydney côtière. Feux de brousse extrêmes." },
  "Victoria":             { country:"Australia", flood:1, flood_pct:4,  note:"Melbourne peu menacée. Sécheresses et feux." },
  "South Australia":      { country:"Australia", flood:1, flood_pct:6,  note:"Gulf St Vincent. Adélaïde en stress hydrique." },
  "Western Australia":    { country:"Australia", flood:1, flood_pct:5,  note:"Perth en sécheresse. Côtes nord menacées." },
  "Northern Territory":   { country:"Australia", flood:2, flood_pct:10, note:"Darwin inondée. Zones côtières tropicales submergées." },
  "Tasmania":             { country:"Australia", flood:1, flood_pct:4,  note:"Île côtière. Hobart légèrement menacée." },

  // ══════════════════════════════════════════════════════════════════
  // CANADA — Provinces
  // ══════════════════════════════════════════════════════════════════
  "British Columbia":     { country:"Canada", flood:1, flood_pct:4, note:"Vancouver Island et côtes menacées. Feux de forêt." },
  "Alberta":              { country:"Canada", flood:0, flood_pct:0, note:"Sécheresses des prairies. Glaciers des Rocheuses en fonte." },
  "Saskatchewan":         { country:"Canada", flood:0, flood_pct:0, note:"Prairies en sécheresse. Nouvelles terres agricoles au nord." },
  "Manitoba":             { country:"Canada", flood:0, flood_pct:1, note:"Lac Winnipeg en crue. Nouvelles terres cultivables." },
  "Ontario":              { country:"Canada", flood:0, flood_pct:2, note:"Grands Lacs fluctuants. Toronto peu menacée." },
  "Quebec":               { country:"Canada", flood:0, flood_pct:2, note:"Saint-Laurent en montée. Montréal peu menacée." },
  "Nova Scotia":          { country:"Canada", flood:2, flood_pct:10, note:"Côtes atlantiques en érosion. Halifax menacée." },
  "New Brunswick":        { country:"Canada", flood:1, flood_pct:6, note:"Baie de Fundy. Marées extrêmes accrues." },
  "Prince Edward Island": { country:"Canada", flood:3, flood_pct:20, note:"⚠️ Île basse. 20% du territoire submergé en 2050." },
  "Newfoundland and Labrador":{ country:"Canada", flood:1, flood_pct:3, note:"Côtes rocheuses résistantes. Quelques zones basses." },
  "Northwest Territories":{ country:"Canada", flood:0, flood_pct:0, note:"Permafrost en dégel. Nouvelles routes arctiques." },
  "Yukon":                { country:"Canada", flood:0, flood_pct:0, note:"Glaciers en fonte rapide. Peu de risques côtiers." },
  "Nunavut":              { country:"Canada", flood:1, flood_pct:3, note:"Arctique en transformation. Passage du Nord-Ouest ouvert." },

  // ══════════════════════════════════════════════════════════════════
  // ESPAGNE — Communautés autonomes
  // ══════════════════════════════════════════════════════════════════
  "Cataluña":       { country:"Spain", flood:1, flood_pct:5, note:"Barcelone côtière. Delta de l'Èbre submergé." },
  "Andalucía":      { country:"Spain", flood:2, flood_pct:8, note:"Désertification. Doñana asséché. Marismas submergées." },
  "Valencia":       { country:"Spain", flood:2, flood_pct:10, note:"Albufera et zones côtières submergées (type DANA 2024)." },
  "Galicia":        { country:"Spain", flood:1, flood_pct:4, note:"Côtes atlantiques en érosion. Rías en montée." },
  "País Vasco":     { country:"Spain", flood:1, flood_pct:3, note:"Bilbao côtière. Tempêtes atlantiques accrues." },
  "Murcia":         { country:"Spain", flood:2, flood_pct:7, note:"Désertification avancée. Mar Menor asséché." },
  "Islas Canarias": { country:"Spain", flood:2, flood_pct:10, note:"Îles volcaniques. Côtes basses menacées. Tourisme impacté." },
  "Islas Baleares": { country:"Spain", flood:2, flood_pct:12, note:"Ibiza et Majorque : plages submergées. Tourisme menacé." },
  "Madrid":         { country:"Spain", flood:0, flood_pct:0, note:"Intérieur. Canicules extrêmes. Manque d'eau." },
  "Castilla y León":{ country:"Spain", flood:0, flood_pct:1, note:"Meseta en sécheresse. Agriculture sous pression." },

  // ══════════════════════════════════════════════════════════════════
  // ITALIE — Régions
  // ══════════════════════════════════════════════════════════════════
  "Veneto":           { country:"Italy", flood:3, flood_pct:25, note:"⚠️ Venise submergée. MOSE insuffisant. Padoue en risque." },
  "Friuli-Venezia Giulia":{ country:"Italy", flood:2, flood_pct:10, note:"Trieste et côtes adriatiques menacées." },
  "Emilia-Romagna":   { country:"Italy", flood:2, flood_pct:12, note:"Plaine du Pô inondable. Ravenne en risque." },
  "Toscana":          { country:"Italy", flood:1, flood_pct:6, note:"Florence peu menacée. Côtes toscanes en érosion." },
  "Lazio":            { country:"Italy", flood:1, flood_pct:5, note:"Rome peu menacée. Ostie et delta du Tibre." },
  "Campania":         { country:"Italy", flood:2, flood_pct:8, note:"Naples côtière. Ischia et Procida menacées." },
  "Sicilia":          { country:"Italy", flood:2, flood_pct:10, note:"Côtes siciliennes. Canicules extrêmes. Sécheresse." },
  "Sardegna":         { country:"Italy", flood:1, flood_pct:5, note:"Côtes ouest menacées. Désertification." },
  "Puglia":           { country:"Italy", flood:2, flood_pct:8, note:"Talon de la botte : côtes basses menacées." },
  "Calabria":         { country:"Italy", flood:1, flood_pct:5, note:"Détroit de Messine. Côtes en érosion." },
  "Lombardia":        { country:"Italy", flood:0, flood_pct:1, note:"Milan. Fonte des glaciers alpins. Crues du Pô." },
  "Piemonte":         { country:"Italy", flood:0, flood_pct:1, note:"Alpes en fonte. Turin peu menacée." },

  // ══════════════════════════════════════════════════════════════════
  // PAYS-BAS — Provinces
  // ══════════════════════════════════════════════════════════════════
  "Zuid-Holland":   { country:"Netherlands", flood:3, flood_pct:40, note:"⚠️ Rotterdam et La Haye. Digues maximales. Évacuations." },
  "Noord-Holland":  { country:"Netherlands", flood:3, flood_pct:35, note:"⚠️ Amsterdam sous le niveau de la mer. Défenses critiques." },
  "Zeeland":        { country:"Netherlands", flood:3, flood_pct:50, note:"⚠️ Province la plus menacée. 50% submergé sans digues." },
  "Groningen":      { country:"Netherlands", flood:3, flood_pct:30, note:"⚠️ Côtes de la Mer du Nord. Affaissement du sol accentué." },
  "Friesland":      { country:"Netherlands", flood:3, flood_pct:25, note:"⚠️ Iles des Wadden submergées. Digues renforcées." },
  "Utrecht":        { country:"Netherlands", flood:2, flood_pct:15, note:"Intérieur mais zones basses à risque." },
  "Gelderland":     { country:"Netherlands", flood:2, flood_pct:10, note:"Rivières en crue. Zones inondables du Rhin." },
  "Overijssel":     { country:"Netherlands", flood:1, flood_pct:5,  note:"Crues de l'IJssel. Impact modéré." },
  "Noord-Brabant":  { country:"Netherlands", flood:1, flood_pct:5,  note:"Peu côtière. Crues de la Meuse." },
  "Limburg":        { country:"Netherlands", flood:1, flood_pct:6,  note:"Inondations de la Meuse (type 2021) plus fréquentes." },
  "Flevoland":      { country:"Netherlands", flood:3, flood_pct:45, note:"⚠️ Polder artificiel. Totalement dépendant des pompes." },
  "Drenthe":        { country:"Netherlands", flood:1, flood_pct:3,  note:"Élevé mais peu côtier. Crues accrues." },

};
