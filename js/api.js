// =========================================================
// API.JS - MENGHUBUNGKAN FRONTEND DENGAN DATABASE (BACKEND)
// =========================================================
// --- TAMENG ANTI-CRASH: Memastikan output selalu berupa Array ---
async function fetchSafe(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return []; // Jika server error 500/404, kembalikan array kosong
        const json = await res.json();
        return Array.isArray(json) ? json : [];
    } catch(e) { 
        console.warn("Fetch gagal (Server Down/Timeout):", url);
        return []; 
    }
}

// --- FUNGSI AMBIL DATA TITIK (BLACKSPOT/TROUBLESPOT) ---
async function fetchPointData() {
    if (window.currentDashboardModule === 'keselamatan' || window.currentDashboardModule === 'ketertiban' || window.currentDashboardModule === 'kelancaran') {
        return { type: 'FeatureCollection', features: [] };
    }
    try {
        // 1. Tentukan nama file statis berdasarkan mode
        const fileName = currentMode === 'risk' ? 'api_points_risk.json' : 'api_points_traffic.json';

        // 2. Fetch langsung ke file JSON di dalam folder data
        const data = await fetchSafe(`./data/${fileName}`);

        if (!data || data.length === 0) return { type: 'FeatureCollection', features: [] };

        // 3. Ubah format JSON mentah menjadi format GeoJSON yang dipahami Peta
        const features = data
            .filter(row => {
                const isActive = row.status && row.status.toUpperCase() === 'ACTIVE';
                let strLat = String(row.lat).replace(',', '.');
                let strLng = String(row.lng).replace(',', '.');
                const lat = parseFloat(strLat);
                const lng = parseFloat(strLng);
                const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90 && lat !== 0;
                const isValidLng = !isNaN(lng) && lng >= -180 && lng <= 180 && lng !== 0;
                
                return isActive && isValidLat && isValidLng;
            })
            .map(row => {
                return {
                    type: 'Feature',
                    geometry: { 
                        type: 'Point', 
                        coordinates: [parseFloat(String(row.lng).replace(',', '.')), parseFloat(String(row.lat).replace(',', '.'))] 
                    },
                    properties: { type: currentMode === 'risk' ? 'Blackspot' : 'Troublespot' }
                };
            });

        return { type: 'FeatureCollection', features: features };
    } catch (e) { 
        console.error("Gagal load titik:", e);
        return { type: 'FeatureCollection', features: [] }; 
    }
}

let globalTrendCache = { keamanan: [], keselamatan: [], ketertiban: [], kelancaran: [], traffic: [] }; // Tambah traffic

async function preloadAllData() {
    try {
        console.log("🚀 Memuat semua data analitik ke memori...");
        // Download 5 Mode Sekaligus dari File JSON Lokal!
        const [dataKeamanan, dataTraffic, dataKeselamatan, dataKetertiban, dataKelancaran] = await Promise.all([
            fetchSafe(`${BASE_URL}/api_trend_risk.json`),
            fetchSafe(`${BASE_URL}/api_trend_traffic.json`), 
            fetchSafe(`${BASE_URL}/api_trend_fatality.json`),
            fetchSafe(`${BASE_URL}/api_trend_ketertiban.json`),
            fetchSafe(`${BASE_URL}/api_trend_kelancaran.json`)
        ]);

        const processMap = (row) => {
            let cleanPolres = normalizeDbPolresName(row.polres, row.polda);
            let targetPoldaLabel = getPoldaLabelFromDbValue(row.polda) || (polresLookup[cleanPolres] ? polresLookup[cleanPolres][0] : 'MABES POLRI');
            return {
                tanggal: row.tanggal, _year: new Date(row.tanggal).getFullYear(),
                _clean_polres: cleanPolres, _polda_label: targetPoldaLabel,
                value_amount: parseFloat(row.value_amount || 0), total_pelanggaran: parseFloat(row.total_pelanggaran || 0),
                jml_populasi: parseFloat(row.jml_populasi || 0), jml_kendaraan: parseFloat(row.jml_kendaraan || 0),
                jml_pengemudi: parseFloat(row.jml_pengemudi || 0), jml_laka: parseFloat(row.jml_laka || 0),
                polda: row.polda || "", polres: row.polres || ""
            };
        };

        globalTrendCache.keamanan = dataKeamanan.map(processMap);
        globalTrendCache.traffic = dataTraffic.map(processMap); // [SIMPAN TRAFFIC]
        globalTrendCache.keselamatan = dataKeselamatan.map(processMap);
        globalTrendCache.ketertiban = dataKetertiban.map(processMap);
        globalTrendCache.kelancaran = dataKelancaran.map(processMap);

        console.log("✅ Semua data berhasil dimuat ke memori!");
    } catch (e) { console.error("🔴 Gagal preload data:", e); }
}

function getCurrentTrendData() {
    if (currentMode === 'fatality' || currentMode === 'fatality_pop' || currentMode === 'fatality_veh') return globalTrendCache.keselamatan;
    else if (currentMode === 'ketertiban') return globalTrendCache.ketertiban;
    else if (currentMode === 'kelancaran') return globalTrendCache.kelancaran; 
    else return globalTrendCache.keamanan;
}

// Gunakan fetchSafe agar tidak crash jika database mati
// [GANTI URL FETCH MENJADI NAMA FILE LOKAL]
async function fetchPopulationData() { return await fetchSafe(`${BASE_URL}/api_population.json`); }
async function fetchVehicleData() { return await fetchSafe(`${BASE_URL}/api_vehicle.json`); }
async function fetchDriverData() { return await fetchSafe(`${BASE_URL}/api_driver.json`); }

async function fetchRiskData(year, month, poldas, polres) {
    // Fungsi ini sebenarnya sudah TIDAK DIPAKAI LAGI sejak kita menggunakan sistem Cache Memori (preloadAllData)
    // Namun untuk mencegah error jika terpanggil, kita buat mengembalikan array kosong.
    return []; 
}

async function initFilters() {
    try {
        const response = await fetch(`${BASE_URL}/api_options.json`);
        if(!response.ok) {
            console.warn("⚠️ Data Opsi Statis tidak ditemukan. Memuat UI Kosong.");
            return;
        }
        const data = await response.json();

        const yearOpts = document.getElementById('yearOptions');
        let yearHtml = `<div class="option-item" data-value="All" onclick="selectOption('year', 'All', this)"><div class="chk-indicator"></div>All</div>`;
        if (data.years) {
            data.years.forEach(y => {
                const selected = y == 2026 ? 'selected' : ''; 
                yearHtml += `<div class="option-item ${selected}" data-value="${y}" onclick="selectOption('year', '${y}', this)"><div class="chk-indicator"></div>${y}</div>`;
            });
        }
        yearOpts.innerHTML = yearHtml;

        const poldaOpts = document.getElementById('poldaOptions');
        let poldaHtml = `
            <div class="search-box"><input type="text" placeholder="Cari Polda..." onkeyup="filterOptions(this)"></div>
            <div class="option-item selected" data-value="All" onclick="selectOption('polda', 'All', this)"><div class="chk-indicator"></div>All</div>
        `;
        
        if(data.poldas) {
            let poldaGroups = {}; 
            data.poldas.forEach(rawName => {
                let norm = normalizeDbPoldaName(rawName);
                if (!norm) return; 
                if (norm.toUpperCase() === "TEST" || rawName.toUpperCase() === "POLDA TEST") return;
                if (!poldaGroups[norm]) poldaGroups[norm] = [];
                poldaGroups[norm].push(rawName);
            });

            poldaConfig.forEach(config => {
                let normConfigName = config.label.replace("Polda ", "").replace("POLDA ", "").toUpperCase();
                if (!poldaGroups[normConfigName]) poldaGroups[normConfigName] = ["POLDA " + normConfigName];
            });

            Object.keys(poldaGroups).sort().forEach(normName => {
                const rawValues = poldaGroups[normName].join(",");
                const label = "POLDA " + normName;
                poldaHtml += `<div class="option-item" data-value="${rawValues}" onclick="selectOption('polda', '${rawValues}', this)"><div class="chk-indicator"></div>${label}</div>`;
            });
        }
        poldaOpts.innerHTML = poldaHtml;

        const polresOpts = document.getElementById('polresOptions');
        let polresHtml = `<div class="search-box"><input type="text" placeholder="Cari Polres..." onkeyup="filterOptions(this)"></div><div class="option-item selected" data-value="All" onclick="selectOption('polres', 'All', this)"><div class="chk-indicator"></div>All</div>`;
        
        if(data.polres) {
            let polresGroups = {}; 
            data.polres.forEach(item => {
                let rawPolresName = typeof item === 'object' ? item.polres : item;
                let rawPoldaName = typeof item === 'object' ? item.polda : ""; 
                
                let norm = normalizeDbPolresName(rawPolresName, rawPoldaName);
                if (!norm) return; 
                if (norm.toUpperCase() === "POLRES BASEL" || rawPolresName.toUpperCase() === "POLRES BASEL") return;
                if (!polresGroups[norm]) polresGroups[norm] = [];
                
                if (norm.startsWith("DITLANTAS")) {
                    if (!polresGroups[norm].includes(norm)) polresGroups[norm].push(norm);
                } else {
                    if (!polresGroups[norm].includes(rawPolresName)) polresGroups[norm].push(rawPolresName); 
                }
            });

            poldaConfig.forEach(config => {
                let normPoldaName = config.label.replace("Polda ", "").replace("POLDA ", "").toUpperCase();
                let expectedDitlantas = "DITLANTAS POLDA " + normPoldaName;
                if (!polresGroups[expectedDitlantas]) polresGroups[expectedDitlantas] = [expectedDitlantas];
            });

            const missingPolres = ["POLRES TULANG BAWANG BARAT", "POLRES BANJAR KOTA", "POLRES LAMPUNG SELATAN", "POLRES MESUJI", "POLRES SUMBA TENGAH"];
            missingPolres.forEach(pName => {
                if (!polresGroups[pName]) polresGroups[pName] = [pName];
            });

            Object.keys(polresGroups).sort().forEach(normName => {
                const rawValues = polresGroups[normName].join(",");
                polresHtml += `<div class="option-item" data-value="${rawValues}" onclick="selectOption('polres', '${rawValues}', this)"><div class="chk-indicator"></div>${normName}</div>`;
            });
        }
        polresOpts.innerHTML = polresHtml;
        setupDropdownEvents();

    } catch (e) { console.error("Error init filters:", e); }
}