// ==========================================
// 1. TRANSISI HALAMAN & STATE APLIKASI
// ==========================================
window.currentDashboardModule = 'keamanan'; 

function setupDashboardUI(module) {
    window.currentDashboardModule = module;
    const pageTitle = document.querySelector('.page-title');
    const techTitle = document.querySelector('.tech-title');
    const headerButtons = document.querySelector('.header-buttons');
    const tableHead = document.querySelector('.risk-table thead');
    const legendLeft = document.querySelector('#polygonGradientRow .legend-text.left');
    const legendRight = document.querySelector('#polygonGradientRow .legend-text.right');

    // Filter Dropdown Tahun (Sembunyikan < 2021 untuk Keselamatan)
    const yearOptions = document.querySelectorAll('#yearOptions .option-item');
    const slider = document.getElementById('timeSlider');
    const ticksContainer = document.querySelector('.slider-ticks.full-year');

    if (module === 'keselamatan') {
        pageTitle.innerHTML = 'Road Safety - Kinerja Keselamatan';
        techTitle.innerHTML = '<i class="fas fa-helmet-safety"></i> Kinerja Keselamatan';
        
        headerButtons.innerHTML = `
            <button class="btn-map-control tech-btn active" id="btnFatality" onclick="switchMode('fatality')" style="padding: 4px 12px; height: 42px;">
                <span class="tech-glow"></span>
                <i class="fas fa-heart-pulse" style="font-size: 18px;"></i> 
                <div style="text-align: left; line-height: 1.1; font-size: 11px; letter-spacing: 0.5px; white-space: nowrap;">
                    FATALITY<br>REDUCTION
                </div>
            </button>
            <button class="btn-map-control tech-btn" id="btnFatalityPop" onclick="switchMode('fatality_pop')" style="padding: 4px 12px; height: 42px;">
                <span class="tech-glow"></span>
                <i class="fas fa-users-rays" style="font-size: 18px;"></i> 
                <div style="text-align: left; line-height: 1.1; font-size: 11px; letter-spacing: 0.5px; white-space: nowrap;">
                    INDEKS FATALITAS<br>BERBASIS POPULASI
                </div>
            </button>
            <button class="btn-map-control tech-btn" id="btnFatalityVeh" onclick="switchMode('fatality_veh')" style="padding: 4px 12px; height: 42px;">
                <span class="tech-glow"></span>
                <i class="fas fa-car" style="font-size: 18px;"></i> 
                <div style="text-align: left; line-height: 1.1; font-size: 11px; letter-spacing: 0.5px; white-space: nowrap;">
                    INDEKS FATALITAS<br>BERBASIS KENDARAAN
                </div>
            </button>
        `;

        tableHead.innerHTML = `<tr><th class="rank-col" style="width: 10%;">Rank</th><th style="width: 35%;">Polda</th><th style="text-align:center; width: 15%;">MD</th><th id="colInfrastruktur" style="text-align:center; width: 20%; color:#2563eb;">Faskes</th><th id="col4Header" style="text-align:center; width: 20%;">FR</th></tr>`;
        legendLeft.innerHTML = `<span>Fatalitas <b>Menurun</b></span><small>Keselamatan <b>Meningkat</b></small>`;
        legendRight.innerHTML = `<span>Fatalitas <b>Meningkat</b></span><small>Keselamatan <b>Menurun</b></small>`;
        
        // Logika Menyembunyikan Tahun di Filter & Time Slider
        yearOptions.forEach(opt => {
            let val = opt.getAttribute('data-value');
            if (val !== 'All' && parseInt(val) < 2021) opt.style.display = 'none';
            else opt.style.display = 'flex';
        });
        if(slider) slider.min = 2021;
        if(ticksContainer) ticksContainer.innerHTML = '<span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span><span>2026</span>';

        currentMode = 'fatality';
    } else if (module === 'keamanan') {
        pageTitle.innerHTML = 'Road Safety - Kinerja Keamanan';
        techTitle.innerHTML = '<i class="fas fa-shield-halved"></i> Kinerja Keamanan';
        
        headerButtons.innerHTML = `
            <button class="btn-map-control tech-btn active" id="btnRisk" onclick="switchMode('risk')">
                <span class="tech-glow"></span>
                <i class="fas fa-car-burst"></i> Risiko Kecelakaan
            </button>
            <button class="btn-map-control tech-btn" id="btnTraffic" onclick="switchMode('traffic')">
                <span class="tech-glow"></span>
                <i class="fas fa-traffic-light"></i> Risiko Kemacetan
            </button>
        `;

        tableHead.innerHTML = `<tr><th class="rank-col" style="width: 15%;">Rank</th><th style="width: 55%;">Polda</th><th class="risk-col" style="text-align:center; width: 30%;">Risiko</th></tr>`;
        legendLeft.innerHTML = `<span>Risiko <b>Menurun</b></span><small>Keamanan <b>Meningkat</b></small>`;
        legendRight.innerHTML = `<span>Risiko <b>Meningkat</b></span><small>Keamanan <b>Menurun</b></small>`;
        
        // Logika Menampilkan Kembali Semua Tahun
        yearOptions.forEach(opt => opt.style.display = 'flex');
        if(slider) slider.min = 2018;
        if(ticksContainer) ticksContainer.innerHTML = '<span>2018</span><span>2019</span><span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span><span>2026</span>';

        currentMode = 'risk';
    } else if (module === 'kelancaran') {
        // --- UI KINERJA KELANCARAN ---
        pageTitle.innerHTML = 'Road Safety - Kinerja Kelancaran';
        techTitle.innerHTML = '<i class="fas fa-road"></i> Kinerja Kelancaran';
        
        headerButtons.innerHTML = `
            <button class="btn-map-control tech-btn active" id="btnKelancaran" onclick="switchMode('kelancaran')">
                <span class="tech-glow"></span>
                <i class="fas fa-car-side"></i> Indeks Kelancaran Lalu Lintas
            </button>
        `;
        tableHead.innerHTML = `<tr><th class="rank-col" style="width: 15%;">Rank</th><th style="width: 55%;">Polda</th><th id="col4Header" style="text-align:center; width: 30%;">IKLL</th></tr>`;
        legendLeft.innerHTML = `<span>Skor IKLL <b>Meningkat</b></span><small>Kelancaran <b>Meningkat</b></small>`;
        legendRight.innerHTML = `<span>Skor IKLL <b>Menurun</b></span><small>Kelancaran <b>Menurun</b></small>`;
        
        // [PERBAIKAN]: Kunci ketat opsi Dropdown dan Slider hanya untuk 2025 & 2026
        yearOptions.forEach(opt => {
            let val = opt.getAttribute('data-value');
            if (val !== 'All' && parseInt(val) < 2025) opt.style.display = 'none';
            else opt.style.display = 'flex';
        });
        
        if(slider) {
            slider.min = 2025;
            slider.max = 2026;
            slider.step = 1;
            if (parseInt(slider.value) < 2025) slider.value = 2026; // Paksa maju ke 2026 jika nyangkut di tahun lama
        }
        
        if(ticksContainer) ticksContainer.innerHTML = '<span>2025</span><span>2026</span>';
        currentMode = 'kelancaran';
    } else {
        // --- UI KINERJA KETERTIBAN ---
        pageTitle.innerHTML = 'Road Safety - Kinerja Ketertiban';
        techTitle.innerHTML = '<i class="fas fa-scale-balanced"></i> Kinerja Ketertiban';
        
        headerButtons.innerHTML = `
            <button class="btn-map-control tech-btn active" id="btnKetertiban" onclick="switchMode('ketertiban')">
                <span class="tech-glow"></span>
                <i class="fas fa-file-signature"></i> Indeks Kinerja Ketertiban Holistik
            </button>
        `;

        // [PERBAIKAN]: Ubah judul Header Tabel menjadi IKKH
        tableHead.innerHTML = `<tr><th class="rank-col" style="width: 15%;">Rank</th><th style="width: 55%;">Polda</th><th id="col4Header" style="text-align:center; width: 30%;">IKKH</th></tr>`;
        legendLeft.innerHTML = `<span>Skor IKKH <b>Meningkat</b></span><small>Ketertiban <b>Meningkat</b></small>`;
        legendRight.innerHTML = `<span>Skor IKKH <b>Menurun</b></span><small>Ketertiban <b>Menurun</b></small>`;
        
        // [PERBAIKAN]: Sembunyikan tahun di bawah 2020 untuk Dropdown Filter
        yearOptions.forEach(opt => {
            let val = opt.getAttribute('data-value');
            if (val !== 'All' && parseInt(val) < 2020) opt.style.display = 'none';
            else opt.style.display = 'flex';
        });
        
        // [PERBAIKAN]: Batasi Time Slider hanya dari 2020
        if(slider) slider.min = 2020;
        if(ticksContainer) ticksContainer.innerHTML = '<span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span><span>2026</span>';

        currentMode = 'ketertiban';
    }
}

function enterWebGIS(module = 'keamanan') {
    isUserEntered = true;
    
    // Panggil fungsi sulap UI sebelum pindah halaman
    setupDashboardUI(module);

    const landing = document.getElementById('landing-page');
    const loader = document.getElementById('loader-overlay');
    
    landing.style.opacity = '0';
    loader.classList.add('active');

    setTimeout(() => { 
        landing.style.display = 'none'; 
        document.body.classList.remove('landing-active'); 
        
        // HAPUS switchMode dari sini!
        // Kita pindahkan ke dalam checkAndOpenApp agar peta di-resize dulu
        checkAndOpenApp(module); 
    }, 500);
}

async function checkAndOpenApp(module = window.currentDashboardModule) {
    if (isUserEntered && isSystemReady) {
        const app = document.getElementById('webgis-app');
        const loader = document.getElementById('loader-overlay');

        // 1. Tampilkan kontainer peta ke layar terlebih dahulu
        app.style.display = 'flex'; 
        document.body.classList.add('webgis-active'); 

        // 2. Beri jeda kecil agar CSS Flexbox siap
        setTimeout(async () => { 
            app.style.opacity = '1'; 
            
            // KUNCI: Paksa peta menghitung ulang ukuran kanvasnya
            map.resize(); 
            
            // ========================================================
            // KUNCI PERBAIKAN: Gunakan 'await' agar sistem BERHENTI di sini
            // dan benar-benar menahan napas sampai switchMode selesai 100%
            // ========================================================
            if (module === 'keselamatan') {
                await switchMode('fatality');
            } else if (module === 'ketertiban') {
                await switchMode('ketertiban'); 
            } else if (module === 'kelancaran') { // [PERBAIKAN 1]: Rute Langsung ke Kelancaran
                await switchMode('kelancaran'); 
            } else {
                await switchMode('risk');
            }

            // PERHATIAN: Saya telah MENGHAPUS baris setTimeout 600ms di sini.
            // Tirai loading sekarang akan otomatis dihapus HANYA oleh 
            // fungsi switchMode() setelah MapLibre & Chart selesai dirender!

        }, 100); 
    }
}

function goBackToLanding() {
    const landing = document.getElementById('landing-page');
    const app = document.getElementById('webgis-app');
    
    app.style.opacity = '0';
    setTimeout(() => { 
        app.style.display = 'none'; 
        landing.style.display = 'flex'; 
        document.body.classList.remove('webgis-active'); 
        document.body.classList.add('landing-active'); 
        
        setTimeout(() => { landing.style.opacity = '1'; }, 50); 
    }, 500);
}

// ==========================================
// FUNGSI BARU: SWITCH MODUL UTAMA DARI DALAM DASHBOARD
// ==========================================
function switchMainModule(module) {
    // 1. Set penanda modul saat ini
    window.currentDashboardModule = module;
    
    // 2. Ubah struktur UI Header dan Filter Dropdown
    setupDashboardUI(module);
    
    // 3. Langsung eksekusi Mode Default-nya!
    if (module === 'keselamatan') {
        switchMode('fatality');
    } else if (module === 'ketertiban') {
        switchMode('ketertiban'); 
    } else if (module === 'kelancaran') { // [PERBAIKAN 2]: Rute Langsung ke Kelancaran
        switchMode('kelancaran'); 
    } else {
        switchMode('risk');
    }
}

// ==========================================
// 2. KONTROL MODE & RESET
// ==========================================
function closeFilterAndPopups() {
    const body = document.getElementById('filterBody');
    const header = document.querySelector('.filter-header');
    const icon = document.getElementById('toggle-icon');
    
    if (body && !body.classList.contains('hidden')) {
        body.classList.add('hidden'); 
        header.classList.add('minimized'); 
        icon.innerText = '▲';
    }

    const popups = document.querySelectorAll('.maplibregl-popup');
    popups.forEach(p => p.remove());

    if (typeof map !== 'undefined' && map.getSource('highlight-source')) {
        map.getSource('highlight-source').setData({ type: 'FeatureCollection', features: [] });
    }
}

// Deklarasikan variabel memori di luar fungsi agar tersimpan abadi
window.originalBsIconHTML = null;
window.originalSmallIconClass = null;

async function switchMode(mode) {
    closeFilterAndPopups();
    const loader = document.getElementById('loader-overlay');
    const loaderText = document.querySelector('.loader-text');
    
    if (mode === 'fatality') loaderText.innerText = "Memuat Data Fatalitas...";
    else if (mode === 'fatality_pop') loaderText.innerText = "Memuat Data IFP...";
    else if (mode === 'fatality_veh') loaderText.innerText = "Memuat Data IFK...";
    else if (mode === 'risk') loaderText.innerText = "Memuat Data Risiko Laka...";
    else if (mode === 'ketertiban') loaderText.innerText = "Memuat Data IKKH...";
    else if (mode === 'kelancaran') loaderText.innerText = "Memuat Data IKLL...";
    else loaderText.innerText = "Memuat Data Risiko Macet...";
    
    // 1. TURUNKAN TIRAI LOADING SECARA FISIK
    loader.classList.add('active');

    // 2. Beri nafas browser 150ms agar animasi CSS loading tidak patah
    await new Promise(resolve => setTimeout(resolve, 150)); 

    try {
        currentMode = mode;

        const headerTitle = document.querySelector('.header-title'); 
        const headerDesc = document.getElementById('totalRiskDesc'); 
        const headerImg = document.querySelector('.header-img');
        const bsPanel = document.querySelector('.blackspot-info-panel');
        const pointLegendPanel = document.getElementById('pointLegendPanel');
        const projectionPanel = document.getElementById('projectionPanel');
        
        // [PERBAIKAN]: Reset total style dari panel agar bentuknya tidak bocor saat pindah ke mode lain
        if (projectionPanel) {
            projectionPanel.style.borderLeft = 'none';
            projectionPanel.style.gap = '0px';
            projectionPanel.style.display = 'none';
            projectionPanel.style.left = '';
            projectionPanel.style.right = '';
            projectionPanel.style.bottom = '';
            projectionPanel.style.padding = '';
            projectionPanel.style.minWidth = '';
            projectionPanel.style.background = '';
            projectionPanel.style.backdropFilter = '';
            projectionPanel.style.border = '';
            projectionPanel.style.borderRadius = '';
            projectionPanel.style.boxShadow = '';
        }
        if (bsPanel) {
            bsPanel.style.display = 'flex'; // Pastikan panel dasar selalu muncul di mode selain Ketertiban
        }

        const chartTxtYear = document.getElementById('chartTextYear');
        const chartTxtQuarter = document.getElementById('chartTextQuarter');
        const chartTxtMonth = document.getElementById('chartTextMonth');

        const bsIconContainer = document.querySelector('.bs-icon-large');
        if (bsIconContainer && !window.originalBsIconHTML) {
            window.originalBsIconHTML = bsIconContainer.innerHTML; 
        }
        
        const bsTitle = document.querySelector('.blackspot-info-panel .bs-title');
        let smallIcon = bsTitle ? bsTitle.previousElementSibling : null;
        if (smallIcon && smallIcon.tagName === 'I' && !window.originalSmallIconClass) {
            window.originalSmallIconClass = smallIcon.className; 
        }

        // ==========================================
        // SETUP UI BERDASARKAN MODE
        // ==========================================
        const regPanel = document.getElementById('regionalInfoPanel');

        if (mode === 'fatality') {
            if (pointLegendPanel) pointLegendPanel.style.display = 'none';
            if (regPanel) regPanel.style.display = 'flex'; // [PERBAIKAN]: HANYA MUNCUL DI MODE FR

            if (projectionPanel) {
                projectionPanel.style.display = 'flex';
                // Kembalikan kotak 2 tingkat (Proyeksi RUNK)
                projectionPanel.innerHTML = `
                    <div class="proj-col" style="border-bottom: 1px dashed rgba(255,255,255,0.2); padding-bottom: 6px;">
                        <div class="proj-title" style="color:#38bdf8;"><i class="fas fa-triangle-exclamation"></i> Proyeksi MD dengan RUNK</div>
                        <div class="bs-value" id="valDenganRunk" style="font-size: 22px !important; background: none; -webkit-text-fill-color: #38bdf8; color: #38bdf8; text-shadow: 0 0 10px rgba(56, 189, 248, 0.4) !important;">0</div>
                    </div>
                    <div class="proj-col" style="padding-top: 6px;">
                        <div class="proj-title" style="color:#f97316;"><i class="fas fa-triangle-exclamation"></i> Proyeksi MD tanpa RUNK</div>
                        <div class="bs-value" id="valTanpaRunk" style="font-size: 22px !important; background: none; -webkit-text-fill-color: #f97316; color: #f97316; text-shadow: 0 0 10px rgba(249, 115, 22, 0.4) !important;">0</div>
                    </div>
                `;
            }
            if(headerTitle) headerTitle.innerText = "Tingkat Fatality Reduction Nasional";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan tren penurunan angka kematian sebesar <span id='tempVal'>0%</span> dibandingkan tahun sebelumnya.`;
            if(headerImg) headerImg.src = "./assets/fr.png";
            
            if(bsPanel) {
                // Diubah jadi biru IFP
                bsPanel.style.borderLeftColor = '#38bdf8';
                bsPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56, 189, 248, 0.15)';
            } 
            if(bsTitle) bsTitle.innerText = "Jumlah Meninggal Dunia";
            
            if(bsIconContainer) {
                // Warna icon diubah jadi biru
                bsIconContainer.innerHTML = '<i class="fas fa-skull" style="font-size: 2.2rem; color: #38bdf8;"></i>';
            }
            if(smallIcon && smallIcon.tagName === 'I') {
                smallIcon.className = 'fas fa-skull';
                smallIcon.style.color = '#38bdf8'; // Warna icon kecil diubah jadi biru
            }

            const textRisk = "Persentase Fatality Reduction";
            if(chartTxtYear) chartTxtYear.innerText = textRisk;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textRisk;
            if(chartTxtMonth) chartTxtMonth.innerText = textRisk;

            const btnFatality = document.getElementById('btnFatality');
            const btnFatalityPop = document.getElementById('btnFatalityPop');
            const btnFatalityVeh = document.getElementById('btnFatalityVeh');
            if(btnFatality) { btnFatality.classList.add('active'); btnFatality.onclick = resetToDefaultState; } 
            if(btnFatalityPop) { btnFatalityPop.classList.remove('active'); btnFatalityPop.onclick = () => switchMode('fatality_pop'); }
            if(btnFatalityVeh) { btnFatalityVeh.classList.remove('active'); btnFatalityVeh.onclick = () => switchMode('fatality_veh'); }

            let col4 = document.getElementById('col4Header');
            if (col4) col4.innerText = 'FR';
            let colInfra = document.getElementById('colInfrastruktur');
            if (colInfra) { colInfra.style.display = 'table-cell'; colInfra.innerText = 'Faskes'; }
            
            // Ubah Judul Grafik Bawah
            const frChartTitle = document.querySelector('#defSubRight .card-heading');
            if (frChartTitle) frChartTitle.innerHTML = `CAPAIAN FATALITY REDUCTION <span style="color:#cbd5e1; margin-left:5px; font-weight:400; font-size:14px;">Terhadap Target RUNK LLAJ</span>`;

        } else if (mode === 'fatality_pop') {
            // --- MODE: INDEKS FATALITAS POPULASI ---
            if (pointLegendPanel) pointLegendPanel.style.display = 'none';
            // [GANTI BARIS INI]: Gunakan !important agar tidak bisa ditimpa
            if (regPanel) regPanel.style.setProperty('display', 'none', 'important');

            if (projectionPanel) {
                projectionPanel.style.display = 'flex';
                // Ubah menjadi kotak 1 tingkat (Jumlah Populasi)
                projectionPanel.innerHTML = `
                    <div class="proj-col" style="justify-content: center; align-items: center; padding: 10px 0;">
                        <div class="proj-title" style="color:#22c55e; font-size: 11px;"><i class="fas fa-users"></i> Jumlah Populasi</div>
                        <div class="bs-value" id="valPopulasiIFP" style="font-size: 26px !important; background: none; -webkit-text-fill-color: #22c55e; color: #22c55e; text-shadow: 0 0 15px rgba(34, 197, 94, 0.4) !important; margin-top: 8px;">0</div>
                    </div>
                `;
            }
            if(headerTitle) headerTitle.innerText = "Indeks Fatalitas Berbasis Populasi";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan rasio korban meninggal dunia per 100.000 penduduk dibandingkan target toleransi.`;
            if(headerImg) headerImg.src = "./assets/ifp.png?v=2"
            
            // Warna border dan efek cahaya diubah jadi biru
            if(bsPanel) { bsPanel.style.borderLeftColor = '#38bdf8'; bsPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56, 189, 248, 0.15)'; } 
            if(bsTitle) bsTitle.innerText = "Jumlah Meninggal Dunia";
            // Warna icon besar dan kecil diubah jadi biru
            if(bsIconContainer) bsIconContainer.innerHTML = '<i class="fas fa-car-burst" style="font-size: 2.2rem; color: #38bdf8;"></i>';
            if(smallIcon && smallIcon.tagName === 'I') { smallIcon.className = 'fas fa-car-burst'; smallIcon.style.color = '#38bdf8'; }

            const textRisk = "Nilai Indeks Fatalitas Berbasis Populasi (IFP)";
            if(chartTxtYear) chartTxtYear.innerText = textRisk;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textRisk;
            if(chartTxtMonth) chartTxtMonth.innerText = textRisk;

            const btnFatality = document.getElementById('btnFatality');
            const btnFatalityPop = document.getElementById('btnFatalityPop');
            const btnFatalityVeh = document.getElementById('btnFatalityVeh');
            if(btnFatality) { btnFatality.classList.remove('active'); btnFatality.onclick = () => switchMode('fatality'); }
            if(btnFatalityPop) { btnFatalityPop.classList.add('active'); btnFatalityPop.onclick = resetToDefaultState; }
            if(btnFatalityVeh) { btnFatalityVeh.classList.remove('active'); btnFatalityVeh.onclick = () => switchMode('fatality_veh'); }
            
            let col4 = document.getElementById('col4Header');
            if (col4) col4.innerText = 'IFP';
            let colInfra = document.getElementById('colInfrastruktur');
            if (colInfra) { colInfra.style.display = 'table-cell'; colInfra.innerText = 'Titik Keramaian'; colInfra.style.color = '#10b981'; }
            
            // Ubah Judul Grafik Bawah
            const frChartTitle = document.querySelector('#defSubRight .card-heading');
            if (frChartTitle) frChartTitle.innerHTML = `CAPAIAN INDEKS FATALITAS BERBASIS POPULASI <span style="color:#cbd5e1; margin-left:5px; font-weight:400; font-size:14px;">Terhadap Target RUNK LLAJ</span>`;

        } else if (mode === 'fatality_veh') {
            // --- MODE: INDEKS FATALITAS KENDARAAN ---
            if (pointLegendPanel) pointLegendPanel.style.display = 'none';            
            // [GANTI BARIS INI]: Gunakan !important
            if (regPanel) regPanel.style.setProperty('display', 'none', 'important');

            if (projectionPanel) {
                projectionPanel.style.display = 'flex';    
                projectionPanel.innerHTML = `
                    <div class="proj-col" style="justify-content: center; align-items: center; padding: 10px 0;">
                        <div class="proj-title" style="color:#eab308; font-size: 11px;"><i class="fas fa-car"></i> Jumlah Kendaraan</div>
                        <div class="bs-value" id="valKendaraanIFK" style="font-size: 26px !important; background: none; -webkit-text-fill-color: #eab308; color: #eab308; text-shadow: 0 0 15px rgba(234, 179, 8, 0.4) !important; margin-top: 8px;">0</div>
                    </div>
                `;
            }
            if(headerTitle) headerTitle.innerText = "Indeks Fatalitas Berbasis Kendaraan";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan rasio korban meninggal dunia per 10.000 kendaraan dibandingkan target toleransi.`;
            if(headerImg) headerImg.src = "./assets/ifk.png?v=2";
            
            if(bsPanel) { bsPanel.style.borderLeftColor = '#38bdf8'; bsPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(234, 179, 8, 0.15)'; } 
            if(bsTitle) bsTitle.innerText = "Jumlah Meninggal Dunia";
            if(bsIconContainer) bsIconContainer.innerHTML = '<i class="fas fa-car-burst" style="font-size: 2.2rem; color: #38bdf8;"></i>';
            if(smallIcon && smallIcon.tagName === 'I') { smallIcon.className = 'fas fa-car-burst'; smallIcon.style.color = '#38bdf8'; }

            const textRisk = "Nilai Indeks Fatalitas Berbasis Kendaraan (IFK)";
            if(chartTxtYear) chartTxtYear.innerText = textRisk;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textRisk;
            if(chartTxtMonth) chartTxtMonth.innerText = textRisk;

            const btnFatality = document.getElementById('btnFatality');
            const btnFatalityPop = document.getElementById('btnFatalityPop');
            const btnFatalityVeh = document.getElementById('btnFatalityVeh');
            if(btnFatality) { btnFatality.classList.remove('active'); btnFatality.onclick = () => switchMode('fatality'); }
            if(btnFatalityPop) { btnFatalityPop.classList.remove('active'); btnFatalityPop.onclick = () => switchMode('fatality_pop'); }
            if(btnFatalityVeh) { btnFatalityVeh.classList.add('active'); btnFatalityVeh.onclick = resetToDefaultState; }
            
            let col4 = document.getElementById('col4Header');
            if (col4) col4.innerText = 'IFK';
            let colInfra = document.getElementById('colInfrastruktur');
            if (colInfra) { colInfra.style.display = 'table-cell'; colInfra.innerText = 'Uji Kendaraan'; colInfra.style.color = '#8b5cf6'; }
            
            // Ubah Judul Grafik Bawah
            const frChartTitle = document.querySelector('#defSubRight .card-heading');
            if (frChartTitle) frChartTitle.innerHTML = `CAPAIAN INDEKS FATALITAS BERBASIS KENDARAAN <span style="color:#cbd5e1; margin-left:5px; font-weight:400; font-size:14px;">Terhadap Target RUNK LLAJ</span>`;

        } else if (mode === 'ketertiban') {
            // --- MODE: INDEKS KINERJA KETERTIBAN HOLISTIK (IKKH) ---
            if (pointLegendPanel) pointLegendPanel.style.display = 'none';
            if (regPanel) regPanel.style.display = 'none'; // Sembunyikan Panel Demografi
            if (bsPanel) bsPanel.style.display = 'none'; // Sembunyikan Panel Blackspot Lama
            
            // [PERBAIKAN]: Tampilkan Panel Komprehensif Data Evaluasi IKKH (Menggantikan 2 panel lama)
            if (projectionPanel) {
                projectionPanel.style.display = 'block';
                projectionPanel.style.left = 'auto'; 
                projectionPanel.style.right = '10px'; // Pindahkan ke pojok kanan peta
                projectionPanel.style.bottom = '5px';
                projectionPanel.style.padding = '15px 20px';
                projectionPanel.style.minWidth = '340px';
                projectionPanel.style.background = 'rgba(15, 23, 42, 0.85)';
                projectionPanel.style.backdropFilter = 'blur(10px)';
                projectionPanel.style.border = '1px solid rgba(255,255,255,0.1)';
                projectionPanel.style.borderLeft = '4px solid #f87171';
                projectionPanel.style.borderRadius = '8px';
                projectionPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(248, 113, 113, 0.15)';
                
                projectionPanel.innerHTML = `
                    <div style="font-size: 13px; font-weight: 800; color: #f87171; margin-bottom: 12px; border-bottom: 1px dashed rgba(248, 113, 113, 0.3); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clipboard-list" style="font-size: 16px;"></i> DATA EVALUASI IKKH
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px;">
                        <div>
                            <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Total Pelanggaran</div>
                            <div id="valTotalPelanggaran" style="font-size: 18px; font-weight: 900; color: #c084fc; text-shadow: 0 0 10px rgba(192,132,252,0.4);">0</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Pelanggaran Berat</div>
                            <div id="valBeratPelanggaran" style="font-size: 18px; font-weight: 900; color: #ef4444; text-shadow: 0 0 10px rgba(239,68,68,0.4);">0</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Jumlah Pengemudi</div>
                            <div id="valPengemudiIKKH" style="font-size: 16px; font-weight: 800; color: #22c55e;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">Jiwa</span></div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Jumlah Kendaraan</div>
                            <div id="valKendaraanIKKH" style="font-size: 16px; font-weight: 800; color: #eab308;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">Unit</span></div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Panjang Jalan</div>
                            <div id="valJalanIKKH" style="font-size: 16px; font-weight: 800; color: #3b82f6;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">km</span></div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Kamera ETLE</div>
                            <div id="valEtleIKKH" style="font-size: 16px; font-weight: 800; color: #f97316;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">Titik</span></div>
                        </div>
                    </div>
                `;
            }
            
            if(headerTitle) headerTitle.innerText = "Indeks Kinerja Ketertiban Holistik (IKKH) Nasional";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan persentase pelanggaran berisiko tinggi terhadap total pelanggaran yang terjadi di jalan raya.`;
            if(headerImg) headerImg.src = "./assets/ikkh.png";

            const textRisk = "Skor Indeks Kinerja Ketertiban Holistik (IKKH)";
            if(chartTxtYear) chartTxtYear.innerText = textRisk;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textRisk;
            if(chartTxtMonth) chartTxtMonth.innerText = textRisk;

            let col4 = document.getElementById('col4Header');
            if (col4) col4.innerText = 'Skor IKKH';
            let colInfra = document.getElementById('colInfrastruktur');
            if (colInfra) colInfra.style.display = 'none';
        
        } else if (mode === 'kelancaran') {
            // [PERBAIKAN]: Sembunyikan panel legenda layer dengan `!important` agar tidak ditimpa CSS lain
            if (pointLegendPanel) pointLegendPanel.style.setProperty('display', 'none', 'important');
            if (regPanel) regPanel.style.display = 'none';
            if (bsPanel) bsPanel.style.display = 'none';
            
            // PANEL GRID 6 KOTAK KELANCARAN
            if (projectionPanel) {
                projectionPanel.style.display = 'block';
                projectionPanel.style.left = 'auto'; 
                projectionPanel.style.right = '10px';
                projectionPanel.style.bottom = '5px';
                projectionPanel.style.padding = '15px 20px';
                projectionPanel.style.minWidth = '340px';
                projectionPanel.style.background = 'rgba(15, 23, 42, 0.85)';
                projectionPanel.style.backdropFilter = 'blur(10px)';
                projectionPanel.style.border = '1px solid rgba(255,255,255,0.1)';
                projectionPanel.style.borderLeft = '4px solid #3b82f6'; // Biru Kelancaran
                projectionPanel.style.borderRadius = '8px';
                projectionPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(59, 130, 246, 0.15)';
                
                projectionPanel.innerHTML = `
                    <div style="font-size: 13px; font-weight: 800; color: #3b82f6; margin-bottom: 12px; border-bottom: 1px dashed rgba(59, 130, 246, 0.3); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-route" style="font-size: 16px;"></i> DATA EVALUASI IKLL
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px;">
                        <div><div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Rata-Rata VCR</div><div id="valVcrAvg" style="font-size: 18px; font-weight: 900; color: #eab308;">0</div></div>
                        <div><div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Titik Keramaian</div><div id="valRamaiVCR" style="font-size: 16px; font-weight: 800; color: #3b82f6;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">Lokasi</span></div></div>
                        <div><div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Titik Troublespot</div><div id="valTsVCR" style="font-size: 16px; font-weight: 800; color: #ef4444;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">Lokasi</span></div></div>
                        <div><div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Panjang Jalan</div><div id="valJalanVCR" style="font-size: 16px; font-weight: 800; color: #f97316;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">km</span></div></div>
                        <div><div style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">APILL</div><div id="valApillVCR" style="font-size: 16px; font-weight: 800; color: #c084fc;">0 <span style="font-size:10px; font-weight:normal; color:#64748b;">Titik</span></div></div>
                    </div>
                `;
            }
            
            if(headerTitle) headerTitle.innerText = "Indeks Kelancaran Lalu Lintas (IKLL) Nasional";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan tingkat kelancaran jalan berbasis Kapasitas Kendaraan (VCR), Hambatan Samping, dan Manajemen Persimpangan (APILL).`;
            if(headerImg) headerImg.src = "./assets/ikll.png"; 

            const textRisk = "Skor Indeks Kelancaran Lalu Lintas (IKLL)";
            if(chartTxtYear) chartTxtYear.innerText = textRisk;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textRisk;
            if(chartTxtMonth) chartTxtMonth.innerText = textRisk;

            let col4 = document.getElementById('col4Header');
            if (col4) col4.innerText = 'Skor IKLL';
            let colInfra = document.getElementById('colInfrastruktur');
            if (colInfra) colInfra.style.display = 'none';

        } else if (mode === 'risk') {
            if (pointLegendPanel) pointLegendPanel.style.display = 'flex';
            if (projectionPanel) projectionPanel.style.display = 'none';
            if (regPanel) regPanel.style.display = 'none'; // <--- Sembunyikan panel demografi
            if(headerTitle) headerTitle.innerText = "Risiko Terlibat Kecelakaan Nasional";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan terdapat <span id='tempVal'>...</span> titik lokasi yang rentan terlibat kecelakaan setiap 100 km perjalanan.`;
            if(headerImg) headerImg.src = "./assets/crashrisk.png"; 
            
            if(bsPanel) {
                bsPanel.style.borderLeftColor = '#ef4444';
                bsPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(239, 68, 68, 0.15)';
            } 
            if(bsTitle) bsTitle.innerText = "Jumlah Blackspot";
            
            if(bsIconContainer && window.originalBsIconHTML) {
                bsIconContainer.innerHTML = window.originalBsIconHTML;
                const bsIconPath = bsIconContainer.querySelector('path'); 
                if(bsIconPath) bsIconPath.setAttribute('stroke', '#ef4444');
            }
            if(smallIcon && smallIcon.tagName === 'I' && window.originalSmallIconClass) {
                smallIcon.className = window.originalSmallIconClass;
                smallIcon.style.color = '#ef4444';
            }

            const textRisk = "Nilai Risiko Terlibat Kecelakaan";
            if(chartTxtYear) chartTxtYear.innerText = textRisk;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textRisk;
            if(chartTxtMonth) chartTxtMonth.innerText = textRisk;

            const btnRisk = document.getElementById('btnRisk');
            const btnTraffic = document.getElementById('btnTraffic');
            if(btnRisk) { btnRisk.classList.add('active'); btnRisk.onclick = resetToDefaultState; } 
            if(btnTraffic) { btnTraffic.classList.remove('active'); btnTraffic.onclick = () => switchMode('traffic'); }

        } else {
            if (regPanel) regPanel.style.display = 'none'; // <--- Sembunyikan panel demografi
            if(headerTitle) headerTitle.innerText = "Risiko Terjebak Kemacetan Nasional";
            if(headerDesc) headerDesc.innerHTML = `Mengindikasikan terdapat <span id='tempVal'>...</span> titik lokasi yang rentan terjebak kemacetan setiap 100 km perjalanan.`;
            if(headerImg) headerImg.src = "./assets/traffic.png"; 
            
            if(bsPanel) {
                bsPanel.style.borderLeftColor = '#eab308';
                bsPanel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(234, 179, 8, 0.15)';
            }
            if(bsTitle) bsTitle.innerText = "Jumlah Troublespot";
            
            if(bsIconContainer && window.originalBsIconHTML) {
                bsIconContainer.innerHTML = window.originalBsIconHTML;
                const bsIconPath = bsIconContainer.querySelector('path'); 
                if(bsIconPath) bsIconPath.setAttribute('stroke', '#eab308');
            }
            if(smallIcon && smallIcon.tagName === 'I' && window.originalSmallIconClass) {
                smallIcon.className = window.originalSmallIconClass;
                smallIcon.style.color = '#eab308';
            }
         
            const textTraffic = "Nilai Risiko Terjebak Kemacetan";
            if(chartTxtYear) chartTxtYear.innerText = textTraffic;
            if(chartTxtQuarter) chartTxtQuarter.innerText = textTraffic;
            if(chartTxtMonth) chartTxtMonth.innerText = textTraffic;

            const btnRisk = document.getElementById('btnRisk');
            const btnTraffic = document.getElementById('btnTraffic');
            if(btnTraffic) { btnTraffic.classList.add('active'); btnTraffic.onclick = resetToDefaultState; }
            if(btnRisk) { btnRisk.classList.remove('active'); btnRisk.onclick = () => switchMode('risk'); }
        }

        updateFooterDefinitions(mode);
        const riskLabel = document.querySelector('.risk-score-label');
        if (riskLabel) riskLabel.innerText = mode === 'fatality' ? "Skor FR:" : (mode === 'risk' ? "Risiko Laka:" : "Risiko Macet:");

        // ==========================================
        // PENGAMBILAN DATA INSTAN DARI MEMORI
        // ==========================================
        rawTrendData = getCurrentTrendData(); // <--- AMBIL INSTAN TANPA LOADING
        updateLastUpdatedDate(rawTrendData);
        if (typeof calculateNationalThresholds === 'function') calculateNationalThresholds(rawTrendData); 
        await updatePointLayerData(); 
        
        // Memanggil kalkulasi utama (termasuk processFatalityMode)
        await resetToDefaultState(); 

        // Eksekusi render FR Chart secara sinkron
        if ((mode === 'fatality' || mode === 'fatality_pop' || mode === 'fatality_veh') && typeof renderFRChart === 'function') {
            renderFRChart(); 
        }

        if (mode !== 'fatality' && regPanel) {
            regPanel.style.setProperty('display', 'none', 'important');
        }

        // =====================================================================
        // KUNCI GEMBOK: Paksa Browser Menggambar DOM (Painting) Sebelum Buka Tirai
        // =====================================================================
        await new Promise(resolve => {
            // RequestAnimationFrame ganda memastikan GPU selesai melukis HTML & Canvas
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });

        // Beri Jeda Ekstra Terakhir selama 1 detik (1000ms) untuk meyakinkan mata
        setTimeout(() => {
            loader.classList.remove('active');
        }, 1000);

    } catch (e) {
        console.error("Gagal switch mode:", e);
        loader.classList.remove('active'); // Tetap buka tirai jika terjadi error fatal
    }
}

async function resetToDefaultState() {
    const btnRisk = document.getElementById('btnRisk');
    const btnTraffic = document.getElementById('btnTraffic');
    const btnFatality = document.getElementById('btnFatality');

    if (btnRisk && btnTraffic) {
        if (currentMode === 'risk') {
            btnRisk.classList.add('active');
            btnTraffic.classList.remove('active');
        } else {
            btnTraffic.classList.add('active');
            btnRisk.classList.remove('active');
        }
    }
    
    const btnFatalityPop = document.getElementById('btnFatalityPop');
    const btnFatalityVeh = document.getElementById('btnFatalityVeh');
    
    if (btnFatality && btnFatalityPop && btnFatalityVeh) {
        // Matikan semua tombol keselamatan terlebih dahulu
        btnFatality.classList.remove('active');
        btnFatalityPop.classList.remove('active');
        btnFatalityVeh.classList.remove('active');
        
        // Nyalakan hanya satu yang sesuai dengan mode saat ini
        if (currentMode === 'fatality_pop') {
            btnFatalityPop.classList.add('active');
        } else if (currentMode === 'fatality_veh') {
            btnFatalityVeh.classList.add('active');
        } else {
            btnFatality.classList.add('active');
        }
    }

    // [PERBAIKAN 3]: Deteksi otomatis tahun paling update di Database, jangan asal 2026!
    let maxYr = 2026;
    if (rawTrendData && rawTrendData.length > 0) {
        let tempMax = 0;
        for (let i = 0; i < rawTrendData.length; i++) {
            if (rawTrendData[i]._year > tempMax) tempMax = rawTrendData[i]._year;
        }
        if (tempMax > 2018) maxYr = tempMax;
    }
    let strYr = maxYr.toString();

    currentFilters = { year: [strYr], month: ['All'], poldas: ['All'], polres: ['All'] };
    activeChartFilter = { year: null, quarter: null, month: null };

    resetDropdownUI('year', strYr);
    resetDropdownUI('month', 'All');
    resetDropdownUI('polda', 'All');
    resetDropdownUI('polres', 'All');
    
    document.getElementById('yearTrigger').innerText = strYr;
    document.getElementById('monthTrigger').innerText = 'All';
    document.getElementById('poldaTrigger').innerText = 'All';
    document.getElementById('polresTrigger').innerText = 'All';

    const slider = document.getElementById('timeSlider');
    if (slider) {
        slider.value = maxYr;
        document.getElementById('sliderValueDisplay').innerText = strYr;
        document.getElementById('timeBadge').innerText = strYr;
        toggleTimeSlider(false); 
    }

    map.flyTo({ center: [110.0, -3.0], zoom: 4.0, essential: true });

    // Tunggu data diproses HINGGA SELESAI
    await updateDashboardData();
}

// ==========================================
// 3. UI KONTROL PETA & SLIDER WAKTU
// ==========================================

function toggleFilterPanel() {
    const body = document.getElementById('filterBody');
    const header = document.querySelector('.filter-header');
    const icon = document.getElementById('toggle-icon');
    if (body.classList.contains('hidden')) { 
        body.classList.remove('hidden'); header.classList.remove('minimized'); icon.innerText = '▼'; 
    } else { 
        body.classList.add('hidden'); header.classList.add('minimized'); icon.innerText = '▲'; 
    }
}

function toggleTimeSlider(show) {
    const btn = document.getElementById('timeToggleBtn');
    const panel = document.getElementById('timePanel');

    if (show) {
        btn.classList.add('hidden');
        panel.classList.add('active');
    } else {
        btn.classList.remove('hidden');
        panel.classList.remove('active');
    }
}

// 1. FUNGSI SANGAT RINGAN: Hanya mengubah angka teks saat slider ditarik/digeser
function updateSliderVisualOnly(val) {
    const year = val.toString();
    document.getElementById('sliderValueDisplay').innerText = year;
    const badge = document.getElementById('timeBadge');
    if(badge) badge.innerText = year;
}

// 2. FUNGSI BERAT: Hanya dieksekusi saat klik mouse dilepas
function handleSliderChange(val) {
    const year = val.toString();
    updateSliderVisualOnly(val); // Pastikan UI sinkron

    currentFilters.year = [year];
    activeChartFilter = { year: parseInt(year), quarter: null, month: null };

    document.getElementById('yearTrigger').innerText = year;
    resetDropdownUI('year', year);

    // Sekarang, update data hanya dipanggil SEKALI!
    updateDashboardData();    
    renderInteractiveCharts(); 
}

// Fungsi yang dijalankan saat tombol "Terapkan Filter" diklik
function applyFiltersAndZoom() {
    closeFilterAndPopups(); // Menutup panel filter secara otomatis
    updateDashboardData();  // Memperbarui data (dan otomatis memicu zoom ke wilayah)
}

// ==========================================
// 4. UI DROPDOWN FILTER KUSTOM
// ==========================================

function setupDropdownEvents() {
    document.addEventListener('click', function(e) { 
        if (!e.target.closest('.custom-select-wrapper')) { 
            document.querySelectorAll('.custom-options').forEach(el => el.classList.remove('open')); 
        } 
    });
    
    document.querySelectorAll('.custom-select-trigger').forEach(trigger => { 
        trigger.addEventListener('click', function() { 
            const options = this.nextElementSibling; 
            document.querySelectorAll('.custom-options').forEach(el => { 
                if(el !== options) el.classList.remove('open'); 
            }); 
            options.classList.toggle('open'); 
        }); 
    });
}

function filterOptions(input) {
    const filter = input.value.toUpperCase();
    const items = input.closest('.custom-options').getElementsByClassName('option-item');
    for (let i = 0; i < items.length; i++) {
        if (items[i].dataset.value === 'All') continue;
        const txtValue = items[i].textContent || items[i].innerText;
        items[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
}

function selectSingleOption(type, value, element) {
    const siblings = element.parentNode.querySelectorAll('.option-item');
    siblings.forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    const trigger = element.closest('.custom-select-wrapper').querySelector('.custom-select-trigger');
    if (type === 'month' && value !== 'All') {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        trigger.innerText = monthNames[parseInt(value)-1];
    } else {
        trigger.innerText = value;
    }
    
    element.parentNode.classList.remove('open');
    if (type === 'year') currentFilters.year = value;
    if (type === 'month') currentFilters.month = value;
}

function selectOption(type, value, element) {
    const isAll = value === 'All';
    const parent = element.parentNode;
    
    if (isAll) { 
        parent.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected')); 
        element.classList.add('selected'); 
    } else { 
        parent.querySelector('.option-item[data-value="All"]').classList.remove('selected'); 
        element.classList.toggle('selected'); 
        if (parent.querySelectorAll('.option-item.selected').length === 0) { 
            parent.querySelector('.option-item[data-value="All"]').classList.add('selected'); 
        } 
    }
    
    const selectedItems = Array.from(parent.querySelectorAll('.option-item.selected'));
    const trigger = element.closest('.custom-select-wrapper').querySelector('.custom-select-trigger');
    
    if (selectedItems.length === 1 && selectedItems[0].dataset.value === 'All') { 
        trigger.innerText = 'All'; 
        currentFilters[type === 'polda' ? 'poldas' : type] = ['All']; 
    } else { 
        trigger.innerText = `${selectedItems.length} Selected`; 
        let values = [];
        selectedItems.forEach(el => {
            const rawVal = el.dataset.value;
            
            // KUNCI PERBAIKAN: Pisahkan nilai koma untuk SEMUA filter (Polda maupun Polres)
            if(rawVal.includes(',')) { 
                values.push(...rawVal.split(','));
            } else {
                values.push(rawVal);
            }
        });
        currentFilters[type === 'polda' ? 'poldas' : type] = values; 
    }
}

function resetDropdownUI(type, defaultValue) {
    let containerId = '';
    if (type === 'year') containerId = 'yearOptions';
    else if (type === 'month') containerId = 'monthOptions';
    else if (type === 'polda') containerId = 'poldaOptions';
    else if (type === 'polres') containerId = 'polresOptions';

    const container = document.getElementById(containerId);
    if (!container) return;

    const items = container.querySelectorAll('.option-item');
    items.forEach(el => el.classList.remove('selected'));

    let found = false;
    items.forEach(el => {
        if (el.dataset.value === defaultValue) {
            el.classList.add('selected');
            found = true;
        }
    });

    if (!found && defaultValue === 'All') {
        const allOpt = container.querySelector('.option-item[data-value="All"]');
        if (allOpt) allOpt.classList.add('selected');
    }
}

// ==========================================
// 5. UPDATE TAMPILAN DATA & TABEL
// ==========================================

function updateHeaderDisplay() {
    const yearElem = document.getElementById('headerYearDisplay');
    if (currentFilters.year.includes('All')) {
        yearElem.innerText = "Semua Tahun";
    } else {
        let nums = currentFilters.year.map(Number).sort((a,b)=>a-b);
        if(nums.length === 1) yearElem.innerText = nums[0];
        else if(nums.length > 1) {
            let isSeq = true;
            for(let i=0; i<nums.length-1; i++) { if(nums[i+1] !== nums[i]+1) { isSeq = false; break; } }
            if(isSeq) yearElem.innerText = `${nums[0]} - ${nums[nums.length-1]}`;
            else yearElem.innerText = nums.join(", ");
        } else {
            yearElem.innerText = "2025"; 
        }
    }
}

function updateHeaderStats(value) {
    const valElem = document.getElementById('totalRiskDisplay');
    const descElem = document.getElementById('totalRiskDesc');

    const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
    let scope = 'national';
    if (currentFilters.polres[0] !== 'All') { scope = 'polres'; } 
    else if (currentFilters.poldas[0] !== 'All') { scope = 'polda'; }

    const status = getRiskClassification(value, scope, period);

    // ==============================================================
    // SULAP UI: JIKA MODE KESELAMATAN AKTIF, TAMPILKAN TARGET RUNK
    // ==============================================================
    if (window.currentDashboardModule === 'keselamatan') {
        // 1. Ambil Tahun Aktif (Default ke 2026 jika 'All')
        const yearStr = currentFilters.year[0] !== 'All' ? currentFilters.year[0] : "2026";
        const activeYear = parseInt(yearStr);
        
        // 2. Data Target RUNK sesuai master data Bappenas/Korlantas
        const targetTanpaRunk = {
            2010: 31234, 2020: 40356, 2021: 39768, 2022: 39180, 2023: 38592, 2024: 38004, 2025: 37416, 2026: 39473, 2027: 41530, 2028: 43587, 2029: 45645, 2030: 47703, 2031: 50648, 2032: 53592, 2033: 56537, 2034: 59481, 2035: 62426, 2036: 66581, 2037: 70736, 2038: 74891, 2039: 79046, 2040: 83201
        };
        const targetDenganRunk = {
            2010: 31234, 2020: 15935, 2021: 18316, 2022: 20697, 2023: 23077, 2024: 25458, 2025: 27838, 2026: 27041, 2027: 26244, 2028: 25447, 2029: 24650, 2030: 23852, 2031: 23130, 2032: 22409, 2033: 21688, 2034: 20967, 2035: 20246, 2036: 19525, 2037: 18804, 2038: 18083, 2039: 17362, 2040: 16640
        };
        const targetFatalityReduction = {
            2020: -0.610, 2021: -0.540, 2022: -0.470, 2023: -0.400, 2024: -0.330, 2025: -0.260, 2026: -0.308, 2027: -0.356, 2028: -0.404, 2029: -0.452, 2030: -0.500, 2031: -0.510, 2032: -0.546, 2033: -0.582, 2034: -0.618, 2035: -0.680, 2036: -0.704, 2037: -0.728, 2038: -0.752, 2039: -0.776, 2040: -0.800
        };
        
        let tanpa = targetTanpaRunk[activeYear] || 0;
        let dengan = targetDenganRunk[activeYear] || 0;
        let fr = targetFatalityReduction[activeYear] || 0; 
        
        // Asumsi data aktual laka masih belum dikonek DB (sehingga bernilai 0)
        let actual = value || 0; 
        
        // 3. Kalkulasi Persentase Aktual vs Proyeksi TANPA RUNK
        let diffTanpa = tanpa > 0 ? ((actual - tanpa) / tanpa) * 100 : 0;
        let diffTanpaText = "";
        let diffAbs = Math.abs(diffTanpa).toFixed(1);
        if (diffTanpa < 0) {
            diffTanpaText = `-${diffAbs}% lebih rendah`;
        } else if (diffTanpa > 0) {
            diffTanpaText = `+${diffAbs}% lebih tinggi`;
        } else {
            diffTanpaText = `0%`;
        }
        
        // 4. Kalkulasi Persentase Aktual vs Proyeksi DENGAN RUNK
        let diffDengan = dengan > 0 ? ((actual - dengan) / dengan) * 100 : 0;
        let diffDenganText = diffDengan > 0 ? `+${diffDengan.toFixed(1)}%` : `${diffDengan.toFixed(1)}%`;
        
        // 5. Format Target Persentase FR (Ubah -0.308 menjadi -30.8%)
        let targetFRPercent = fr !== 0 ? (fr * 100).toFixed(1) + "%" : "0%";
        
        // 6. Penentuan Warna Indikator
        let colorDengan = diffDengan <= 0 ? '#22c55e' : '#ef4444'; // Hijau jika tercapai (minus/0)
        let colorTanpa = diffTanpa <= 0 ? '#22c55e' : '#ef4444'; 

        // Update Layar Angka Besar
        if (valElem) {
            valElem.innerText = actual.toLocaleString('id-ID');
            valElem.style.color = '#22c55e'; // Angka besar tetap Hijau (karena masih 0)
            valElem.style.textShadow = 'none';
        }

        // Update Layar Teks Kotak RUNK
        if (descElem) {
            descElem.innerHTML = `
                <div style="line-height:1.5; font-size:13px; color:#334155; margin-bottom:12px;">
                    Mengindikasikan korban meninggal dunia akibat laka aktual <b style="color:${colorTanpa};">${diffTanpaText}</b> dibandingkan proyeksi tanpa adanya intervensi RUNK.
                </div>
                <div style="display:flex; gap:12px; text-align:left;">
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);">
                        <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Target (${activeYear})</div>
                        <div style="font-size:18px; font-weight:900; color:#1e293b; letter-spacing:-0.5px;">${targetFRPercent}</div>
                    </div>
                    <div style="flex:1; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.06);">
                        <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Capaian Terhadap RUNK</div>
                        <div style="font-size:18px; font-weight:900; color:${colorDengan}; letter-spacing:-0.5px;">${diffDenganText}</div>
                    </div>
                </div>
            `;
        }
    } 
    // ==============================================================
    // LOGIKA KEMBALI NORMAL UNTUK KINERJA KEAMANAN
    // ==============================================================
    else {
        if (valElem) {
            valElem.innerText = value.toFixed(2);
            valElem.style.color = status.color;
            valElem.style.textShadow = `0 4px 15px ${status.color}40`; 
        }

        if (descElem) {
            if (currentMode === 'risk') {
                let rangeText = (value % 1 === 0) ? value : `${Math.floor(value)} - ${Math.ceil(value)}`;
                descElem.innerHTML = `Mengindikasikan terdapat <b style="color:${status.color}">${rangeText}</b> titik lokasi yang rentan terlibat kecelakaan setiap 100 km perjalanan.`;
            } else {
                descElem.innerHTML = `Mengindikasikan Indeks Beban Kemacetan sebesar <b style="color:${status.color}">${value.toFixed(2)}</b>. Skor ini mencerminkan tingginya potensi penumpukan kendaraan akibat kombinasi titik hambat lalu lintas dan kepadatan aktivitas penduduk.`;
            }
        }
    }
}

function updateRiskTable(aggregatedData) {
    let tableData = [];
    let grandTotalForHeader = 0; 

    for (const [poldaName, total] of Object.entries(aggregatedData)) {
        grandTotalForHeader += total;
        tableData.push({ name: poldaName, total: total });
    }

    tableData.sort((a, b) => b.total - a.total);
    
    currentPoldaRanks = {}; 
    const tbody = document.getElementById('riskTableBody');
    tbody.innerHTML = '';
    
    const totalCount = tableData.length;
    const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';

    if (totalCount === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">Tidak ada wilayah yang sesuai filter</td></tr>`;
        updateHeaderStats(0);
        return;
    }

    // [PERBAIKAN PERFORMA 1]: Kumpulkan teks dulu, baru tempel 1 kali!
    let tableHTML = '';
    
    tableData.forEach((item, index) => {
        let lastIndex = index;
        for(let i = index + 1; i < totalCount; i++) {
            if(Math.abs(tableData[i].total - item.total) < 0.0001) { lastIndex = i; } else { break; }
        }
        const rank = totalCount - lastIndex;
        currentPoldaRanks[item.name] = rank;

        let rankClass = 'rank-col';
        if (rank === 1 && totalCount > 1) rankClass += ' top-rank-1'; 
        else if (rank === 2) rankClass += ' top-rank-2'; 
        else if (rank === 3) rankClass += ' top-rank-3';
        
        const displayTotal = item.total.toFixed(2); 
        const status = getRiskClassification(item.total, 'polda', period);
        const logoUrl = getPoldaLogoFilename(item.name);

        // Jangan pakai tbody.innerHTML += di sini! Simpan ke string sementara.
        tableHTML += `
            <tr onclick="zoomToPolda('${item.name}')" 
                title="Klik untuk zoom ke ${item.name} (${status.label})"
                style="background-color: ${status.bg}; border-left: 4px solid ${status.color};">
                <td class="${rankClass}">#${rank}</td>
                <td style="font-weight:600; color:#334155; display:flex; align-items:center;">
                    <img src="${logoUrl}" class="table-polda-logo"> 
                    ${item.name}
                </td>
                <td class="risk-col" style="color: ${status.color} !important; font-weight: 800;">${displayTotal}</td>
            </tr>`;
    });

    // Tempelkan SEMUANYA sekaligus dalam 1 milidetik!
    tbody.innerHTML = tableHTML;
    updateHeaderStats(grandTotalForHeader);
}

function updateFooterDefinitions(mode) {
    const defUtamaTitle = document.getElementById('mainDefTitle');
    const defUtamaDesc = document.getElementById('mainDefDesc');
    const defSubTitle = document.getElementById('defTitle');
    const defSubDesc = document.getElementById('defDesc');
    const scoreSubLabel = document.getElementById('scoreSubLabel');
    const scoreValue = document.getElementById('footerRiskValue');

    if (window.currentDashboardModule === 'kelancaran') {
        document.body.classList.remove('mode-keselamatan');
        
        if(defUtamaTitle) defUtamaTitle.innerHTML = '<div style="font-size:18px; color: #cbd5e1;">Apa itu <strong style="font-size: 26px; color: #ffffff;">Kinerja Kelancaran?</strong></div>';
        if(defUtamaDesc) defUtamaDesc.innerHTML = `
            <p class="card-desc" style="margin-bottom: 10px;">
                <strong style="font-size: 20px; color: #ffffff;">Kinerja Kelancaran</strong><span style="font-size:14px;"> mengevaluasi tingkat kelancaran arus kendaraan di jaringan jalan raya secara holistik.</span>
            </p>`;
        if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400; color: #cbd5e1;">Apa Definisi</span> <strong style="font-size: 26px; color: #ffffff;">Indeks Kelancaran Lalu Lintas (IKLL)?</strong>';
        if(defSubDesc) defSubDesc.innerHTML = `
            <p class="card-desc" style="margin-bottom: 10px;">
                <strong style="font-size: 20px; color: #ffffff;">IKLL</strong><span style="font-size:14px;"> adalah metrik komprehensif berskala 0-100 yang mengevaluasi tingkat kelancaran jalan.</span>
            </p>
            <p class="card-desc">
                <span style="font-size:14px;">Skor IKLL dihitung dari 3 dimensi: Kepadatan Arus (VCR), Gangguan Hambatan Samping (Titik Keramaian + Troublespot), serta Kesiapan Manajemen Persimpangan Jalan (Rasio APILL). Semakin mendekati 100, lalu lintas semakin ideal.</span>
            </p>`;
        if(scoreSubLabel) scoreSubLabel.innerHTML = `<strong style="font-size: 24px; color: #ffffff;">Skor IKLL Nasional</strong>`;
        return; 
    }

    if (window.currentDashboardModule === 'ketertiban') {
        document.body.classList.remove('mode-keselamatan');
        
        if(defUtamaTitle) defUtamaTitle.innerHTML = '<div style="font-size:18px; color: #cbd5e1;">Apa itu <strong style="font-size: 26px; color: #ffffff;">Kinerja Ketertiban?</strong></div>';
        if(defUtamaDesc) defUtamaDesc.innerHTML = `
            <p class="card-desc" style="margin-bottom: 10px;">
                <strong style="font-size: 20px; color: #ffffff;">Kinerja ketertiban</strong><span style="font-size:14px;"> merupakan evaluasi tentang sejauh mana sistem lalu lintas, peraturan lalu lintas, dan perilaku pengemudi memenuhi standar dan tujuan terkait dengan menjaga ketertiban di jalan raya.</span>
            </p>
            <p class="card-desc">
                <span style="font-size:14px;">Ketertiban lalu lintas adalah aspek penting dalam menjaga keamanan dan kelancaran lalu lintas, dengan tujuan untuk memastikan bahwa semua pengguna jalan raya mematuhi peraturan dan tindakan etika.</span>
            </p>
        `;

        // [PERBAIKAN]: Ubah judul dan definisi dari HRVR menjadi IKKH
        if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400; color: #cbd5e1;">Apa Definisi</span> <strong style="font-size: 26px; color: #ffffff;">Indeks Kinerja Ketertiban Holistik?</strong>';
        if(defSubDesc) defSubDesc.innerHTML = `
            <p class="card-desc" style="margin-bottom: 10px;">
                <strong style="font-size: 20px; color: #ffffff;">Indeks Kinerja Ketertiban Holistik (IKKH)</strong><span style="font-size:14px;"> adalah metrik komprehensif berskala 0-100 yang mengevaluasi tingkat ketertiban suatu wilayah.</span>
            </p>
            <p class="card-desc">
                <span style="font-size:14px;">Skor IKKH dihitung tidak hanya dari jumlah pelanggaran, tetapi menggabungkan 3 dimensi: Kualitas Pelanggaran Berat (Severity), Rasio Jumlah Pengemudi (Exposure), serta Kesenjangan Kapasitas ETLE vs Kepadatan Kendaraan (Surveillance Gap).</span>
            </p>
        `;
        if(scoreSubLabel) scoreSubLabel.innerHTML = `<strong style="font-size: 24px; color: #ffffff;">Skor IKKH Nasional</strong>`;

        return; // Selesai untuk ketertiban
    }

    if (window.currentDashboardModule === 'keselamatan') {
        document.body.classList.add('mode-keselamatan');
        
        // TEKS UTAMA KINERJA KESELAMATAN (DIKEMBALIKAN KE ASLI)
        if(defUtamaTitle) defUtamaTitle.innerHTML = '<div style="font-size:18px; color: #cbd5e1;">Apa itu <strong style="font-size: 26px; color: #ffffff;">Kinerja Keselamatan?</strong></div>';
        if(defUtamaDesc) defUtamaDesc.innerHTML = `
            <p class="card-desc" style="margin-bottom: 10px;">
                <strong style="font-size: 20px; color: #ffffff;">Kinerja Keselamatan</strong><span style="font-size:14px;"> merupakan evaluasi tentang sejauh mana sistem lalu lintas, infrastruktur jalan, dan perilaku pengemudi memenuhi standar dan tujuan terkait keselamatan dalam penggunaan jalan raya.</span>
            </p>
            <p class="card-desc">
                <span style="font-size:14px;">Tujuannya adalah untuk memastikan bahwa lalu lintas berjalan dengan tingkat risiko kecelakaan rendah sehingga mengurangi kemungkinan terjadinya kecelakaan dan cedera.</span>
            </p>
        `;

        if (mode === 'fatality_pop') {
            // TEKS SESUAI GAMBAR SCREENSHOT IFP
            if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400; color: #cbd5e1;">Apa Definisi</span> <strong style="font-size: 26px; color: #ffffff;">Indeks Fatalitas Populasi?</strong>';
            if(defSubDesc) defSubDesc.innerHTML = `
                <p class="card-desc" style="margin-bottom: 10px;">
                    <strong style="font-size: 20px; color: #ffffff;">Indeks Fatalitas Berbasis Populasi (IFP)</strong>
                    <span style="font-size:14px;"> merupakan pengukuran tingkat fatalitas menggunakan jumlah korban meninggal dunia dibandingkan dengan jumlah populasi dalam satuan ukur per 100.000 penduduk.</span>
                </p>
                <p class="card-desc">
                    <span style="font-size:14px;">Hasil analisa ini digunakan untuk menentukan program - program preemtif, preventif, dan represif lalu lintas dalam asistensi masyarakat pengguna jalan.</span>
                </p>
            `;
            if(scoreSubLabel) scoreSubLabel.innerHTML = `Skor IFP Nasional`;
        } else if (mode === 'fatality_veh') {
            if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400; color: #cbd5e1;">Apa Definisi</span> <strong style="font-size: 26px; color: #ffffff;">Indeks Fatalitas Kendaraan?</strong>';
            if(defSubDesc) defSubDesc.innerHTML = `
                <p class="card-desc" style="margin-bottom: 10px;">
                    <strong style="font-size: 20px; color: #ffffff;">Indeks Fatalitas Berbasis Kendaraan (IFK)</strong>
                    <span style="font-size:14px;"> merupakan pengukuran dengan menggunakan jumlah korban meninggal dunia dibandingkan dengan jumlah kendaraan dalam satuan ukur 10.000 unit.</span>
                </p>
                <p class="card-desc"><span style="font-size:14px;">Hasil analisa ini digunakan untuk menentukan program - program preemtif, preventif, dan represif lalu lintas dalam asistensi kendaraan laik jalan.</span></p>
            `;
            if(scoreSubLabel) scoreSubLabel.innerHTML = `Skor IFK Nasional`;    
        } else {
            // TEKS FR LAMA (DIKEMBALIKAN KE ASLI)
            if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400; color: #cbd5e1;">Definisi</span> <strong style="font-size: 26px; color: #ffffff;">Fatality Reduction</strong>';
            if(defSubDesc) defSubDesc.innerHTML = `
                <p class="card-desc" style="margin-bottom: 10px;">
                    <strong style="font-size: 20px; color: #ffffff;">Fatality Reduction (FR)</strong>
                    <span style="font-size:14px;"> merupakan pengukuran tingkat fatalitas kecelakaan dengan menggunakan persentase penurunan korban meninggal dunia akibat kebijakan atau program RUNK dibandingkan skenario tanpa intervensi program.</span>
                </p>
                <p class="card-desc">
                    <span style="font-size:14px;">Manfaat dari pengukuran ini adalah untuk menilai efektivitas program keselamatan dalam mengurangi korban meninggal dunia.</span>
                </p>
            `;
            if(scoreSubLabel) scoreSubLabel.innerHTML = `Skor Fatality Reduction`;
        }
        if(scoreValue) { scoreValue.innerText = '0'; scoreValue.style.color = '#22c55e'; scoreValue.style.webkitTextFillColor = '#22c55e'; }
    } else {
        // 1. MATIKAN LAYOUT CSS KESELAMATAN (Kembali ke Keamanan)
        document.body.classList.remove('mode-keselamatan');

        // 2. KEMBALIKAN TEKS KEAMANAN
        if(defUtamaTitle) defUtamaTitle.innerHTML = '<div style="font-size:18px; color: #cbd5e1;">Apa itu <strong style="font-size: 26px; color: #ffffff;">Kinerja Keamanan?</strong></div>';
        if(defUtamaDesc) defUtamaDesc.innerHTML = `
            <p class="card-desc" style="margin-bottom: 10px;">
                <strong style="font-size: 20px; color: #ffffff;">Kinerja Keamanan</strong><span style="font-size:14px;"> merupakan evaluasi terhadap sejauh mana sistem lalu lintas, infrastruktur jalan, dan perilaku pengemudi memenuhi standar dan tujuan terkait keamanan dalam penggunaan jalan raya.</span>
            </p>
            <p class="card-desc">
                <span style="font-size:14px;">Tujuannya adalah untuk memastikan bahwa lalu lintas berjalan dengan tingkat risiko kecelakaan dan kemacetan yang rendah sehingga pengguna jalan merasa aman.</span>
            </p>
        `;

        if (mode === 'risk') {
            if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400;">Apa Definisi</span> <strong style="font-size: 26px;">Risiko Terlibat Kecelakaan?</strong>';
            if(defSubDesc) defSubDesc.innerHTML = `
                <p class="card-desc" style="margin-bottom: 10px;">
                    <strong style="font-size: 20px; color: #ffffff;">Risiko Terlibat Kecelakaan</strong>
                    <span style="font-size:14px;"> merupakan indeks yang dihitung dari <b>rasio jumlah titik rawan kecelakaan (blackspot) per 100 km panjang jalan</b>. Indeks ini dijadikan indikator objektif untuk mengukur tingkat keamanan pengguna jalan dari ancaman fatalitas lalu lintas di suatu wilayah.</span>
                </p>
                <p class="card-desc">
                    <span style="font-size:14px;">Manfaat dari pengukuran ini adalah sebagai landasan data (data-driven) untuk menentukan rencana ploting anggota, pendirian posko, alokasi sarana pendukung, serta rekomendasi teknis perbaikan infrastruktur titik blackspot kepada stakeholder terkait.</span>
                </p>
            `;
            if(scoreSubLabel) scoreSubLabel.innerHTML = `<strong style="font-size: 24px; color: #ffffff;">Skor Risiko Laka</strong>`;
        } else {
            if(defSubTitle) defSubTitle.innerHTML = '<span style="font-size: 18px; font-weight: 400;">Apa Definisi</span> <strong style="font-size: 26px;">Risiko Terjebak Kemacetan?</strong>';
            if(defSubDesc) defSubDesc.innerHTML = `
                <p class="card-desc" style="margin-bottom: 10px;">
                    <strong style="font-size: 20px; color: #ffffff;">Risiko Terjebak Kemacetan</strong>
                    <span style="font-size:14px;"> merupakan indeks yang dihitung dari <b>rasio jumlah titik rawan macet (troublespot) per 100 km panjang jalan, yang dibobotkan dengan kepadatan penduduk</b>. Indeks ini dijadikan indikator objektif tingkat kelancaran arus lalu lintas.</span>
                </p>
                <p class="card-desc">
                    <span style="font-size:14px;">Manfaat dari pengukuran ini adalah sebagai landasan data (data-driven) untuk menentukan rencana ploting tim urai kemacetan, posko taktis, serta rekomendasi rekayasa lalu lintas pada titik troublespot kepada stakeholder terkait.</span>
                </p>
            `;
            if(scoreSubLabel) scoreSubLabel.innerHTML = `<strong style="font-size: 24px; color: #ffffff;">Skor Risiko Macet</strong>`;
        }
    }
}

function generateRecommendation(currentRisk, rawTrendData) {
    const isTraffic = currentMode === 'traffic';
    const isFatality = currentMode === 'fatality';
    const isIFP = currentMode === 'fatality_pop'; 
    const isIFK = currentMode === 'fatality_veh';
    const isKetertiban = currentMode === 'ketertiban';
    const isKelancaran = currentMode === 'kelancaran';
    
    let recHTML = "";
    let actionShort = "";
    let statusLevel = "";
    let colorCode = "#94a3b8";

    // =================================================================
    // 1. TENTUKAN STATUS & WARNA BERDASARKAN MODE YANG AKTIF
    // =================================================================
    if (isKetertiban) {
        const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
        let scope = 'national';
        if (currentFilters.polres[0] !== 'All') { scope = 'polres'; } 
        else if (currentFilters.poldas[0] !== 'All') { scope = 'polda'; }
        
        let classObj = typeof getKetertibanClassification === 'function' ? getKetertibanClassification(currentRisk, scope, period) : { label: 'NO DATA', color: '#94a3b8' };
        statusLevel = classObj.label;
        colorCode = classObj.color;
    } else if (isKelancaran) {
        // [TAMBAHKAN BLOK INI]
        let classObj = typeof getKelancaranClassification === 'function' ? getKelancaranClassification(currentRisk) : { label: 'NO DATA', color: '#94a3b8' };
        statusLevel = classObj.label;
        colorCode = classObj.color;
    } else if (isIFP) {
        let activeYear = currentFilters.year[0] !== 'All' ? parseInt(currentFilters.year[0]) : new Date().getFullYear();
        let tIFP = typeof targetIFP !== 'undefined' ? (targetIFP[activeYear] || 8.938) : 8.938;
        
        let classObj = typeof getIFPClassification === 'function' ? getIFPClassification(currentRisk, tIFP) : { label: 'NO DATA', color: '#94a3b8' };
        
        statusLevel = classObj.label;
        colorCode = classObj.color;
    } else if (isIFK) {
        let activeYear = currentFilters.year[0] !== 'All' ? parseInt(currentFilters.year[0]) : new Date().getFullYear();
        let tIFK = typeof targetIFK !== 'undefined' ? (targetIFK[activeYear] || 2.0) : 2.0;
        let classObj = typeof getIFKClassification === 'function' ? getIFKClassification(currentRisk, tIFK) : { label: 'NO DATA', color: '#94a3b8' };
        statusLevel = classObj.label; colorCode = classObj.color;    
    } else if (isFatality) {
        const targetFR = window.currentFatalityTargetFR || 0;
        let classObj = typeof getFatalityClassification === 'function' ? getFatalityClassification(currentRisk, targetFR) : { label: 'NO DATA', color: '#94a3b8' };
        
        statusLevel = classObj.label;
        colorCode = classObj.color;
    } else {
        const period = currentFilters.month[0] !== 'All' ? 'month' : 'year';
        let scope = 'national';
        if (currentFilters.polres[0] !== 'All') { scope = 'polres'; } 
        else if (currentFilters.poldas[0] !== 'All') { scope = 'polda'; }
        
        const statusObj = getRiskClassification(currentRisk, scope, period);
        statusLevel = statusObj.label;
        colorCode = statusObj.color;
    }

    // =================================================================
    // 2. TENTUKAN ISI LIST (recHTML) DAN JUDUL AKSI (actionShort)
    // =================================================================
    if (isKetertiban) {
        // --- TEKS REKOMENDASI KHUSUS IKKH (INDEKS KINERJA KETERTIBAN HOLISTIK) ---
        if (statusLevel === "AMAN") {
            actionShort = "STANDARISASI & EKSPANSI SMART CITY";
            recHTML = `<ul>
                <li>Pertahankan efektivitas penegakan hukum, skor IKKH menunjukkan keseimbangan ideal antara rasio pelanggaran berat dengan kepadatan kendaraan.</li>
                <li>Jadikan wilayah ini pilot project penerapan penghargaan (reward) bebas denda pajak bagi pengemudi yang tidak pernah melanggar.</li>
                <li>Lakukan kalibrasi rutin perangkat ETLE untuk memastikan kualitas tangkapan kamera tetap optimal meskipun kepadatan lalin tinggi.</li>
                <li>Perluas program Police Goes to School untuk menanamkan kultur ketertiban sejak usia dini.</li>
                <li>Publikasikan capaian Indeks Ketertiban yang sangat baik ini di media lokal untuk membangun kebanggaan warga tertib.</li>
                <li>Lakukan audit silang ke wilayah berstatus Rawan untuk mentransfer ilmu manajemen lalu lintas dari wilayah yang Aman.</li>
            </ul>`;
        } else if (statusLevel === "WASPADA") {
            actionShort = "OPTIMALISASI PENCEGAHAN & VISIBILITAS";
            recHTML = `<ul>
                <li>Kesenjangan pengawasan (Surveillance Gap) mulai terlihat. Gencarkan patroli Blue Light pada jam rawan di rute padat yang belum terjangkau ETLE.</li>
                <li>Gelar penertiban tematik (ETLE Mobile) untuk menekan rasio pelanggaran berat (Severity) yang mulai merangkak naik.</li>
                <li>Dorong Bhabinkamtibmas memberikan penyuluhan door-to-door ke pemukiman penyumbang rasio pengemudi pelanggar tertinggi.</li>
                <li>Pasang pita kejut atau rambu peringatan keras di jalan arteri yang berpotensi memicu pelanggaran batas kecepatan.</li>
                <li>Berikan teguran tertulis kepada perusahaan logistik jika ditemukan peningkatan eksposur armadanya yang melanggar ODOL di wilayah ini.</li>
                <li>Optimalkan penjagaan personel di simpul macet agar warga tidak mencuri kesempatan melakukan pelanggaran kasat mata.</li>
            </ul>`;
        } else if (statusLevel === "RAWAN") {
            actionShort = "INTERVENSI REPRESIF TAKTIS";
            recHTML = `<ul>
                <li>Skor IKKH memburuk akibat minimnya pengawasan di tengah tingginya intensitas kendaraan. Segera usulkan penambahan titik pengawasan/ETLE baru.</li>
                <li>Gelar Operasi Penegakan Hukum Gabungan (TNI/Dishub) secara masif untuk memberikan shock therapy terhadap tingginya pelanggaran berat.</li>
                <li>Terapkan sanksi denda tilang maksimal tanpa kompromi untuk 7 Prioritas Pelanggaran yang membahayakan nyawa.</li>
                <li>Lakukan penyitaan sementara bagi kendaraan knalpot brong atau ban cacing.</li>
                <li>Surati dan panggil orang tua/sekolah bagi pelanggar di bawah umur dan wajibkan penandatanganan surat pernyataan untuk komitmen keselamatan.</li>
                <li>Tutup paksa persimpangan ilegal atau U-Turn liar yang memfasilitasi pengendara untuk melawan arus guna menutupi gap pengawasan.</li>
            </ul>`;
        } else if (statusLevel === "KRITIS") {
            actionShort = "PENANGANAN DARURAT INSTITUSIONAL";
            recHTML = `<ul>
                <li>Segera bentuk Tim Satgas Khusus Penanganan Fatalitas Laka Lantas lintas sektoral tingkat tinggi bersama Kepala Daerah dan Forum LLAJ.</li>
                <li>Indeks IKKH sangat buruk, sehingga butuh ditetapkan status Darurat Ketertiban LLAJ akibat rasio pelanggaran berat yang sangat ekstrem dan titik pengawasan nihil.</li>
                <li>Terapkan prinsip Zero Tolerance, cabut SIM pengemudi angkutan niaga/bus yang terbukti melakukan pelanggaran ODOL berulang.</li>
                <li>Laksanakan sweeping tengah malam secara masif untuk menindak pengemudi mabuk.</li>
                <li>Kerahkan untuk melakukan pengawasan di titik-titik persimpangan krusial.</li>
                <li>Evaluasi kinerja pimpinan lalu lintas setempat atas indikasi pembiaran penegakan hukum (Dark Figure) di tengah melonjaknya volume kendaraan.</li>
                <li>Libatkan Kepala Daerah secara langsung untuk menerbitkan aturan pembatasan operasional rute truk/kendaraan berat di siang hari.</li>
            </ul>`;
        } else {
            actionShort = "PENGUMPULAN DATA VALID";
            recHTML = `<ul><li>Data penindakan atau demografi bernilai 0. Harap sinkronisasi database untuk menghindari bias penindakan (Dark Figure).</li></ul>`;
        }
    } else if (isKelancaran) {
        // [TAMBAHKAN BLOK REKOMENDASI IKLL INI]
        if (statusLevel === "SANGAT LANCAR") {
            actionShort = "PEMELIHARAAN KAPASITAS ARUS";
            recHTML = `<ul>
                <li>Pertahankan manajemen rekayasa lalu lintas saat ini dan jadikan wilayah ini percontohan (pilot project) tata kelola kelancaran jalan.</li>
                <li>Lakukan pemeliharaan rutin pada sensor dan komponen APILL untuk memastikan siklus lalu lintas tetap optimal.</li>
                <li>Lanjutkan patroli rutin untuk mencegah munculnya titik parkir liar atau PKL yang mereduksi kapasitas jalan.</li>
                <li>Optimalkan pemantauan melalui kamera CCTV/ATCS guna mendeteksi secara dini anomali arus lalin.</li>
                <li>Pertahankan ketersediaan rambu larangan berhenti dan parkir.</li>
                <li>Berikan apresiasi kepada petugas lapangan dan Dishub yang berhasil mempertahankan ketertiban hambatan samping.</li>
            </ul>`;
        } else if (statusLevel === "PADAT MERAYAP") {
            actionShort = "PENGENDALIAN HAMBATAN SAMPING";
            recHTML = `<ul>
                <li>Tingkatkan penempatan personel pada titik keramaian khusus pada jam-jam padat.</li>
                <li>Gencarkan penertiban parkir dan angkutan umum yang ngetem di sekitar pusat aktivitas warga.</li>
                <li>Evaluasi dan sesuaikan ulang durasi waktu hijau (green time) pada APILL di persimpangan padat.</li>
                <li>Pasang water barrier di titik rawan putaran balik (U-Turn) untuk mencegah konflik arus.</li>
                <li>Koordinasikan akses keluar-masuk kendaraan dengan pengelola pusat perbelanjaan/pasar.</li>
                <li>Sosialisasikan penggunaan jalur alternatif melalui media sosial sebelum memasuki jam sibuk.</li>
            </ul>`;
        } else if (statusLevel === "TERSENDAT") {
            actionShort = "REKAYASA LALU LINTAS TAKTIS";
            recHTML = `<ul>
                <li>Terapkan rekayasa lalu lintas taktis (contraflow atau one way) pada jam-jam puncak kepadatan.</li>
                <li>Gelar penertiban gabungan berskala besar untuk membersihkan trotoar dan bahu jalan dari PKL dan parkir liar.</li>
                <li>Tutup secara permanen U-Turn dan persimpangan ilegal penyumbang utama troublespot.</li>
                <li>Usulkan pemasangan APILL baru atau transisi ke sistem ATCS pada persimpangan padat.</li>
                <li>Siapkan Tim Urai Kemacetan (Quick Response) untuk memecah simpul kemacetan secara proaktif.</li>
                <li>Terapkan aturan pembatasan jam masuk kota bagi truk berat untuk mengurangi beban kapasitas di siang hari.</li>
            </ul>`;
        } else if (statusLevel === "MACET KRITIS") {
            actionShort = "PENANGANAN DARURAT & INFRASTRUKTUR";
            recHTML = `<ul>
                <li>Tetapkan status darurat kemacetan dan libatkan Kepala Daerah/Forum LLAJ untuk intervensi sektoral.</li>
                <li>Berlakukan kebijakan pembatasan mobilitas radikal (Ganjil-Genap atau pelarangan total kendaraan berat).</li>
                <li>Rekomendasikan secara mendesak pelebaran geometrik jalan atau pembangunan Flyover/Underpass.</li>
                <li>Tertibkan paksa tanpa kompromi seluruh terminal bayangan yang mengokupasi ruang milik jalan raya.</li>
                <li>Wajibkan Andalalin yang sangat ketat bagi setiap pembangunan pusat komersial baru.</li>
                <li>Percepat integrasi angkutan umum massal dan dorong peralihan (shifting) dari kendaraan pribadi.</li>
            </ul>`;
        } else {
            actionShort = "PENGUMPULAN DATA VALID";
            recHTML = `<ul><li>Data perhitungan Volume-to-Capacity Ratio (VCR) belum memadai atau bernilai 0.</li></ul>`;
        }
    } else if (isIFP) {
        // --- TEKS REKOMENDASI KHUSUS INDEKS FATALITAS POPULASI (IFP) ---
        if (statusLevel === "AMAN") {
            actionShort = "STANDARISASI & PEMELIHARAAN KULTUR";
            recHTML = `<ul>
                <li>Pertahankan tren rasio fatalitas di bawah batas target RUNK melalui konsistensi program keselamatan berlalu lintas terpadu.</li>
                <li>Jadikan kebijakan keselamatan di wilayah ini sebagai percontohan (pilot project) manajemen edukasi masyarakat bagi daerah lain.</li>
                <li>Terus lakukan kampanye Safety Riding & Driving berkelanjutan guna memperkuat budaya tertib lalu lintas secara kultural.</li>
                <li>Perluas jangkauan kamera ETLE untuk mempertahankan dan mengawasi kedisiplinan populasi pengguna jalan secara konstan.</li>
                <li>Berikan apresiasi (reward) kepada elemen masyarakat dan instansi terkait yang berperan aktif menekan angka kecelakaan.</li>
                <li>Lakukan sinkronisasi data kependudukan dan laka lantas secara periodik guna memantau proyeksi rasio fatalitas di masa depan.</li>
            </ul>`;
        } else if (statusLevel === "WASPADA") {
            actionShort = "OPTIMALISASI EDUKASI & PREVENTIF";
            recHTML = `<ul>
                <li>Fokuskan program sosialisasi keselamatan lalu lintas secara spesifik pada kelompok usia produktif yang rentan laka.</li>
                <li>Intensifkan patroli simpatik di kawasan padat penduduk dan pusat aktivitas pergerakan warga (sekolah, pabrik, pasar, dll.).</li>
                <li>Gencarkan imbauan keselamatan jalan melalui media sosial dan libatkan tokoh masyarakat untuk menjangkau masyarakat lebih masif.</li>
                <li>Tingkatkan sinergi dengan Forum LLAJ guna mengevaluasi rambu dan kelengkapan marka di jalur penghubung antar permukiman.</li>
                <li>Dorong perangkat desa/kelurahan dalam pembentukan Kampung Pelopor Keselamatan Lalu Lintas di tingkat warga.</li>
                <li>Optimalkan penempatan personel penjagaan pada simpul keramaian di jam sibuk warga guna mencegah pelanggaran fatal.</li>
            </ul>`;
        } else if (statusLevel === "RAWAN") {
            actionShort = "INTERVENSI TAKTIS DEMOGRAFIS";
            recHTML = `<ul>
                <li>Gelar operasi penegakan hukum secara terarah pada pelanggaran dominan yang menyumbang rasio kematian.</li>
                <li>Petakan klaster pemukiman atau kecamatan yang paling banyak berkontribusi menyumbang korban untuk intervensi spesifik.</li>
                <li>Lakukan rekayasa lalu lintas taktis (pemasangan speed bump) di rute cepat yang membelah kawasan padat penduduk.</li>
                <li>Tugaskan Tim Audit Keselamatan Jalan bersama Dishub untuk meninjau ulang infrastruktur rute-rute mobilitas utama warga.</li>
                <li>Percepat respon penanganan gawat darurat medis bersama RSUD setempat untuk menekan probabilitas korban meninggal dunia.</li>
                <li>Tinjau ulang materi edukasi kampanye keselamatan agar pesannya lebih relevan dengan karakteristik sosiologis wilayah setempat.</li>
            </ul>`;
        } else if (statusLevel === "KRITIS") {
            actionShort = "PENANGANAN DARURAT STRATEGIS";
            recHTML = `<ul>
                <li>Tetapkan status darurat fatalitas jalan dan segera bentuk Satgas Keselamatan Lintas Sektoral bersama Kepala Daerah setempat.</li>
                <li>Terapkan kebijakan Zero Tolerance terhadap kejahatan lalu lintas, pelanggaran ODOL, dan pengemudi di bawah umur.</li>
                <li>Wajibkan pelaksanaan investigasi TAA (Traffic Accident Analysis) menyeluruh pada setiap laka menonjol guna memutus rantai masalah sistemik.</li>
                <li>Rekomendasikan percepatan perbaikan geometri jalan, PJU, dan pemasangan fasilitas pengaman di area lintasan warga yang berbahaya.</li>
                <li>Ajukan regulasi daerah untuk membatasi jam operasional angkutan barang/kendaraan berat yang masuk melintasi kawasan aktivitas sipil.</li>
                <li>Gelar evaluasi metrik kinerja rasio fatalitas secara mingguan dengan laporan pertanggungjawaban langsung kepada tingkat Polda/Korlantas.</li>
            </ul>`;
        } else {
            actionShort = "PENGUMPULAN DATA VALID";
            recHTML = `<ul><li>Data kependudukan atau laka lantas belum sinkron sepenuhnya. Harap pastikan pembaruan data IRSMS dan integrasi Dukcapil.</li></ul>`;
        }
    }else if (isIFK) {
        if (statusLevel === "AMAN") {
            actionShort = "PEMELIHARAAN SISTEM KENDARAAN";
            recHTML = `<ul><li>Pertahankan standar tinggi pengecekan uji kelaikan kendaraan angkutan barang dan penumpang di wilayah ini.</li>
            <li>Lanjutkan program apresiasi (reward) kepada PO Bus atau Perusahaan Logistik yang memiliki zero accident.</li>
            <li>Pertahankan sosialisasi teknis kelaikan ban, rem, dan dimensi kendaraan melalui kampanye Safety Driving.</li>
            <li>Lanjutkan integrasi kamera ETLE untuk pengawasan batas kecepatan dan kedisiplinan pengemudi.</li>
            <li>Perkuat kolaborasi dengan Dishub untuk sterilisasi terminal dan pool kendaraan dari angkutan ilegal.</li>
            <li>Jadikan wilayah ini model (pilot project) penerapan sistem pemantauan transportasi pintar.</li></ul>`;
        } else if (statusLevel === "WASPADA") {
            actionShort = "PENINGKATAN AUDIT KENDARAAN";
            recHTML = `<ul><li>Gencarkan razia gabungan khusus kelayakan jalan (ban gundul, rem blong, lampu mati, dll.) pada kendaraan niaga.</li>
            <li>Sosialisasikan kembali regulasi penindakan hukum bagi angkutan berat yang melebihi batas muatan.</li>
            <li>Tingkatkan pengawasan operasional armada bus AKAP/AKDP terutama pada musim liburan/mudik.</li>
            <li>Perketat pengawasan di jembatan timbang bersama dinas terkait untuk mencegah kerusakan infrastruktur dan risiko laka.</li>
            <li>Lakukan inspeksi mendadak (ramp check) ke pool PO Bus di wilayah rawan.</li>
            <li>Tingkatkan edukasi tentang bahaya modifikasi kendaraan bermotor roda dua (knalpot brong, ban cacing, dll.) ke kalangan pelajar.</li></ul>`;
        } else if (statusLevel === "RAWAN") {
            actionShort = "PENINDAKAN HUKUM MASIF";
            recHTML = `<ul><li>Terapkan sanksi tilang maksimal dan penyitaan kendaraan bagi truk angkutan barang yang terbukti melanggar ODOL (Over Dimension Over Load).</li>
            <li>Gelar penegakan hukum progresif terhadap pengendara bermotor di bawah umur yang mendominasi populasi pelanggar.</li>
            <li>Hentikan paksa operasional armada angkutan umum/barang yang terbukti menggunakan suku cadang tidak standar/rakitan.</li>
            <li>Bentuk tim khusus penyidik TAA (Traffic Accident Analysis) untuk mengusut aspek mekanis pada setiap kecelakaan menonjol.</li>
            <li>Lakukan audit menyeluruh terhadap bengkel karoseri truk/bus di wilayah kerja untuk menekan perakitan dimensi ilegal.</li>
            <li>Evaluasi jalur-jalur yang menjadi blackspot kecelakaan akibat rem blong kendaraan niaga.</li></ul>`;
        } else if (statusLevel === "KRITIS") {
            actionShort = "EVALUASI MENYELURUH & DARURAT";
            recHTML = `<ul><li>Cabut izin trayek angkutan atau laporkan perusahaan logistik yang armadanya menjadi penyebab kecelakaan fatal beruntun.</li>
            <li>Berlakukan pelarangan total melintas bagi kendaraan berat sumbu 3 ke atas pada jalur arteri kota di jam aktivitas warga.</li>
            <li>Tindak pidana perusahaan yang lalai melakukan pemeliharaan armada angkutan sehingga menyebabkan korban jiwa massal.</li>
            <li>Laksanakan inspeksi Kelaikan Kendaraan (KIR) ulang secara total bersama Kementerian Perhubungan di wilayah ini.</li>
            <li>Implementasikan segera sistem manajemen keselamatan jalan berbasis IT (GPS Tracking) pada seluruh angkutan komersial.</li>
            <li>Lakukan pembatasan umur pakai (peremajaan) operasional kendaraan angkutan umum yang berpotensi membahayakan nyawa.</li></ul>`;
        } else {
            actionShort = "PENGUMPULAN DATA KENDARAAN";
            recHTML = `<ul><li>Data populasi kendaraan atau korban laka belum memadai. Lakukan sinkronisasi data ERI (Electronic Registration and Identification).</li></ul>`;
        }    
    } else if (isFatality) { 
        if (statusLevel === "AMAN") {
            actionShort = "STANDARISASI & PEMELIHARAAN";
            recHTML = `<ul><li>Pertahankan dan jadikan percontohan program kampanye keselamatan jalan yang terbukti efektif di wilayah ini ke tingkat Satwil lainnya.</li>
            <li>Lakukan standardisasi infrastruktur pada titik-titik blackspot yang telah berhasil ditangani agar statusnya tidak kembali menjadi rawan.</li>
            <li>Berikan apresiasi/penghargaan kepada jajaran Satuan Wilayah dan stakeholder terkait atas keberhasilan menekan fatalitas melampaui target RUNK.</li>
            <li>Perluas cakupan kamera ETLE (Electronic Traffic Law Enforcement) untuk menjaga tingkat kepatuhan masyarakat secara konsisten dan transparan.</li>
            <li>Tingkatkan kolaborasi Smart City terintegrasi dengan pemerintah daerah untuk pemantauan arus, analitik CCTV, dan keselamatan lalu lintas secara real-time.</li>
            <li>Perkuat program edukasi dini secara berkelanjutan seperti Police Goes to School untuk membangun budaya tertib jangka panjang.</li></ul>`;
        } else if (statusLevel === "WASPADA") {
            actionShort = "OPTIMALISASI INTERVENSI";
            recHTML = `<ul><li>Tingkatkan intensitas operasi keselamatan dan patroli lalu lintas pada jam-jam rawan yang secara statistik masih menyumbang angka fatalitas.</li>
            <li>Perluas jangkauan edukasi dan kampanye keselamatan berkendara (Safety Riding/Driving) ke target demografi penyumbang laka tertinggi.</li>
            <li>Lakukan Audit Keselamatan Jalan (Road Safety Audit) skala ringan pada ruas-ruas jalan sekunder/kabupaten yang teridentifikasi mulai rawan kecelakaan.</li>
            <li>Tingkatkan sinergi dengan Forum LLAJ (Dishub, PU) untuk mempercepat perbaikan fasilitas jalan yang mulai rusak (PJU mati, marka jalan pudar, rambu tertutup pohon).</li>
            <li>Optimalkan Response Time (Waktu Tanggap) sistem gawat darurat medis bersama Dinas Kesehatan untuk mencegah korban luka berat berakibat fatal.</li>
            <li>Gencarkan diseminasi informasi daerah rawan laka melalui media sosial, radio, dan platform digital untuk meningkatkan kewaspadaan pengguna jalan.</li></ul>`;
        } else if (statusLevel === "RAWAN") {
            actionShort = "INTERVENSI TAKTIS & REPRESIF";
            recHTML = `<ul><li>Gelar operasi penegakan hukum secara masif pada pelanggaran pemicu fatalitas tinggi (tidak pakai helm, melawan arus, dan lainnya).</li>
            <li>Segera identifikasi dan tetapkan lokasi blackspot baru untuk dilakukan rekayasa lalu lintas taktis (pemasangan pita kejut/rumble strip, water barrier, atau penutupan U-Turn).</li>
            <li>Tingkatkan visibilitas petugas di lapangan melalui Blue Light Patrol pada blank spot terutama di malam hari.</li>
            <li>Tinjau ulang dan evaluasi efektivitas program keselamatan yang saat ini berjalan, karena terindikasi gagal memberikan dampak penurunan korban.</li>
            <li>Laksanakan operasi tematik khusus (Operasi Patuh/Zebra) berskala lokal yang secara tajam menargetkan jenis kendaraan terbanyak penyebab laka di wilayah tersebut.</li>
            <li>Intensifkan koordinasi dengan PT Jasa Raharja dan RSUD setempat untuk pendataan validitas korban serta percepatan penjaminan biaya perawatan trauma.</li></ul>`;
        } else if (statusLevel === "KRITIS") {
            actionShort = "PENANGANAN DARURAT STRATEGIS";
            recHTML = `<ul><li>Segera bentuk Tim Satgas Khusus Penanganan Fatalitas Laka Lantas lintas sektoral tingkat tinggi bersama Kepala Daerah dan Forum LLAJ.</li>
            <li>Laksanakan investigasi kecelakaan mendalam menggunakan metode TAA (Traffic Accident Analysis) untuk menemukan akar masalah sistemik dari rentetan kejadian laka menonjol.</li>
            <li>Lakukan Audit Keselamatan Infrastruktur Jalan secara menyeluruh, keluarkan rekomendasi resmi perbaikan geometri jalan kepada penyelenggara jalan.</li>
            <li>Terapkan kebijakan penegakan hukum tanpa kompromi (Zero Tolerance) terhadap tindak pelanggaran berat seperti angkutan ODOL (Over Dimension Over Load) dan pengemudi di bawah umur.</li>
            <li>Usulkan penerapan pembatasan operasional sementara melalui SK Gubernur/Bupati (misalnya rekayasa jam operasional kendaraan berat/sumbu 3 ke atas) pada jalur-jalur penyumbang laka tertinggi.</li>
            <li>Terapkan sistem pelaporan progres penanganan secara harian/mingguan yang dievaluasi langsung oleh pimpinan wilayah hingga tren fatalitas dapat kembali ditekan.</li></ul>`;
        } else {
            actionShort = "PENGUMPULAN DATA VALID";
            recHTML = `<ul><li>Data kematian belum tersedia secara lengkap untuk tahun ini. Harap lakukan sinkronisasi data dengan database IRSMS Pusat.</li></ul>`;
        }
    } else if (isTraffic) {
        if(statusLevel === "AMAN") actionShort = "PENGATURAN LALU LINTAS";
        else if(statusLevel === "WASPADA") actionShort = "MENGURAI HAMBATAN";
        else if(statusLevel === "RAWAN") actionShort = "REKAYASA TAKTIS";
        else actionShort = "MANAJEMEN KAPASITAS";
        
        if (statusLevel === "AMAN") {
            recHTML = `<ul><li>Lakukan pengaturan lalu lintas rutin pada jam padat pagi dan sore hari.</li>
            <li>Tertibkan parkir liar insidentil dan kendaraan ngetem yang menghambat arus lalu lintas.</li>
            <li>Pastikan fungsi APILL berfungsi normal.</li>
            <li>Lakukan monitoring rutin melalui CCTV untuk deteksi dini kepadatan.</li>
            <li>Berikan himbauan kepada pengguna jalan untuk tetap disiplin menggunakan lajur jalan.</li>
            <li>Pastikan bahu jalan bersih dari tumpukan material atau sampah yang mengganggu.</li></ul>`;
        } else if (statusLevel === "WASPADA") {
            recHTML = `<ul><li>Sterilisasi bahu jalan dari hambatan samping (pedagang kaki lima, ojol, parkir liar, dll.).</li>
            <li>Evaluasi ulang siklus waktu lampu merah (APILL) di persimpangan yang mulai padat.</li>
            <li>Siapkan Tim Urai Kemacetan (Patroli) untuk respon cepat (quick response).</li>
            <li>Sosialisasi penggunaan jalur alternatif kepada masyarakat melalui media sosial.</li>
            <li>Tertibkan kegiatan bongkar muat barang di pinggir jalan pada jam sibuk.</li>
            <li>Tingkatkan koordinasi dengan satuan lalu lintas wilayah perbatasan untuk antisipasi limpahan arus.</li></ul>`;
        } else if (statusLevel === "RAWAN") {
            recHTML = `<ul><li>Terapkan rekayasa lalu lintas taktis: Contraflow atau One Way parsial saat jam puncak kemacetan.</li>
            <li>Tutup sementara U-Turn (putaran balik) yang menyebabkan konflik arus.</li>
            <li>Batasi jam operasional kendaraan angkutan barang/truk sumbu 3 ke atas di ruas jalan protokol.</li>
            <li>Terapkan larangan belok kanan langsung di persimpangan prioritas untuk mengurangi antrean.</li>
            <li>Tempatkan personil patroli di titik penyempitan jalan.</li>
            <li>Lakukan pengalihan arus lalu lintas secara insidentil jika panjang antrean melebihi batas toleransi.</li></ul>`;
        } else {
            recHTML = `<ul><li>Terapkan Kebijakan Pembatasan Lalu Lintas (ganjil-genap atau pembatasan area) secara ketat.</li>
            <li>Usulkan pembangunan infrastruktur strategis (flyover/underpass atau pelebaran jalan) ke Pemda.</li>
            <li>Implementasi ATCS (Area Traffic Control System) adaptif berbasis AI untuk lampu merah otomatis.</li>
            <li>Gelar operasi gabungan lintas sektoral (Polri, Dishub, dan Satpol PP) untuk penertiban hambatan samping masif.</li>
            <li>Dorong integrasi antarmoda transportasi umum massal untuk mengurangi volume kendaraan pribadi.</li>
            <li>Lakukan rekayasa simpang tak sebidang atau manajemen kapasitas jalan secara masif.</li></ul>`;
        }
    } else {
        if(statusLevel === "AMAN") actionShort = "MONITORING RUTIN";
        else if(statusLevel === "WASPADA") actionShort = "TINDAKAN PREVENTIF";
        else if(statusLevel === "RAWAN") actionShort = "TINDAKAN REPRESIF TAKTIS";
        else actionShort = "INTERVENSI STRATEGIS";
        
        if (statusLevel === "AMAN") {
            recHTML = `<ul><li>Lakukan patroli rutin untuk memantau kepatuhan pengguna jalan.</li>
            <li>Cek kondisi fisik rambu lalu lintas, marka jalan, dan pagar pengaman secara berkala.</li>
            <li>Laksanakan kegiatan Dikmas Lantas (Pendidikan Masyarakat) ke sekolah dan komunitas.</li>
            <li>Pastikan Penerangan Jalan Umum (PJU) berfungsi baik, terutama di tikungan tajam.</li>
            <li>Lakukan analisis data kecelakaan harian untuk mendeteksi anomali kejadian baru.</li>
            <li>Pertahankan sosialisasi keselamatan berkendara (safety riding).</li></ul>`;
        } else if (statusLevel === "WASPADA") {
            recHTML = `<ul><li>Tingkatkan frekuensi patroli di titik blind spot dan area rawan pelanggaran.</li>
            <li>Pasang spanduk atau papan himbauan Daerah Rawan Kecelakaan di lokasi strategis yang berpotensi laka.</li>
            <li>Berikan teguran simpatik terhadap pelanggaran kasat mata (helm, sabuk pengaman, melawan arus, dll.).</li>
            <li>Koordinasi cepat dengan Dinas PU untuk perbaikan jalan rusak ringan (berlubang/bergelombang).</li>
            <li>Tertibkan kendaraan yang parkir di badan jalan yang menghalangi pandangan pengemudi.</li>
            <li>Tingkatkan patroli pada malam hari untuk mencegah laka lantas.</li></ul>`;
        } else if (statusLevel === "RAWAN") {
            recHTML = `<ul><li>Gelar Operasi Penindakan secara stasioner maupun hunting di lokasi Blackspot.</li>
            <li>Pasang sarana peredam kecepatan (speed trap atau pita kejut) di jalur cepat menjelang titik rawan.</li>
            <li>Tempatkan personel patroli (penjagaan statis) di jam-jam rawan kejadian laka.</li>
            <li>Lakukan audit fasilitas penyeberangan orang (zebra cross/JPO) dan perbaiki jika tidak layak.</li>
            <li>Lakukan razia batas kecepatan.</li>
            <li>Pasang cermin tikungan (convex mirror) di area dengan jarak pandang terbatas.</li></ul>`;
        } else {
            recHTML = `<ul><li>Lakukan Road Safety Audit (Audit Keselamatan Jalan) secara menyeluruh bersama Forum LLAJ.</li>
            <li>Penegakan hukum masif menggunakan kamera ETLE (statis dan mobile) untuk memberikan efek jera.</li>
            <li>Lakukan rekayasa geometrik jalan (perbaikan radius tikungan, median jalan, atau pemisah jalur).</li>
            <li>Tindak tegas kejahatan lalu lintas dan kendaraan ODOL (Over Dimension Over-Load).</li>
            <li>Tutup permanen putaran balik (U-Turn) yang sering menjadi lokasi kecelakaan fatal.</li>
            <li>Wajibkan Analisis Dampak Lalu Lintas (Andalalin) ketat untuk pembangunan baru.</li></ul>`;
        }
    }

    // =================================================================
    // 3. UPDATE UI (BERLAKU SAMA UNTUK SEMUA MODE)
    // =================================================================
    const recLabel = document.querySelector('.score-box .card-label');
    if(recLabel) {
        recLabel.innerHTML = `
            <span style="font-size: 14px; color: #94a3b8; font-weight: 700; letter-spacing: 2px;">REKOMENDASI</span>
            <span style="font-size: 20px; color: ${colorCode}; font-weight: 900; margin-top: 5px; text-transform: uppercase; text-align: center; line-height: 1.1;">
                ${actionShort}
            </span>
        `;
        
        const scoreValue = document.getElementById('footerRiskValue');
        if(scoreValue) {
            scoreValue.style.color = colorCode;
            scoreValue.style.background = "none"; 
            scoreValue.style.webkitTextFillColor = colorCode;
            scoreValue.style.textShadow = `0 0 20px ${colorCode}40`; 
        }
    }
    
    return recHTML;
}

// ==========================================
// 6. FITUR EXPORT (SCREENSHOT)
// ==========================================

function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
}

window.addEventListener('click', function(e) {
    if (!e.target.closest('.export-wrapper')) {
        const menu = document.getElementById('exportMenu');
        if(menu) menu.classList.remove('show');
    }
});

async function captureScreen(format) {
    document.getElementById('exportMenu').classList.remove('show');
    const target = document.getElementById('webgis-app');
    
    // 1. Scroll layar otomatis ke paling atas
    window.scrollTo(0, 0); 
    
    document.body.classList.add('capturing');

    // Beri jeda agar animasi scroll dan CSS berubah sempurna
    await new Promise(resolve => setTimeout(resolve, 800));

    const btnExport = document.querySelector('.btn-download'); 
    const originalText = btnExport.innerHTML;
    btnExport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Proses...';

    try {
        const canvas = await html2canvas(target, {
            scale: 2, 
            useCORS: true, 
            logging: false,
            scrollX: 0,
            scrollY: 0, 
            // windowWidth dan windowHeight DIHAPUS agar ukuran peta (vh) tidak meledak
            width: target.scrollWidth, 
            height: target.scrollHeight, 
            backgroundColor: '#475569', 
            allowTaint: true,
            foreignObjectRendering: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const fileName = `Dashboard_RoadSafety_${new Date().toISOString().slice(0,10)}`;

        if (format === 'jpeg') {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = fileName + '.jpg';
            link.click();
        } 
        else if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            
            // Konversi Proporsional ke PDF (Lebar fix Kertas A3 = 420mm)
            // Tingginya dihitung otomatis sesuai proporsi gambar asli agar tidak ada yang terpotong
            const pdfWidth = 420; 
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Tentukan orientasi otomatis berdasarkan tinggi vs lebar
            const pdfOrientation = pdfHeight > pdfWidth ? 'portrait' : 'landscape';

            // Cetak dengan ukuran kertas kustom tersebut
            const pdf = new jsPDF({
                orientation: pdfOrientation,
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(fileName + '.pdf');
        }

    } catch (err) {
        console.error("Gagal Screenshot:", err);
        alert("Terjadi kesalahan saat mengambil gambar.");
    } finally {
        document.body.classList.remove('capturing');
        btnExport.innerHTML = originalText;
    }
}

// --- FUNGSI UPDATE TANGGAL DINAMIS (DIOPTIMALKAN UNTUK BIG DATA & UX CERDAS) ---
function updateLastUpdatedDate(trendData) {
    const dateElem = document.querySelector('.bs-date');
    if (!dateElem) return;

    // Pastikan label selalu bertuliskan "Pembaruan Terakhir:" di semua mode
    const parentElem = dateElem.parentElement;
    if (parentElem) {
        parentElem.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                let text = node.textContent.trim();
                if (text.includes("Pembaruan Terakhir") || text.includes("Status Data")) {
                    node.textContent = "Pembaruan Terakhir: ";
                }
            }
        });
    }

    if (!trendData || trendData.length === 0) {
        dateElem.innerText = "-";
        return;
    }

    // =========================================================
    // Gunakan Looping untuk Big Data (>500.000 baris)
    // =========================================================
    let maxTime = 0;
    const now = new Date(); // Ambil waktu hari ini persis detik ini
    const currentRealTime = now.getTime(); 
    
    for (let i = 0; i < trendData.length; i++) {
        const time = new Date(trendData[i].tanggal).getTime();
        // Cek apakah waktu valid, TIDAK melewati hari ini, dan lebih besar dari maxTime
        if (!isNaN(time) && time <= currentRealTime && time > maxTime) {
            maxTime = time;
        }
    }
    
    if (maxTime === 0) {
        dateElem.innerText = "Belum Tersedia";
        return;
    }

    const maxDataDate = new Date(maxTime);
    let displayDate;

    // =========================================================
    // LOGIKA CERDAS: PENYESUAIAN TANGGAL TAMPILAN
    // =========================================================
    // Cek apakah data terbaru berada di bulan dan tahun yang SAMA dengan hari ini
    if (maxDataDate.getFullYear() === now.getFullYear() && maxDataDate.getMonth() === now.getMonth()) {
        // Jika laporannya bulan ini, tampilkan tanggal hari ini (Berjalan real-time)
        displayDate = now;
    } else {
        // Jika laporannya bulan lalu/sudah lewat, tampilkan tanggal TERAKHIR di bulan tersebut
        // Trik JS: new Date(tahun, bulan + 1, 0) akan mengembalikan hari terakhir dari bulan tersebut
        displayDate = new Date(maxDataDate.getFullYear(), maxDataDate.getMonth() + 1, 0);
    }

    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    dateElem.innerText = `${displayDate.getDate()} ${months[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
}