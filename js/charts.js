// ==========================================
// 1. STATE & VARIABEL GLOBAL CHART
// ==========================================
let rawTrendData = []; 
let activeChartFilter = { year: null, quarter: null, month: null }; 
let chartInstances = { year: null, quarter: null, month: null };

// ==========================================
// 2. FUNGSI UTAMA RENDER CHART
// ==========================================

// SAKLAR PENGAMAN 1: Hanya Ubah Data Jika Mode Fatality
function transformMDtoRate(aggData, periodType) {
    // KUNCI PERBAIKAN: Masukkan fatality_veh ke dalam whitelist
    if (currentMode !== 'fatality' && currentMode !== 'fatality_pop' && currentMode !== 'fatality_veh') return aggData; 

    const runkDataTanpa = { 2021: 39768, 2022: 39180, 2023: 38592, 2024: 38004, 2025: 37416, 2026: 39473, 2027: 41530 };
    let result = {};
    
    for (let key in aggData) {
        let actualMD = aggData[key];
        let year = parseInt(key.split('-')[0]);

        if (currentMode === 'fatality_pop') {
            // LOGIKA IFP (MD / Populasi * 100k)
            let pop = window.getFilteredDemography ? window.getFilteredDemography(year).pop : 0;
            if (pop > 0) result[key] = (actualMD / pop) * 100000;
            else result[key] = 0;
        } else if (currentMode === 'fatality_veh') {
            // LOGIKA IFK (MD / Kendaraan * 10k)
            let veh = window.getFilteredDemography ? window.getFilteredDemography(year).veh : 0;
            if (veh > 0) result[key] = (actualMD / veh) * 10000;
            else result[key] = 0;
        } else {
            // LOGIKA FR LAMA
            let targetTahunan = runkDataTanpa[year] || 39473;
            let targetPeriod = targetTahunan;
            if (periodType === 'quarter') targetPeriod = targetTahunan / 4;
            if (periodType === 'month') targetPeriod = targetTahunan / 12;

            if (actualMD > 0 && targetPeriod > 0) result[key] = ((actualMD - targetPeriod) / targetPeriod) * 100;
            else result[key] = 0; 
        }
    }
    return result;
}

function renderInteractiveCharts() {
    // --- A. CHART TAHUN ---
    let aggYearFull = aggregateData(rawTrendData).aggYear;    
    aggYearFull = transformMDtoRate(aggYearFull, 'year'); // <--- SUDAH DIGANTI JADI Rate
    const yearDataFinal = filterDataByKey(aggYearFull, activeChartFilter.year);
    updateChartInstance('year', yearDataFinal, 'chartYear');

    // --- B. CHART KUARTAL ---
    let qRaw = rawTrendData;
    if (activeChartFilter.year) {
        qRaw = rawTrendData.filter(r => new Date(r.tanggal).getFullYear() === activeChartFilter.year);
    }
    let aggQuarterFull = aggregateData(qRaw).aggQuarter;
    aggQuarterFull = transformMDtoRate(aggQuarterFull, 'quarter'); // <--- SUDAH DIGANTI JADI Rate
    
    let activeQKey = null;
    if (activeChartFilter.year && activeChartFilter.quarter) {
        activeQKey = `${activeChartFilter.year}-Q${activeChartFilter.quarter}`;
    }
    const quarterDataFinal = filterDataByKey(aggQuarterFull, activeQKey);
    updateChartInstance('quarter', quarterDataFinal, 'chartQuarter');

    // --- C. CHART BULAN ---
    let mRaw = qRaw; 
    if (activeChartFilter.quarter) {
        mRaw = mRaw.filter(r => {
            const m = new Date(r.tanggal).getMonth() + 1;
            return Math.ceil(m / 3) === activeChartFilter.quarter;
        });
    }
    let aggMonthFull = aggregateData(mRaw).aggMonth;
    aggMonthFull = transformMDtoRate(aggMonthFull, 'month'); // <--- SUDAH DIGANTI JADI Rate
    
    let activeMKey = null;
    if (activeChartFilter.year && activeChartFilter.month) {
        const mStr = activeChartFilter.month.toString().padStart(2, '0');
        activeMKey = `${activeChartFilter.year}-${mStr}`;
    }
    const monthDataFinal = filterDataByKey(aggMonthFull, activeMKey);
    updateChartInstance('month', monthDataFinal, 'chartMonth');
}

function updateChartInstance(type, aggData, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const keys = Object.keys(aggData).sort(); 
    
    if (keys.length === 0) {
        if (chartInstances[type]) chartInstances[type].destroy();
        return;
    }

    const dataValues = keys.map(k => aggData[k]);

    const labels = keys.map(k => {
        if (type === 'year') return k; 
        if (type === 'quarter') return k.split('-')[1]; 
        if (type === 'month') {
            const mIndex = parseInt(k.split('-')[1]) - 1;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            return monthNames[mIndex];
        }
    });

    let pctChange = [];
    if (keys.length > 1) {
        pctChange = dataValues.map((val, i) => {
            if (i === 0) return null;
            const prev = dataValues[i-1];
            if (prev === 0) return val;
            return ((val - prev) / prev) * 100;
        });
    } else {
        pctChange = [null]; 
    }

    const targetFatalityReduction = { 2020: -0.610, 2021: -0.540, 2022: -0.470, 2023: -0.400, 2024: -0.330, 2025: -0.260, 2026: -0.308, 2027: -0.356, 2028: -0.404, 2029: -0.452, 2030: -0.500 };
    
    // SAKLAR PENGAMAN 2: Pisahkan Pewarnaan Grafik
    const chartColors = dataValues.map((val, index) => {
        let yr = parseInt(keys[index].split('-')[0]);

        if (currentMode === 'fatality_pop') {
            let tIFP = targetIFP[yr] || 8.938;
            
            // Sesuaikan batas target jika grafik yang dilihat adalah Kuartal atau Bulan
            let tPeriod = tIFP;
            if (type === 'quarter') tPeriod = tIFP / 4;
            if (type === 'month') tPeriod = tIFP / 12;
            
            // Panggil klasifikasi warna global IFP
            if (typeof getIFPClassification === 'function') {
                return getIFPClassification(val, tPeriod).color;
            }
            return val <= tPeriod ? '#22c55e' : '#ef4444';
        }

        if (currentMode === 'fatality_veh') {
            let tIFK = typeof targetIFK !== 'undefined' ? targetIFK[yr] : 2.0;
            
            // Klasifikasi target dinamis per waktu
            let tPeriod = tIFK;
            if (type === 'quarter') tPeriod = tIFK / 4;
            if (type === 'month') tPeriod = tIFK / 12;
            
            if (typeof getIFKClassification === 'function') {
                return getIFKClassification(val, tPeriod).color;
            }
            return val <= tPeriod ? '#22c55e' : '#ef4444';
        }
        
        if (currentMode === 'fatality') {
            let tFR = (targetFatalityReduction[yr] || 0) * 100;
            if (typeof getFatalityClassification === 'function') {
                return getFatalityClassification(val, tFR).color; 
            }
            return val <= 0 ? '#22c55e' : '#ef4444'; 
        }
        
        if (currentMode === 'ketertiban') {
            // [PERBAIKAN]: Data 0% sekarang otomatis akan menjadi AMAN (Hijau)
            if (typeof getKetertibanClassification === 'function') {
                return getKetertibanClassification(val, 'national', type).color;
            }
            return '#8b5cf6'; 
        }

        if (currentMode === 'kelancaran') {
            if (typeof getKelancaranClassification === 'function') {
                return getKelancaranClassification(val).color;
            }
            return '#3b82f6'; 
        }

        // JIKA MODE KEAMANAN (LAKA/MACET)
        if (val === 0) return '#22c55e';
        return getRiskClassification(val, 'national', type).color;
    });

    if (chartInstances[type]) chartInstances[type].destroy();

    chartInstances[type] = new Chart(ctx, {
        data: {
            keys: keys, 
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    data: dataValues,
                    pctChange: pctChange, // Data YoY tetap disisipkan
                    backgroundColor: chartColors, 
                    order: 2,
                    maxBarThickness: 60, 
                },
                {
                    type: 'line',
                    data: dataValues,
                    borderColor: 'rgba(255, 215, 0, 1)', 
                }
            ]
        },
        options: {
            ...getCommonChartOptions(true),
            onClick: (e, elements, chart) => handleChartClick(e, elements, chart, type),
            layout: { padding: { left: 20, right: 20, top: 30 } }
        },
        plugins: [customLabelsPlugin, yearDividerPlugin]
    });
}

function handleChartClick(evt, elements, chart, type) {
    if (!elements || elements.length === 0) return;
    
    const index = elements[0].index;
    const clickedKey = chart.data.keys[index]; 

    let clickedYear = null, clickedQuarter = null, clickedMonth = null;
    if (type === 'year') {
        clickedYear = parseInt(clickedKey);
    } else if (type === 'quarter') {
        const [y, q] = clickedKey.split('-');
        clickedYear = parseInt(y);
        clickedQuarter = parseInt(q.replace('Q', ''));
    } else if (type === 'month') {
        const [y, m] = clickedKey.split('-');
        clickedYear = parseInt(y);
        clickedMonth = parseInt(m);
    }

    // 1. Tentukan apakah ini mematikan filter (Reset) atau menyalakan filter baru
    let isTurningOff = false;
    if (type === 'year') {
        if (activeChartFilter.year === clickedYear) { 
            activeChartFilter = { year: null, quarter: null, month: null }; 
            isTurningOff = true; 
        } else { 
            activeChartFilter = { year: clickedYear, quarter: null, month: null }; 
        }
    } else if (type === 'quarter') {
        if (activeChartFilter.year === clickedYear && activeChartFilter.quarter === clickedQuarter) { 
            activeChartFilter = { year: clickedYear, quarter: null, month: null }; 
            isTurningOff = true;
        } else { 
            activeChartFilter = { year: clickedYear, quarter: clickedQuarter, month: null }; 
        }
    } else if (type === 'month') {
        if (activeChartFilter.year === clickedYear && activeChartFilter.month === clickedMonth) { 
            activeChartFilter = { year: clickedYear, quarter: null, month: null }; 
            isTurningOff = true;
        } else { 
            activeChartFilter = { year: clickedYear, quarter: null, month: clickedMonth }; 
            activeChartFilter.quarter = Math.ceil(clickedMonth / 3); 
        }
    }

    // 2. SINKRONISASI PETA & SLIDER (Tanpa Loading Screen)
    const slider = document.getElementById('timeSlider');
    
    if (isTurningOff) {
        // [PERBAIKAN]: Jika filter grafik dimatikan, kembalikan tahun peta sesuai angka di SLIDER
        const currentSliderYear = slider ? slider.value.toString() : "2026";
        currentFilters.year = [currentSliderYear];
        
        document.getElementById('yearTrigger').innerText = currentSliderYear;
        resetDropdownUI('year', currentSliderYear);
    } else {
        // Jika menyalakan filter baru via grafik
        if (clickedYear) {
            currentFilters.year = [clickedYear.toString()];
            if (slider) {
                slider.value = clickedYear;
                document.getElementById('sliderValueDisplay').innerText = clickedYear;
                const badge = document.getElementById('timeBadge');
                if(badge) badge.innerText = clickedYear;
            }
            document.getElementById('yearTrigger').innerText = clickedYear;
            resetDropdownUI('year', clickedYear.toString());
        }
    }

    // 3. EKSEKUSI INSTAN (Tanpa setTimeout/Loader agar tidak ngelag visual)
    updateDashboardData();    // Update Peta
    renderInteractiveCharts(); // Update Grafik
}

function aggregateData(rawData) {
    let aggYear = {}; let aggQuarter = {}; let aggMonth = {};

    // [PERBAIKAN]: Set batas awal tahun berdasarkan modul yang aktif
    let minBound = 2018;
    if (window.currentDashboardModule === 'keselamatan') minBound = 2021;
    else if (window.currentDashboardModule === 'ketertiban') minBound = 2020;

    let minYear = minBound; 
    let maxYear = 2026; // <--- KUNCI PERBAIKAN: Kunci paksa batas maksimal tahun ke 2026

    if (rawData && rawData.length > 0) {
        let tempMin = Infinity; let tempMax = -Infinity; let foundValidYear = false;
        for (let i = 0; i < rawData.length; i++) {
            const y = new Date(rawData[i].tanggal).getFullYear();
            // [PERBAIKAN]: Abaikan baris data yang tahunnya lebih dari 2026 (Data Masa Depan)
            if (!isNaN(y) && y <= maxYear) { 
                if (y < tempMin) tempMin = y;
                if (y > tempMax) tempMax = y;
                foundValidYear = true;
            }
        }
        if (foundValidYear) { minYear = Math.max(minBound, tempMin); maxYear = tempMax; }
    }

    let isKet = window.currentDashboardModule === 'ketertiban';
    let isVCR = window.currentDashboardModule === 'kelancaran'; // [TAMBAHKAN INI]

    for (let y = minYear; y <= maxYear; y++) {
        // [PERBAIKAN]: Buat format {sum, count} untuk VCR agar bisa dirata-rata
        aggYear[y] = isKet ? { b: 0, t: 0 } : (isVCR ? { sum: 0, count: 0 } : 0);
        for (let q = 1; q <= 4; q++) aggQuarter[`${y}-Q${q}`] = isKet ? { b: 0, t: 0 } : (isVCR ? { sum: 0, count: 0 } : 0);
        for (let m = 1; m <= 12; m++) aggMonth[`${y}-${m.toString().padStart(2, '0')}`] = isKet ? { b: 0, t: 0 } : (isVCR ? { sum: 0, count: 0 } : 0);
    }

    for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        
        // [KUNCI KECEPATAN]: Gunakan Tahun dari Cache, bukan hitung 'new Date' lagi
        const y = item._year || new Date(item.tanggal).getFullYear(); 
        
        if (!isNaN(y) && y >= minBound && y <= maxYear) { 
            const m = new Date(item.tanggal).getMonth() + 1; 
            const q = Math.ceil(m / 3);
            let riskValue = 0;
            const rawVal = item.value_amount;

            // [KUNCI KECEPATAN]: ...
            if (window.currentDashboardModule === 'keselamatan') {
                if (isRowAllowedByFilter(item)) riskValue = rawVal; else riskValue = 0;
            } else if (window.currentDashboardModule === 'ketertiban') {
                if (isRowAllowedByFilter(item)) {
                    // Masukkan ke object (Berat dan Total)
                    if (aggYear[y]) { aggYear[y].b += rawVal; aggYear[y].t += item.total_pelanggaran; }
                    if (aggQuarter[`${y}-Q${q}`]) { aggQuarter[`${y}-Q${q}`].b += rawVal; aggQuarter[`${y}-Q${q}`].t += item.total_pelanggaran; }
                    if (aggMonth[`${y}-${m.toString().padStart(2, '0')}`]) { aggMonth[`${y}-${m.toString().padStart(2, '0')}`].b += rawVal; aggMonth[`${y}-${m.toString().padStart(2, '0')}`].t += item.total_pelanggaran; }
                }
                continue; // Lanjut ke iterasi berikutnya, tidak perlu hitung yang bawah
            } else // [PERBAIKAN]: Tambahkan rute untuk Kelancaran
            if (window.currentDashboardModule === 'kelancaran') {
                if (isRowAllowedByFilter(item)) {
                    if (aggYear[y]) { aggYear[y].sum += rawVal; aggYear[y].count++; }
                    if (aggQuarter[`${y}-Q${q}`]) { aggQuarter[`${y}-Q${q}`].sum += rawVal; aggQuarter[`${y}-Q${q}`].count++; }
                    if (aggMonth[`${y}-${m.toString().padStart(2, '0')}`]) { aggMonth[`${y}-${m.toString().padStart(2, '0')}`].sum += rawVal; aggMonth[`${y}-${m.toString().padStart(2, '0')}`].count++; }
                }
                continue;
            } else {
                // [KUNCI KECEPATAN]: Gunakan teks bersih dari Cache, tidak ada normalizeDbPolresName di sini!
                if (item._clean_polres) {
                    if (item._clean_polres.includes('DITLANTAS') || item._clean_polres.includes('PJR')) continue;
                    
                    let targetPoldaLabel = item._polda_label;

                    if (targetPoldaLabel) {
                        let uniqueKey = targetPoldaLabel + '_' + item._clean_polres;
                        let geoProps = geoPropertiesLookup[uniqueKey];

                        if (!geoProps && polresLookup[item._clean_polres]) {
                            // Fallback jika tidak ketemu
                            for (const altPolda of polresLookup[item._clean_polres]) {
                                const altKey = altPolda + '_' + item._clean_polres;
                                if (geoPropertiesLookup[altKey]) { geoProps = geoPropertiesLookup[altKey]; break; }
                            }
                        }

                        if (geoProps) {
                            if (currentMode === 'risk') riskValue = (rawVal / geoProps.len) * 100;
                            else riskValue = ((rawVal / geoProps.len) * 100) * Math.max(0, Math.log10(geoProps.dens));
                        }
                    }
                } 
            }
            
            if (aggYear[y] !== undefined) aggYear[y] += riskValue;
            if (aggQuarter[`${y}-Q${q}`] !== undefined) aggQuarter[`${y}-Q${q}`] += riskValue;
            if (aggMonth[`${y}-${m.toString().padStart(2, '0')}`] !== undefined) aggMonth[`${y}-${m.toString().padStart(2, '0')}`] += riskValue;
        }
    }
    if (isKet) {
        const demoCache = {};
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const currentQuarter = Math.ceil(currentMonth / 3);

        const calcIKKH = (obj, periodType) => { 
            let div = periodType === 'quarter' ? 4 : (periodType === 'month' ? 12 : 1);
            for(let k in obj) { 
                let year = parseInt(k.split('-')[0]);
                
                // [PERBAIKAN]: Cek apakah ini bulan/kuartal di masa depan
                let isFuture = false;
                if (year > currentYear) isFuture = true;
                else if (year === currentYear) {
                    if (periodType === 'month') {
                        let m = parseInt(k.split('-')[1]);
                        if (m > currentMonth) isFuture = true;
                    } else if (periodType === 'quarter') {
                        let q = parseInt(k.split('-')[1].replace('Q', ''));
                        if (q > currentQuarter) isFuture = true;
                    }
                }

                // Jika masa depan atau tidak ada pelanggaran sama sekali (0), biarkan 0
                if (isFuture || obj[k].t === 0) {
                    obj[k] = 0;
                    continue;
                }

                if (!demoCache[year]) {
                    demoCache[year] = window.getFilteredDemography(year);
                }
                let demo = demoCache[year];
                obj[k] = window.calculateIKKH(obj[k].b, obj[k].t, demo.drv, demo.veh, demo.len, demo.etle, div);
            } 
        };
        calcIKKH(aggYear, 'year'); calcIKKH(aggQuarter, 'quarter'); calcIKKH(aggMonth, 'month');
    }
    if (isVCR) {
        const trafficData = globalTrendCache.traffic || [];
        // Kumpulkan Troublespot ke obj
        trafficData.forEach(row => {
            let y = row._year; if (isNaN(y) || y < minBound || y > maxYear) return;
            let m = (new Date(row.tanggal).getMonth() + 1).toString(); let q = Math.ceil(m / 3);
            if (isRowAllowedByFilter(row)) {
                if (aggYear[y]) aggYear[y].ts = (aggYear[y].ts || 0) + row.value_amount;
                if (aggQuarter[`${y}-Q${q}`]) aggQuarter[`${y}-Q${q}`].ts = (aggQuarter[`${y}-Q${q}`].ts || 0) + row.value_amount;
                if (aggMonth[`${y}-${m.padStart(2, '0')}`]) aggMonth[`${y}-${m.padStart(2, '0')}`].ts = (aggMonth[`${y}-${m.padStart(2, '0')}`].ts || 0) + row.value_amount;
            }
        });

        // Eksekusi kalkulasi Rata-Rata VCR -> IKLL
        const calcIKLLChart = (obj) => { 
            let demo = window.getFilteredDemography(2026); // Gunakan infra konstan
            for(let k in obj) { 
                let avgVcr = obj[k].count > 0 ? (obj[k].sum / obj[k].count) : 0; 
                let ts = obj[k].ts || 0;
                // Jika data kosong, anggap tidak ada (jangan langsung di-100-kan agar chart tidak lompat)
                if (obj[k].count === 0 && ts === 0) { obj[k] = 0; continue; }
                obj[k] = window.calculateIKLL(avgVcr, demo.keramaian, ts, demo.apill, demo.len);
            } 
        };
        calcIKLLChart(aggYear); calcIKLLChart(aggQuarter); calcIKLLChart(aggMonth);
    }
    
    // [PERBAIKAN KUNCI]: Baris ini HARUS ADA di paling bawah fungsi aggregateData!
    return { aggYear, aggQuarter, aggMonth };
}

function filterDataByKey(aggData, keyToKeep) {
    if (!keyToKeep) return aggData; 
    if (aggData[keyToKeep] !== undefined) return { [keyToKeep]: aggData[keyToKeep] };
    return {}; 
}

// --- HELPER FILTER REGIONAL UNTUK GRAFIK (SUPER CEPAT) ---
function isRowAllowedByFilter(row) {
    // 1. Jika filter disetel ke "All", langsung lolos (0 milidetik)
    if (currentFilters.poldas.includes('All') && currentFilters.polres.includes('All')) return true;
    
    // 2. Ambil Kunci Identitas yang sudah kita siapkan di api.js
    const compKey = row._polda_label + '_' + row._clean_polres;
    
    // 3. Gunakan daftar Polres Aktif yang sudah dihitung oleh map.js (O(1) Lookup)
    if (window._activePolresKeys && window._activePolresKeys.length > 0) {
        return window._activePolresKeys.includes(compKey);
    }
    
    // 4. Jika hanya filter Polda yang aktif
    if (!currentFilters.poldas.includes('All')) {
        let poldaLabels = currentFilters.poldas.map(dbPolda => getPoldaLabelFromDbValue(dbPolda));
        return poldaLabels.includes(row._polda_label);
    }
    
    return false;
}

// ==========================================
// 4. CHART PLUGINS & OPTIONS KUSTOM
// ==========================================

const yearDividerPlugin = {
    id: 'yearDivider',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const xScale = scales.x;
        const keys = chart.config._config.data.keys; 

        if (!keys || keys.length === 0) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1; ctx.setLineDash([5, 5]); 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
        ctx.font = 'bold 14px "Fira Sans", sans-serif'; 
        ctx.textAlign = 'center';

        let currentYearStart = 0;
        let currentYearStr = keys[0].split('-')[0];

        for (let i = 1; i < keys.length; i++) {
            const yearStr = keys[i].split('-')[0];
            if (yearStr !== currentYearStr) {
                const xLine = (xScale.getPixelForValue(i) + xScale.getPixelForValue(i-1)) / 2;
                ctx.beginPath(); ctx.moveTo(xLine, chartArea.top); ctx.lineTo(xLine, chartArea.bottom); ctx.stroke();

                const xCenter = (xScale.getPixelForValue(currentYearStart) + xScale.getPixelForValue(i-1)) / 2;
                ctx.fillText(currentYearStr, xCenter, chartArea.top - 5);

                currentYearStr = yearStr;
                currentYearStart = i;
            }
        }
        const xCenterFinal = (xScale.getPixelForValue(currentYearStart) + xScale.getPixelForValue(keys.length - 1)) / 2;
        ctx.fillText(currentYearStr, xCenterFinal, chartArea.top - 5);
        ctx.restore();
    }
};

const customLabelsPlugin = {
    id: 'customLabels',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        ctx.save();
        
        const barDatasetMeta = chart.getDatasetMeta(0); 
        const isFatality = currentMode === 'fatality';

        barDatasetMeta.data.forEach((bar, index) => {
            const value = data.datasets[0].data[index];
            const pctChange = data.datasets[0].pctChange ? data.datasets[0].pctChange[index] : null;
            
            if (value === null || value === 0) return;

            const xPos = bar.x;
            
            // =========================================================
            // KECERDASAN SPASIAL Y-AXIS (ATAS / BAWAH)
            // =========================================================
            let yPos = 0;
            let arrowYPos = 0;

            if (value < 0) {
                // Jika minus (grafik ke bawah), letakkan teks DI BAWAH titik
                yPos = bar.y + 6; 
                arrowYPos = yPos + 16; // Panah pertumbuhan diletakkan di bawah teks
                ctx.textBaseline = 'top';
            } else {
                // Jika positif (grafik ke atas), letakkan teks DI ATAS titik
                yPos = bar.y - 6; 
                arrowYPos = yPos - 16; // Panah pertumbuhan diletakkan di atas teks
                ctx.textBaseline = 'bottom';
            }

            ctx.textAlign = 'center';
            ctx.font = 'bold 12px "Fira Sans", sans-serif'; 
            ctx.fillStyle = 'white';

            let textToPrint = isFatality ? value.toFixed(2) + '%' : value.toFixed(2);
            if(isFatality && value > 0) textToPrint = '+' + textToPrint; 
            ctx.fillText(textToPrint, xPos, yPos);

            // JIKA BUKAN KESELAMATAN: Tampilkan Segitiga Panah YoY Merah/Hijau
            if (!isFatality && pctChange !== null && pctChange !== undefined) {
                const isPositive = pctChange >= 0;
                // [PERBAIKAN]: Untuk IKKH & IKLL, skor naik itu Bagus (Hijau). Untuk Laka/Macet, naik itu Buruk (Merah).
                let color;
                if (currentMode === 'ketertiban' || currentMode === 'kelancaran') color = isPositive ? '#4ade80' : '#f87171';
                else color = isPositive ? '#f87171' : '#4ade80';
                
                ctx.fillStyle = color;
                const arrow = isPositive ? '▲' : '▼';
                const pctText = `${Math.abs(pctChange).toFixed(0)}%`;
                
                ctx.font = '10px sans-serif'; 
                const arrowWidth = ctx.measureText(arrow).width;
                ctx.font = 'bold 11px "Fira Sans", sans-serif'; 
                const textWidth = ctx.measureText(pctText).width;
                
                const gap = 2; 
                const totalWidth = arrowWidth + gap + textWidth;
                const startX = xPos - (totalWidth / 2);
                
                ctx.textAlign = 'left';
                ctx.font = '10px sans-serif';
                ctx.fillText(arrow, startX, arrowYPos);
                ctx.font = 'bold 11px "Fira Sans", sans-serif'; 
                ctx.fillText(pctText, startX + arrowWidth + gap, arrowYPos);
            }
        });
        ctx.restore();
    }
};

const getOrCreateTooltip = (chart) => {
    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-tooltip';
        tooltipEl.innerHTML = `<div class="tooltip-header"></div><div class="tooltip-body"></div>`;
        document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
};

const externalTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);

    if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; return; }

    if (tooltip.body) {
        const dataPoint = tooltip.dataPoints[0];
        const index = dataPoint.dataIndex;
        const barDataset = chart.data.datasets[0]; 
        
        const riskVal = dataPoint.raw || 0;
        const pctChange = barDataset.pctChange ? barDataset.pctChange[index] : null;

        let titlePrefix = "Risiko Terlibat Kecelakaan";
        if (currentMode === 'traffic') titlePrefix = "Risiko Terjebak Kemacetan";
        if (currentMode === 'fatality') titlePrefix = "Capaian Fatality Reduction";
        if (currentMode === 'fatality_pop') titlePrefix = "Indeks Fatalitas Populasi";

        let spotLabel = "Jumlah Titik Blackspot Aktif";
        if (currentMode === 'traffic') spotLabel = "Jumlah Titik Troublespot Aktif";
        if (currentMode === 'fatality') spotLabel = "Jumlah Kematian (MD)";
        if (currentMode === 'ketertiban') { titlePrefix = "Indeks Kinerja Ketertiban"; spotLabel = "Skor IKKH"; }
        // [TAMBAHKAN INI]: Judul untuk IKLL
        if (currentMode === 'kelancaran') { titlePrefix = "Indeks Kelancaran Lalu Lintas"; spotLabel = "Skor IKLL"; }

        const keys = chart.data.keys;
        const rawKey = keys ? keys[index] : '';
        let dateLabel = rawKey;

        if (rawKey.includes('-Q')) {
            const [y, q] = rawKey.split('-');
            dateLabel = `${q} ${y}`;
        } else if (rawKey.includes('-')) {
            const [y, m] = rawKey.split('-');
            const monthNames = [null, 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const mInt = parseInt(m);
            if (mInt >= 1 && mInt <= 12) dateLabel = `${monthNames[mInt]} ${y}`;
        }
        
        const titleHtml = `${titlePrefix} ${dateLabel}`;

        let trendHtml = '';
        // MUNCULKAN KEMBALI PANAH DI TOOLTIP HANYA JIKA BUKAN MODE KESELAMATAN
        if (currentMode !== 'fatality' && pctChange !== null && pctChange !== undefined) {
            const isUp = pctChange >= 0;
            
            // [PERBAIKAN 2]: Logika Warna Panah IKLL dan IKKH (Naik = Hijau)
            let color;
            if (currentMode === 'ketertiban' || currentMode === 'kelancaran') color = isUp ? '#22c55e' : '#ef4444';
            else color = isUp ? '#ef4444' : '#22c55e';
            
            const arrow = isUp ? '▲' : '▼'; 
            trendHtml = `<span style="color: ${color}; font-weight:800; margin-left:8px; font-size: 13px;">${arrow} ${Math.abs(pctChange).toFixed(0)}%</span>`;
        }

        const displayRisk = riskVal.toFixed(2);
        
        let row1 = ""; let row2 = ""; let row3 = "";

        // SAKLAR PENGAMAN 5: Konten Tooltip Tiga Mode Berbeda
        if (currentMode === 'fatality_pop') {
            let yr = parseInt(rawKey.split('-')[0]) || new Date().getFullYear();
            let tIFP = targetIFP[yr] || 8.938;
            let tPeriod = tIFP;
            if (rawKey.includes('-Q')) tPeriod = tIFP / 4;
            else if (rawKey.includes('-') && rawKey.split('-')[1].length === 2) tPeriod = tIFP / 12;

            let cColor = typeof getIFPClassification === 'function' ? getIFPClassification(riskVal, tPeriod).color : '#38bdf8';
            let rangeText = (riskVal % 1 === 0) ? riskVal : `${Math.floor(riskVal)} - ${Math.ceil(riskVal)}`;

            row1 = `<div style="margin-bottom:5px;">Nilai IFP: <b style="color:${cColor}; font-size:16px;">${displayRisk}</b></div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Mengindikasikan sekitar <b style="color: ${cColor}; font-size:14px;">${rangeText}</b> kematian per 100.000 penduduk akibat kecelakaan lalu lintas.</div>`;
            row3 = ``;
        } else if (currentMode === 'fatality_veh') {
            let yr = parseInt(rawKey.split('-')[0]) || new Date().getFullYear();
            let tIFK = typeof targetIFK !== 'undefined' ? targetIFK[yr] : 2.0;
            let tPeriod = rawKey.includes('-Q') ? tIFK / 4 : (rawKey.includes('-') && rawKey.split('-')[1].length === 2 ? tIFK / 12 : tIFK);
            let cColor = typeof getIFKClassification === 'function' ? getIFKClassification(riskVal, tPeriod).color : '#eab308';
            let rangeText = (riskVal % 1 === 0) ? riskVal : `${Math.floor(riskVal)} - ${Math.ceil(riskVal)}`;

            row1 = `<div style="margin-bottom:5px;">Nilai IFK: <b style="color:${cColor}; font-size:16px;">${displayRisk}</b></div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Mengindikasikan sekitar <b style="color: ${cColor}; font-size:14px;">${rangeText}</b> kematian per 10.000 kendaraan akibat kecelakaan lalu lintas.</div>`;
            row3 = ``;
        } else if (currentMode === 'fatality') {
            const sign = riskVal > 0 ? '+' : '';
            const cColor = riskVal > 0 ? '#ef4444' : '#22c55e';
            const word = riskVal > 0 ? 'lebih buruk' : 'lebih baik';
            
            row1 = `<div style="margin-bottom:5px;">Nilai FR: <b style="color:${cColor}; font-size:16px;">${sign}${displayRisk}%</b></div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Trend Nilai Fatality Reduction <b style="color: ${cColor}; font-size:14px;">${Math.abs(riskVal).toFixed(2)}% ${word}</b> dibandingkan proyeksi tanpa intervensi RUNK.</div>`;
        
        } else if (currentMode === 'ketertiban') {
            // [PERBAIKAN 3]: KONTEN TOOLTIP KHUSUS IKKH (Lengkap dengan Lencana Status)
            const period = rawKey.includes('-Q') ? 'quarter' : (rawKey.includes('-') && rawKey.split('-')[1].length === 2 ? 'month' : 'year');
            
            let dashScope = 'national';
            if (typeof currentFilters !== 'undefined') {
                if (currentFilters.polres[0] !== 'All') dashScope = 'polres';
                else if (currentFilters.poldas[0] !== 'All') dashScope = 'polda';
            }
            
            // Dapatkan warna dan label (Aman/Waspada/Rawan/Kritis) dari map.js
            let classObj = typeof getKetertibanClassification === 'function' ? getKetertibanClassification(riskVal, dashScope, period) : { color: '#8b5cf6', label: '' };
            let cColor = classObj.color;
            let statusLabel = classObj.label;

            row1 = `<div style="margin-bottom:5px;">Skor IKKH: <b style="color:${cColor}; font-size:16px;">${displayRisk}</b> <span style="font-size:10px; padding:2px 6px; background:${cColor}20; color:${cColor}; border-radius:4px; margin-left:5px; font-weight:bold;">${statusLabel}</span> ${trendHtml}</div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Skor evaluasi ketertiban lalu lintas. Angka mendekati 100 menunjukkan tingkat kepatuhan yang sangat baik.</div>`;
            row3 = ``;
            
        } else if (currentMode === 'kelancaran') {
            // [TAMBAHKAN KONTEN TOOLTIP KHUSUS IKLL]
            let classObj = typeof getKelancaranClassification === 'function' ? getKelancaranClassification(riskVal) : { color: '#3b82f6', label: '' };
            let cColor = classObj.color;
            let statusLabel = classObj.label;

            row1 = `<div style="margin-bottom:5px;">Skor IKLL: <b style="color:${cColor}; font-size:16px;">${displayRisk}</b> <span style="font-size:10px; padding:2px 6px; background:${cColor}20; color:${cColor}; border-radius:4px; margin-left:5px; font-weight:bold;">${statusLabel}</span> ${trendHtml}</div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Skor evaluasi kelancaran lalu lintas. Angka mendekati 100 menunjukkan tingkat kelancaran yang sangat ideal.</div>`;
            row3 = ``;

        } else if (currentMode === 'risk') {
            let rangeText = (riskVal % 1 === 0) ? riskVal : `${Math.floor(riskVal)} - ${Math.ceil(riskVal)}`;
            row1 = `<div style="margin-bottom:5px;">Indeks Risiko: <b style="color:#1e293b; font-size:16px;">${displayRisk}</b> <span style="font-size:10px; color:#64748b;">(per 100 km)</span> ${trendHtml}</div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Mengindikasikan <b style="color: #ef4444; font-size:14px;">${rangeText}</b> lokasi yang rentan terjadi kecelakaan setiap 100 km perjalanan.</div>`;
            const spotCount = (riskVal * 2).toFixed(0); 
            row3 = `<div style="margin-top:8px; color:#334155;">${spotLabel}: <b style="color: #ef4444; font-size:14px;">${spotCount}</b></div>`;
        } else {
            row1 = `<div style="margin-bottom:5px;">Indeks Risiko: <b style="color:#1e293b; font-size:16px;">${displayRisk}</b> <span style="font-size:10px; color:#64748b;">(per 100 km)</span> ${trendHtml}</div>`;
            row2 = `<div style="line-height:1.5; color:#334155;">Mengindikasikan Indeks Beban Kemacetan sebesar <b style="color: #f59e0b; font-size:14px;">${riskVal.toFixed(2)}</b>. Skor ini mencerminkan tingginya potensi penumpukan kendaraan.</div>`;
            const spotCount = (riskVal * 2).toFixed(0); 
            row3 = `<div style="margin-top:8px; color:#334155;">${spotLabel}: <b style="color: #ef4444; font-size:14px;">${spotCount}</b></div>`;
        }

        tooltipEl.querySelector('.tooltip-header').innerHTML = titleHtml;
        tooltipEl.querySelector('.tooltip-body').innerHTML = `${row1}${row2}${row3}`;
    }

    const position = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + window.scrollX + tooltip.caretX + 'px';
    tooltipEl.style.top = position.top + window.scrollY + tooltip.caretY + 'px';
};

function getCommonChartOptions(extraPadding = false) {
    // SAKLAR PENGAMAN 6: Sumbu Y Kiri
    let yLabel = 'Risiko Laka';
    if (currentMode === 'traffic') yLabel = 'Risiko Macet';
    if (currentMode === 'fatality') yLabel = '% Fatality Reduction'; 
    if (currentMode === 'fatality_pop' || currentMode === 'fatality_veh' || currentMode === 'ketertiban' || currentMode === 'kelancaran') yLabel = 'Nilai Indeks';

    return {
        animation: false, /* <--- TAMBAHKAN BARIS INI */
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false, external: externalTooltipHandler }
        },
        scales: {
            y: {
                beginAtZero: true,
                grace: extraPadding ? '20%' : '5%',
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { family: 'Fira Sans', size: 12 },
                    callback: function(value) { return currentMode === 'fatality' ? value.toFixed(0) + '%' : value.toFixed(2); }
                },
                title: { 
                    display: true, 
                    text: yLabel, 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    font: { family: 'Fira Sans', size: 14 } 
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'white', font: { family: 'Fira Sans', size: 13, weight: 'bold' } }
            }
        },
        layout: { padding: { top: 30 } }
    };
}

// --- TOOLTIP KUSTOM MODERN UNTUK GRAFIK FR ---
const externalFRTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    let tooltipEl = document.getElementById('chartjs-fr-tooltip');

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'chartjs-fr-tooltip';
        tooltipEl.innerHTML = `<div class="fr-tooltip-header"></div><div class="fr-tooltip-body"></div>`;
        document.body.appendChild(tooltipEl);
    }

    if (tooltip.opacity === 0) { tooltipEl.style.opacity = 0; return; }

    if (tooltip.body) {
        const yearStr = tooltip.title[0] || '';
        let bodyHtml = '';
        
        tooltip.dataPoints.forEach(dp => {
            const color = dp.dataset.borderColor;
            const label = dp.dataset.label;
            // Jika IFP atau IFK, paksakan 2 angka desimal. Jika FR, pakai ribuan
            const val = (currentMode === 'fatality_pop' || currentMode === 'fatality_veh') ? dp.raw.toFixed(2) : dp.raw.toLocaleString('id-ID');
            bodyHtml += `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:20px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="width:10px; height:10px; border-radius:50%; background-color:${color}; display:inline-block; box-shadow: 0 0 8px ${color};"></span>
                        <span style="color:#cbd5e1; font-size:12px; font-weight:500;">${label}</span>
                    </div>
                    <strong style="color:#ffffff; font-size:14px; letter-spacing:0.5px;">${val}</strong>
                </div>
            `;
        });

        tooltipEl.querySelector('.fr-tooltip-header').innerHTML = `<span style="color:#94a3b8; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Tahun Evaluasi</span><br/><strong style="font-size:18px; color:#38bdf8; letter-spacing: 1px;">${yearStr}</strong>`;
        tooltipEl.querySelector('.fr-tooltip-body').innerHTML = bodyHtml;
    }

    tooltipEl.classList.remove('fr-align-center', 'fr-align-left', 'fr-align-right');
    if (tooltip.caretX > chart.width - 150) { tooltipEl.classList.add('fr-align-right'); } 
    else if (tooltip.caretX < 150) { tooltipEl.classList.add('fr-align-left'); } 
    else { tooltipEl.classList.add('fr-align-center'); }

    const position = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + window.scrollX + tooltip.caretX + 'px';
    tooltipEl.style.top = position.top + window.scrollY + tooltip.caretY + 'px';
};

// --- FUNGSI CHART CAPAIAN FATALITY REDUCTION & IFP ---
let chartFRInstance = null;
function renderFRChart() {
    const ctxElem = document.getElementById('chartFR');
    if (!ctxElem) return; 

    const ctx = ctxElem.getContext('2d');
    if (chartFRInstance) chartFRInstance.destroy();

    const labels = ['2021', '2022', '2023', '2024', '2025', '2026'];
    const dataTanpa = [39768, 39180, 38592, 38004, 37416, 39473];
    const dataDengan = [18316, 20697, 23077, 25458, 27838, 27041];
    
    let dataAktual = [0, 0, 0, 0, 0, 0];
    const safeData = typeof rawTrendData !== 'undefined' ? rawTrendData : [];
    
    if (safeData.length > 0) {
        // FILTER DATA BERDASARKAN WILAYAH SEBELUM DIHITUNG!
        const regionalData = safeData.filter(row => isRowAllowedByFilter(row));

        labels.forEach((yrStr, idx) => {
            let yr = parseInt(yrStr);
            let sumYr = 0;
            for(let i=0; i<regionalData.length; i++) {
                if (new Date(regionalData[i].tanggal).getFullYear() === yr) {
                    sumYr += parseFloat(regionalData[i].value_amount || 0);
                }
            }
            dataAktual[idx] = sumYr;
        });
    }

    // =================================================================
    // PLUGIN TEXT LABEL DI ATAS GRAFIK (DIKEMBALIKAN & DISESUAIKAN)
    // =================================================================
    const drawDataLabelsPlugin = {
        id: 'drawDataLabels',
        afterDatasetsDraw(chart) {
            const { ctx, chartArea } = chart; 
            ctx.save();
            ctx.font = 'bold 11px "Fira Sans", sans-serif'; 
            
            const meta0 = chart.getDatasetMeta(0); 
            const meta1 = chart.getDatasetMeta(1); 
            const hasMeta2 = chart.data.datasets.length > 2;
            const meta2 = hasMeta2 ? chart.getDatasetMeta(2) : null; 
            
            for(let idx = 0; idx < chart.data.labels.length; idx++) {
                const val0 = chart.data.datasets[0].data[idx];
                const val1 = chart.data.datasets[1].data[idx];
                const val2 = hasMeta2 ? chart.data.datasets[2].data[idx] : 0;
                
                const p0 = meta0.data[idx];
                const p1 = meta1.data[idx];
                const p2 = hasMeta2 ? meta2.data[idx] : null;

                let pts = [];
                let isIFP = currentMode === 'fatality_pop';
                let isIFK = currentMode === 'fatality_veh';

                if (!meta0.hidden && val0 !== 0) pts.push({ val: val0, y: p0.y, x: p0.x, color: chart.data.datasets[0].borderColor, text: (isIFP || isIFK) ? val0.toFixed(2) : val0.toLocaleString('id-ID') });
                if (!meta1.hidden && val1 !== 0) pts.push({ val: val1, y: p1.y, x: p1.x, color: chart.data.datasets[1].borderColor, text: (isIFP || isIFK) ? val1.toFixed(2) : val1.toLocaleString('id-ID') });
                if (hasMeta2 && !meta2.hidden && val2 !== 0) pts.push({ val: val2, y: p2.y, x: p2.x, color: chart.data.datasets[2].borderColor, text: val2.toLocaleString('id-ID') });

                pts.sort((a, b) => a.y - b.y);

                if (pts.length === 3) {
                    pts[0].labelY = pts[0].y - 12; pts[1].labelY = pts[1].y; pts[2].labelY = pts[2].y + 12; 
                    if (pts[1].labelY - pts[0].labelY < 16) { let diff = 16 - (pts[1].labelY - pts[0].labelY); pts[0].labelY -= diff / 2; pts[1].labelY += diff / 2; }
                    if (pts[2].labelY - pts[1].labelY < 16) { let diff = 16 - (pts[2].labelY - pts[1].labelY); pts[1].labelY -= diff / 2; pts[2].labelY += diff / 2; }
                    if (pts[1].labelY - pts[0].labelY < 16) { pts[0].labelY -= (16 - (pts[1].labelY - pts[0].labelY)); }
                } else if (pts.length === 2) {
                    pts[0].labelY = pts[0].y - 12; pts[1].labelY = pts[1].y + 12;
                    if (pts[1].labelY - pts[0].labelY < 16) { let diff = 16 - (pts[1].labelY - pts[0].labelY); pts[0].labelY -= diff / 2; pts[1].labelY += diff / 2; }
                } else if (pts.length === 1) {
                    pts[0].labelY = pts[0].y - 15;
                }

                pts.forEach(pt => {
                    let textY = pt.labelY;
                    let tAlign = 'center';
                    
                    if (textY > chartArea.bottom - 10) textY = chartArea.bottom - 10; 
                    if (textY < chartArea.top + 10) textY = chartArea.top + 10;       
                    if (pt.x < chartArea.left + 25) tAlign = 'left';                  
                    if (pt.x > chartArea.right - 25) tAlign = 'right';                

                    ctx.textAlign = tAlign;
                    ctx.textBaseline = 'middle'; 
                    ctx.lineJoin = 'round';
                    ctx.miterLimit = 2;
                    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
                    ctx.lineWidth = 4.5;
                    ctx.strokeText(pt.text, pt.x, textY);
                    
                    ctx.fillStyle = pt.color;
                    ctx.fillText(pt.text, pt.x, textY);
                });
            }
            ctx.restore();
        }
    };

    // =================================================================
    // PEMISAHAN DATASET (IFP 2 GARIS vs FR 3 GARIS)
    // =================================================================
    let datasets = [];
    if (currentMode === 'fatality_pop') {
        let dataAktualIFP = []; let dataTargetIFP = [];
        labels.forEach((yrStr, idx) => {
            let yr = parseInt(yrStr);
            let popYr = window.getFilteredDemography ? window.getFilteredDemography(yr).pop : 0;
            let ifp = popYr > 0 ? (dataAktual[idx] / popYr) * 100000 : 0;
            dataAktualIFP.push(ifp);
            dataTargetIFP.push(targetIFP[yr] || 0);
        });

        datasets = [
            { label: 'Nilai IFP', data: dataAktualIFP, borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.2)', pointBackgroundColor: '#38bdf8', borderWidth: 3, fill: true, pointRadius: 5, tension: 0.3 },
            { label: 'Target IFP RUNK LLAJ', data: dataTargetIFP, borderColor: '#f87171', backgroundColor: 'transparent', pointBackgroundColor: '#f87171', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, tension: 0.3 }
        ];
    } else if (currentMode === 'fatality_veh') {
        let dataAktualIFK = []; let dataTargetIFK = [];
        labels.forEach((yrStr, idx) => {
            let yr = parseInt(yrStr);
            let vehYr = window.getFilteredDemography ? window.getFilteredDemography(yr).veh : 0;
            // Jika ada MD dan kendaraan, hitung aktualnya. Jika tidak 0.
            let ifk = vehYr > 0 ? (dataAktual[idx] / vehYr) * 10000 : 0;
            dataAktualIFK.push(ifk);
            dataTargetIFK.push(typeof targetIFK !== 'undefined' ? (targetIFK[yr] || 2.0) : 2.0);
        });

        datasets = [
            { label: 'Nilai IFK', data: dataAktualIFK, borderColor: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.2)', pointBackgroundColor: '#eab308', borderWidth: 3, fill: true, pointRadius: 5, tension: 0.3 },
            { label: 'Target IFK RUNK LLAJ', data: dataTargetIFK, borderColor: '#f87171', backgroundColor: 'transparent', pointBackgroundColor: '#f87171', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, tension: 0.3 }
        ];      
    } else {
        datasets = [
            { label: 'Meninggal Dunia', data: dataAktual, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.2)', pointBackgroundColor: '#22c55e', borderWidth: 2.5, fill: true, pointRadius: 4, pointHoverRadius: 7, tension: 0.3 },
            { label: 'Proyeksi Tanpa RUNK', data: dataTanpa, borderColor: '#f97316', backgroundColor: 'transparent', pointBackgroundColor: '#f97316', borderWidth: 2, borderDash: [5, 5], pointRadius: 3, pointHoverRadius: 6, tension: 0.3 },
            { label: 'Proyeksi Dengan RUNK', data: dataDengan, borderColor: '#38bdf8', backgroundColor: 'transparent', pointBackgroundColor: '#38bdf8', borderWidth: 2, borderDash: [5, 5], pointRadius: 3, pointHoverRadius: 6, tension: 0.3 }
        ];
    }

    chartFRInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            animation: false,
            responsive: true, maintainAspectRatio: false, 
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 35, right: 30, left: 10, bottom: 20 } },
            plugins: { 
                legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { family: 'Fira Sans', size: 11 }, usePointStyle: true, boxWidth: 8, padding: 20 } },
                tooltip: { enabled: false, external: externalFRTooltipHandler }
            },
            scales: {
                y: { beginAtZero: true, grace: '15%', ticks: { color: '#ffffff', font: { size: 10 }, stepSize: (currentMode === 'fatality_pop' || currentMode === 'fatality_veh') ? undefined : 10000, padding: 15 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#ffffff', font: { size: 10, weight: 'bold' } }, grid: { display: false } }
            }
        },
        plugins: [drawDataLabelsPlugin] 
    });
}