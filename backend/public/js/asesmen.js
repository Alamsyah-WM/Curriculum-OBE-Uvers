// ASESMEN FUNCTIONS

let editAsesmenId = null;
let asesmenDataList = [];
let allMksForAsesmen = [];
let allCpmksForAsesmen = [];
let allSubCpmksForAsesmen = [];
let allAsesmenLogics = [];

async function loadProdiAsesmenSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Filter by user prodi jika bukan admin
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-asesmen-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        select.addEventListener('change', filterMkAsesmenByProdi);

        // Fetch seluruh data referensi filter untuk UI
        await Promise.all([
            fetchAllMksForAsesmen(),
            fetchAllCpmksForAsesmen(),
            fetchAllSubCpmksForAsesmen(),
            fetchAllAsesmenForLogic() // Untuk tau total bobot di SubCPMK
        ]);

        if (prodis.length === 1) {
             filterMkAsesmenByProdi();
        }
    } catch (error) {
        console.error('Error load Prodi Asesmen:', error);
    }
}

async function fetchAllMksForAsesmen() {
    try {
        const res = await fetch('/api/mk');
        allMksForAsesmen = await res.json();
    } catch (error) {
        console.error('Error load MK for Asesmen:', error);
    }
}

async function fetchAllCpmksForAsesmen() {
    try {
        const res = await fetch('/api/cpmk');
        allCpmksForAsesmen = await res.json();
    } catch (error) {
        console.error('Error load CPMK for Asesmen:', error);
    }
}

async function fetchAllSubCpmksForAsesmen() {
    try {
        const res = await fetch('/api/subcpmk');
        allSubCpmksForAsesmen = await res.json();
    } catch (error) {
        console.error('Error load SubCPMK for Asesmen:', error);
    }
}

async function fetchAllAsesmenForLogic() {
    try {
        const res = await fetch(`/api/asesmen?search=${encodeURIComponent(document.getElementById('search-asesmen') ? document.getElementById('search-asesmen').value : '')}`);
        allAsesmenLogics = await res.json();
    } catch (error) {
        console.error('Error load Asesmen for logic:', error);
    }
}

function filterMkAsesmenByProdi() {
    const selectedProdiId = document.getElementById('prodi-asesmen-select').value;
    const mkSelect = document.getElementById('mk-asesmen-select');
    const cpmkSelect = document.getElementById('cpmk-asesmen-select');
    const subcpmkSelect = document.getElementById('subcpmk-asesmen-select');

    cpmkSelect.innerHTML = '<option value="">Pilih CPMK</option>';
    subcpmkSelect.innerHTML = '<option value="">Pilih SubCPMK</option>';

    if (!selectedProdiId) {
        mkSelect.innerHTML = '<option value="">Pilih Mata Kuliah</option>';
        return;
    }

    const filteredMks = allMksForAsesmen.filter(m => m.prodi_id === selectedProdiId);
    
    mkSelect.innerHTML = '<option value="">Pilih Mata Kuliah</option>' + filteredMks.map(m =>
        `<option value="${m.mk_id}">${m.kode_mk} - ${m.nama_mk_id}</option>`
    ).join('');

    mkSelect.addEventListener('change', filterCpmkAsesmenByMk);
}

function filterCpmkAsesmenByMk() {
    const selectedMkId = document.getElementById('mk-asesmen-select').value;
    const cpmkSelect = document.getElementById('cpmk-asesmen-select');
    const subcpmkSelect = document.getElementById('subcpmk-asesmen-select');

    subcpmkSelect.innerHTML = '<option value="">Pilih SubCPMK</option>';

    if (!selectedMkId) {
        cpmkSelect.innerHTML = '<option value="">Pilih CPMK</option>';
        return;
    }

    const filteredCpmks = allCpmksForAsesmen.filter(c => c.mk_id === selectedMkId);
    
    cpmkSelect.innerHTML = '<option value="">Pilih CPMK</option>' + filteredCpmks.map(c =>
        `<option value="${c.cpmk_id}">${c.kode_cpmk}</option>`
    ).join('');

    cpmkSelect.addEventListener('change', filterSubCpmkAsesmenByCpmk);
}

function filterSubCpmkAsesmenByCpmk() {
    const selectedCpmkId = document.getElementById('cpmk-asesmen-select').value;
    const subcpmkSelect = document.getElementById('subcpmk-asesmen-select');

    if (!selectedCpmkId) {
        subcpmkSelect.innerHTML = '<option value="">Pilih SubCPMK</option>';
        return;
    }

    const filteredSubCpmks = allSubCpmksForAsesmen.filter(s => s.cpmk_id === selectedCpmkId);
    
    subcpmkSelect.innerHTML = '<option value="">Pilih SubCPMK</option>' + filteredSubCpmks.map(s => 
        `<option value="${s.subcpmk_id}">${s.kode_subcpmk}</option>`
    ).join('');
}


// Simpan Asesmen baru
async function saveAsesmen() {
    const subcpmkSelect = document.getElementById('subcpmk-asesmen-select');
    const subcpmkId = subcpmkSelect.value;
    const namaAsesmen = document.getElementById('nama-asesmen').value.trim();
    const deskripsi = document.getElementById('deskripsi-asesmen').value.trim();
    const bobotAsesmen = document.getElementById('bobot-asesmen').value.trim();
    const teknikPenilaian = document.getElementById('teknik-penilaian-asesmen').value;

    if (!subcpmkId || !namaAsesmen || !bobotAsesmen || !teknikPenilaian) {
        showStatus('asesmen-status', 'Nama, Bobot, Teknik Penilaian, dan hirarki pilihan (Prodi->MK->CPMK->SubCPMK) wajib diisi!', 'error');
        return;
    }

    const bobotFloat = parseFloat(bobotAsesmen);

    const data = {
        subcpmk_id: subcpmkId,
        nama_asesmen: namaAsesmen,
        deskripsi: deskripsi,
        bobot: bobotFloat,
        teknik_penilaian: teknikPenilaian
    };

    const method = editAsesmenId ? 'PUT' : 'POST';
    const url = editAsesmenId ? `/api/asesmen/${editAsesmenId}` : '/api/asesmen';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Gagal menyimpan Asesmen');
        }
        
        showStatus('asesmen-status', `${result.message}`, 'success');
        
        cancelEditAsesmen();
        
        // Refresh tabel dan update local state untuk filter bobot berikutnya
        await fetchAllAsesmenForLogic();
        filterSubCpmkAsesmenByCpmk(); // Rerender dropdown subcpmk utk pembaruan bobot sisa
        loadAsesmen();
    } catch (error) {
        showStatus('asesmen-status', error.message, 'error');
    }
}

// Load daftar Asesmen
async function loadAsesmen() {
    try {
        const res = await fetch(`/api/asesmen?search=${encodeURIComponent(document.getElementById('search-asesmen') ? document.getElementById('search-asesmen').value : '')}`);
        const data = await res.json();
        asesmenDataList = data;
        renderAsesmenTable(data);
    } catch (error) {
        console.error('Load Asesmen error:', error);
    }
}

// Render tabel Asesmen
function renderAsesmenTable(asesmenList) {
    if (asesmenList.length === 0) {
        document.getElementById('asesmen-list').innerHTML = '<p>Belum ada data Asesmen.</p>';
        return;
    }

    // Sort by prodi, mk, cpmk, subcpmk, lalu nama asesmen
    asesmenList.sort((a, b) => {
        if (a.nama_prodi !== b.nama_prodi) return a.nama_prodi.localeCompare(b.nama_prodi);
        if (a.nama_mk !== b.nama_mk) return a.nama_mk.localeCompare(b.nama_mk);
        if (a.kode_cpmk !== b.kode_cpmk) return a.kode_cpmk.localeCompare(b.kode_cpmk);
        if (a.kode_subcpmk !== b.kode_subcpmk) return a.kode_subcpmk.localeCompare(b.kode_subcpmk);
        return a.nama_asesmen.localeCompare(b.nama_asesmen);
    });

    document.getElementById('asesmen-list').innerHTML = `
        <table style="font-size: 13px;">
            <thead>
                <tr>
                    <th>Mata Kuliah</th>
                    <th>CPMK</th>
                    <th>SubCPMK</th>
                    <th>Nama Asesmen</th>
                    <th>Teknik Penilaian</th>
                    <th>Deskripsi</th>
                    <th>Bobot (%)</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${asesmenList.map(a => `
                    <tr>
                        <td>${a.nama_mk}</td>
                        <td>${a.kode_cpmk}</td>
                        <td>${a.kode_subcpmk}</td>
                        <td><strong>${a.nama_asesmen}</strong></td>
                        <td>${a.teknik_penilaian || '-'}</td>
                        <td>${a.deskripsi}</td>
                        <td>${a.bobot}</td>
                        <td>
                            <button onclick="editAsesmen('${a.asesmen_id}')">Edit</button>
                            <button class="danger" onclick="deleteAsesmen('${a.asesmen_id}')">Hapus</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Hapus Asesmen
async function deleteAsesmen(id) {
    if (!confirm('Yakin hapus Asesmen ini?')) return;

    try {
        const res = await fetch(`/api/asesmen/${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Gagal menghapus Asesmen');
        }
        
        showStatus('asesmen-status', result.message, 'success');
        
        // Refresh tabel dan update local state
        await fetchAllAsesmenForLogic(); 
        filterSubCpmkAsesmenByCpmk(); // Rerender dropdown utk pembaruan sisa bobot
        loadAsesmen();
    } catch (error) {
        showStatus('asesmen-status', error.message, 'error');
    }
}

function editAsesmen(id) {
    const a = asesmenDataList.find(x => x.asesmen_id === id);
    if (!a) return;
    editAsesmenId = id;
    
    let cpmk_id = null;
    const subObj = allSubCpmksForAsesmen.find(s => s.subcpmk_id === a.subcpmk_id);
    if (subObj) cpmk_id = subObj.cpmk_id;
    let mk_id = null;
    const cpmkObj = allCpmksForAsesmen.find(c => c.cpmk_id === cpmk_id);
    if (cpmkObj) mk_id = cpmkObj.mk_id;
    let prodi_id = null;
    const mkObj = allMksForAsesmen.find(m => m.mk_id === mk_id);
    if (mkObj) prodi_id = mkObj.prodi_id;
    
    document.getElementById('prodi-asesmen-select').value = prodi_id || '';
    filterMkAsesmenByProdi();
    document.getElementById('mk-asesmen-select').value = mk_id || '';
    filterCpmkAsesmenByMk();
    document.getElementById('cpmk-asesmen-select').value = cpmk_id || '';
    filterSubCpmkAsesmenByCpmk();
    document.getElementById('subcpmk-asesmen-select').value = a.subcpmk_id || '';
    
    document.getElementById('nama-asesmen').value = a.nama_asesmen || '';
    document.getElementById('deskripsi-asesmen').value = a.deskripsi || '';
    document.getElementById('bobot-asesmen').value = a.bobot || '';
    document.getElementById('teknik-penilaian-asesmen').value = a.teknik_penilaian || '';
    
    const btn = document.querySelector('#asesmen-section button[onclick="saveAsesmen()"]');
    if (btn) btn.innerText = "Update Asesmen";
    
    if (!document.getElementById('btn-batal-asesmen')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-asesmen';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditAsesmen;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditAsesmen() {
    editAsesmenId = null;
    document.getElementById('nama-asesmen').value = '';
    document.getElementById('deskripsi-asesmen').value = '';
    document.getElementById('bobot-asesmen').value = '';
    document.getElementById('teknik-penilaian-asesmen').value = '';
    
    const btn = document.querySelector('#asesmen-section button[onclick="saveAsesmen()"]');
    if (btn) btn.innerText = "Tambah Asesmen";
    const batalBtn = document.getElementById('btn-batal-asesmen');
    if (batalBtn) batalBtn.remove();
}
