// INPUT NILAI ASESMEN FUNCTIONS

let allMahasiswasNilai = [];
let allMksNilai = [];
let allCpmksNilai = [];
let allSubCpmksNilai = [];
let allAsesmenNilai = [];
let currentNilaiHistory = [];

async function loadProdiNilaiSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Filter prodi berdasarkan user login jika bukan admin
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-nilai-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        await Promise.all([
            fetchAllMahasiswaNilai(),
            fetchAllMkNilai(),
            fetchAllCpmkNilai(),
            fetchAllSubCpmkNilai(),
            fetchAllAsesmenNilai()
        ]);

        if (window.autoSelectNilai && window.autoSelectNilai.prodiId) {
            select.value = window.autoSelectNilai.prodiId;
            onProdiNilaiChange();
            
            const mhsSelect = document.getElementById('mahasiswa-nilai-select');
            mhsSelect.value = window.autoSelectNilai.mahasiswaId;
            onMahasiswaNilaiChange();

            // Clear the auto-select config after using it
            window.autoSelectNilai = null;
        } else if (prodis.length === 1) {
            onProdiNilaiChange();
        }

        select.addEventListener('change', onProdiNilaiChange);
        document.getElementById('mahasiswa-nilai-select').addEventListener('change', onMahasiswaNilaiChange);


    } catch (error) {
        console.error('Error load Prodi Nilai:', error);
    }
}

async function fetchAllMahasiswaNilai() {
    try { const res = await fetch('/api/mahasiswa'); allMahasiswasNilai = await res.json(); } catch (e) { console.error(e); }
}
async function fetchAllMkNilai() {
    try { const res = await fetch('/api/mk'); allMksNilai = await res.json(); } catch (e) { console.error(e); }
}
async function fetchAllCpmkNilai() {
    try { const res = await fetch('/api/cpmk'); allCpmksNilai = await res.json(); } catch (e) { console.error(e); }
}
async function fetchAllSubCpmkNilai() {
    try { const res = await fetch('/api/subcpmk'); allSubCpmksNilai = await res.json(); } catch (e) { console.error(e); }
}
async function fetchAllAsesmenNilai() {
    try { const res = await fetch('/api/asesmen'); allAsesmenNilai = await res.json(); } catch (e) { console.error(e); }
}

function onProdiNilaiChange() {
    const prodiId = document.getElementById('prodi-nilai-select').value;
    const mhsSelect = document.getElementById('mahasiswa-nilai-select');
    
    resetNilaiDropdowns('mhs');

    if (!prodiId) return;

    const filteredMhs = allMahasiswasNilai.filter(m => m.prodi_id === prodiId);
    mhsSelect.innerHTML = '<option value="">Pilih Mahasiswa</option>' + filteredMhs.map(m =>
        `<option value="${m.mahasiswa_id}">${m.nim} - ${m.nama}</option>`
    ).join('');
}

async function onMahasiswaNilaiChange() {
    const mhsId = document.getElementById('mahasiswa-nilai-select').value;
    const cardsContainer = document.getElementById('matakuliah-cards-container');
    
    if (!mhsId) {
        cardsContainer.innerHTML = '';
        document.getElementById('nilai-list').innerHTML = '';
        return;
    }

    // Refresh history nilai untuk mahasiswa ini (wajib ditunggu agar existingNilai ada)
    await loadNilaiHistory(mhsId);

    // Cari MK apa saja yang mahasiswa ini ambil
    const mhsData = allMahasiswasNilai.find(m => m.mahasiswa_id === mhsId);
    const takenMkIds = mhsData && mhsData.mk_ids ? mhsData.mk_ids : [];

    if (takenMkIds.length === 0) {
        cardsContainer.innerHTML = '<p style="color:#7f8c8d;">Mahasiswa belum mengambil KRS atau Matakuliah.</p>';
        return;
    }

    const activeRole = window.currentUser?.active_role;
    const dosenId = window.currentUser?.dosen_id;

    let filteredMks = allMksNilai.filter(mk => takenMkIds.includes(mk.mk_id));
    
    // RESTRICTION: Dosen hanya menilai mata kuliah yang diampunya
    if (activeRole === 'dosen' && dosenId) {
        filteredMks = filteredMks.filter(mk => mk.dosen_id === dosenId);
    }
    
    if (filteredMks.length === 0) {
        cardsContainer.innerHTML = '<p style="color:#7f8c8d;">Anda tidak memiliki akses untuk menilai mata kuliah yang diambil mahasiswa ini.</p>';
        return;
    }

    let html = '';

    filteredMks.forEach(mk => {
        const cpmks = allCpmksNilai.filter(c => c.mk_id === mk.mk_id);
        
        let asesmenHtml = '';
        let hasAsesmen = false;

        cpmks.forEach(cpmk => {
            const subcpmks = allSubCpmksNilai.filter(s => s.cpmk_id === cpmk.cpmk_id);
            subcpmks.forEach(subcpmk => {
                const asesmens = allAsesmenNilai.filter(a => a.subcpmk_id === subcpmk.subcpmk_id);
                asesmens.forEach(a => {
                    hasAsesmen = true;
                    // Find existing score
                    const existingNilai = currentNilaiHistory.find(n => n.asesmen_id === a.asesmen_id);
                    const val = existingNilai ? existingNilai.nilai : '';

                    asesmenHtml += `
                        <div style="background: #fff; padding: 12px; border: 1px solid #ddd; border-radius: 6px;">
                            <div style="font-size: 13px; color: #7f8c8d; margin-bottom: 5px;">CPMK: ${cpmk.kode_cpmk} | SubCPMK: ${subcpmk.kode_subcpmk}</div>
                            <div style="font-weight: bold; margin-bottom: 8px;">${a.nama_asesmen} (Bobot ${a.bobot}%)</div>
                            <input type="number" step="0.01" min="0" max="100" placeholder="Nilai (0-100)" 
                                class="asesmen-input-field-${mk.mk_id}" 
                                data-cpmk-id="${cpmk.cpmk_id}"
                                data-subcpmk-id="${subcpmk.subcpmk_id}"
                                data-asesmen-id="${a.asesmen_id}"
                                value="${val}" 
                                style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                    `;
                });
            });
        });

        if (!hasAsesmen) {
            asesmenHtml = '<p style="color:#e74c3c; grid-column: 1 / -1; margin:0;">Mata kuliah ini belum memiliki Asesmen yang lengkap disetel.</p>';
        } else {
            asesmenHtml += `
                <div style="grid-column: 1 / -1; margin-top: 15px;">
                    <button onclick="saveNilaiMk('${mk.mk_id}')" style="width: 100%; background: #2980b9;">Simpan Nilai Mata Kuliah Ini</button>
                </div>
            `;
        }

        html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e1e8ed; margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #2c3e50;">
                    ${mk.kode_mk} - ${mk.nama_mk_id}
                </h3>
                <div id="asesmen-mk-${mk.mk_id}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    ${asesmenHtml}
                </div>
            </div>
        `;
    });

    cardsContainer.innerHTML = html;
}

// Utilitas untuk mereset dropdown yang ada di bawah
function resetNilaiDropdowns(level) {
    if (level === 'mhs') {
        document.getElementById('mahasiswa-nilai-select').innerHTML = '<option value="">Pilih Mahasiswa</option>';
        document.getElementById('matakuliah-cards-container').innerHTML = '';
        document.getElementById('nilai-list').innerHTML = '';
    }
}

// Simpan data nilai per Mata Kuliah ke database
async function saveNilaiMk(mkId) {
    const mhsId = document.getElementById('mahasiswa-nilai-select').value;
    if (!mhsId) return;

    const inputFields = document.querySelectorAll('.asesmen-input-field-' + mkId);
    const payloads = [];
    let hasError = false;

    inputFields.forEach(input => {
        const valTxt = input.value.trim();
        if (valTxt !== '') {
            const nilaiNum = parseFloat(valTxt);
            if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
                hasError = true;
            } else {
                payloads.push({
                    mahasiswa_id: mhsId,
                    mk_id: mkId,
                    cpmk_id: input.getAttribute('data-cpmk-id'),
                    subcpmk_id: input.getAttribute('data-subcpmk-id'),
                    asesmen_id: input.getAttribute('data-asesmen-id'),
                    nilai: nilaiNum
                });
            }
        }
    });

    if (hasError) {
        showStatus('nilai-status', 'Ada nilai yang formatnya tidak valid (harus angka 0 - 100).', 'error');
        return;
    }

    if (payloads.length === 0) {
        showStatus('nilai-status', 'Tidak ada nilai yang diisi untuk matakuliah ini.', 'error');
        return;
    }

    try {
        await Promise.all(payloads.map(payload => 
            fetch('/api/nilai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        ));
        
        showStatus('nilai-status', 'Nilai untuk matakuliah ini berhasil disimpan!', 'success');
        
        // Refresh tabel rekap nilai
        loadNilaiHistory(mhsId);

    } catch (error) {
        showStatus('nilai-status', error.message, 'error');
    }
}

// Ambil riwayat nilai mahasiswa
async function loadNilaiHistory(mhsId) {
    try {
        const res = await fetch(`/api/nilai/${mhsId}`);
        currentNilaiHistory = await res.json();
        renderNilaiTable();
    } catch (error) {
        console.error('Error fetching data nilai:', error);
    }
}

function renderNilaiTable() {
    const listContainer = document.getElementById('nilai-list');

    if (currentNilaiHistory.length === 0) {
        listContainer.innerHTML = '<p>Belum ada nilai asesmen untuk mahasiswa ini.</p>';
        return;
    }

    const searchInput = document.getElementById('search-nilai');
    const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

    const activeRole = window.currentUser?.active_role;
    const dosenId = window.currentUser?.dosen_id;

    // RESTRICTION: Dosen hanya melihat riwayat nilai dari mata kuliahnya
    let allowedHistory = currentNilaiHistory;
    if (activeRole === 'dosen' && dosenId) {
        // Ambil mk_id yang diajar oleh dosen ini
        const mkIdsDosen = allMksNilai.filter(mk => mk.dosen_id === dosenId).map(mk => mk.mk_id);
        allowedHistory = currentNilaiHistory.filter(n => mkIdsDosen.includes(n.mk_id));
    }

    let filteredData = allowedHistory;
    if (searchVal) {
        filteredData = allowedHistory.filter(n => 
            (n.kode_mk && n.kode_mk.toLowerCase().includes(searchVal)) ||
            (n.kode_cpmk && n.kode_cpmk.toLowerCase().includes(searchVal)) ||
            (n.kode_subcpmk && n.kode_subcpmk.toLowerCase().includes(searchVal)) ||
            (n.nama_asesmen && n.nama_asesmen.toLowerCase().includes(searchVal))
        );
    }

    // Sort by MK, then CPMK, SubCPMK, Asesmen
    const sortedData = [...filteredData].sort((a,b) => {
        if(a.kode_mk !== b.kode_mk) return a.kode_mk.localeCompare(b.kode_mk);
        if(a.kode_subcpmk !== b.kode_subcpmk) return a.kode_subcpmk.localeCompare(b.kode_subcpmk);
        return a.nama_asesmen.localeCompare(b.nama_asesmen);
    });

    listContainer.innerHTML = `
        <table style="font-size:14px; margin-top: 10px;">
            <thead>
                <tr>
                    <th>Mata Kuliah</th>
                    <th>SubCPMK</th>
                    <th>Nama Asesmen</th>
                    <th>Nilai (0-100)</th>
                </tr>
            </thead>
            <tbody>
                ${sortedData.map(n => `
                    <tr>
                        <td>${n.kode_mk} - ${n.nama_mk}</td>
                        <td>${n.kode_subcpmk}</td>
                        <td>${n.nama_asesmen}</td>
                        <td style="font-weight: bold; color: ${n.nilai >= 60 ? '#27ae60' : '#e74c3c'}">${n.nilai}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
