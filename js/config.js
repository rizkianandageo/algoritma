// ==========================================
// 1. KONSTANTA GLOBAL
// ==========================================
const BASE_URL = 'http://localhost:3000/api';

const SPECIAL_POLRES_NAMES = ['DITLANTAS', 'POLRES'];

// ==========================================
// TARGET INDEKS FATALITAS POPULASI (IFP)
// ==========================================
const targetIFP = {
    2020: 6.570, 2021: 7.162, 2022: 7.754, 2023: 8.346, 2024: 8.938, 
    2025: 9.530, 2026: 9.148, 2027: 8.766, 2028: 8.384, 2029: 8.002, 2030: 7.620
};

// ==========================================
// TARGET INDEKS FATALITAS KENDARAAN (IFK) - PER 10.000 KENDARAAN
// ==========================================
const targetIFK = {
    2021: 1.84, 2022: 1.72, 2023: 1.60, 2024: 1.48, 2025: 1.37, 
    2026: 1.29, 2027: 1.21, 2028: 1.14, 2029: 1.06, 2030: 0.98
};

// ==========================================
// 2. STATE GLOBAL (Penyimpanan Status)
// ==========================================
let currentFilters = { year: ['2026'], month: ['All'], poldas: ['All'], polres: ['All'] };
let isSystemReady = false; 
let isUserEntered = false; 
let currentMode = 'risk';
let rawPopulationData = []; // Penampung data populasi dari DB
let rawVehicleData = [];    // <--- TAMBAHKAN INI UNTUK DATA KENDARAAN
let rawDriverData = [];

// ==========================================
// 3. KAMUS & DATA STATIS (Dictionaries)
// ==========================================

// Mapping nama dari Database/User ke nama Standar GeoJSON
const poldaNameMapping = {
    "ACEH": "Polda Aceh", "POLDA ACEH": "Polda Aceh",
    "SUMUT": "Polda Sumatera Utara", "SUMATERA UTARA": "Polda Sumatera Utara", "POLDA SUMUT": "Polda Sumatera Utara",
    "SUMBAR": "Polda Sumatera Barat", "SUMATERA BARAT": "Polda Sumatera Barat", "POLDA SUMBAR": "Polda Sumatera Barat",
    "RIAU": "Polda Riau", "POLDA RIAU": "Polda Riau",
    "KEPRI": "Polda Kepulauan Riau", "KEPULAUAN RIAU": "Polda Kepulauan Riau", "POLDA KEPRI": "Polda Kepulauan Riau",
    "JAMBI": "Polda Jambi", "POLDA JAMBI": "Polda Jambi",
    "BENGKULU": "Polda Bengkulu", "POLDA BENGKULU": "Polda Bengkulu",
    "SUMSEL": "Polda Sumatera Selatan", "SUMATERA SELATAN": "Polda Sumatera Selatan", "POLDA SUMSEL": "Polda Sumatera Selatan",
    "BABEL": "Polda Kep. Bangka Belitung", "BANGKA BELITUNG": "Polda Kep. Bangka Belitung", "KEP. BANGKA BELITUNG": "Polda Kep. Bangka Belitung", "POLDA BABEL": "Polda Kep. Bangka Belitung",
    "KEPULAUAN BANGKA BELITUNG": "Polda Kep. Bangka Belitung", "POLDA KEPULAUAN BANGKA BELITUNG": "Polda Kep. Bangka Belitung",
    "LAMPUNG": "Polda Lampung", "POLDA LAMPUNG": "Polda Lampung",
    "METRO JAYA": "Polda Metro Jaya", "JAYA": "Polda Metro Jaya", "POLDA METRO JAYA": "Polda Metro Jaya",
    "BANTEN": "Polda Banten", "POLDA BANTEN": "Polda Banten",
    "JABAR": "Polda Jawa Barat", "JAWA BARAT": "Polda Jawa Barat", "POLDA JABAR": "Polda Jawa Barat",
    "JATENG": "Polda Jawa Tengah", "JAWA TENGAH": "Polda Jawa Tengah", "POLDA JATENG": "Polda Jawa Tengah",
    "DIY": "Polda D.I. Yogyakarta", "D.I. YOGYAKARTA": "Polda D.I. Yogyakarta", "YOGYAKARTA": "Polda D.I. Yogyakarta", "POLDA DIY": "Polda D.I. Yogyakarta", "DAERAH ISTIMEWA YOGYAKARTA": "Polda D.I. Yogyakarta", "POLDA DI YOGYAKARTA": "Polda D.I. Yogyakarta",
    "JATIM": "Polda Jawa Timur", "JAWA TIMUR": "Polda Jawa Timur", "POLDA JATIM": "Polda Jawa Timur",
    "BALI": "Polda Bali", "POLDA BALI": "Polda Bali",
    "NTB": "Polda Nusa Tenggara Barat", "NUSA TENGGARA BARAT": "Polda Nusa Tenggara Barat", "POLDA NTB": "Polda Nusa Tenggara Barat",
    "NTT": "Polda Nusa Tenggara Timur", "NUSA TENGGARA TIMUR": "Polda Nusa Tenggara Timur", "POLDA NTT": "Polda Nusa Tenggara Timur",
    "KALBAR": "Polda Kalimantan Barat", "KALIMANTAN BARAT": "Polda Kalimantan Barat", "POLDA KALBAR": "Polda Kalimantan Barat",
    "KALTENG": "Polda Kalimantan Tengah", "KALIMANTAN TENGAH": "Polda Kalimantan Tengah", "POLDA KALTENG": "Polda Kalimantan Tengah",
    "KALSEL": "Polda Kalimantan Selatan", "KALIMANTAN SELATAN": "Polda Kalimantan Selatan", "POLDA KALSEL": "Polda Kalimantan Selatan",
    "KALTIM": "Polda Kalimantan Timur", "KALIMANTAN TIMUR": "Polda Kalimantan Timur", "POLDA KALTIM": "Polda Kalimantan Timur",
    "KALTARA": "Polda Kalimantan Utara", "KALIMANTAN UTARA": "Polda Kalimantan Utara", "POLDA KALTARA": "Polda Kalimantan Utara",
    "SULUT": "Polda Sulawesi Utara", "SULAWESI UTARA": "Polda Sulawesi Utara", "POLDA SULUT": "Polda Sulawesi Utara",
    "GORONTALO": "Polda Gorontalo", "POLDA GORONTALO": "Polda Gorontalo",
    "SULTENG": "Polda Sulawesi Tengah", "SULAWESI TENGAH": "Polda Sulawesi Tengah", "POLDA SULTENG": "Polda Sulawesi Tengah",
    "SULBAR": "Polda Sulawesi Barat", "SULAWESI BARAT": "Polda Sulawesi Barat", "POLDA SULBAR": "Polda Sulawesi Barat",
    "SULSEL": "Polda Sulawesi Selatan", "SULAWESI SELATAN": "Polda Sulawesi Selatan", "POLDA SULSEL": "Polda Sulawesi Selatan",
    "SULTRA": "Polda Sulawesi Tenggara", "SULAWESI TENGGARA": "Polda Sulawesi Tenggara", "POLDA SULTRA": "Polda Sulawesi Tenggara",
    "MALUKU": "Polda Maluku", "POLDA MALUKU": "Polda Maluku",
    "MALUT": "Polda Maluku Utara", "MALUKU UTARA": "Polda Maluku Utara", "POLDA MALUT": "Polda Maluku Utara",
    "PAPUA BARAT": "Polda Papua Barat", "POLDA PAPUA BARAT": "Polda Papua Barat",
    "PAPUA BARAT DAYA": "Polda Papua Barat Daya", "POLDA PAPUA BARAT DAYA": "Polda Papua Barat Daya",
    "PAPUA TENGAH": "Polda Papua Tengah", "POLDA PAPUA TENGAH": "Polda Papua Tengah",
    "PAPUA": "Polda Papua", "POLDA PAPUA": "Polda Papua", "PAPUA INDUK": "Polda Papua"
};

// Mapping Manual (Kasus Khusus Pemekaran / Beda Penulisan di DB)
const manualNameMapping = {
    // Metro Jaya
    "POLRES METROPOLITAN DEPOK": "METRO DEPOK",
    "METROPOLITAN DEPOK": "METRO DEPOK",
    "POLRES METRO TANGERANG": "METRO TANGERANG KOTA", 
    "POLRES METRO TANGERANG KOTA": "METRO TANGERANG KOTA",
    "POLRES TANGERANG KOTA": "METRO TANGERANG KOTA",
    "POLRES METRO JAKARTA PUSAT": "METRO JAKARTA PUSAT",
    "POLRES METRO JAKARTA UTARA": "METRO JAKARTA UTARA",
    "POLRES METRO JAKARTA BARAT": "METRO JAKARTA BARAT",
    "POLRES METRO JAKARTA SELATAN": "METRO JAKARTA SELATAN",
    "POLRES METRO JAKARTA TIMUR": "METRO JAKARTA TIMUR",
    "POLRES METRO BEKASI": "METRO BEKASI",
    "POLRES METRO BEKASI KOTA": "METRO BEKASI KOTA",
    "POLRES KPPP TANJUNG PRIOK": "PELABUHAN TANJUNG PRIOK", 
    "POLRES PELABUHAN TANJUNG PRIOK": "PELABUHAN TANJUNG PRIOK",

    // Jawa Timur
    "POLRESTA MALANG KOTA": "MALANG", 
    "POLRES MALANG KOTA": "MALANG",
    "MALANG KOTA": "MALANG",
    "POLRES TULUNG AGUNG": "TULUNGAGUNG",
    "TULUNG AGUNG": "TULUNGAGUNG",

    // DIY
    "POLRES KULONPROGO": "KULON PROGO", 
    "POLRES GUNUNGKIDUL": "GUNUNG KIDUL",

    // Wilayah Lainnya
    "POLRES METRO": "METRO", // Lampung
    "POLRESTA PANGKAL PINANG": "PANGKAL PINANG", // Babel
    "POLRESTA P.AMBON DAN P.P. LEASE": "PULAU AMBON DAN PULAU-PULAU LEASE", // Maluku
    "P.AMBON DAN P.P. LEASE": "PULAU AMBON DAN PULAU-PULAU LEASE",
    "AMBON": "PULAU AMBON DAN PULAU-PULAU LEASE",
    "POLRES TALIABU": "PULAU TALIABU", // Maluku Utara
    "TALIABU": "PULAU TALIABU",
    "POLRES PULAU TALIABU": "PULAU TALIABU",
    "POLRES TANAH KARO": "KARO", // Sumut
    "TANAH KARO": "KARO",
    "POLRES LABUHAN BATU SELATAN": "LABUHANBATU SELATAN",
    "LABUHAN BATU SELATAN": "LABUHANBATU SELATAN",
    "POLRES LABUHAN BATU": "LABUHANBATU",
    "LABUHAN BATU": "LABUHANBATU",
    "POLRESTA TANJUNG PINANG": "TANJUNGPINANG", // Kepri
    "TANJUNG PINANG": "TANJUNGPINANG",
    "POLRES PASANG KAYU": "PASANGKAYU", // Sulbar
    "PASANG KAYU": "PASANGKAYU",

    // Pengecualian Khusus Non-Wilayah
    "DITLANTAS": "IGNORE_ME" 
};

// Konfigurasi File GeoJSON (Ditulis ke bawah agar rapi dan mudah diubah)
const poldaConfig = [
    { file: "Polres_Polda Aceh.geojson", label: "Polda Aceh" }, 
    { file: "Polres_Polda Sumut.geojson", label: "Polda Sumatera Utara" }, 
    { file: "Polres_Polda Sumbar.geojson", label: "Polda Sumatera Barat" }, 
    { file: "Polres_Polda Riau.geojson", label: "Polda Riau" }, 
    { file: "Polres_Polda Jambi.geojson", label: "Polda Jambi" }, 
    { file: "Polres_Polda Sumsel.geojson", label: "Polda Sumatera Selatan" }, 
    { file: "Polres_Polda Bengkulu.geojson", label: "Polda Bengkulu" }, 
    { file: "Polres_Polda Lampung.geojson", label: "Polda Lampung" }, 
    { file: "Polres_Polda Babel.geojson", label: "Polda Kep. Bangka Belitung" }, 
    { file: "Polres_Polda Kepri.geojson", label: "Polda Kepulauan Riau" }, 
    { file: "Polres_Polda Metro Jaya.geojson", label: "Polda Metro Jaya" }, 
    { file: "Polres_Polda Jabar.geojson", label: "Polda Jawa Barat" }, 
    { file: "Polres_Polda Jateng.geojson", label: "Polda Jawa Tengah" }, 
    { file: "Polres_Polda DIY.geojson", label: "Polda D.I. Yogyakarta" }, 
    { file: "Polres_Polda Jatim.geojson", label: "Polda Jawa Timur" }, 
    { file: "Polres_Polda Banten.geojson", label: "Polda Banten" }, 
    { file: "Polres_Polda Bali.geojson", label: "Polda Bali" }, 
    { file: "Polres_Polda NTB.geojson", label: "Polda Nusa Tenggara Barat" }, 
    { file: "Polres_Polda NTT.geojson", label: "Polda Nusa Tenggara Timur" }, 
    { file: "Polres_Polda Kalbar.geojson", label: "Polda Kalimantan Barat" }, 
    { file: "Polres_Polda Kalteng.geojson", label: "Polda Kalimantan Tengah" }, 
    { file: "Polres_Polda Kalsel.geojson", label: "Polda Kalimantan Selatan" }, 
    { file: "Polres_Polda Kaltim.geojson", label: "Polda Kalimantan Timur" }, 
    { file: "Polres_Polda Kaltara.geojson", label: "Polda Kalimantan Utara" }, 
    { file: "Polres_Polda Sulut.geojson", label: "Polda Sulawesi Utara" }, 
    { file: "Polres_Polda Sulteng.geojson", label: "Polda Sulawesi Tengah" }, 
    { file: "Polres_Polda Sulsel.geojson", label: "Polda Sulawesi Selatan" }, 
    { file: "Polres_Polda Sultra.geojson", label: "Polda Sulawesi Tenggara" }, 
    { file: "Polres_Polda Gorontalo.geojson", label: "Polda Gorontalo" }, 
    { file: "Polres_Polda Sulbar.geojson", label: "Polda Sulawesi Barat" }, 
    { file: "Polres_Polda Maluku.geojson", label: "Polda Maluku" }, 
    { file: "Polres_Polda Malut.geojson", label: "Polda Maluku Utara" }, 
    { file: "Polres_Polda Papua Barat.geojson", label: "Polda Papua Barat" }, 
    { file: "Polres_Polda Papua Barat Daya.geojson", label: "Polda Papua Barat Daya" }, 
    { file: "Polres_Polda Papua Tengah.geojson", label: "Polda Papua Tengah" }, 
    { file: "Polres_Polda Papua.geojson", label: "Polda Papua" }
];

// ==========================================
// 4. FUNGSI HELPER (Bantuan String & Objek)
// ==========================================

function normalizePolresName(name) {
    if (!name) return "";
    
    // 1. Bersihkan spasi ganda dan trim
    let clean = name.toUpperCase().trim().replace(/\s+/g, ' ');

    // 2. Cek Kamus Manual Dulu
    if (manualNameMapping[clean]) {
        return manualNameMapping[clean];
    }

    // 3. Pembersihan standar
    clean = clean
        .replace("KEPOLISIAN RESOR KOTA BESAR", "")
        .replace("KEPOLISIAN RESOR KOTA", "")
        .replace("KEPOLISIAN RESOR", "")
        .replace("POLRESTABES ", "")
        .replace("POLRESTA ", "")
        .replace("POLRES ", "")
        .replace(" KOTA", " KOTA"); // Pertahankan KOTA untuk membedakan Kab/Kota
    
    return clean.trim();
}

function normalizeDbPoldaName(dbName) {
    // 1. Abaikan data kosong atau yang bernama "POLDA -"
    if (!dbName || dbName.trim() === "-" || dbName.trim() === "POLDA -") return ""; 
    
    // 2. Bersihkan awalan "POLDA" agar mudah dicocokkan
    let name = dbName.replace("POLDA ", "").trim().toUpperCase();
    
    // Pastikan tidak ada sisa karakter "-" yang lolos
    if (name === "-") return "";

    // 3. Aturan Penggabungan (Merge) sesuai permintaan
    if (name === "JATENG") return "JAWA TENGAH";
    if (name.includes("BABEL") || name.includes("BANGKA")) return "KEP. BANGKA BELITUNG";
    if (name === "NTT") return "NUSA TENGGARA TIMUR";
    if (name === "SULBAR") return "SULAWESI BARAT";
    if (name === "SUMATRA UTARA" || name === "SUMUT") return "SUMATERA UTARA";
    
    // (Aturan bawaan sebelumnya yang sudah ada)
    if (name === "MALUT") return "MALUKU UTARA"; 
    if (name === "DIY" || name.includes("YOGYAKARTA")) return "D.I. YOGYAKARTA";
    
    return name;
}

function normalizeDbPolresName(rawPolres, rawPolda) {
    if (!rawPolres) return "";
    let polres = String(rawPolres).toUpperCase().replace(/\s+/g, ' ').trim();

    if (polres === "-" || polres === "" || polres === "POLRES" || polres === "POLRESTA" || polres === "POLRESTABES") return "";

    if (polres === "DITLANTAS" || polres === "DIT LANTAS") {
        if (!rawPolda || rawPolda.trim() === "") return ""; 
        let normPolda = normalizeDbPoldaName(rawPolda);
        if (!normPolda) return ""; 
        return "DITLANTAS POLDA " + normPolda;
    }

    // =======================================================
    // PEMISAHAN MUTLAK WILAYAH KEMBAR (KOTA VS KABUPATEN)
    // =======================================================
    if (polres === "KOTA BANDUNG" || polres === "POLRESTABES BANDUNG") return "POLRESTABES BANDUNG";
    if (polres === "BANDUNG" || polres === "KABUPATEN BANDUNG" || polres === "POLRESTA BANDUNG" || polres === "POLRES BANDUNG") return "POLRESTA BANDUNG";

    if (polres === "KOTA SEMARANG" || polres === "POLRESTABES SEMARANG") return "POLRESTABES SEMARANG";
    if (polres === "SEMARANG" || polres === "KABUPATEN SEMARANG" || polres === "POLRES SEMARANG") return "POLRES SEMARANG";

    if (polres === "KOTA MALANG" || polres === "POLRESTA MALANG KOTA" || polres === "POLRESTA MALANG") return "POLRESTA MALANG";
    if (polres === "MALANG" || polres === "KABUPATEN MALANG" || polres === "POLRES MALANG") return "POLRES MALANG";
    // =======================================================

    // (Standarisasi wilayah lain yang sebelumnya sudah ada)
    if (polres.includes("BAU-BAU") || polres === "POLRES BAUBAU") return "POLRES BAUBAU";
    if (polres.includes("FAK FAK") || polres === "POLRES FAKFAK") return "POLRES FAKFAK";
    if (polres.includes("SITARO") || polres.includes("TAGULANDANG") || polres.includes("TANGULANDANG")) return "POLRES SITARO";
    if (polres.includes("PULAU-PULAU ARU") || polres.includes("KEPULAUAN ARU")) return "POLRES KEPULAUAN ARU";
    if (polres.includes("PORES KEPULAUAN TANIMBAR") || polres.includes("POLRES KEPULAUAN TANIMBAR")) return "POLRES KEPULAUAN TANIMBAR";
    if (polres.includes("KUTAI KERTANEGARA") || polres.includes("KUTAI KARTANEGARA")) return "POLRES KUTAI KARTANEGARA";
    if (polres.includes("MAHAKAM HULU") || polres.includes("MAHAKAM ULU")) return "POLRES MAHAKAM ULU";
    if (polres.includes("METROPOLITAN DEPOK") || polres === "POLRES METRO DEPOK") return "POLRES METRO DEPOK";
    if (polres === "POLRES MOROTAI" || polres === "POLRES P. MOROTAI" || polres === "POLRES PULAU MOROTAI") return "POLRES PULAU MOROTAI";
    if (polres === "POLRES P. TALIABU" || polres === "POLRESTA TALIABU" || polres === "POLRES PULAU TALIABU") return "POLRES PULAU TALIABU";
    if (polres.includes("PANGKAJENE") || polres.includes("PANGKEP")) return "POLRES PANGKAJENE KEPULAUAN";
    if (polres === "PASANGKAYU" || polres === "POLRES PASANG KAYU" || polres === "POLRES PASANGKAYU") return "POLRES PASANGKAYU";
    if (polres === "POLRES SBD" || polres === "POLRES SUMBA BARAT DAYA") return "POLRES SUMBA BARAT DAYA";
    if (polres.includes("SIDENRENG RAPPANG") || polres.includes("SIDRAP")) return "POLRES SIDENRENG RAPPANG";
    if (polres.includes("TULANG BAWANG BARAT")) return "POLRES TULANG BAWANG BARAT";
    if (polres.includes("BALIKPAPAN") || (polres.includes("BERAU") && polres.includes("BALIKPAPAN"))) return "POLRESTA BALIKPAPAN";
    if (polres === "POLRES BERAU") return "POLRES BERAU"; 
    if (polres === "POLRESTA MAGELANG" || polres === "POLRES MAGELANG") return "POLRES MAGELANG";
    if (polres.includes("AMBON") || polres.includes("LEASE")) return "POLRESTA P.AMBON DAN P.P. LEASE";
    if (polres.includes("PANGKAL PINANG") || polres.includes("PANGKALPINANG")) return "POLRESTA PANGKALPINANG";
    if (polres.includes("TIDORE")) return "POLRESTA TIDORE KEPULAUAN";
    if (polres === "POLRES TANJUNG PINANG" || polres === "POLRESTA TANJUNG PINANG" || polres === "POLRES TANJUNGPINANG" || polres === "POLRESTA TANJUNGPINANG") return "POLRESTA TANJUNGPINANG";
    if (polres.includes("JAYAPURA KOTA")) return "POLRES JAYAPURA KOTA";
    if (polres.includes("BUKITTINGI") || polres.includes("BUKITTINGGI")) return "POLRES BUKITTINGGI";
    if (polres === "TIMOR TENGAH SELATAN" || polres === "POLRES TIMOR TENGAH SELATAN") return "POLRES TIMOR TENGAH SELATAN";
    if (polres.includes("HALMAHERA SELATAN")) return "POLRES HALMAHERA SELATAN";

    // =======================================================
    // PENYELARASAN NOMENKLATUR DATABASE VS GEOJSON (UPDATE BARU)
    // =======================================================
    if (polres === "POLRESTA PALOPO" || polres === "PALOPO" || polres === "POLRES PALOPO") return "POLRES PALOPO";
    if (polres === "POLRESTA PAREPARE" || polres === "PAREPARE" || polres === "POLRES PAREPARE" || polres === "POLRESTA PARE-PARE") return "POLRES PAREPARE";
    if (polres === "POLRES TANGGAMUS" || polres === "TANGGAMUS") return "POLRES TANGGAMUS";
    if (polres === "POLRES TANAH KARO" || polres === "TANAH KARO") return "POLRES KARO";
    if (polres === "POLRES LABUHAN BATU" || polres === "LABUHAN BATU") return "POLRES LABUHANBATU";
    if (polres === "POLRES LABUHAN BATU SELATAN" || polres === "LABUHAN BATU SELATAN") return "POLRES LABUHANBATU SELATAN";
    if (polres === "POLRES TOBA SAMOSIR" || polres === "TOBA SAMOSIR") return "POLRES TOBA";
    if (polres === "POLRES BATANG HARI" || polres === "BATANG HARI") return "POLRES BATANGHARI";
    if (polres === "POLRES METRO TANGERANG" || polres === "METRO TANGERANG") return "POLRES METRO TANGERANG KOTA";
    if (polres === "POLRESTA TANGERANG SELATAN" || polres === "TANGERANG SELATAN") return "POLRES TANGERANG SELATAN";
    if (polres === "POLRES KULONPROGO" || polres === "KULONPROGO") return "POLRES KULON PROGO";
    if (polres === "POLRES TULUNG AGUNG" || polres === "TULUNG AGUNG") return "POLRES TULUNGAGUNG";
    if (polres === "POLRESTA PONTIANAK KOTA" || polres === "PONTIANAK KOTA") return "POLRESTA PONTIANAK";
    if (polres === "POLRES TOLI-TOLI" || polres === "TOLI-TOLI") return "POLRES TOLITOLI";
    if (polres === "POLRES GORONTALO KOTA" || polres === "GORONTALO KOTA") return "POLRESTA GORONTALO KOTA";
    if (polres === "POLRES PULAU BURU" || polres === "PULAU BURU") return "POLRES BURU";
    
    // Opsional untuk memastikan Banyuasin dan Serang tidak meleset
    if (polres === "POLRES BANYU ASIN") return "POLRES BANYUASIN";

    return polres;
}

function getPoldaLabelFromDbValue(dbPoldaRaw) {
    if (!dbPoldaRaw) return null;
    let cleanDb = dbPoldaRaw.replace("POLDA ", "").trim().toUpperCase();
    if (poldaNameMapping[cleanDb]) return poldaNameMapping[cleanDb];
    if (poldaNameMapping["POLDA " + cleanDb]) return poldaNameMapping["POLDA " + cleanDb];
    const found = poldaConfig.find(c => c.label.toUpperCase().includes(cleanDb));
    return found ? found.label : null;
}

function generateCompositeKey(poldaLabel, polresName) {
    // KUNCI PERBAIKAN: Gunakan normalizeDbPolresName agar 
    // kata "POLRESTA" dan "POLRESTABES" tidak dibuang, sehingga ID-nya unik!
    return `${poldaLabel}_${normalizeDbPolresName(polresName, poldaLabel)}`;
}

function getProp(props, key) {
    if (!props) return null;
    if (props[key]) return props[key];
    if (props[key.toUpperCase()]) return props[key.toUpperCase()];
    if (props[key.toLowerCase()]) return props[key.toLowerCase()];
    return null;
}

// INI YANG BARU DITAMBAHKAN DARI MAP.JS KE SINI
function getPoldaLogoFilename(poldaLabel) {
    const map = {
        "Polda Aceh": "Polda_Aceh",
        "Polda Sumatera Utara": "Polda_Sumut",
        "Polda Sumatera Barat": "Polda_Sumbar",
        "Polda Riau": "Polda_Riau",
        "Polda Kepulauan Riau": "Polda_Kepri",
        "Polda Jambi": "Polda_Jambi", 
        "Polda Bengkulu": "Polda_Bengkulu",
        "Polda Sumatera Selatan": "Polda_Sumsel",
        "Polda Kep. Bangka Belitung": "Polda_Babel",
        "Polda Lampung": "Polda_Lampung",
        "Polda Metro Jaya": "Polda_Metro_Jaya",
        "Polda Banten": "Polda_Banten",
        "Polda Jawa Barat": "Polda_Jabar",
        "Polda Jawa Tengah": "Polda_Jateng",
        "Polda D.I. Yogyakarta": "Polda_DIY",
        "Polda Jawa Timur": "Polda_Jatim",
        "Polda Bali": "Polda_Bali",
        "Polda Nusa Tenggara Barat": "Polda_NTB",
        "Polda Nusa Tenggara Timur": "Polda_NTT",
        "Polda Kalimantan Barat": "Polda_Kalbar",
        "Polda Kalimantan Tengah": "Polda_Kalteng",
        "Polda Kalimantan Selatan": "Polda_Kalsel",
        "Polda Kalimantan Timur": "Polda_Kaltim",
        "Polda Kalimantan Utara": "Polda_Kaltara",
        "Polda Sulawesi Utara": "Polda_Sulut",
        "Polda Gorontalo": "Polda_Gorontalo",
        "Polda Sulawesi Tengah": "Polda_Sulteng",
        "Polda Sulawesi Barat": "Polda_Sulbar",
        "Polda Sulawesi Selatan": "Polda_Sulsel",
        "Polda Sulawesi Tenggara": "Polda_Sultra",
        "Polda Maluku": "Polda_Maluku",
        "Polda Maluku Utara": "Polda_Malut",
        "Polda Papua Barat": "Polda_Papua_Barat",
        "Polda Papua Barat Daya": "Polda_Papua_Barat_Daya",
        "Polda Papua Tengah": "Polda_Papua_Tengah",
        "Polda Papua": "Polda_Papua"
    };

    const filename = map[poldaLabel];
    // Kembalikan path lengkap, fallback ke korlantas jika tidak ada
    return filename ? `./assets/${filename}.png` : `./assets/korlantas25.png`;
}