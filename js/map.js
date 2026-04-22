// ==========================================
// 1. INISIALISASI PETA & STATE LOKAL
// ==========================================

let currentDataMap = {}; 
let dynamicThresholdsPolres = { low: 0, med: 0, high: 0 };
let dynamicThresholdsPolda = { low: 0, med: 0, high: 0 };
let dynamicThresholdsNational = { year: { low: 0, med: 0, high: 0 }, quarter: { low: 0, med: 0, high: 0 }, month: { low: 0, med: 0, high: 0 } };
let currentPoldaRanks = {}; 
let globalMaxRisk = 0; 
let poldaStructure = {};
let polresLookup = {}; 
let poldaBounds = {};
let geoPropertiesLookup = {};
let grandTotalPoints = 0; 
let currentFatalityTargetFR = 0; // State untuk menyimpan Target FR secara global

const basePath = './data/';

const map = new maplibregl.Map({ 
    container: 'map', 
    preserveDrawingBuffer: true, 
    style: { 
        version: 8, 
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: { 
            'osm': { type: 'raster', tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }, 
            'esri': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 }, 
            'g-sat': { type: 'raster', tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'], tileSize: 256 }, 
            'g-traffic': { type: 'raster', tiles: ['https://mt1.google.com/vt/lyrs=y,traffic&x={x}&y={y}&z={z}'], tileSize: 256 }, 
            'google': { type: 'raster', tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'], tileSize: 256 } 
        }, 
        layers: [ 
            { id: 'base-osm', type: 'raster', source: 'osm', layout: { visibility: 'visible' } }, 
            { id: 'base-esri', type: 'raster', source: 'esri', layout: { visibility: 'none' } }, 
            { id: 'base-g-sat', type: 'raster', source: 'g-sat', layout: { visibility: 'none' } }, 
            { id: 'base-g-traffic', type: 'raster', source: 'g-traffic', layout: { visibility: 'none' } }, 
            { id: 'base-google', type: 'raster', source: 'google', layout: { visibility: 'none' } } 
        ] 
    }, 
    center: [110.0, -3.0], 
    zoom: 4.0 
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

// ==========================================
// 2. FUNGSI PEMUATAN DATA SPASIAL (GEOJSON)
// ==========================================

function extractGeojsonName(properties) {
    if (properties.Polres && properties.Polres.trim() !== "") return properties.Polres.trim();
    if (properties.polres && properties.polres.trim() !== "") return properties.polres.trim();
    if (properties.NAMOBJ && properties.NAMOBJ.trim() !== "") return properties.NAMOBJ.trim();
    if (properties.WADMKK && properties.WADMKK.trim() !== "") return properties.WADMKK.trim();
    return "";
}

async function initialLoadGeoJSON() {
    poldaStructure = {}; polresLookup = {}; poldaBounds = {}; geoPropertiesLookup = {}; 

    try {
        // 1. HANYA FETCH 1 FILE TUNGGAL!
        const response = await fetch(basePath + 'Polres.geojson?v=' + new Date().getTime());
        const geojsonData = await response.json();

        // 2. PROSES DATA PROPERTY
        geojsonData.features.forEach(f => {
            const geoName = extractGeojsonName(f.properties); 
            
            // Mengakali perubahan nama kolom dari QGIS (Case-Insensitive)
            const keys = Object.keys(f.properties);
            const getValByKeyword = (keywords) => {
                let k = keys.find(key => keywords.some(kw => key.toLowerCase().includes(kw)));
                return k ? f.properties[k] : null;
            };

            // Tarik nama Polda dengan pencarian dinamis
            const rawPoldaName = getValByKeyword(['polda', 'wadmpr']) || "MABES POLRI";
            const poldaName = typeof getPoldaLabelFromDbValue === 'function' ? (getPoldaLabelFromDbValue(rawPoldaName) || rawPoldaName) : rawPoldaName;
            
            const cleanName = normalizeDbPolresName(geoName);
            const uniqueKey = generateCompositeKey(poldaName, cleanName);

            // =================================================================
            // KUNCI PERBAIKAN: TARIK DATA PRESISI SESUAI FIELD GEOJSON ANDA
            // =================================================================
            // Sistem akan mencari nama kolom pasti Anda terlebih dahulu, jika gagal baru memakai pencarian kata kunci
            let rawLuas = f.properties.Luas !== undefined ? f.properties.Luas : getValByKeyword(['luas']);
            let rawLen = f.properties.Panjang_km !== undefined ? f.properties.Panjang_km : getValByKeyword(['panjang_km', 'panjang']);
            let rawDens = f.properties.Kepadatan !== undefined ? f.properties.Kepadatan : getValByKeyword(['kepadatan']);
            let rawPop = f.properties.Penduduk !== undefined ? f.properties.Penduduk : getValByKeyword(['penduduk', 'pop']);

            // Parsing angka (Aman dari format text berkoma hasil export QGIS)
            let luasAreaKm2 = parseFloat(String(rawLuas).replace(',', '.')) || 1.0;
            let panjangJalan = parseFloat(String(rawLen).replace(',', '.')) || 1.0;
            let kepadatanPenduduk = parseFloat(String(rawDens).replace(',', '.')) || 1.0;
            let populasiAbsolut = parseFloat(String(rawPop).replace(',', '.')) || 0;
            let rawFaskes = f.properties.faskes !== undefined ? f.properties.faskes : getValByKeyword(['faskes', 'rs', 'kesehatan']);
            let jumlahFaskes = parseInt(rawFaskes) || 0;

            let rawKeramaian = f.properties.keramaian !== undefined ? f.properties.keramaian : getValByKeyword(['keramaian', 'ramai']);
            let jumlahKeramaian = parseInt(rawKeramaian) || 0;

            let rawUji = f.properties.uji !== undefined ? f.properties.uji : getValByKeyword(['uji', 'kir']);
            let jumlahUji = parseInt(rawUji) || 0;
            
            let rawEtle = f.properties.etle !== undefined ? f.properties.etle : getValByKeyword(['etle', 'kamera', 'tilang']);
            let jumlahEtle = parseInt(rawEtle) || 0;

            // [PERBAIKAN]: Tarik jumlah APILL (Lampu Merah) dari GeoJSON
            let rawApill = f.properties.APILL !== undefined ? f.properties.APILL : getValByKeyword(['apill', 'lampu', 'traffic_signals']);
            let jumlahApill = parseInt(rawApill) || 0;

            // Cegah hasil NaN
            if (isNaN(luasAreaKm2) || luasAreaKm2 <= 0) luasAreaKm2 = 1.0;
            if (isNaN(panjangJalan) || panjangJalan <= 0) panjangJalan = 1.0;
            if (isNaN(kepadatanPenduduk) || kepadatanPenduduk <= 0) kepadatanPenduduk = 1.0;
            if (isNaN(populasiAbsolut)) populasiAbsolut = 0;

            if (cleanName) {
                geoPropertiesLookup[uniqueKey] = { 
                    len: panjangJalan, dens: kepadatanPenduduk, pop: populasiAbsolut, area: luasAreaKm2,
                    faskes: jumlahFaskes, keramaian: jumlahKeramaian, uji: jumlahUji, etle: jumlahEtle,
                    apill: jumlahApill // [SIMPAN APILL KE MEMORI]
                };
                
                // ... (Biarkan kode di bawahnya tetap sama)
                if (!poldaStructure[poldaName]) poldaStructure[poldaName] = [];
                if (!poldaStructure[poldaName].includes(cleanName)) poldaStructure[poldaName].push(cleanName);
                
                if (!polresLookup[cleanName]) polresLookup[cleanName] = [];
                if (!polresLookup[cleanName].includes(poldaName)) polresLookup[cleanName].push(poldaName);

                if (!poldaBounds[poldaName]) poldaBounds[poldaName] = { bounds: new maplibregl.LngLatBounds(), geoJSON: { type: 'FeatureCollection', features: [] } };
                poldaBounds[poldaName].geoJSON.features.push(f);

                if (f.geometry) {
                    const extendBounds = (coords) => {
                        if (typeof coords[0] === 'number') poldaBounds[poldaName].bounds.extend(coords);
                        else coords.forEach(c => extendBounds(c));
                    };
                    extendBounds(f.geometry.coordinates);
                }
            }
            
            f.properties._clean_name = cleanName;
            f.properties._composite_key = uniqueKey; 
            f.properties._orig_name = geoName;
            f.properties._polda_name = poldaName;
        });

        // 3. TAMBAHKAN HANYA 1 SOURCE & 1 LAYER KE MAPLIBRE
        map.addSource('src-nasional', { type: 'geojson', data: geojsonData });
        
        map.addLayer({ 
            id: 'layer-nasional-fill', 
            type: 'fill', 
            source: 'src-nasional', 
            layout: { 'visibility': 'visible' }, 
            paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.6, 'fill-outline-color': 'white' } 
        }, 'highlight-line'); 
        
        map.addLayer({ 
            id: 'layer-nasional-line', 
            type: 'line', 
            source: 'src-nasional', 
            layout: { 'visibility': 'visible' }, 
            paint: { 'line-color': '#fff', 'line-width': 0.5 } 
        });

    } catch (e) {
        console.error("Gagal memuat Peta Nasional GeoJSON:", e);
    }
}

async function updatePointLayerData() {
    // [PERBAIKAN]: Matikan Layer Titik jika berada di mode Keselamatan, Ketertiban, ATAU Kelancaran
    if (currentMode === 'fatality' || currentMode === 'fatality_pop' || currentMode === 'fatality_veh' || currentMode === 'ketertiban' || currentMode === 'kelancaran') {
        if (map.getSource('points-source')) map.getSource('points-source').setData({ type: 'FeatureCollection', features: [] });
        const legendText = document.getElementById('pointLegendText');
        if (legendText) legendText.parentElement.parentElement.style.setProperty('display', 'none', 'important'); // Sembunyikan paksa box legenda titik
        return;
    }

    // Tampilkan kembali box legenda jika kembali ke mode Keamanan
    const legendBox = document.getElementById('pointLegendPanel');
    if (legendBox) legendBox.style.display = 'flex';

    const pointGeoJSON = await fetchPointData();
    if (map.getSource('points-source')) map.getSource('points-source').setData(pointGeoJSON);

    const isRisk = currentMode === 'risk';
    const clusterColors = isRisk ? ['step', ['get', 'point_count'], '#ef4444', 50, '#b91c1c', 200, '#7f1d1d', 500, '#450a0a'] : ['step', ['get', 'point_count'], '#eab308', 50, '#ca8a04', 200, '#a16207', 500, '#713f12'];
    const pointColor = isRisk ? '#ef4444' : '#eab308'; 

    if (map.getLayer('clusters')) { map.setPaintProperty('clusters', 'circle-color', clusterColors); map.setPaintProperty('clusters', 'circle-stroke-color', clusterColors); }
    if (map.getLayer('unclustered-point')) { map.setPaintProperty('unclustered-point', 'circle-color', pointColor); map.setPaintProperty('unclustered-point', 'circle-stroke-color', pointColor); }

    const legendText = document.getElementById('pointLegendText');
    const legendIcon = document.getElementById('pointLegendIcon');
    const legendTitle = document.getElementById('pointLegendTitle'); 

    if (legendText && legendIcon) {
        legendText.innerText = isRisk ? "Titik Blackspot Aktif" : "Titik Troublespot Aktif";
        if (legendTitle) legendTitle.innerText = isRisk ? "Layer Blackspot" : "Layer Troublespot";
        legendIcon.style.borderColor = pointColor;
        legendIcon.style.background = isRisk ? '#ef44444d' : '#eab3084d'; 
    }
}

// --- HELPER DEMOGRAFI GLOBAL UNTUK PETA & GRAFIK ---
window.getFilteredDemography = function(targetYear, targetPolda = null) {
    let pop = 0, veh = 0, drv = 0, len = 0, etle = 0, keramaian = 0, apill = 0;

    for (let uniqueKey in geoPropertiesLookup) {
        let parts = uniqueKey.split('_');
        let poldaLabel = parts[0]; 
        let cleanPolres = parts[1];

        if (targetPolda && poldaLabel !== targetPolda) continue;

        let isAllowedPolres = false;
        if (currentFilters.poldas.includes('All') && currentFilters.polres.includes('All')) { 
            isAllowedPolres = true; 
        } else if (!currentFilters.polres.includes('All')) {
            for (let sel of currentFilters.polres) {
                let cleanSel = normalizeDbPolresName(sel.split('###')[0]);
                if (cleanSel.startsWith("DITLANTAS")) {
                    let selPolda = cleanSel.replace("DITLANTAS ", "").toUpperCase();
                    if (poldaLabel.toUpperCase() === selPolda && cleanPolres.startsWith("DITLANTAS")) { isAllowedPolres = true; break; }
                } else { 
                    if (cleanPolres === cleanSel) { isAllowedPolres = true; break; } 
                }
            }
        } else if (!currentFilters.poldas.includes('All')) {
            for (let dbPolda of currentFilters.poldas) {
                if (getPoldaLabelFromDbValue(dbPolda) === poldaLabel) { isAllowedPolres = true; break; }
            }
        }

        if (isAllowedPolres) {
            if (targetYear >= 2025 || targetYear === 'All') pop += geoPropertiesLookup[uniqueKey].pop || 0; 
            else {
                let dbPop = rawPopulationData.find(r => parseInt(r.tahun) === targetYear && normalizeDbPolresName(r.polres) === cleanPolres);
                if (dbPop) pop += parseFloat(dbPop.populasi || 0);
            }
            
            let dbVeh = rawVehicleData.find(r => parseInt(r.tahun) === targetYear && normalizeDbPolresName(r.polres) === cleanPolres);
            if (dbVeh) veh += parseFloat(dbVeh.total_kendaraan || 0);

            let tDrv = targetYear;
            if (tDrv === 2021 || tDrv === 2023) tDrv = 2022; if (tDrv === 2026) tDrv = 2025;
            let dbDriver = rawDriverData.find(r => parseInt(r.tahun) === tDrv && normalizeDbPolresName(r.polres) === cleanPolres);
            if (dbDriver) drv += parseFloat(dbDriver.total_pengemudi || 0);

            len += geoPropertiesLookup[uniqueKey].len || 0;
            etle += geoPropertiesLookup[uniqueKey].etle || 0;
            keramaian += geoPropertiesLookup[uniqueKey].keramaian || 0;
            apill += geoPropertiesLookup[uniqueKey].apill || 0; // [TAMBAHKAN INI]
        }
    }
    return { pop, veh, drv, len, etle, keramaian, apill }; // [PERBAIKAN]: Kirimkan datanya!
}

// --- KLASIFIKASI 4 WARNA IFP ---
function getIFPClassification(ifp, target) {
    if (ifp === null || isNaN(ifp)) return { label: 'NO DATA', color: '#94a3b8', bg: '#f1f5f9' }; // Hapus '|| ifp === 0'
    if (ifp <= target) return { label: 'AMAN', color: '#22c55e', bg: '#dcfce7' };
    if (ifp <= target * 1.1) return { label: 'WASPADA', color: '#eab308', bg: '#fef9c3' };
    if (ifp <= target * 1.3) return { label: 'RAWAN', color: '#f97316', bg: '#ffedd5' };
    return { label: 'KRITIS', color: '#ef4444', bg: '#fee2e2' };
}

function getIFKClassification(ifk, target) {
    if (ifk === null || isNaN(ifk)) return { label: 'NO DATA', color: '#94a3b8', bg: '#f1f5f9' }; // Hapus '|| ifk === 0'
    if (ifk <= target) return { label: 'AMAN', color: '#22c55e', bg: '#dcfce7' }; 
    if (ifk <= target * 1.15) return { label: 'WASPADA', color: '#eab308', bg: '#fef9c3' }; 
    if (ifk <= target * 1.35) return { label: 'RAWAN', color: '#f97316', bg: '#ffedd5' }; 
    return { label: 'KRITIS', color: '#ef4444', bg: '#fee2e2' }; 
}
// ==========================================
// 3. FUNGSI LOGIKA KLASIFIKASI & SKORING
// ==========================================

function calculatePercentiles(data) {
    if (!data || data.length === 0) return { low: 0, med: 0, high: 0 };
    const validData = data.filter(v => v > 0);
    if (validData.length === 0) return { low: 0, med: 0, high: 0 };
    const sorted = [...validData].sort((a, b) => a - b);
    const getPercentile = (p) => {
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (upper >= sorted.length) return sorted[lower];
        return sorted[lower] * (1 - (index - lower)) + sorted[upper] * (index - lower);
    };
    let thresholds = { low: getPercentile(50), med: getPercentile(75), high: getPercentile(90) };
    if (thresholds.med <= thresholds.low) thresholds.med = thresholds.low + 0.001;
    if (thresholds.high <= thresholds.med) thresholds.high = thresholds.med + 0.001;
    return thresholds;
}

function calculateNationalThresholds(trendData) {
    const aggYearTotal = aggregateData(trendData).aggYear;
    const aggQuarterTotal = aggregateData(trendData).aggQuarter;
    const aggMonthTotal = aggregateData(trendData).aggMonth;
    dynamicThresholdsNational.year = calculatePercentiles(Object.values(aggYearTotal));
    dynamicThresholdsNational.quarter = calculatePercentiles(Object.values(aggQuarterTotal));
    dynamicThresholdsNational.month = calculatePercentiles(Object.values(aggMonthTotal));
}

function getRiskClassification(value, scope, period = 'year') {
    const isTraffic = currentMode === 'traffic';
    let thresholds = { low: 0, med: 0, high: 0 };

    if (scope === 'national') {
        if (isTraffic) {
            if (period === 'month') thresholds = { low: 2.0, med: 5.0, high: 10.0 };
            else if (period === 'quarter') thresholds = { low: 8.0, med: 15.0, high: 25.0 };
            else thresholds = { low: 30.0, med: 60.0, high: 100.0 };
        } else {
            if (period === 'month') thresholds = { low: 1.2, med: 1.8, high: 2.5 };
            else if (period === 'quarter') thresholds = { low: 3.5, med: 5.5, high: 8.0 };
            else thresholds = { low: 15.0, med: 20.0, high: 30.0 }; 
        }
    } else if (scope === 'polda') {
        thresholds = dynamicThresholdsPolda;
        if (thresholds.high === 0) thresholds = { low: 0.1, med: 0.5, high: 1.0 };
    } else {
        thresholds = dynamicThresholdsPolres;
        if (thresholds.high === 0) thresholds = { low: 0.1, med: 0.5, high: 1.0 };
    }

    if (value <= thresholds.low) return { label: 'AMAN', color: '#22c55e', bg: '#dcfce7' };
    if (value <= thresholds.med) return { label: 'WASPADA', color: '#eab308', bg: '#fef9c3' };
    if (value <= thresholds.high) return { label: 'RAWAN', color: '#f97316', bg: '#ffedd5' };
    return { label: 'KRITIS', color: '#ef4444', bg: '#fee2e2' };
}

// FUNGSI BARU: KLASIFIKASI 4 WARNA UNTUK FATALITY REDUCTION
function getFatalityClassification(frValue, targetFR) {
    if (frValue === null || isNaN(frValue)) return { label: 'NO DATA', color: '#94a3b8', bg: '#f1f5f9' };
    if (frValue <= targetFR) return { label: 'AMAN', color: '#22c55e', bg: '#dcfce7' }; 
    if (frValue <= 0) return { label: 'WASPADA', color: '#eab308', bg: '#fef9c3' }; 
    if (frValue <= 15) return { label: 'RAWAN', color: '#f97316', bg: '#ffedd5' }; 
    return { label: 'KRITIS', color: '#ef4444', bg: '#fee2e2' }; 
}

// --- FORMULA INDEKS KINERJA KETERTIBAN HOLISTIK (IKKH) Skala 0-100 ---
window.calculateIKKH = function(pb, pt, pengemudi, kendaraan, panjang, etle, timeDivisor = 1) {
    let adjPengemudi = pengemudi / timeDivisor;
    let adjKendaraan = kendaraan / timeDivisor;
    
    if (pt === 0) {
        // Bias Penindakan: Jika tidak menilang padahal jalan padat & kurang ETLE, dikurangi poinnya
        let gap = (adjKendaraan / (panjang || 1)) / ((etle || 0) + 1);
        let penalty = Math.min(40, Math.log10(gap + 1) * 15);
        return Math.max(0, 100 - penalty); 
    }
    
    let hrvr = (pb / pt) * 100;
    let severityPenalty = Math.min(40, hrvr * 0.4); // Max potong 40 poin
    
    let exposure = adjPengemudi > 0 ? (pb / adjPengemudi) * 10000 : 0;
    let exposurePenalty = Math.min(30, exposure * 0.5); // Max potong 30 poin
    
    let gap = (adjKendaraan / (panjang || 1)) / ((etle || 0) + 1);
    let gapPenalty = Math.min(30, Math.log10(gap + 1) * 10); // Max potong 30 poin
    
    let ikkh = 100 - (severityPenalty + exposurePenalty + gapPenalty);
    return Math.max(0, Math.min(100, ikkh));
};

// --- KLASIFIKASI 4 WARNA IKKH (REKALIBRASI REALISTIS) ---
function getKetertibanClassification(ikkh, scope = 'polres', period = 'year') {
    if (ikkh === null || isNaN(ikkh)) return { label: 'NO DATA', color: '#94a3b8', bg: '#f1f5f9' };

    // Standar kelulusan diturunkan menyesuaikan ketiadaan ETLE di mayoritas wilayah
    let thresholds = { aman: 50, waspada: 35, rawan: 20 }; 

    if (scope === 'national') {
        if (period === 'month') thresholds = { aman: 55, waspada: 40, rawan: 25 };
        else if (period === 'quarter') thresholds = { aman: 58, waspada: 43, rawan: 28 };
        else thresholds = { aman: 60, waspada: 45, rawan: 30 }; // Nasional
    } else if (scope === 'polda') {
        if (period === 'month') thresholds = { aman: 50, waspada: 35, rawan: 20 };
        else if (period === 'quarter') thresholds = { aman: 53, waspada: 38, rawan: 23 };
        else thresholds = { aman: 55, waspada: 40, rawan: 25 }; // Polda
    } else { // Polres (Fluktuasi sangat tinggi)
        if (period === 'month') thresholds = { aman: 45, waspada: 30, rawan: 15 };
        else if (period === 'quarter') thresholds = { aman: 48, waspada: 33, rawan: 18 };
        else thresholds = { aman: 50, waspada: 35, rawan: 20 }; 
    }

    if (ikkh >= thresholds.aman) return { label: 'AMAN', color: '#22c55e', bg: '#dcfce7' };
    if (ikkh >= thresholds.waspada) return { label: 'WASPADA', color: '#eab308', bg: '#fef9c3' };
    if (ikkh >= thresholds.rawan) return { label: 'RAWAN', color: '#f97316', bg: '#ffedd5' };
    return { label: 'KRITIS', color: '#ef4444', bg: '#fee2e2' };
}

// --- FORMULA INDEKS KELANCARAN LALU LINTAS (IKLL) Skala 0-100 ---
window.calculateIKLL = function(vcr, keramaian, troublespot, apill, panjang_jalan) {
    if (vcr === 0 && troublespot === 0) return 100; // Jika tidak ada laporan VCR/Macet, anggap sangat lancar
    
    let p = panjang_jalan || 1;
    
    // 1. Penalti Volume Kendaraan (Max Potong 50 poin) -> VCR 1.0 (Macet Total) = -50 Poin
    let penVcr = Math.min(50, vcr * 50);
    
    // 2. Penalti Hambatan Samping (Max Potong 30 poin) -> Menghitung rasio Pasar/Keramaian & Troublespot per km
    let rasioFriksi = (keramaian + troublespot) / p;
    let penFriksi = Math.min(30, rasioFriksi * 15);
    
    // 3. Penalti Kurangnya Manajemen APILL (Max Potong 20 poin) -> VCR tinggi tapi Lampu Merah/ATCS sedikit
    let densApill = apill / p;
    let rasioApill = vcr / (densApill + 0.1); // +0.1 menghindari pembagian dengan nol
    let penApill = Math.min(20, rasioApill * 5);

    let ikll = 100 - (penVcr + penFriksi + penApill);
    return Math.max(0, Math.min(100, ikll));
};

// --- KLASIFIKASI 4 WARNA KELANCARAN (IKLL) ---
// Semakin tinggi skor mendekati 100, semakin Hijau (Sama seperti IKKH)
function getKelancaranClassification(ikll) {
    if (ikll === null || isNaN(ikll)) return { label: 'NO DATA', color: '#94a3b8', bg: '#f1f5f9' };
    if (ikll >= 70) return { label: 'SANGAT LANCAR', color: '#22c55e', bg: '#dcfce7' }; // >= 70
    if (ikll >= 50) return { label: 'PADAT MERAYAP', color: '#eab308', bg: '#fef9c3' }; // 50 - 69
    if (ikll >= 30) return { label: 'TERSENDAT', color: '#f97316', bg: '#ffedd5' }; // 30 - 49
    return { label: 'MACET KRITIS', color: '#ef4444', bg: '#fee2e2' }; // < 30
}

// ==========================================
// 4. PIPELINE DATA: UPDATE DASHBOARD & PETA
// ==========================================

async function updateDashboardData() {
    const params = new URLSearchParams();
    if (currentFilters.year[0] !== 'All') params.append('year', currentFilters.year.join(','));
    else params.append('year', 'All');
    if (currentFilters.month[0] !== 'All') params.append('month', currentFilters.month.join(','));
    else params.append('month', 'All');
    
    let apiPoldas = currentFilters.poldas[0] === 'All' ? [] : [...currentFilters.poldas];
    let apiPolres = [];
    let hasDitlantas = false;

    if (currentFilters.polres[0] !== 'All') {
        currentFilters.polres.forEach(p => {
            let raw = p.includes('###') ? p.split('###')[0] : p;
            let norm = normalizeDbPolresName(raw);
            if (norm && norm.startsWith("DITLANTAS")) hasDitlantas = true; 
            else apiPolres.push(raw);
        });
    }

    if (hasDitlantas) {
        params.append('poldas', 'All'); params.append('polres', 'All');
    } else {
        if (apiPoldas.length > 0) params.append('poldas', [...new Set(apiPoldas)].join(','));
        else params.append('poldas', 'All');
        if (apiPolres.length > 0) params.append('polres', [...new Set(apiPolres)].join(','));
    }

    params.append('mode', currentMode);

    try {
        // [PERBAIKAN]: Pastikan ke-3 mode keselamatan masuk ke pintu ini!
        if (currentMode === 'fatality' || currentMode === 'fatality_pop' || currentMode === 'fatality_veh') {
            await processFatalityMode(); // Tunggu data selesai dihitung
            
            // Panggil render grafik tren (Tahun/Kuartal/Bulan) HARI INI JUGA
            if (typeof renderInteractiveCharts === 'function') renderInteractiveCharts();
            if (typeof renderFRChart === 'function') renderFRChart(); // <--- TAMBAHKAN BARIS INI
            
            zoomToFilteredExtent();
            return; // Kunci Penting: Berhenti di sini, jangan lanjut ke kode Keamanan!
        }

        if (currentMode === 'ketertiban') {
            await processKetertibanMode(); 
            if (typeof renderInteractiveCharts === 'function') renderInteractiveCharts();
            zoomToFilteredExtent();
            return; 
        }
        // [TAMBAHKAN INI]
        if (currentMode === 'kelancaran') {
            await processKelancaranMode(); 
            if (typeof renderInteractiveCharts === 'function') renderInteractiveCharts();
            zoomToFilteredExtent();
            return; 
        }

        // --- JALUR NORMAL KINERJA KEAMANAN ---
        let data = [];
        
        // [PERBAIKAN SERVERLESS]: Kita buat agregasi data secara mandiri dari memori (rawTrendData)
        // Tanpa perlu memanggil server backend sama sekali!
        let manualGroupedData = {};
        let activeYearStr = currentFilters.year[0];
        let isMonthAll = currentFilters.month[0] === 'All';

        if (rawTrendData && rawTrendData.length > 0) {
            rawTrendData.forEach(row => {
                let y = row._year !== undefined ? row._year : new Date(row.tanggal).getFullYear();
                if (isNaN(y) || (activeYearStr !== 'All' && y !== parseInt(activeYearStr))) return;
                
                let m = row._month !== undefined ? row._month : (new Date(row.tanggal).getMonth() + 1).toString();
                if (!isMonthAll && !currentFilters.month.includes(m)) return;

                let key = row.polda + "_" + row.polres;
                if (!manualGroupedData[key]) {
                    manualGroupedData[key] = { polda: row.polda, polres: row.polres, total_value: 0 };
                }
                manualGroupedData[key].total_value += row.value_amount;
            });
            data = Object.values(manualGroupedData);
        }

        currentDataMap = {}; globalMaxRisk = 0; grandTotalPoints = 0; let tableAggregations = {};
        
        // [PERBAIKAN KUNCI 3]: Daftarkan semua Polres dengan risiko 0
        for (let uniqueKey in geoPropertiesLookup) {
            currentDataMap[uniqueKey] = { risk: 0, raw: 0 };
        }

        let allowedPoldas = new Set();
        const selectedPoldas = currentFilters.poldas;
        const selectedPolres = currentFilters.polres;

        if (!selectedPolres.includes('All')) {
            selectedPolres.forEach(sel => {
                let poldaLabel = null;
                if (sel.includes('###')) {
                    const pPoldaRaw = sel.split('###')[1];
                    poldaLabel = getPoldaLabelFromDbValue(pPoldaRaw) || getPoldaLabelFromDbValue("POLDA " + normalizeDbPoldaName(pPoldaRaw));
                } else {
                    const cleanPolres = normalizeDbPolresName(sel);
                    if (cleanPolres.startsWith("DITLANTAS")) {
                        let pTarget = cleanPolres.replace("DITLANTAS ", "").toUpperCase();
                        let found = poldaConfig.find(c => c.label.toUpperCase() === pTarget);
                        poldaLabel = found ? found.label : pTarget;
                    } else if (polresLookup[cleanPolres]) {
                        poldaLabel = polresLookup[cleanPolres][0];
                    }
                }
                if (poldaLabel) allowedPoldas.add(poldaLabel);
            });
        } else if (!selectedPoldas.includes('All')) {
            selectedPoldas.forEach(dbPolda => {
                const poldaLabel = getPoldaLabelFromDbValue(dbPolda);
                if (poldaLabel) allowedPoldas.add(poldaLabel);
            });
        } else {
            poldaConfig.forEach(cfg => allowedPoldas.add(cfg.label));
        }

        allowedPoldas.forEach(label => { tableAggregations[label] = 0; });

        let poldaGeoProps = {};
        for (let key in geoPropertiesLookup) {
            let pLabel = key.split('_')[0]; 
            if (!poldaGeoProps[pLabel]) poldaGeoProps[pLabel] = { len: 0, densSum: 0, count: 0 };
            poldaGeoProps[pLabel].len += geoPropertiesLookup[key].len;
            poldaGeoProps[pLabel].densSum += geoPropertiesLookup[key].dens;
            poldaGeoProps[pLabel].count += 1;
        }

        data.forEach(row => {
            const rawValue = parseFloat(row.total_value) || 0;
            if (row.polres && !row.polres.includes('PJR')) {
                const cleanPolres = normalizeDbPolresName(row.polres, row.polda);
                const isRowDitlantas = cleanPolres.startsWith("DITLANTAS");
                
                let targetPoldaLabel = getPoldaLabelFromDbValue(row.polda);
                if (!targetPoldaLabel) {
                    const candidates = polresLookup[cleanPolres];
                    if (candidates && candidates.length >= 1) targetPoldaLabel = candidates[0];
                }

                let matchFound = false;
                if (currentFilters.polres[0] !== 'All') {
                    for (let selected of currentFilters.polres) {
                        let cleanSelected = normalizeDbPolresName(selected.split('###')[0]);
                        if (cleanSelected.startsWith("DITLANTAS")) {
                            let selectedPoldaTarget = cleanSelected.replace("DITLANTAS ", "").toUpperCase();
                            if (targetPoldaLabel && targetPoldaLabel.toUpperCase() === selectedPoldaTarget && isRowDitlantas) {
                                matchFound = true; break;
                            }
                        } else {
                            if (cleanPolres === cleanSelected) { matchFound = true; break; }
                        }
                    }
                    if (!matchFound) return; 
                } else if (isRowDitlantas) return; 

                if (targetPoldaLabel) {
                    let roadLength = 1.0; let popDensity = 1.0; let targetKeysForColor = [];

                    if (isRowDitlantas) {
                        let pGeo = poldaGeoProps[targetPoldaLabel];
                        if (pGeo) { roadLength = pGeo.len > 0 ? pGeo.len : 1.0; popDensity = pGeo.count > 0 ? (pGeo.densSum / pGeo.count) : 1.0; }
                        if (poldaStructure[targetPoldaLabel]) targetKeysForColor = poldaStructure[targetPoldaLabel].map(pName => generateCompositeKey(targetPoldaLabel, pName));
                    } else {
                        let uniqueKey = generateCompositeKey(targetPoldaLabel, cleanPolres);
                        let geoProps = geoPropertiesLookup[uniqueKey];
                        if (!geoProps && polresLookup[cleanPolres]) {
                            for (const altPolda of polresLookup[cleanPolres]) {
                                const altKey = generateCompositeKey(altPolda, cleanPolres);
                                if (geoPropertiesLookup[altKey]) { geoProps = geoPropertiesLookup[altKey]; uniqueKey = altKey; targetPoldaLabel = altPolda; break; }
                            }
                        }
                        if (geoProps) { roadLength = geoProps.len; popDensity = geoProps.dens; targetKeysForColor = [uniqueKey]; }
                    }

                    if (targetKeysForColor.length > 0) {
                        let calculatedRisk = 0;
                        if (currentMode === 'risk') calculatedRisk = (rawValue / roadLength) * 100;
                        else {
                            let logDensity = Math.log10(popDensity);
                            if (logDensity < 0) logDensity = 0; 
                            calculatedRisk = ((rawValue / roadLength) * 100) * logDensity;
                        }

                        targetKeysForColor.forEach(k => {
                            if (!currentDataMap[k]) currentDataMap[k] = { risk: 0, raw: 0 };
                            currentDataMap[k].risk += calculatedRisk; currentDataMap[k].raw += rawValue; 
                        });

                        if (tableAggregations[targetPoldaLabel] !== undefined) tableAggregations[targetPoldaLabel] += calculatedRisk;
                        if (calculatedRisk > globalMaxRisk) globalMaxRisk = calculatedRisk;
                        grandTotalPoints += rawValue; 
                    }
                }
            }
        });

        dynamicThresholdsPolres = calculatePercentiles(Object.values(currentDataMap).map(d => d.risk));
        dynamicThresholdsPolda = calculatePercentiles(Object.values(tableAggregations));

        const bsTotalValue = document.getElementById('bsTotalValue');
        if(bsTotalValue) bsTotalValue.innerText = grandTotalPoints;
        
        let bsTitle = document.querySelector('.blackspot-info-panel .bs-title');
        if(bsTitle) bsTitle.innerText = currentMode === 'risk' ? "Jumlah Blackspot" : "Jumlah Troublespot";

        updatePointLayerData();
        updateMapStyles();
        updateMapVisibility();
        updateRiskTable(tableAggregations); 
        updateHeaderDisplay();
        
        let currentTotalRisk = 0;
        Object.values(tableAggregations).forEach(val => currentTotalRisk += val);
        
        const footerValEl = document.getElementById('footerRiskValue');
        if (footerValEl) footerValEl.innerText = currentTotalRisk.toFixed(2);

        if (rawTrendData && rawTrendData.length > 0) {
            const recText = generateRecommendation(currentTotalRisk, rawTrendData);
            document.getElementById('recommendationText').innerHTML = recText;
        }
        
        // ==============================================================
        // KUNCI PERBAIKAN: PERINTAHKAN GRAFIK UNTUK DIGAMBAR ULANG
        // UNTUK MODE LAKA DAN MACET!
        // ==============================================================
        if (typeof renderInteractiveCharts === 'function') {
            renderInteractiveCharts();
        }

        zoomToFilteredExtent();
    } catch (e) { console.error("Update failed:", e); }
}


// =========================================================
// 5. JANTUNG KESELAMATAN: LOGIKA FATALITY REDUCTION MURNI
// =========================================================
async function processFatalityMode() {
    const safeTrendData = typeof rawTrendData !== 'undefined' ? rawTrendData : [];

    let maxDbYear = new Date().getFullYear();
    if (safeTrendData.length > 0) {
        let tempMax = 0;
        for (let i = 0; i < safeTrendData.length; i++) {
            let y = new Date(safeTrendData[i].tanggal).getFullYear();
            if (!isNaN(y) && y > tempMax) tempMax = y;
        }
        if (tempMax > 0) maxDbYear = tempMax;
    }

    let requestedYearStr = currentFilters.year[0];
    let activeYear = requestedYearStr === 'All' ? maxDbYear : parseInt(requestedYearStr);
    
    if (requestedYearStr !== 'All') {
        let exists = safeTrendData.some(r => new Date(r.tanggal).getFullYear() === activeYear);
        if (!exists && maxDbYear > 0) activeYear = maxDbYear;
    }
    let prevYear = activeYear - 1;

    let isMonthAll = currentFilters.month[0] === 'All';
    let fMonth = currentFilters.month;

    // =================================================================
    // DEKLARASI MODE IFP DITARUH DI PALING ATAS AGAR TERBACA SEMUA KODE
    // =================================================================
    let isIFPMode = currentMode === 'fatality_pop';
    let isIFKMode = currentMode === 'fatality_veh';
    let targetIFPTahunIni = targetIFP[activeYear] || 8.938;
    let targetIFKTahunIni = targetIFK[activeYear] || 2.0;

    let totalMD = 0;
    let totalMDPrev = 0; 
    let poldaStats = {};
    currentDataMap = {};
    for (let uniqueKey in geoPropertiesLookup) {
        currentDataMap[uniqueKey] = { curr: 0, prev: 0 };
        // [PERBAIKAN]: Daftarkan semua Polda sejak awal agar Faskesnya tetap terhitung walau MD-nya 0
        let poldaLabel = uniqueKey.split('_')[0];
        if (!poldaStats[poldaLabel]) poldaStats[poldaLabel] = { curr: 0, prev: 0, faskes: 0, keramaian: 0, uji: 0 };
    }

    let allTimeNationalMD = 0;
    let allTimePoldaMD = {};
    let allTimePolresMD = {};

    // --- VARIABEL MESIN FILTER ---
    const selectedPoldas = currentFilters.poldas;
    const selectedPolres = currentFilters.polres;
    let totalMD_Filtered = 0;
    let totalMDPrev_Filtered = 0;
    let allTimeFilteredMD = 0;
    let allowedPoldas = new Set();
    // [PERBAIKAN] Daftarkan Polda yang dizinkan langsung dari pilihan Dropdown
    if (!selectedPolres.includes('All')) {
        selectedPolres.forEach(sel => {
            let cleanPolres = normalizeDbPolresName(sel.split('###')[0]);
            if (cleanPolres.startsWith("DITLANTAS")) {
                let pTarget = cleanPolres.replace("DITLANTAS ", "").toUpperCase();
                let found = poldaConfig.find(c => c.label.toUpperCase() === pTarget);
                if (found) allowedPoldas.add(found.label);
            } else if (polresLookup[cleanPolres]) {
                allowedPoldas.add(polresLookup[cleanPolres][0]);
            }
        });
    } else if (!selectedPoldas.includes('All')) {
        selectedPoldas.forEach(dbPolda => {
            let pLabel = getPoldaLabelFromDbValue(dbPolda);
            if (pLabel) allowedPoldas.add(pLabel);
        });
    } else {
        poldaConfig.forEach(cfg => allowedPoldas.add(cfg.label));
    }
    // --- VARIABEL PENAMPUNG DEMOGRAFI ---
    let totalPopulasi = 0;
    let totalKendaraan = 0;
    let totalLuas = 0;
    let totalLaka = 0;
    let totalPengemudi = 0; 

    safeTrendData.forEach(row => {
        // [PERBAIKAN]: Cek apakah ada di cache, jika tidak, hitung manual agar tidak error (NaN)
        let y = row._year !== undefined ? row._year : new Date(row.tanggal).getFullYear();
        if (isNaN(y)) return;
        let m = row._month !== undefined ? row._month : (new Date(row.tanggal).getMonth() + 1).toString();
        if (!isMonthAll && !fMonth.includes(m)) return;

        let val = row.value_amount;
        const cleanPolres = row._clean_polres;
        const targetPoldaLabel = row._polda_label;

        // --- CEK APAKAH BARIS INI MASUK DALAM FILTER UI ---
        // (Sisa kode di bawahnya biarkan sama persis seperti sebelumnya)
        let isAllowed = false;
        if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
            isAllowed = true;
            if (targetPoldaLabel !== 'MABES POLRI') allowedPoldas.add(targetPoldaLabel);
        } else if (!selectedPolres.includes('All')) {
            for (let selected of selectedPolres) {
                let cleanSelected = normalizeDbPolresName(selected.split('###')[0]);
                if (cleanSelected.startsWith("DITLANTAS")) {
                    let selectedPoldaTarget = cleanSelected.replace("DITLANTAS ", "").toUpperCase();
                    if (targetPoldaLabel && targetPoldaLabel.toUpperCase() === selectedPoldaTarget && cleanPolres.startsWith("DITLANTAS")) {
                        isAllowed = true; allowedPoldas.add(targetPoldaLabel); break;
                    }
                } else {
                    if (cleanPolres === cleanSelected) { 
                        isAllowed = true; allowedPoldas.add(targetPoldaLabel); break; 
                    }
                }
            }
        } else if (!selectedPoldas.includes('All')) {
            for (let dbPolda of selectedPoldas) {
                let pLabel = getPoldaLabelFromDbValue(dbPolda);
                if (pLabel === targetPoldaLabel) { 
                    isAllowed = true; allowedPoldas.add(targetPoldaLabel); break; 
                }
            }
        }

        // 1. KUMPULKAN DATA ALL-TIME GLOBAL
        allTimeNationalMD += val;
        if (!allTimePoldaMD[targetPoldaLabel]) allTimePoldaMD[targetPoldaLabel] = 0;
        allTimePoldaMD[targetPoldaLabel] += val;
        
        if (cleanPolres && targetPoldaLabel !== 'MABES POLRI') {
            let compKey = generateCompositeKey(targetPoldaLabel, cleanPolres);
            if (!allTimePolresMD[compKey]) allTimePolresMD[compKey] = 0;
            allTimePolresMD[compKey] += val;
        }

        // 2. KUMPULKAN DATA TAHUN BERJALAN & LALU GLOBAL
        if (!poldaStats[targetPoldaLabel]) poldaStats[targetPoldaLabel] = { curr: 0, prev: 0, faskes: 0 };
        
        if (y === activeYear) {
            totalMD += val;
            poldaStats[targetPoldaLabel].curr += val;
        }
        if (y === prevYear) {
            totalMDPrev += val;
            poldaStats[targetPoldaLabel].prev += val;
        }

        // 3. KUMPULKAN DATA KHUSUS AREA YANG DIFILTER (SCOPE)
        if (isAllowed) {
            allTimeFilteredMD += val;
            if (y === activeYear) {
                totalMD_Filtered += val;
                totalLaka += row.jml_laka; // Hanya Laka yang tersisa dari trend-data
            }
            if (y === prevYear) totalMDPrev_Filtered += val;
        }

        // 4. DATA UNTUK PETA (Disimpan Semua, Ditampilkan Sesuai Visibilitas)
        if (cleanPolres && targetPoldaLabel !== 'MABES POLRI') {
            let compKey = generateCompositeKey(targetPoldaLabel, cleanPolres);
            if (!currentDataMap[compKey]) currentDataMap[compKey] = { curr: 0, prev: 0 };
            if (y === activeYear) currentDataMap[compKey].curr += val;
            if (y === prevYear) currentDataMap[compKey].prev += val;
        }
    });

    grandTotalPoints = totalMD_Filtered; 

    // --- KAMUS RUNK LLAJ RESMI ---
    const targetFatalityReduction = {
        2020: -0.610, 2021: -0.540, 2022: -0.470, 2023: -0.400, 
        2024: -0.330, 2025: -0.260, 2026: -0.308, 2027: -0.356, 
        2028: -0.404, 2029: -0.452, 2030: -0.500, 2031: -0.510
    };
    const runkDataTanpa = { 2021: 39768, 2022: 39180, 2023: 38592, 2024: 38004, 2025: 37416, 2026: 39473 };
    const targetDenganRunkValues = { 2021: 18316, 2022: 20697, 2023: 23077, 2024: 25458, 2025: 27838, 2026: 27041 };
    
    let targetTanpa = runkDataTanpa[activeYear] || 39473;
    let targetDengan = targetDenganRunkValues[activeYear] || 27041;
    let targetFR = (targetFatalityReduction[activeYear] || 0) * 100; 
    window.currentFatalityTargetFR = targetFR;

    // --- WARNA PETA PROPORSI HISTORIS ---
    let matchExpression = ['match', ['get', '_composite_key']];
    let hasData = false;

    for (let key in currentDataMap) {
        let curr = currentDataMap[key].curr;
        let prev = currentDataMap[key].prev;
        let color = '#94a3b8';

        if (isIFPMode) {
            // LOGIKA WARNA & SKOR PETA: INDEKS FATALITAS POPULASI (IFP)
            let popPolres = 0;
            if (activeYear >= 2025 || requestedYearStr === 'All') {
                popPolres = geoPropertiesLookup[key] ? geoPropertiesLookup[key].pop : 0;
            } else {
                let cleanPolres = key.split('_')[1];
                let dbPop = rawPopulationData.find(r => parseInt(r.tahun) === activeYear && normalizeDbPolresName(r.polres) === cleanPolres);
                if (dbPop) popPolres = parseFloat(dbPop.populasi || 0);
            }

            let ifpPolres = popPolres > 0 ? (curr / popPolres) * 100000 : 0;
            currentDataMap[key].risk = ifpPolres; 
            currentDataMap[key].raw = curr;

            // [PERBAIKAN]: Langsung minta warna, jangan pakai syarat curr > 0
            color = getIFPClassification(ifpPolres, targetIFPTahunIni).color;

        } else if (isIFKMode) {
            // LOGIKA IFK (KENDARAAN)
            let vehPolres = 0;
            let cleanPolres = key.split('_')[1];
            let dbVeh = rawVehicleData.find(r => parseInt(r.tahun) === activeYear && normalizeDbPolresName(r.polres) === cleanPolres);
            if (dbVeh) vehPolres = parseFloat(dbVeh.total_kendaraan || 0);

            let ifkPolres = vehPolres > 0 ? (curr / vehPolres) * 10000 : 0;
            currentDataMap[key].risk = ifkPolres;
            currentDataMap[key].raw = curr;

            // [PERBAIKAN]: Langsung minta warna
            color = getIFKClassification(ifkPolres, targetIFKTahunIni).color;

        } else {
            // LOGIKA WARNA & SKOR PETA: FATALITY REDUCTION (FR)
            let fr = 0;
            let bobotPolres = 0;
            if (totalMDPrev > 0 && prev > 0) { bobotPolres = prev / totalMDPrev; } 
            // [PERBAIKAN KUNCI 2]: Ubah allTimePoldaMD menjadi allTimePolresMD
            else if (allTimeNationalMD > 0 && allTimePolresMD[key]) { bobotPolres = allTimePolresMD[key] / allTimeNationalMD; }

            if (bobotPolres > 0) {
                let targetTanpaPolres = bobotPolres * targetTanpa;
                fr = ((curr - targetTanpaPolres) / targetTanpaPolres) * 100;
            } else if (curr === 0) {
                // Jika MD = 0, FR otomatis menjadi -100% (Aman Sempurna)
                fr = -100;
            } else if (curr > 0 && requestedYearStr !== 'All') {
                fr = 100;
            }

            currentDataMap[key].risk = fr; // SKOR FR DISIMPAN DI SINI
            currentDataMap[key].raw = curr;

            color = getFatalityClassification(fr, targetFR).color;
        }

        matchExpression.push(key, color);
        hasData = true;
    }
    
    const defaultColor = '#94a3b8'; 
    matchExpression.push(defaultColor);

    // [PERBAIKAN KUNCI 3]: Hanya warnai layer nasional
    if (map.getLayer('layer-nasional-fill')) {
        map.setPaintProperty('layer-nasional-fill', 'fill-color', hasData ? matchExpression : defaultColor);
    }
    
    updateMapVisibility();

    // --- KALKULASI SKOR FR (DINAMIS SESUAI FILTER WILAYAH) ---
    let frDisplayValue = 0;
    let targetTanpaFiltered = targetTanpa;
    let targetDenganFiltered = targetDengan;

    if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
        if (targetTanpa > 0 && totalMD > 0) { frDisplayValue = ((totalMD - targetTanpa) / targetTanpa) * 100; }
    } else {
        let bobotFiltered = 0;
        if (totalMDPrev > 0 && totalMDPrev_Filtered > 0) bobotFiltered = totalMDPrev_Filtered / totalMDPrev;
        else if (allTimeNationalMD > 0 && allTimeFilteredMD > 0) bobotFiltered = allTimeFilteredMD / allTimeNationalMD;

        targetTanpaFiltered = bobotFiltered * targetTanpa;
        targetDenganFiltered = bobotFiltered * targetDengan;

        if (targetTanpaFiltered > 0) {
            frDisplayValue = ((totalMD_Filtered - targetTanpaFiltered) / targetTanpaFiltered) * 100;
        } else if (totalMD_Filtered > 0 && requestedYearStr !== 'All') {
            frDisplayValue = 100;
        }
    }

    let capaianNasional = 0;
    if (targetFR !== 0) capaianNasional = (frDisplayValue / targetFR) * 100;

    // --- INJEKSI KE PANEL BOX BARU (PROYEKSI PROPORSI DAERAH) ---
    let valDenganElem = document.getElementById('valDenganRunk');
    let valTanpaElem = document.getElementById('valTanpaRunk');
    if (valDenganElem) valDenganElem.innerText = Math.round(targetDenganFiltered).toLocaleString('id-ID');
    if (valTanpaElem) valTanpaElem.innerText = Math.round(targetTanpaFiltered).toLocaleString('id-ID');

    // =================================================================
    // DEKLARASI MODE IFP (DIPINDAHKAN KE ATAS AGAR TERBACA OLEH SISTEM)
    // =================================================================
    // --- UPDATE UI DASHBOARD (HEADER & FOOTER MENGIKUTI FILTER WILAYAH) ---
    document.getElementById('headerYearDisplay').innerText = activeYear;
    
    let colorTheme = totalMD_Filtered === 0 ? '#94a3b8' : getFatalityClassification(frDisplayValue, targetFR).color;
    let frTextDisplay = totalMD_Filtered === 0 ? '0.00%' : (frDisplayValue > 0 ? `+${frDisplayValue.toFixed(2)}%` : `${frDisplayValue.toFixed(2)}%`);

    let headerRiskVal = document.getElementById('totalRiskDisplay');
    if (headerRiskVal) {
        headerRiskVal.innerText = frTextDisplay;
        headerRiskVal.style.color = colorTheme; 
        const headerTitle = document.querySelector('.header-title');
        
        if (headerTitle) {
            let scopeText = (selectedPoldas.includes('All') && selectedPolres.includes('All')) ? "Nasional" : "Wilayah";
            
            if (isIFPMode) {
                headerTitle.innerText = `Indeks Fatalitas Berbasis Populasi ${scopeText}`;
            } else if (isIFKMode) {
                headerTitle.innerText = `Indeks Fatalitas Berbasis Kendaraan ${scopeText}`;
            } else {
                headerTitle.innerText = `Tingkat Fatality Reduction ${scopeText}`;
            }
        }
    }
    
    // Update Header dan Footer Nilai
    let nationalDemography = window.getFilteredDemography(activeYear);
    let nationalPop = nationalDemography.pop;
    let nationalVeh = nationalDemography.veh;
    
    let ifpNasional = nationalPop > 0 ? (totalMD_Filtered / nationalPop) * 100000 : 0;
    let ifkNasional = nationalVeh > 0 ? (totalMD_Filtered / nationalVeh) * 10000 : 0;
    
    let valPopElem = document.getElementById('valPopulasiIFP');
    if (valPopElem) valPopElem.innerHTML = nationalPop.toLocaleString('id-ID') + '<span style="font-size:12px; color:#94a3b8; font-weight:600; margin-left:4px;">Jiwa</span>';
    
    let valVehElem = document.getElementById('valKendaraanIFK');
    if (valVehElem) valVehElem.innerHTML = nationalVeh.toLocaleString('id-ID') + '<span style="font-size:12px; color:#eab308; font-weight:600; margin-left:4px;">Unit</span>';

    let mainColor = isIFPMode ? getIFPClassification(ifpNasional, targetIFPTahunIni).color : (isIFKMode ? getIFKClassification(ifkNasional, targetIFKTahunIni).color : getFatalityClassification(frDisplayValue, targetFR).color);
    if (totalMD_Filtered === 0) mainColor = '#94a3b8';

    let mainText = isIFPMode ? ifpNasional.toFixed(2) : (isIFKMode ? ifkNasional.toFixed(2) : (totalMD_Filtered === 0 ? '0.00%' : (frDisplayValue > 0 ? `+${frDisplayValue.toFixed(2)}%` : `${frDisplayValue.toFixed(2)}%`)));
    let fVal = document.getElementById('footerRiskValue');
    if (fVal) { fVal.innerText = mainText; fVal.style.color = mainColor; fVal.style.webkitTextFillColor = mainColor; fVal.style.textShadow = `0 4px 10px ${mainColor}40`; }
    let hVal = document.getElementById('totalRiskDisplay');
    if (hVal) { hVal.innerText = mainText; hVal.style.color = mainColor; }

    let desc = document.getElementById('totalRiskDesc');
    if (desc) {
        if (isIFPMode) {
            let deviasi = targetIFPTahunIni > 0 ? ((ifpNasional - targetIFPTahunIni) / targetIFPTahunIni) * 100 : 0;
            let capaianIFP = ifpNasional > 0 ? 100 - deviasi : 0;
            let capColor = capaianIFP >= 100 ? '#22c55e' : (capaianIFP > 80 ? '#facc15' : '#ef4444');
            
            // LOGIKA RENTANG ANGKA (Contoh: 9.47 -> "9 - 10")
            let rangeText = (ifpNasional % 1 === 0) ? ifpNasional : `${Math.floor(ifpNasional)} - ${Math.ceil(ifpNasional)}`;

            desc.innerHTML = `
                <div style="line-height:1.5; font-size:13px; color:#334155; margin-bottom:12px;">
                    Mengindikasikan sekitar <b style="color:${mainColor};">${rangeText}</b> kematian per 100.000 penduduk yang diakibatkan oleh kecelakaan lalu lintas.
                </div>
                <div style="display:flex; gap:12px; text-align:left;">
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);">
                        <div style="font-size:10px; font-weight:700; color:#64748b;">TARGET IFP ${activeYear}</div>
                        <div style="font-size:18px; font-weight:900; color:#1e293b;">${targetIFPTahunIni.toFixed(2)}</div>
                    </div>
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);">
                        <div style="font-size:10px; font-weight:700; color:#64748b;">CAPAIAN RUNK</div>
                        <div style="font-size:18px; font-weight:900; color:${capColor};">${capaianIFP.toFixed(2)}%</div>
                    </div>
                </div>`;
        } else if (isIFKMode) {
            let deviasi = targetIFKTahunIni > 0 ? ((ifkNasional - targetIFKTahunIni) / targetIFKTahunIni) * 100 : 0;
            let capaianIFK = ifkNasional > 0 ? 100 - deviasi : 0;
            let capColor = capaianIFK >= 100 ? '#22c55e' : (capaianIFK > 80 ? '#facc15' : '#ef4444');
            let rangeText = (ifkNasional % 1 === 0) ? ifkNasional : `${Math.floor(ifkNasional)} - ${Math.ceil(ifkNasional)}`;

            desc.innerHTML = `
                <div style="line-height:1.5; font-size:13px; color:#334155; margin-bottom:12px;">
                    Mengindikasikan sekitar <b style="color:${mainColor};">${rangeText}</b> kematian per 10.000 kendaraan yang diakibatkan oleh kecelakaan lalu lintas.
                </div>
                <div style="display:flex; gap:12px; text-align:left;">
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);">
                        <div style="font-size:10px; font-weight:700; color:#64748b;">TARGET IFK ${activeYear}</div>
                        <div style="font-size:18px; font-weight:900; color:#1e293b;">${targetIFKTahunIni.toFixed(2)}</div>
                    </div>
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);">
                        <div style="font-size:10px; font-weight:700; color:#64748b;">CAPAIAN RUNK</div>
                        <div style="font-size:18px; font-weight:900; color:${capColor};">${capaianIFK.toFixed(2)}%</div>
                    </div>
                </div>`;
        } else { // (FR Lama)
            // (Biarkan logika FR asli tetap ada jika mode FR)
            let warnaCapaian = capaianNasional >= 100 ? '#22c55e' : (capaianNasional > 0 ? '#facc15' : '#ef4444');
            
            // --- LOGIKA KATA PEMBANDING (LEBIH TINGGI / LEBIH RENDAH) ---
            let kataBanding = frDisplayValue < 0 ? " lebih rendah" : (frDisplayValue > 0 ? " lebih tinggi" : "");
            
            desc.innerHTML = `<div style="line-height:1.5; font-size:13px; color:#334155; margin-bottom:12px;">Mengindikasikan korban meninggal dunia akibat laka aktual <b style="color:${colorTheme};">${Math.abs(frDisplayValue).toFixed(2)}%${kataBanding}</b> dibandingkan proyeksi tanpa adanya intervensi RUNK.</div>
                <div style="display:flex; gap:12px; text-align:left;">
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);"><div style="font-size:10px; font-weight:700; color:#64748b;">Target FR ${activeYear}</div><div style="font-size:18px; font-weight:900; color:#1e293b;">${targetFR.toFixed(1)}%</div></div>
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);"><div style="font-size:10px; font-weight:700; color:#64748b;">Capaian RUNK</div><div style="font-size:18px; font-weight:900; color:${warnaCapaian};">${capaianNasional.toFixed(2)}%</div></div>
                </div>`;
        }
    }
    
    // [PERBAIKAN]: Kembalikan ke variabel MD (Meninggal Dunia)
    let bsTitle = document.querySelector('.blackspot-info-panel .bs-title');
    if (bsTitle) bsTitle.innerText = "Jumlah Meninggal Dunia";
    let bsTotalValue = document.getElementById('bsTotalValue');
    if (bsTotalValue) bsTotalValue.innerText = totalMD_Filtered.toLocaleString('id-ID');

    // --- BANGUN TABEL POLDA LIST ---
    const tbody = document.getElementById('riskTableBody');
    let tableArray = [];
    // --- FITUR BARU: Hitung total Infrastruktur per Polda dari GeoJSON ---
    for (let uniqueKey in geoPropertiesLookup) {
        let poldaLabel = uniqueKey.split('_')[0];
        let faskesCount = geoPropertiesLookup[uniqueKey].faskes || 0;
        let keramaianCount = geoPropertiesLookup[uniqueKey].keramaian || 0;
        let ujiCount = geoPropertiesLookup[uniqueKey].uji || 0;
        
        if (poldaStats[poldaLabel]) {
            poldaStats[poldaLabel].faskes += faskesCount;
            poldaStats[poldaLabel].keramaian += keramaianCount;
            poldaStats[poldaLabel].uji += ujiCount;
        }
    }

    allowedPoldas.forEach(polda => {
        if (polda === 'MABES POLRI') return; 
        let stats = poldaStats[polda] || { curr: 0, prev: 0 }; 
        let valToDisplay = 0; let colorObj;
        
        if (isIFPMode) {
            let popPolda = window.getFilteredDemography(activeYear, polda).pop;
            valToDisplay = popPolda > 0 ? (stats.curr / popPolda) * 100000 : 0;
            colorObj = getIFPClassification(valToDisplay, targetIFPTahunIni);
        } else if (isIFKMode) {
            let vehPolda = window.getFilteredDemography(activeYear, polda).veh;
            valToDisplay = vehPolda > 0 ? (stats.curr / vehPolda) * 10000 : 0;
            colorObj = getIFKClassification(valToDisplay, targetIFKTahunIni);
        } else {
            let bobotPolda = 0;
            if (totalMDPrev > 0 && stats.prev > 0) bobotPolda = stats.prev / totalMDPrev; 
            else if (allTimeNationalMD > 0 && allTimePoldaMD[polda]) bobotPolda = allTimePoldaMD[polda] / allTimeNationalMD;
            
            if (bobotPolda > 0) {
                let targetTanpaPolda = bobotPolda * targetTanpa;
                valToDisplay = ((stats.curr - targetTanpaPolda) / targetTanpaPolda) * 100;
            } else if (stats.curr > 0 && requestedYearStr !== 'All') valToDisplay = 100;
            colorObj = getFatalityClassification(valToDisplay, targetFR);
        }
        
        tableArray.push({ name: polda, md: stats.curr, val: valToDisplay, color: colorObj.color, bg: colorObj.bg, faskes: stats.faskes || 0, keramaian: stats.keramaian || 0, uji: stats.uji || 0 });
    });
    
    tableArray.sort((a, b) => isIFPMode ? b.val - a.val : b.val - a.val); // Nilai Tertinggi (Terburuk) tetap di atas
    tbody.innerHTML = '';
    
    if (tableArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">Data tidak ditemukan.</td></tr>`;
    } else {
        const totalCount = tableArray.length; 
        
        // [PERBAIKAN PERFORMA 2]: Kumpulkan teks dulu!
        let tableHTML = '';
        
        tableArray.forEach((item, index) => {
            let lastIndex = index;
            for(let i = index + 1; i < totalCount; i++) {
                if(Math.abs(tableArray[i].val - item.val) < 0.0001) { lastIndex = i; } else { break; }
            }
            const rank = totalCount - lastIndex; 
            currentPoldaRanks[item.name] = rank; 
            
            let frText = "";
            if (isIFPMode || isIFKMode) {
                frText = item.val.toFixed(2);
            } else {
                frText = item.val > 0 ? `+${item.val.toFixed(2)}%` : `${item.val.toFixed(2)}%`;
            }
            
            let rankClass = 'rank-col';
            if (rank === 1 && totalCount > 1) rankClass += ' top-rank-1'; 
            else if (rank === 2) rankClass += ' top-rank-2'; 
            else if (rank === 3) rankClass += ' top-rank-3';
            
            const logoUrl = getPoldaLogoFilename(item.name);
            
            // --- FITUR BARU: Kolom Infrastruktur Dinamis sesuai Mode ---
            let infraHtml = "";
            if (isIFPMode) {
                infraHtml = `<td style="text-align:center; font-weight:600; color:#10b981; font-size:12px;">${item.keramaian.toLocaleString('id-ID')}</td>`;
            } else if (isIFKMode) {
                infraHtml = `<td style="text-align:center; font-weight:600; color:#8b5cf6; font-size:12px;">${item.uji.toLocaleString('id-ID')}</td>`;
            } else {
                infraHtml = `<td style="text-align:center; font-weight:600; color:#2563eb; font-size:12px;">${item.faskes.toLocaleString('id-ID')}</td>`;
            }

            // [PERBAIKAN]: Simpan ke dalam string tableHTML, jangan ke tbody dulu!
            tableHTML += `
                <tr onclick="zoomToPolda('${item.name}')" style="cursor:pointer; background-color:${item.bg}; border-left:4px solid ${item.color};">
                    <td class="${rankClass}">#${rank}</td>
                    <td style="font-weight:600; color:#334155; display:flex; align-items:center;"><img src="${logoUrl}" class="table-polda-logo"> ${item.name}</td>
                    <td style="text-align:center; font-weight:bold; color:#1e293b;">${item.md.toLocaleString('id-ID')}</td>
                    ${infraHtml}
                    <td style="color: ${item.color} !important; font-weight: 800; text-align:center;">${frText}</td>
                </tr>`;
        });
        
        // Tempelkan SEMUANYA sekaligus!
        tbody.innerHTML = tableHTML;
    }

    // ======================================================================
    // LOGIKA CERDAS DEMOGRAFI (POPULASI & KENDARAAN)
    // ======================================================================
    totalPopulasi = 0;
    totalKendaraan = 0; // <--- Reset total kendaraan
    
    for (let uniqueKey in geoPropertiesLookup) {
        let parts = uniqueKey.split('_');
        let poldaLabel = parts[0];
        let cleanPolres = parts[1];

        let isAllowedPolres = false;
        if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
            isAllowedPolres = true;
        } else if (!selectedPolres.includes('All')) {
            for (let sel of selectedPolres) {
                let cleanSel = normalizeDbPolresName(sel.split('###')[0]);
                if (cleanSel.startsWith("DITLANTAS")) {
                    let selPolda = cleanSel.replace("DITLANTAS ", "").toUpperCase();
                    if (poldaLabel.toUpperCase() === selPolda && cleanPolres.startsWith("DITLANTAS")) { isAllowedPolres = true; break; }
                } else {
                    if (cleanPolres === cleanSel) { isAllowedPolres = true; break; }
                }
            }
        } else if (!selectedPoldas.includes('All')) {
            for (let dbPolda of selectedPoldas) {
                if (getPoldaLabelFromDbValue(dbPolda) === poldaLabel) { isAllowedPolres = true; break; }
            }
        }

        if (isAllowedPolres) {
            // --- 1. AMBIL DATA POPULASI ---
            if (activeYear >= 2025 || requestedYearStr === 'All') {
                totalPopulasi += geoPropertiesLookup[uniqueKey].pop || 0;
            } else {
                let dbPop = rawPopulationData.find(r => 
                    parseInt(r.tahun) === activeYear && 
                    normalizeDbPolresName(r.polres) === cleanPolres
                );
                if (dbPop) totalPopulasi += parseFloat(dbPop.populasi || 0);
            }

            // --- 2. AMBIL DATA KENDARAAN (SEMUA TAHUN DARI DATABASE) ---
            let dbVeh = rawVehicleData.find(r => 
                parseInt(r.tahun) === activeYear && 
                normalizeDbPolresName(r.polres) === cleanPolres
            );
            if (dbVeh) totalKendaraan += parseFloat(dbVeh.total_kendaraan || 0);

            // --- 3. JUMLAHKAN LUAS WILAYAH DARI GEOJSON ---
            totalLuas += geoPropertiesLookup[uniqueKey].area || 0;

            // --- 3. JUMLAHKAN LUAS WILAYAH DARI GEOJSON ---
            totalLuas += geoPropertiesLookup[uniqueKey].area || 0;

            // --- 4. AMBIL DATA PENGEMUDI (DENGAN LOGIKA SUBSTITUSI TAHUN) ---
            let targetYearPengemudi = activeYear;
            // Jika 2021 atau 2023, gunakan data 2022
            if (activeYear === 2021 || activeYear === 2023) targetYearPengemudi = 2022;
            // Jika 2026, gunakan data 2025
            if (activeYear === 2026) targetYearPengemudi = 2025;

            let dbDriver = rawDriverData.find(r => 
                parseInt(r.tahun) === targetYearPengemudi && 
                normalizeDbPolresName(r.polres) === cleanPolres
            );
            if (dbDriver) totalPengemudi += parseFloat(dbDriver.total_pengemudi || 0);
        }
    }

    // --- INJEKSI DATA DEMOGRAFI KE PANEL KIRI BASEMAP ---
    const vPop = document.getElementById('valPopulasi');
    const vKen = document.getElementById('valKendaraan');
    const vPeng = document.getElementById('valPengemudi');
    const vLaka = document.getElementById('valLaka');
    const vLuas = document.getElementById('valLuas');

    // KUNCI SAKLAR NASIONAL
    if (vLuas) {
        if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
            // Jika Nasional, paksakan pakai angka resmi Negara (BPS) agar elegan
            vLuas.innerHTML = `1.904.569 <small>km²</small>`;
        } else {
            // Jika filter Polda/Polres, gunakan hasil penjumlahan poligon GeoJSON
            vLuas.innerHTML = `${Math.round(totalLuas).toLocaleString('id-ID')} <small>km²</small>`;
        }
    }
    if (vPop) vPop.innerHTML = `${totalPopulasi.toLocaleString('id-ID')} <small>jiwa</small>`;
    if (vKen) vKen.innerHTML = `${totalKendaraan.toLocaleString('id-ID')} <small>unit</small>`;
    if (vPeng) vPeng.innerHTML = `${totalPengemudi.toLocaleString('id-ID')} <small>jiwa</small>`;
    if (vLaka) vLaka.innerHTML = `${totalLaka.toLocaleString('id-ID')} <small>kasus</small>`;

    // --- INJEKSI REKOMENDASI PENANGANAN KE DASHBOARD ---
    if (safeTrendData && safeTrendData.length > 0) {
        // Logika cerdas: Jika IFP kirim IFP, Jika IFK kirim IFK, sisanya FR
        let valForRecommendation = isIFPMode ? ifpNasional : (isIFKMode ? ifkNasional : frDisplayValue);
        
        // [PERBAIKAN KUNCI]: Gunakan valForRecommendation, BUKAN ikkhNasional!
        const recText = generateRecommendation(valForRecommendation, safeTrendData);
        const recContainer = document.getElementById('recommendationText');
        if (recContainer) { recContainer.innerHTML = recText; }
    }
}


// ==========================================
// 6. MANAJEMEN LAYER & VISIBILITAS MAP
// ==========================================

function updateMapStyles() {
    const matchExpression = ['match', ['get', '_composite_key']];
    const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
    let hasData = false;

    for (const [key, dataObj] of Object.entries(currentDataMap)) {
        const status = getRiskClassification(dataObj.risk, 'polres', period);
        matchExpression.push(key, status.color);
        hasData = true; 
    }
    
    const defaultColor = '#22c55e';
    matchExpression.push(defaultColor); 

    // [PERBAIKAN]: Hanya warnai 1 layer nasional
    if (map.getLayer('layer-nasional-fill')) {
        map.setPaintProperty('layer-nasional-fill', 'fill-color', hasData ? matchExpression : defaultColor);
    }
}

function updateMapVisibility() {
    const selectedPoldas = currentFilters.poldas;
    const selectedPolres = currentFilters.polres;
    const toggleEl = document.getElementById('togglePolygonLayer');
    const isMasterVisible = toggleEl ? toggleEl.checked : true;

    let validCompositeKeys = [];
    if (!selectedPolres.includes('All')) {
        let targetNormNames = [];
        selectedPolres.forEach(val => {
            val.split(',').forEach(p => {
                let raw = p.split('###')[0].trim().toUpperCase();
                let norm = normalizeDbPolresName(raw);
                if (norm) targetNormNames.push(norm);
            });
        });

        for (const poldaKey in poldaBounds) {
            const geoJSON = poldaBounds[poldaKey].geoJSON;
            if (geoJSON && geoJSON.features) {
                geoJSON.features.forEach(f => {
                    let isMatch = false;
                    let geojsonNormName = f.properties._clean_name || "";
                    if (targetNormNames.includes(geojsonNormName)) {
                        isMatch = true;
                    } else {
                        let isStrict = geojsonNormName.includes("BANDUNG") || geojsonNormName.includes("MALANG") || geojsonNormName.includes("SEMARANG");
                        if (!isStrict) {
                            let cleanG = geojsonNormName.replace(/POLRES|POLRESTA|POLRESTABES/g, '').trim();
                            for (let t of targetNormNames) {
                                let cleanT = t.replace(/POLRES|POLRESTA|POLRESTABES/g, '').trim();
                                if (cleanG === cleanT) { isMatch = true; break; }
                            }
                        }
                    }
                    if (isMatch && f.properties._composite_key) validCompositeKeys.push(f.properties._composite_key);
                });
            }
        }
    }

    window._activePolresKeys = validCompositeKeys;

    // [PERBAIKAN KUNCI 2]: Hanya kontrol 1 layer nasional, hapus looping polda lama
    if (map.getLayer('layer-nasional-fill')) {
        map.setLayoutProperty('layer-nasional-fill', 'visibility', isMasterVisible ? 'visible' : 'none');
        map.setLayoutProperty('layer-nasional-line', 'visibility', isMasterVisible ? 'visible' : 'none');

        if (isMasterVisible) {
            if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
                map.setFilter('layer-nasional-fill', null);
                map.setFilter('layer-nasional-line', null);
            } else {
                let featureFilter = validCompositeKeys.length > 0 ? ['in', '_composite_key', ...validCompositeKeys] : ['in', '_composite_key', 'NONE'];
                
                // Jika user filter by Polda saja
                if (selectedPolres.includes('All') && !selectedPoldas.includes('All')) {
                    let poldaLabels = selectedPoldas.map(dbPolda => getPoldaLabelFromDbValue(dbPolda));
                    featureFilter = ['in', '_polda_name', ...poldaLabels];
                }

                map.setFilter('layer-nasional-fill', featureFilter);
                map.setFilter('layer-nasional-line', featureFilter);
            }
        }
    }
}

function switchBasemap(type, labelName) {
    ['base-osm', 'base-esri', 'base-g-sat', 'base-g-traffic', 'base-google'].forEach(id => { 
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none'); 
    });
    map.setLayoutProperty(`base-${type}`, 'visibility', 'visible');
    document.querySelectorAll('.basemap-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    document.getElementById('active-basemap-label').innerText = labelName;
}

function togglePointVisibility(isVisible) {
    const visibilityState = isVisible ? 'visible' : 'none';
    if (map.getLayer('clusters')) map.setLayoutProperty('clusters', 'visibility', visibilityState);
    if (map.getLayer('unclustered-point')) map.setLayoutProperty('unclustered-point', 'visibility', visibilityState);
    if (map.getLayer('cluster-count')) map.setLayoutProperty('cluster-count', 'visibility', visibilityState);
    
    const legendIcon = document.getElementById('pointLegendIcon');
    const legendText = document.getElementById('pointLegendText');
    if (legendIcon && legendText) {
        legendIcon.style.opacity = isVisible ? '1' : '0.2';
        legendText.style.opacity = isVisible ? '1' : '0.5';
    }
}

function togglePolygonVisibility(isVisible) {
    updateMapVisibility();
    const gradientRow = document.getElementById('polygonGradientRow');
    if (gradientRow) gradientRow.style.opacity = isVisible ? '1' : '0.2';
    if (!isVisible) {
        map.getSource('highlight-source').setData({ type: 'FeatureCollection', features: [] });
        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach(p => p.remove()); 
    }
}

// ==========================================
// 7. FUNGSI INTERAKSI (HOVER & ZOOM PINTAR)
// ==========================================

function setupGlobalInteraction() {
    let currentPopup = null; 
    let hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 15, className: 'hover-popup' });

    const clearHighlight = () => { map.getSource('highlight-source').setData({ type: 'FeatureCollection', features: [] }); };

    // PERBAIKAN KLIK
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['layer-nasional-fill'] });

        if (!features.length) {
            if (currentPopup) { currentPopup.isSwitching = false; currentPopup.remove(); currentPopup = null; }
            clearHighlight(); return;
        }

        const feature = features[0];
        if (currentPopup) { currentPopup.isSwitching = true; currentPopup.remove(); }
        map.getSource('highlight-source').setData({ type: 'FeatureCollection', features: [feature] });

        const compKey = feature.properties._composite_key;
        const polresName = feature.properties._orig_name || "Unknown";
        const poldaName = feature.properties._polda_name || "Unknown";
        const logoUrl = getPoldaLogoFilename(poldaName);

        const dataObj = currentDataMap[compKey] || { risk: 0, raw: 0 };
        const val = dataObj.risk || 0;
        const rawPoints = dataObj.raw || 0;

        let roadLength = parseFloat(feature.properties.panjang_ja || feature.properties.len) || 1.0;
        let popDensity = parseFloat(feature.properties.kepadatan || feature.properties.dens) || 1.0;
        
        const formattedLength = roadLength.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedDensity = popDensity.toLocaleString('id-ID', { maximumFractionDigits: 0 });

        let labelRisk, labelSpot, riskValDisplay, statusBadge, colorTheme, labelDesc;
        let tableRowsHTML = '';

        if (currentMode === 'fatality_pop') {
            labelRisk = "Skor IFP"; riskValDisplay = val.toFixed(2);
            let activeYear = currentFilters.year[0] !== 'All' ? parseInt(currentFilters.year[0]) : new Date().getFullYear();
            let tIFP = typeof targetIFP !== 'undefined' ? (targetIFP[activeYear] || 8.938) : 8.938;
            let classObj = typeof getIFPClassification === 'function' ? getIFPClassification(val, tIFP) : { label: 'NO DATA', color: '#94a3b8' };
            colorTheme = classObj.color; statusBadge = classObj.label;

            let popPolres = geoPropertiesLookup[compKey] ? geoPropertiesLookup[compKey].pop : 0;
            let formattedPop = popPolres.toLocaleString('id-ID');
            
            // [FITUR BARU]: Tambah Data Keramaian
            let jmlKeramaian = geoPropertiesLookup[compKey] ? geoPropertiesLookup[compKey].keramaian : 0;
            let rangeText = (val % 1 === 0) ? val : `${Math.floor(val)} - ${Math.ceil(val)}`;
            labelDesc = `Terdapat <b style="color:#10b981">${jmlKeramaian} Titik Keramaian</b>. Mengindikasikan sekitar <b style="color:${colorTheme}">${rangeText}</b> kematian per 100.000 penduduk.`;

            tableRowsHTML = `
                <tr><td><b>Polres</b></td><td>: <b>${polresName}</b></td></tr>
                <tr><td><b>${labelRisk}</b></td><td>: <b style="color:${colorTheme}">${riskValDisplay}</b></td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:5px 0;"></td></tr>
                <tr><td colspan="2" style="padding-top:5px; color:#334155;"><b>Jumlah MD: <span style="color:#ef4444;">${rawPoints} Jiwa</span></b></td></tr>
                <tr><td colspan="2" style="padding-top:2px; color:#334155;"><b>Jumlah Populasi: <span style="color:#22c55e;">${formattedPop} Jiwa</span></b></td></tr>
                <tr><td colspan="2" style="padding-top:2px; color:#334155;"><b>Pusat Aktivitas: <span style="color:#10b981;">${jmlKeramaian} Titik</span></b></td></tr>
                <tr><td colspan="2" style="font-size:11px; color:#64748b; line-height:1.4; padding-top:5px;">${labelDesc}</td></tr>
            `;

        } else if (currentMode === 'fatality_veh') {
            labelRisk = "Skor IFK"; riskValDisplay = val.toFixed(2);
            let activeYear = currentFilters.year[0] !== 'All' ? parseInt(currentFilters.year[0]) : new Date().getFullYear();
            let tIFK = typeof targetIFK !== 'undefined' ? (targetIFK[activeYear] || 2.0) : 2.0;
            let classObj = typeof getIFKClassification === 'function' ? getIFKClassification(val, tIFK) : { label: 'NO DATA', color: '#94a3b8' };
            colorTheme = classObj.color; statusBadge = classObj.label;

            let vehPolres = 0;
            let cleanPolres = compKey.split('_')[1];
            let dbVeh = rawVehicleData.find(r => parseInt(r.tahun) === activeYear && normalizeDbPolresName(r.polres) === cleanPolres);
            if (dbVeh) vehPolres = parseFloat(dbVeh.total_kendaraan || 0);
            let formattedVeh = vehPolres.toLocaleString('id-ID');
            
            // [FITUR BARU]: Tambah Data Uji KIR
            let jmlUji = geoPropertiesLookup[compKey] ? geoPropertiesLookup[compKey].uji : 0;
            let rasioUji = (jmlUji > 0 && vehPolres > 0) ? Math.round(vehPolres / jmlUji).toLocaleString('id-ID') : 0;
            let rasioHtml = (jmlUji > 0 && vehPolres > 0) ? `(1 Titik per ${rasioUji} Kendaraan)` : '';

            let rangeText = (val % 1 === 0) ? val : `${Math.floor(val)} - ${Math.ceil(val)}`;
            labelDesc = `Mengindikasikan sekitar <b style="color:${colorTheme}">${rangeText}</b> kematian per 10.000 kendaraan.`;

            tableRowsHTML = `
                <tr><td><b>Polres</b></td><td>: <b>${polresName}</b></td></tr>
                <tr><td><b>${labelRisk}</b></td><td>: <b style="color:${colorTheme}">${riskValDisplay}</b></td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:5px 0;"></td></tr>
                <tr><td colspan="2" style="padding-top:5px; color:#334155;"><b>Jumlah MD: <span style="color:#ef4444;">${rawPoints} Jiwa</span></b></td></tr>
                <tr><td colspan="2" style="padding-top:2px; color:#334155;"><b>Jumlah Kendaraan: <span style="color:#eab308;">${formattedVeh} Unit</span></b></td></tr>
                <tr><td colspan="2" style="padding-top:2px; color:#334155;"><b>Fasilitas Uji KIR: <span style="color:#8b5cf6;">${jmlUji} Lokasi</span> <span style="font-size:9px; color:#94a3b8; font-weight:normal;">${rasioHtml}</span></b></td></tr>
                <tr><td colspan="2" style="font-size:11px; color:#64748b; line-height:1.4; padding-top:5px;">${labelDesc}</td></tr>
            `;

        } else if (currentMode === 'fatality') {
            labelRisk = "Fatality Reduction"; labelSpot = "Jumlah Kematian (MD)";
            riskValDisplay = val > 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`;
            let classObj = getFatalityClassification(val, window.currentFatalityTargetFR);
            colorTheme = classObj.color; statusBadge = classObj.label;

            // --- FITUR BARU: Tarik data Faskes dan hitung Rasio ---
            let jmlFaskes = geoPropertiesLookup[compKey] ? geoPropertiesLookup[compKey].faskes : 0;
            let rasioFaskes = (jmlFaskes > 0 && rawPoints > 0) ? (rawPoints / jmlFaskes).toFixed(1) : 0;
            let rasioHtml = (jmlFaskes > 0 && rawPoints > 0) ? `(1 Faskes per ${rasioFaskes} Korban)` : '';

            let targetText = window.currentFatalityTargetFR ? window.currentFatalityTargetFR.toFixed(1) + "%" : "0%";
            labelDesc = statusBadge === 'AMAN' ? `Nilai FR berhasil ditekan hingga <b style="color:${colorTheme}">-${Math.abs(val).toFixed(2)}%</b>, melampaui target (${targetText}).` : 
                        (statusBadge === 'WASPADA' ? `Nilai FR mencapai <b style="color:${colorTheme}">-${Math.abs(val).toFixed(2)}%</b>, belum memenuhi target (${targetText}).` : 
                        (statusBadge === 'RAWAN' ? `Nilai FR mencapai <b style="color:${colorTheme}">${Math.abs(val).toFixed(2)}%</b>. Perlu perhatian.` : 
                        (statusBadge === 'KRITIS' ? `Nilai FR <b style="color:${colorTheme}">melonjak tajam hingga ${Math.abs(val).toFixed(2)}%</b>.` : `Data belum lengkap.`)));

            tableRowsHTML = `
                <tr><td><b>Polres</b></td><td>: <b>${polresName}</b></td></tr>
                <tr><td><b>${labelRisk}</b></td><td>: <b style="color:${colorTheme}">${riskValDisplay}</b></td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:5px 0;"></td></tr>
                <tr><td colspan="2" style="padding-top:5px; color:#334155;"><b>${labelSpot}: <span style="color:#ef4444;">${rawPoints} Jiwa</span></b></td></tr>
                <tr><td colspan="2" style="padding-top:2px; color:#334155;"><b>Akses Faskes: <span style="color:#2563eb;">${jmlFaskes} Lokasi</span> <span style="font-size:9px; color:#94a3b8; font-weight:normal;">${rasioHtml}</span></b></td></tr>
                <tr><td colspan="2" style="font-size:11px; color:#64748b; line-height:1.4; padding-top:5px;">${labelDesc}</td></tr>
            `;
        } else if (currentMode === 'risk' || currentMode === 'traffic') {
            labelRisk = currentMode === 'risk' ? "Risiko Terlibat Kecelakaan" : "Indeks Kerentanan Macet";
            labelSpot = currentMode === 'risk' ? "Jumlah Titik Blackspot" : "Jumlah Titik Troublespot";
            riskValDisplay = val.toFixed(2);
            const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
            const statusObj = getRiskClassification(val, 'polres', period);
            colorTheme = statusObj.color; statusBadge = statusObj.label;

            let riskDescVal = val % 1 === 0 ? val : `${Math.floor(val)} - ${Math.ceil(val)}`;
            labelDesc = currentMode === 'risk' ? `Terdapat <b>${riskDescVal}</b> lokasi rentan laka per 100 km.` : `Potensi kepadatan lalu lintas dan hambatan samping signifikan.`;

            tableRowsHTML = `
                <tr><td><b>Polres</b></td><td>: <b>${polresName}</b></td></tr>
                <tr><td><b>${labelRisk}</b></td><td>: <b style="color:${colorTheme}">${riskValDisplay}</b></td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:5px 0;"></td></tr>
                <tr><td colspan="2" style="padding-top:5px; color:#334155;"><b>${labelSpot}: <span style="color:#ef4444;">${rawPoints}</span></b></td></tr>
                <tr><td colspan="2" style="padding-top:2px; color:#334155;"><b>Panjang Jalan: <span style="color:#2563eb;">${formattedLength} km</span></b></td></tr>
                <tr><td colspan="2" style="font-size:11px; color:#64748b; line-height:1.4; padding-top:5px;">${labelDesc}</td></tr>
            `;
        } else if (currentMode === 'kelancaran') {
            // --- KONTEN POPUP IKLL (DETAIL PARAMETER) ---
            let ikllScore = val; 
            labelRisk = "Skor IKLL"; 
            riskValDisplay = ikllScore.toFixed(2);
            let classObj = getKelancaranClassification(ikllScore);
            colorTheme = classObj.color;

            // Tarik data parameter spesifik untuk Polres ini dari memori
            let dataObj = currentDataMap[compKey] || { sumVcr: 0, countVcr: 0, sumTs: 0 };
            let avgVcr = dataObj.countVcr > 0 ? (dataObj.sumVcr / dataObj.countVcr) : 0;
            let jmlTs = dataObj.sumTs || 0;

            let geo = geoPropertiesLookup[compKey] || {};
            let lenJalan = geo.len || 1.0;
            let fmtLen = lenJalan.toLocaleString('id-ID', { maximumFractionDigits: 0 });
            let jmlRamai = geo.keramaian || 0;
            let jmlApill = geo.apill || 0;

            tableRowsHTML = `
                <tr>
                    <td style="color:#64748b; font-weight:700; width: 40%;">Polres</td>
                    <td style="text-align:right; width: 60%; color:#0f172a;"><b>: ${polresName}</b></td>
                </tr>
                <tr>
                    <td style="color:#64748b; font-weight:700;">Skor IKLL</td>
                    <td style="text-align:right;"><b>: <span style="color:${colorTheme}; font-size:15px;">${riskValDisplay}</span></b></td>
                </tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:5px 0;"></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px;"><b>Rata-Rata VCR: <span style="color:#eab308;">${avgVcr.toFixed(2)}</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Titik Keramaian: <span style="color:#3b82f6;">${jmlRamai} Lokasi</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Titik Troublespot: <span style="color:#ef4444;">${jmlTs} Lokasi</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Panjang Jalan: <span style="color:#f97316;">${fmtLen} km</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>APILL: <span style="color:#c084fc;">${jmlApill} Titik</span></b></td></tr>
            `;
        } else if (currentMode === 'ketertiban') {
            // --- KONTEN POPUP KETERTIBAN (IKKH HOLISTIK) ---
            let ikkhScore = val; 
            let totalGar = dataObj.total || 0;
            const period = currentFilters.month[0] !== 'All' ? 'month' : 'year'; 
            
            labelRisk = "Skor IKKH"; 
            riskValDisplay = ikkhScore.toFixed(2);
            let classObj = getKetertibanClassification(ikkhScore, 'polres', period);  
            colorTheme = classObj.color; statusBadge = classObj.label;

            // Tarik ulang data demografi spesifik untuk polres yang di-klik
            let targetYearStr = currentFilters.year[0];
            let activeYear = targetYearStr === 'All' ? new Date().getFullYear() : parseInt(targetYearStr);
            let tDrv = (activeYear === 2021 || activeYear === 2023) ? 2022 : (activeYear === 2026 ? 2025 : activeYear);
            
            let popDrv = 0, popVeh = 0;
            let cPolres = compKey.split('_')[1];
            
            let dbDrv = rawDriverData.find(r => parseInt(r.tahun) === tDrv && normalizeDbPolresName(r.polres) === cPolres);
            if (dbDrv) popDrv = parseFloat(dbDrv.total_pengemudi || 0);
            
            let dbVeh = rawVehicleData.find(r => parseInt(r.tahun) === activeYear && normalizeDbPolresName(r.polres) === cPolres);
            if (dbVeh) popVeh = parseFloat(dbVeh.total_kendaraan || 0);

            let geo = geoPropertiesLookup[compKey] || {};
            let lenJalan = geo.len || 1.0;
            let jmlEtle = geo.etle || 0;

            let fmtDrv = popDrv.toLocaleString('id-ID');
            let fmtVeh = popVeh.toLocaleString('id-ID');
            let fmtLen = lenJalan.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            let fmtBerat = rawPoints.toLocaleString('id-ID');
            let fmtTotal = totalGar.toLocaleString('id-ID');

            // [PERBAIKAN]: Margin pada garis <hr> dan padding-top pada setiap baris dipangkas habis agar sangat compact
            tableRowsHTML = `
                <tr>
                    <td style="color:#64748b; font-weight:700; width: 40%;">Polres</td>
                    <td style="text-align:right; width: 60%; color:#0f172a;"><b>: ${polresName}</b></td>
                </tr>
                <tr>
                    <td style="color:#64748b; font-weight:700;">Skor IKKH</td>
                    <td style="text-align:right;"><b>: <span style="color:${colorTheme};">${riskValDisplay}</span></b></td>
                </tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px;"><b>Pelanggaran Total: <span style="color:#c084fc;">${fmtTotal} Kasus</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Pelanggaran Berat: <span style="color:#ef4444;">${fmtBerat} Kasus</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px;"><b>Jumlah Pengemudi: <span style="color:#22c55e;">${fmtDrv} Jiwa</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Jumlah Kendaraan: <span style="color:#eab308;">${fmtVeh} Unit</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Panjang Jalan: <span style="color:#2563eb;">${fmtLen} km</span></b></td></tr>
                <tr><td colspan="2" style="text-align: right; color:#334155; font-size: 13px; padding-top:2px;"><b>Kamera ETLE: <span style="color:#f97316;">${jmlEtle} Titik</span></b></td></tr>
            `;
        }

        const popupHTML = `
            <div class="popup-header" style="display:flex; align-items:center; gap:10px;">
                <div class="popup-header-logo-box"><img src="${logoUrl}"></div>
                <span>${poldaName}</span>
            </div>
            <div class="popup-body">
                <table class="popup-table">
                    ${tableRowsHTML}
                </table>
            </div>`;

        const newPopup = new maplibregl.Popup({ closeOnClick: true }).setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
        newPopup.on('close', function() { if (!this.isSwitching) clearHighlight(); });
        currentPopup = newPopup;
    });

    // PERBAIKAN HOVER
    map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['layer-nasional-fill'] });
        
        if (features.length > 0) {
            map.getCanvas().style.cursor = 'pointer';
            const feature = features[0];
            const compKey = feature.properties._composite_key;
            const polresName = feature.properties._orig_name || "Unknown";
            const poldaName = feature.properties._polda_name || "Unknown";
            const logoUrl = getPoldaLogoFilename(poldaName);
            
            const dataObj = currentDataMap[compKey] || { risk: 0, raw: 0 };
            const val = dataObj.risk || 0;
            const rawPoints = dataObj.raw || 0;

            let riskValDisplay, colorTheme, statusBadge;

            if (currentMode === 'fatality_pop') {
                riskValDisplay = val.toFixed(2);
                let activeYear = currentFilters.year[0] !== 'All' ? parseInt(currentFilters.year[0]) : new Date().getFullYear();
                let tIFP = typeof targetIFP !== 'undefined' ? (targetIFP[activeYear] || 8.938) : 8.938;
                let classObj = typeof getIFPClassification === 'function' ? getIFPClassification(val, tIFP) : { label: 'NO DATA', color: '#94a3b8' };
                colorTheme = classObj.color; statusBadge = classObj.label;
            } else if (currentMode === 'fatality_veh') {
                riskValDisplay = val.toFixed(2);
                let activeYear = currentFilters.year[0] !== 'All' ? parseInt(currentFilters.year[0]) : new Date().getFullYear();
                let tIFK = typeof targetIFK !== 'undefined' ? (targetIFK[activeYear] || 2.0) : 2.0;
                let classObj = typeof getIFKClassification === 'function' ? getIFKClassification(val, tIFK) : { label: 'NO DATA', color: '#94a3b8' };
                colorTheme = classObj.color; statusBadge = classObj.label;
            } else if (currentMode === 'fatality') {
                riskValDisplay = val > 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`;
                let classObj = getFatalityClassification(val, window.currentFatalityTargetFR);
                colorTheme = classObj.color; statusBadge = classObj.label;
            } else if (currentMode === 'ketertiban') {
                // --- KONTEN POPUP KETERTIBAN ---
                let ikkhScore = val; 
                let totalGar = dataObj.total || 0;
                const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
                
                labelRisk = "IKKH"; 
                riskValDisplay = ikkhScore.toFixed(2);
                let classObj = getKetertibanClassification(ikkhScore, 'polres', period);
                colorTheme = classObj.color; statusBadge = classObj.label;
            } else if (currentMode === 'kelancaran') {
                // --- KONTEN HOVER KELANCARAN ---
                labelRisk = "VCR"; 
                riskValDisplay = val.toFixed(2);
                let classObj = getKelancaranClassification(val);
                colorTheme = classObj.color; statusBadge = classObj.label;  
            } else {
                riskValDisplay = val.toFixed(2);
                const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
                const statusObj = getRiskClassification(val, 'polres', period);
                colorTheme = statusObj.color; statusBadge = statusObj.label;
            }

            const hoverHTML = `
                <div class="modern-hover-wrapper">
                    <div class="mh-logo-box"><img src="${logoUrl}" class="mh-logo"></div>
                    <div class="mh-details">
                        <div class="mh-subtitle">${poldaName}</div>
                        <div class="mh-title">${polresName}</div>
                        <div class="mh-metrics">
                            <div class="mh-score-box">
                                <span class="mh-score-label">${currentMode === 'fatality' ? 'FR:' : 'Skor:'}</span>
                                <span class="mh-score-val" style="color: ${colorTheme}; text-shadow: 0 0 10px ${colorTheme}80;">${riskValDisplay}</span>
                            </div>
                            <div class="mh-badge" style="background: ${colorTheme}20; color: ${colorTheme}; border: 1px solid ${colorTheme}50;">${statusBadge}</div>
                        </div>
                    </div>
                </div>
            `;
            hoverPopup.setLngLat(e.lngLat).setHTML(hoverHTML).addTo(map);
        } else {
            map.getCanvas().style.cursor = '';
            hoverPopup.remove();
        }
    });

    map.on('mouseleave', () => { hoverPopup.remove(); });
}

function zoomToPolda(poldaName) {
    const data = poldaBounds[poldaName];
    if (data && data.bounds) {
        map.fitBounds(data.bounds, { padding: 50, maxZoom: 9, duration: 1500 });
        if (data.geoJSON) map.getSource('highlight-source').setData(data.geoJSON);
    }
}

function zoomToFilteredExtent() {
    const selectedPoldas = currentFilters.poldas;
    const selectedPolres = currentFilters.polres;
    
    if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
        map.flyTo({ center: [110.0, -3.0], zoom: 4.0, duration: 1500 });
        return;
    }

    const combinedBounds = new maplibregl.LngLatBounds();
    let hasValidBounds = false;
    
    const extendBoundsFromCoords = (coords) => {
        if (typeof coords[0] === 'number') { combinedBounds.extend(coords); hasValidBounds = true; } 
        else { coords.forEach(c => extendBoundsFromCoords(c)); }
    };

    if (!selectedPolres.includes('All')) {
        let ditlantasTargets = [];
        for (let sel of selectedPolres) {
            if (sel.toUpperCase().startsWith("DITLANTAS")) ditlantasTargets.push(sel.toUpperCase().replace("DITLANTAS", "").replace("POLDA", "").trim());
        }

        if (ditlantasTargets.length > 0) {
            for (let poldaTarget of ditlantasTargets) {
                for (const pLabel in poldaBounds) {
                    if (pLabel.toUpperCase().replace("POLDA", "").trim() === poldaTarget && poldaBounds[pLabel].bounds) {
                        combinedBounds.extend(poldaBounds[pLabel].bounds.getSouthWest());
                        combinedBounds.extend(poldaBounds[pLabel].bounds.getNorthEast());
                        hasValidBounds = true; break;
                    }
                }
            }
        }

        const activeKeys = window._activePolresKeys || [];
        for (const poldaKey in poldaBounds) {
            const geoJSON = poldaBounds[poldaKey].geoJSON;
            if (geoJSON && geoJSON.features) {
                geoJSON.features.forEach(f => {
                    if (f.properties._composite_key && activeKeys.includes(f.properties._composite_key) && f.geometry) {
                        extendBoundsFromCoords(f.geometry.coordinates);
                    }
                });
            }
        }
    } else if (!selectedPoldas.includes('All')) {
        selectedPoldas.forEach(dbPolda => {
            const poldaLabel = getPoldaLabelFromDbValue(dbPolda);
            if (poldaLabel && poldaBounds[poldaLabel] && poldaBounds[poldaLabel].bounds) {
                combinedBounds.extend(poldaBounds[poldaLabel].bounds.getSouthWest());
                combinedBounds.extend(poldaBounds[poldaLabel].bounds.getNorthEast());
                hasValidBounds = true;
            }
        });
    }

    if (hasValidBounds) map.fitBounds(combinedBounds, { padding: { top: 120, bottom: 60, left: 100, right: 60 }, maxZoom: 10, duration: 1500 });
}

// ==========================================
// 8. MAP EXECUTION INIT
// ==========================================

map.on('load', async () => { 
    const compassBtn = document.querySelector('.maplibregl-ctrl-compass');
    if (compassBtn) compassBtn.addEventListener('click', (e) => { e.preventDefault(); map.easeTo({ bearing: 0, pitch: 0, duration: 1000 }); }); 
    
    map.addSource('highlight-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'highlight-line', type: 'line', source: 'highlight-source', paint: { 'line-color': '#FFFF00', 'line-width': 4, 'line-opacity': 0.8 } });

    initFilters();
    await preloadAllData(); // <--- 1. Download semua data diam-diam
    rawTrendData = getCurrentTrendData(); // <--- 2. Pasang data yang sesuai mode
    rawPopulationData = await fetchPopulationData();
    rawVehicleData = await fetchVehicleData();
    rawDriverData = await fetchDriverData();
    updateLastUpdatedDate(rawTrendData);
    calculateNationalThresholds(rawTrendData); 
    
    await initialLoadGeoJSON(); 
    
    map.addSource('points-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
    map.addLayer({ id: 'clusters', type: 'circle', source: 'points-source', filter: ['has', 'point_count'], paint: { 'circle-color': ['step', ['get', 'point_count'], '#ef4444', 50, '#b91c1c', 200, '#7f1d1d', 500, '#450a0a'], 'circle-opacity': 0.3, 'circle-stroke-width': 3, 'circle-stroke-color': ['step', ['get', 'point_count'], '#ef4444', 50, '#b91c1c', 200, '#7f1d1d', 500, '#450a0a'], 'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40] } });
    map.addLayer({ id: 'unclustered-point', type: 'circle', source: 'points-source', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': '#ef4444', 'circle-opacity': 0.3, 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#ef4444' } });
    map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'points-source', filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Bold'], 'text-size': 14 }, paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 1 } });

    await updatePointLayerData(); 
    updateFooterDefinitions(currentMode);
    setupGlobalInteraction();
    
    await updateDashboardData();
    renderInteractiveCharts();
    
    isSystemReady = true;
    checkAndOpenApp();
});

// =========================================================
// 9. JANTUNG KETERTIBAN: LOGIKA HRVR MURNI
// =========================================================
async function processKetertibanMode() {
    const safeTrendData = typeof rawTrendData !== 'undefined' ? rawTrendData : [];

    let requestedYearStr = currentFilters.year[0];
    let activeYear = requestedYearStr === 'All' ? new Date().getFullYear() : parseInt(requestedYearStr);
    let isMonthAll = currentFilters.month[0] === 'All';
    let fMonth = currentFilters.month;

    let totalBeratFiltered = 0;
    let totalPelanggaranFiltered = 0; 
    let poldaStats = {};
    currentDataMap = {};
    
    for (let uniqueKey in geoPropertiesLookup) {
        currentDataMap[uniqueKey] = { berat: 0, total: 0 };
        let poldaLabel = uniqueKey.split('_')[0];
        if (!poldaStats[poldaLabel]) poldaStats[poldaLabel] = { berat: 0, total: 0 };
    } 

    const selectedPoldas = currentFilters.poldas;
    const selectedPolres = currentFilters.polres;
    let allowedPoldas = new Set();

    // Setup wilayah yang difilter
    if (!selectedPolres.includes('All')) {
        selectedPolres.forEach(sel => {
            let cleanPolres = normalizeDbPolresName(sel.split('###')[0]);
            if (cleanPolres.startsWith("DITLANTAS")) {
                let found = poldaConfig.find(c => c.label.toUpperCase() === cleanPolres.replace("DITLANTAS ", "").toUpperCase());
                if (found) allowedPoldas.add(found.label);
            } else if (polresLookup[cleanPolres]) {
                allowedPoldas.add(polresLookup[cleanPolres][0]);
            }
        });
    } else if (!selectedPoldas.includes('All')) {
        selectedPoldas.forEach(dbPolda => {
            let pLabel = getPoldaLabelFromDbValue(dbPolda);
            if (pLabel) allowedPoldas.add(pLabel);
        });
    } else {
        poldaConfig.forEach(cfg => allowedPoldas.add(cfg.label));
    }

    safeTrendData.forEach(row => {
        let y = row._year;
        if (isNaN(y)) return;
        if (requestedYearStr !== 'All' && y !== activeYear) return;

        let m = (new Date(row.tanggal).getMonth() + 1).toString();
        if (!isMonthAll && !fMonth.includes(m)) return;

        let valBerat = row.value_amount; // Pelanggaran Berat
        let valTotal = row.total_pelanggaran; // Total Pelanggaran
        const cleanPolres = row._clean_polres;
        const targetPoldaLabel = row._polda_label;

        let isAllowed = false;
        if (selectedPoldas.includes('All') && selectedPolres.includes('All')) {
            isAllowed = true;
            if (targetPoldaLabel !== 'MABES POLRI') allowedPoldas.add(targetPoldaLabel);
        } else if (!selectedPolres.includes('All')) {
            for (let selected of selectedPolres) {
                let cleanSelected = normalizeDbPolresName(selected.split('###')[0]);
                if (cleanSelected.startsWith("DITLANTAS")) {
                    if (targetPoldaLabel && targetPoldaLabel.toUpperCase() === cleanSelected.replace("DITLANTAS ", "").toUpperCase() && cleanPolres.startsWith("DITLANTAS")) {
                        isAllowed = true; allowedPoldas.add(targetPoldaLabel); break;
                    }
                } else {
                    if (cleanPolres === cleanSelected) { isAllowed = true; allowedPoldas.add(targetPoldaLabel); break; }
                }
            }
        } else if (!selectedPoldas.includes('All')) {
            for (let dbPolda of selectedPoldas) {
                if (getPoldaLabelFromDbValue(dbPolda) === targetPoldaLabel) { isAllowed = true; allowedPoldas.add(targetPoldaLabel); break; }
            }
        }

        // Kumpulkan Total
        if (poldaStats[targetPoldaLabel]) {
            poldaStats[targetPoldaLabel].berat += valBerat;
            poldaStats[targetPoldaLabel].total += valTotal;
        }

        if (isAllowed) {
            totalBeratFiltered += valBerat;
            totalPelanggaranFiltered += valTotal;
        }

        // Simpan ke Peta
        if (cleanPolres && targetPoldaLabel !== 'MABES POLRI') {
            let compKey = generateCompositeKey(targetPoldaLabel, cleanPolres);
            if (!currentDataMap[compKey]) currentDataMap[compKey] = { berat: 0, total: 0 };
            currentDataMap[compKey].berat += valBerat;
            currentDataMap[compKey].total += valTotal;
        }
    });

    grandTotalPoints = totalBeratFiltered; 

    // --- WARNA PETA & HITUNG IKKH POLRES ---
    let matchExpression = ['match', ['get', '_composite_key']];
    let hasData = false;
    const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';

    // [OPTIMASI SUPER CEPAT]: Buat Kamus (Dictionary) Data Demografi di luar looping!
    let vehDict = {};
    rawVehicleData.forEach(r => { if(parseInt(r.tahun) === activeYear) vehDict[normalizeDbPolresName(r.polres)] = parseFloat(r.total_kendaraan || 0); });
    
    let yDrv = (activeYear===2021||activeYear===2023)?2022:(activeYear===2026?2025:activeYear);
    let drvDict = {};
    rawDriverData.forEach(r => { if(parseInt(r.tahun) === yDrv) drvDict[normalizeDbPolresName(r.polres)] = parseFloat(r.total_pengemudi || 0); });

    for (let key in currentDataMap) {
        let berat = currentDataMap[key].berat;
        let total = currentDataMap[key].total;
        
        let geo = geoPropertiesLookup[key] || {};
        let cPolres = key.split('_')[1];
        
        // Panggil langsung dari Kamus (0.0001 milidetik) tanpa nge-loop array pakai .find() berjuta kali!
        let veh = vehDict[cPolres] || 20000;
        let drv = drvDict[cPolres] || 10000;

        let ikkh = window.calculateIKKH(berat, total, drv, veh, geo.len || 1, geo.etle || 0);
        
        currentDataMap[key].risk = ikkh; // SKOR IKKH DARI 0-100
        currentDataMap[key].raw = berat; 

        let color = getKetertibanClassification(ikkh, 'polres', period).color;
        matchExpression.push(key, color);
        hasData = true;
    }
    
    const defaultColor = '#94a3b8'; 
    matchExpression.push(defaultColor);

    if (map.getLayer('layer-nasional-fill')) {
        map.setPaintProperty('layer-nasional-fill', 'fill-color', hasData ? matchExpression : defaultColor);
    }
    updateMapVisibility();

    // --- UPDATE UI DASHBOARD (IKKH NASIONAL) ---
    document.getElementById('headerYearDisplay').innerText = requestedYearStr === 'All' ? "Semua Tahun" : activeYear;
    
    let demoGlobal = window.getFilteredDemography(activeYear);
    let ikkhNasional = window.calculateIKKH(totalBeratFiltered, totalPelanggaranFiltered, demoGlobal.drv, demoGlobal.veh, demoGlobal.len, demoGlobal.etle);
    
    let dashScope = 'national';
    if (currentFilters.polres[0] !== 'All') dashScope = 'polres';
    else if (currentFilters.poldas[0] !== 'All') dashScope = 'polda';
    
    // [PERBAIKAN]: Ambil status klasifikasinya secara lengkap (bukan hanya warnanya)
    let statusIKKH = getKetertibanClassification(ikkhNasional, dashScope, period);
    let colorTheme = totalPelanggaranFiltered === 0 ? '#94a3b8' : statusIKKH.color;
    
    let hVal = document.getElementById('totalRiskDisplay');
    if (hVal) { hVal.innerText = ikkhNasional.toFixed(2); hVal.style.color = colorTheme; }
    
    let fVal = document.getElementById('footerRiskValue');
    if (fVal) { fVal.innerText = ikkhNasional.toFixed(2); fVal.style.color = colorTheme; fVal.style.webkitTextFillColor = colorTheme; fVal.style.textShadow = `0 4px 10px ${colorTheme}40`; }

    // [PERBAIKAN]: Teks deskripsi dinamis mengikuti hasil skor IKKH
    let desc = document.getElementById('totalRiskDesc');
    if (desc) {
        let descText = "";
        
        if (totalPelanggaranFiltered === 0) {
            descText = "Data penindakan bernilai 0. Harap sinkronisasi database untuk menghindari bias penindakan (Dark Figure).";
        } else if (statusIKKH.label === 'AMAN') {
            descText = `Skor ini menunjukkan tingkat ketertiban yang <b style="color:${colorTheme}">Sangat Baik</b>. Rasio pelanggaran berisiko sangat minim jika diukur dari jumlah pengemudi dan infrastruktur pengawasan ETLE yang memadai.`;
        } else if (statusIKKH.label === 'WASPADA') {
            descText = `Skor ini menunjukkan tingkat ketertiban yang <b style="color:${colorTheme}">Mulai Menurun</b>. Terdapat tren peningkatan rasio pelanggaran berisiko terhadap eksposur pengemudi dan kendaraan di jalan.`;
        } else if (statusIKKH.label === 'RAWAN') {
            descText = `Skor ini menunjukkan ketertiban yang <b style="color:${colorTheme}">Kurang Baik</b>. Tingkat pelanggaran berat cukup tinggi jika diukur dari rasio pengemudi, serta diperparah dengan minimnya kapasitas pengawasan ETLE.`;
        } else {
            descText = `Skor ini menunjukkan ketertiban yang <b style="color:${colorTheme}">Sangat Memprihatinkan</b>. Pelanggaran fatal mendominasi di tengah tingginya kepadatan kendaraan dan ketiadaan pengawasan ETLE.`;
        }
        
        desc.innerHTML = `<div style="line-height:1.5; font-size:13px; color:#334155;">${descText}</div>`;
    }
    
    // [PERBAIKAN]: Injeksi 6 data sekaligus ke dalam panel grid IKKH yang baru
    let valTotalPelanggaran = document.getElementById('valTotalPelanggaran');
    if (valTotalPelanggaran) valTotalPelanggaran.innerText = totalPelanggaranFiltered.toLocaleString('id-ID');

    let valBeratPelanggaran = document.getElementById('valBeratPelanggaran');
    if (valBeratPelanggaran) valBeratPelanggaran.innerText = totalBeratFiltered.toLocaleString('id-ID');

    let valPengemudiIKKH = document.getElementById('valPengemudiIKKH');
    if (valPengemudiIKKH) valPengemudiIKKH.innerHTML = `${demoGlobal.drv.toLocaleString('id-ID')} <span style="font-size:10px; font-weight:normal; color:#64748b;">Jiwa</span>`;

    let valKendaraanIKKH = document.getElementById('valKendaraanIKKH');
    if (valKendaraanIKKH) valKendaraanIKKH.innerHTML = `${demoGlobal.veh.toLocaleString('id-ID')} <span style="font-size:10px; font-weight:normal; color:#64748b;">Unit</span>`;

    let valJalanIKKH = document.getElementById('valJalanIKKH');
    if (valJalanIKKH) valJalanIKKH.innerHTML = `${demoGlobal.len.toLocaleString('id-ID', {maximumFractionDigits:0})} <span style="font-size:10px; font-weight:normal; color:#64748b;">km</span>`;

    let valEtleIKKH = document.getElementById('valEtleIKKH');
    if (valEtleIKKH) valEtleIKKH.innerHTML = `${demoGlobal.etle.toLocaleString('id-ID')} <span style="font-size:10px; font-weight:normal; color:#64748b;">Titik</span>`;

    // --- BANGUN TABEL POLDA LIST ---
    const tbody = document.getElementById('riskTableBody');
    let tableArray = [];

    allowedPoldas.forEach(polda => {
        if (polda === 'MABES POLRI') return; 
        let stats = poldaStats[polda] || { berat: 0, total: 0 }; 
        let pDemo = window.getFilteredDemography(activeYear, polda);
        let ikkhPolda = window.calculateIKKH(stats.berat, stats.total, pDemo.drv, pDemo.veh, pDemo.len, pDemo.etle);
        
        let colorObj = getKetertibanClassification(ikkhPolda, 'polda', period);
        
        tableArray.push({ name: polda, raw: stats.berat, total: stats.total, val: ikkhPolda, color: colorObj.color, bg: colorObj.bg });
    });
    
    // [PERBAIKAN KUNCI 1]: Tentukan Rank Sebenarnya Dulu (Skor 100 = Rank #1)
    tableArray.sort((a, b) => b.val - a.val); // Sort Descending (Tertinggi ke Terendah)
    
    let currentRank = 1;
    tableArray.forEach((item, index) => {
        // Logika sederhana untuk menyamakan rank jika skornya identik/seri
        if (index > 0 && Math.abs(tableArray[index - 1].val - item.val) > 0.0001) {
            currentRank = index + 1;
        }
        item.rank = currentRank;
    });

    // [PERBAIKAN KUNCI 2]: Balik Array agar yang paling BURUK (Misal Rank #36) muncul di ATAS
    tableArray.reverse();
    
    if (tableArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">Data tidak ditemukan.</td></tr>`;
    } else {
        let tableHTML = '';
        tableArray.forEach((item) => {
            const rank = item.rank;
            let rankClass = 'rank-col';
            
            // Beri warna font Medali (Emas/Perak/Perunggu) HANYA pada 3 wilayah TERBURUK yang kini mejeng di puncak tabel
            if (item === tableArray[0]) rankClass += ' top-rank-1'; 
            else if (item === tableArray[1]) rankClass += ' top-rank-2'; 
            else if (item === tableArray[2]) rankClass += ' top-rank-3';
            
            const logoUrl = getPoldaLogoFilename(item.name);
            tableHTML += `
                <tr onclick="zoomToPolda('${item.name}')" style="cursor:pointer; background-color:${item.bg}; border-left:4px solid ${item.color};">
                    <td class="${rankClass}">#${rank}</td>
                    <td style="font-weight:600; color:#334155; display:flex; align-items:center;"><img src="${logoUrl}" class="table-polda-logo"> ${item.name}</td>
                    <td style="color: ${item.color} !important; font-weight: 900; text-align:center; font-size:16px;">${item.val.toFixed(1)}</td>
                </tr>`;
        });
        tbody.innerHTML = tableHTML;
    }
    // ================================================================
    // [PERBAIKAN KUNCI]: Panggil fungsi Rekomendasi IKKH untuk dipasang ke Layar!
    // ================================================================
    if (safeTrendData && safeTrendData.length > 0) {
        // Mengirimkan skor IKKH Nasional ke mesin rekomendasi
        const recText = generateRecommendation(ikkhNasional, safeTrendData);
        const recContainer = document.getElementById('recommendationText');
        if (recContainer) { 
            recContainer.innerHTML = recText; 
        }
    }
}

// =========================================================
// 10. JANTUNG KELANCARAN: LOGIKA VCR MURNI
// =========================================================
async function processKelancaranMode() {
    const safeTrendData = typeof rawTrendData !== 'undefined' ? rawTrendData : [];
    const trafficData = globalTrendCache.traffic || []; // [TARIK DATA TROUBLESPOT]
    
    let requestedYearStr = currentFilters.year[0];
    let activeYear = 2026; 
    
    if (requestedYearStr !== 'All') {
        activeYear = parseInt(requestedYearStr);
    } else if (safeTrendData.length > 0) {
        let tempMax = 0;
        for (let i=0; i<safeTrendData.length; i++) { if(safeTrendData[i]._year > tempMax) tempMax = safeTrendData[i]._year; }
        if (tempMax > 0) activeYear = tempMax;
    }

    let isMonthAll = currentFilters.month[0] === 'All';
    let fMonth = currentFilters.month;

    let poldaStats = {}; currentDataMap = {};
    for (let key in geoPropertiesLookup) {
        currentDataMap[key] = { sumVcr: 0, countVcr: 0, sumTs: 0 };
        let pLabel = key.split('_')[0];
        if (!poldaStats[pLabel]) poldaStats[pLabel] = { sumVcr: 0, countVcr: 0, sumTs: 0 };
    }

    const selectedPoldas = currentFilters.poldas;
    const selectedPolres = currentFilters.polres;
    let allowedPoldas = new Set();

    // Setup Filter Wilayah
    if (!selectedPolres.includes('All')) {
        selectedPolres.forEach(sel => {
            let cleanPolres = normalizeDbPolresName(sel.split('###')[0]);
            if (cleanPolres.startsWith("DITLANTAS")) {
                let found = poldaConfig.find(c => c.label.toUpperCase() === cleanPolres.replace("DITLANTAS ", "").toUpperCase());
                if (found) allowedPoldas.add(found.label);
            } else if (polresLookup[cleanPolres]) allowedPoldas.add(polresLookup[cleanPolres][0]);
        });
    } else if (!selectedPoldas.includes('All')) {
        selectedPoldas.forEach(dbPolda => {
            let pLabel = getPoldaLabelFromDbValue(dbPolda);
            if (pLabel) allowedPoldas.add(pLabel);
        });
    } else {
        poldaConfig.forEach(cfg => allowedPoldas.add(cfg.label));
    }

    // 1. Ekstrak Data VCR
    safeTrendData.forEach(row => {
        let y = row._year;
        if (isNaN(y) || (requestedYearStr !== 'All' && y !== activeYear)) return;
        let m = (new Date(row.tanggal).getMonth() + 1).toString();
        if (!isMonthAll && !fMonth.includes(m)) return;

        const cleanPolres = row._clean_polres;
        const targetPoldaLabel = row._polda_label;

        if (poldaStats[targetPoldaLabel]) { poldaStats[targetPoldaLabel].sumVcr += row.value_amount; poldaStats[targetPoldaLabel].countVcr += 1; }
        if (cleanPolres && targetPoldaLabel !== 'MABES POLRI') {
            let compKey = generateCompositeKey(targetPoldaLabel, cleanPolres);
            if (currentDataMap[compKey]) { currentDataMap[compKey].sumVcr += row.value_amount; currentDataMap[compKey].countVcr += 1; }
        }
    });

    // 2. Ekstrak Data Troublespot (Dari Cache Traffic)
    trafficData.forEach(row => {
        let y = row._year;
        if (isNaN(y) || (requestedYearStr !== 'All' && y !== activeYear)) return;
        let m = (new Date(row.tanggal).getMonth() + 1).toString();
        if (!isMonthAll && !fMonth.includes(m)) return;

        const cleanPolres = row._clean_polres;
        const targetPoldaLabel = row._polda_label;

        if (poldaStats[targetPoldaLabel]) poldaStats[targetPoldaLabel].sumTs += row.value_amount;
        if (cleanPolres && targetPoldaLabel !== 'MABES POLRI') {
            let compKey = generateCompositeKey(targetPoldaLabel, cleanPolres);
            if (currentDataMap[compKey]) currentDataMap[compKey].sumTs += row.value_amount;
        }
    });

    let matchExpression = ['match', ['get', '_composite_key']];
    let hasData = false;

    // 3. Kalkulasi IKLL Per Polres
    for (let key in currentDataMap) {
        let avgVcr = currentDataMap[key].countVcr > 0 ? currentDataMap[key].sumVcr / currentDataMap[key].countVcr : 0;
        let ts = currentDataMap[key].sumTs;
        let geo = geoPropertiesLookup[key] || {};
        
        let ikll = window.calculateIKLL(avgVcr, geo.keramaian || 0, ts, geo.apill || 0, geo.len || 1);
        
        currentDataMap[key].risk = ikll; 
        let color = getKelancaranClassification(ikll).color;
        matchExpression.push(key, color);
        hasData = true;
    }
    
    const defaultColor = getKelancaranClassification(100).color; // Default Hijau
    matchExpression.push(defaultColor);
    if (map.getLayer('layer-nasional-fill')) map.setPaintProperty('layer-nasional-fill', 'fill-color', hasData ? matchExpression : defaultColor);
    updateMapVisibility();

    // 4. Kalkulasi IKLL Nasional
    let demoGlobal = window.getFilteredDemography(activeYear);
    
    // Rata-rata VCR Nasional & Total TS Nasional yang diizinkan filter
    let sumVcrNasional = 0, countVcrNasional = 0, sumTsNasional = 0;
    allowedPoldas.forEach(polda => {
        if (polda === 'MABES POLRI') return; 
        if (poldaStats[polda]) {
            sumVcrNasional += poldaStats[polda].sumVcr;
            countVcrNasional += poldaStats[polda].countVcr;
            sumTsNasional += poldaStats[polda].sumTs;
        }
    });
    
    let avgVcrNasional = countVcrNasional > 0 ? sumVcrNasional / countVcrNasional : 0;
    let ikllNasional = window.calculateIKLL(avgVcrNasional, demoGlobal.keramaian, sumTsNasional, demoGlobal.apill, demoGlobal.len);
    
    let statusIKLL = getKelancaranClassification(ikllNasional);
    
    document.getElementById('headerYearDisplay').innerText = requestedYearStr === 'All' ? "Semua Tahun" : activeYear;
    let hVal = document.getElementById('totalRiskDisplay'); if (hVal) { hVal.innerText = ikllNasional.toFixed(2); hVal.style.color = statusIKLL.color; }
    let fVal = document.getElementById('footerRiskValue'); if (fVal) { fVal.innerText = ikllNasional.toFixed(2); fVal.style.color = statusIKLL.color; fVal.style.webkitTextFillColor = statusIKLL.color; }

    let desc = document.getElementById('totalRiskDesc');
    if (desc) {
        let descText = "";
        
        if (countVcrNasional === 0) {
            descText = "Data perhitungan Volume-to-Capacity Ratio (VCR) belum memadai atau bernilai 0 pada periode ini.";
        } else if (statusIKLL.label === 'SANGAT LANCAR') {
            descText = `Skor ini menunjukkan tingkat kelancaran yang <b style="color:${statusIKLL.color}">Sangat Baik</b>. Rasio volume kendaraan berbanding kapasitas jalan (VCR) sangat terkendali, didukung dengan minimnya hambatan samping dan manajemen persimpangan yang memadai.`;
        } else if (statusIKLL.label === 'PADAT MERAYAP') {
            descText = `Skor ini menunjukkan tingkat kelancaran yang <b style="color:${statusIKLL.color}">Mulai Menurun</b>. Mulai terlihat fluktuasi penumpukan kendaraan pada jam sibuk yang dipengaruhi oleh peningkatan volume arus dan aktivitas titik keramaian lokal.`;
        } else if (statusIKLL.label === 'TERSENDAT') {
            descText = `Skor ini menunjukkan kelancaran di level <b style="color:${statusIKLL.color}">Kurang Baik</b>. Kepadatan volume kendaraan cukup tinggi dan secara signifikan diperparah oleh banyaknya titik troublespot serta kurangnya fasilitas pengatur simpang.`;
        } else { // MACET KRITIS
            descText = `Skor ini menunjukkan kelancaran yang <b style="color:${statusIKLL.color}">Sangat Memprihatinkan</b>. Kepadatan lalu lintas telah melampaui daya tampung jalan, mengakibatkan gridlock parah akibat tidak seimbangnya infrastruktur dengan eksalasi volume kendaraan dan hambatan fisik.`;
        }
        
        desc.innerHTML = `<div style="line-height:1.5; font-size:13px; color:#334155;">${descText}</div>`;
    }

    // Injeksi Panel 6 Kotak IKLL
    let valIkllAvg = document.getElementById('valIkllAvg'); if (valIkllAvg) { valIkllAvg.innerText = ikllNasional.toFixed(2); valIkllAvg.style.color = statusIKLL.color; }
    let valVcrAvg = document.getElementById('valVcrAvg'); if (valVcrAvg) valVcrAvg.innerText = avgVcrNasional.toFixed(2);
    let valRamaiVCR = document.getElementById('valRamaiVCR'); if (valRamaiVCR) valRamaiVCR.innerHTML = `${demoGlobal.keramaian.toLocaleString('id-ID')} <span style="font-size:10px; color:#64748b;">Lokasi</span>`;
    let valTsVCR = document.getElementById('valTsVCR'); if (valTsVCR) valTsVCR.innerHTML = `${sumTsNasional.toLocaleString('id-ID')} <span style="font-size:10px; color:#64748b;">Lokasi</span>`;
    let valJalanVCR = document.getElementById('valJalanVCR'); if (valJalanVCR) valJalanVCR.innerHTML = `${demoGlobal.len.toLocaleString('id-ID', {maximumFractionDigits:0})} <span style="font-size:10px; color:#64748b;">km</span>`;
    let valApillVCR = document.getElementById('valApillVCR'); if (valApillVCR) valApillVCR.innerHTML = `${demoGlobal.apill.toLocaleString('id-ID')} <span style="font-size:10px; color:#64748b;">Titik</span>`;

    // 5. Bangun Tabel Polda IKLL
    const tbody = document.getElementById('riskTableBody');
    tbody.innerHTML = ''; 
    let tableArray = [];

    allowedPoldas.forEach(polda => {
        if (polda === 'MABES POLRI') return; 
        let stats = poldaStats[polda] || { sumVcr: 0, countVcr: 0, sumTs: 0 }; 
        let avgPoldaVcr = stats.countVcr > 0 ? (stats.sumVcr / stats.countVcr) : 0;
        let pDemo = window.getFilteredDemography(activeYear, polda);
        
        let ikllPolda = window.calculateIKLL(avgPoldaVcr, pDemo.keramaian, stats.sumTs, pDemo.apill, pDemo.len);
        let colorObj = getKelancaranClassification(ikllPolda);
        tableArray.push({ name: polda, val: ikllPolda, color: colorObj.color, bg: colorObj.bg });
    });
    
    // Urutkan IKLL: Paling Rendah (Macet/Kritis) di Atas
    tableArray.sort((a, b) => a.val - b.val); 

    let tableHTML = '';
    let currentRank = 1;

    tableArray.forEach((item, index) => {
        if (index > 0 && Math.abs(tableArray[index - 1].val - item.val) > 0.0001) currentRank = index + 1;
        let rankClass = 'rank-col';
        if (currentRank === 1) rankClass += ' top-rank-1'; 
        else if (currentRank === 2) rankClass += ' top-rank-2'; 
        else if (currentRank === 3) rankClass += ' top-rank-3'; 
        
        tableHTML += `
            <tr onclick="zoomToPolda('${item.name}')" style="cursor:pointer; background-color:${item.bg}; border-left:4px solid ${item.color};">
                <td class="${rankClass}">#${currentRank}</td>
                <td style="font-weight:600; color:#334155; display:flex; align-items:center;"><img src="${getPoldaLogoFilename(item.name)}" class="table-polda-logo"> ${item.name}</td>
                <td style="color: ${item.color} !important; font-weight: 900; text-align:center; font-size:16px;">${item.val.toFixed(2)}</td>
            </tr>`;
    });
    tbody.innerHTML = tableHTML;
    
    // Perbarui isi Tooltip Hover/Click
    map.on('mousemove', function updateHoverText(e) { /* logika akan diurus popup handler */ });
    // ================================================================
    // 6. INJEKSI REKOMENDASI PENANGANAN IKLL KE LAYAR
    // ================================================================
    if (safeTrendData && safeTrendData.length > 0) {
        // Mengirimkan skor IKLL Nasional ke mesin rekomendasi
        const recText = generateRecommendation(ikllNasional, safeTrendData);
        const recContainer = document.getElementById('recommendationText');
        if (recContainer) { 
            recContainer.innerHTML = recText; 
        }
    }
}