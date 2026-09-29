// SUBCPMK FUNCTIONS

let editSubCpmkId = null;
let subcpmkDataList = [];
let allMksForSubCpmk = [];
let allCpmksForSubCpmk = [];
let allSubCpmks = [];

async function loadProdiSubCpmkSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Jika user punya prodi_id (bukan admin)
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-subcpmk-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        select.addEventListener('change', filterMkSubCpmkByProdi);

        // Fetch semua MK, CPMK dan SubCPMK sekaligus agar filtering cepat
        await Promise.all([
            fetchAllMksForSubCpmk(),
            fetchAllCpmksForSubCpmk(),
            fetchAllSubCpmksForLogic() // Untuk tau total bobot saat live calculation
        ]);

        if (prodis.length === 1) {
             filterMkSubCpmkByProdi();
        }
    } catch (error) {
        console.error('Error load Prodi SubCPMK:', error);
    }
}

async function fetchAllMksForSubCpmk() {
    try {
        const res = await fetch('/api/mk');
        allMksForSubCpmk = await res.json();
    } catch (error) {
        console.error('Error load MK for SubCPMK:', error);
    }
}

async function fetchAllCpmksForSubCpmk() {
    try {
        const res = await fetch('/api/cpmk');
        allCpmksForSubCpmk = await res.json();
    } catch (error) {
        console.error('Error load CPMK for SubCPMK:', error);
    }
}

async function fetchAllSubCpmksForLogic() {
    try {
        const res = await fetch(`/api/subcpmk?search=${encodeURIComponent(document.getElementById('search-subcpmk') ? document.getElementById('search-subcpmk').value : '')}`);
        allSubCpmks = await res.json();
    } catch (error) {
        console.error('Error load SubCPMK for calculating weight:', error);
    }
}

function filterMkSubCpmkByProdi() {
    const selectedProdiId = document.getElementById('prodi-subcpmk-select').value;
    const mkSelect = document.getElementById('mk-subcpmk-select');
    const cpmkSelect = document.getElementById('cpmk-subcpmk-select');

    cpmkSelect.innerHTML = '<option value="">Pilih CPMK</option>'; // Reset CPMK

    if (!selectedProdiId) {
        mkSelect.innerHTML = '<option value="">Pilih Mata Kuliah</option>';
        return;
    }

    const filteredMks = allMksForSubCpmk.filter(m => m.prodi_id === selectedProdiId);
    
    mkSelect.innerHTML = '<option value="">Pilih Mata Kuliah</option>' + filteredMks.map(m =>
        `<option value="${m.mk_id}">${m.kode_mk} - ${m.nama_mk_id}</option>`
    ).join('');

    mkSelect.addEventListener('change', filterCpmkByMk);
}

function filterCpmkByMk() {
    const selectedMkId = document.getElementById('mk-subcpmk-select').value;
    const cpmkSelect = document.getElementById('cpmk-subcpmk-select');

    if (!selectedMkId) {
        cpmkSelect.innerHTML = '<option value="">Pilih CPMK</option>';
        return;
    }

    const filteredCpmks = allCpmksForSubCpmk.filter(c => c.mk_id === selectedMkId);
    
    cpmkSelect.innerHTML = '<option value="">Pilih CPMK</option>' + filteredCpmks.map(c => 
        `<option value="${c.cpmk_id}">${c.kode_cpmk}</option>`
    ).join('');
}


async function saveSubCpmk() {
    const cpmkSelect = document.getElementById('cpmk-subcpmk-select');
    const cpmkId = cpmkSelect.value;
    const kodeSubCpmk = document.getElementById('kode-subcpmk').value.trim();
    const deskripsi = document.getElementById('deskripsi-subcpmk').value.trim();

    if (!cpmkId || !kodeSubCpmk || !deskripsi) {
        showStatus('subcpmk-status', 'Semua field wajib diisi!', 'error');
        return;
    }

    const data = {
        cpmk_id: cpmkId,
        kode_subcpmk: kodeSubCpmk,
        deskripsi: deskripsi
    };

    const method = editSubCpmkId ? 'PUT' : 'POST';
    const url = editSubCpmkId ? `/api/subcpmk/${editSubCpmkId}` : '/api/subcpmk';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Gagal menyimpan SubCPMK');
        }
        
        showStatus('subcpmk-status', `${result.message}`, 'success');
        
        cancelEditSubCpmk();
        
        // Refresh tabel dan update local state untuk filter bobot berikutnya
        await fetchAllSubCpmksForLogic();
        filterCpmkByMk(); // Rerender dropdown cpmk utk update sisa bobot terbarunya
        loadSubCpmk();
    } catch (error) {
        showStatus('subcpmk-status', error.message, 'error');
    }
}

// Load daftar SubCPMK
async function loadSubCpmk() {
    try {
        const res = await fetch(`/api/subcpmk?search=${encodeURIComponent(document.getElementById('search-subcpmk') ? document.getElementById('search-subcpmk').value : '')}`);
        const data = await res.json();
        subcpmkDataList = data;
        renderSubCpmkTable(data);
    } catch (error) {
        console.error('Load SubCPMK error:', error);
    }
}

// Render tabel SubCPMK
function renderSubCpmkTable(subcpmks) {
    if (subcpmks.length === 0) {
        document.getElementById('subcpmk-list').innerHTML = '<p>Belum ada data SubCPMK.</p>';
        return;
    }

    // Sort by prodi, mk, cpmk, lalu kode subcpmk
    subcpmks.sort((a, b) => {
        if (a.nama_prodi !== b.nama_prodi) return a.nama_prodi.localeCompare(b.nama_prodi);
        if (a.nama_mk !== b.nama_mk) return a.nama_mk.localeCompare(b.nama_mk);
        if (a.kode_cpmk !== b.kode_cpmk) return a.kode_cpmk.localeCompare(b.kode_cpmk);
        return a.kode_subcpmk.localeCompare(b.kode_subcpmk);
    });

    document.getElementById('subcpmk-list').innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Mata Kuliah</th>
                    <th>CPMK</th>
                    <th>Kode SubCPMK</th>
                    <th>Deskripsi</th>
                    <th>Bobot (%)</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${subcpmks.map(s => `
                    <tr onclick="navigateToAsesmen('${s.prodi_id}', '${s.mk_id}', '${s.cpmk_id}', '${s.subcpmk_id}', '${s.kode_subcpmk}')" style="cursor: pointer;" class="hover-row">
                        <td>${s.nama_mk}</td>
                        <td>${s.kode_cpmk}</td>
                        <td>${s.kode_subcpmk}</td>
                        <td>${s.deskripsi}</td>
                        <td>${s.bobot}</td>
                        <td>
                            <button onclick="event.stopPropagation(); editSubCpmk('${s.subcpmk_id}')">Edit</button>
                            <button class="danger" onclick="event.stopPropagation(); deleteSubCpmk('${s.subcpmk_id}')">Hapus</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Hapus SubCPMK
async function deleteSubCpmk(id) {
    if (!confirm('Yakin hapus SubCPMK ini?')) return;

    try {
        const res = await fetch(`/api/subcpmk/${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Gagal menghapus SubCPMK');
        }
        
        showStatus('subcpmk-status', result.message, 'success');
        // Refresh tabel dan update local state
        await fetchAllSubCpmksForLogic(); 
        filterCpmkByMk(); // Rerender dropdown utk pembaruan bobot sisa
        loadSubCpmk();
    } catch (error) {
        showStatus('subcpmk-status', error.message, 'error');
    }
}

function editSubCpmk(id) {
    const s = subcpmkDataList.find(x => x.subcpmk_id === id);
    if (!s) return;
    editSubCpmkId = id;
    
    // Untuk mengisi cpmk, kita harus mengisi mk dulu
    // Asumsi kita dapat mencari mk_id dari allCpmksForSubCpmk jika s tidak punya
    let mk_id = null;
    const cpmkObj = allCpmksForSubCpmk.find(c => c.cpmk_id === s.cpmk_id);
    if (cpmkObj) mk_id = cpmkObj.mk_id;
    let prodi_id = null;
    const mkObj = allMksForSubCpmk.find(m => m.mk_id === mk_id);
    if (mkObj) prodi_id = mkObj.prodi_id;
    
    document.getElementById('prodi-subcpmk-select').value = prodi_id || '';
    filterMkSubCpmkByProdi();
    document.getElementById('mk-subcpmk-select').value = mk_id || '';
    filterCpmkByMk();
    document.getElementById('cpmk-subcpmk-select').value = s.cpmk_id || '';
    
    document.getElementById('kode-subcpmk').value = s.kode_subcpmk || '';
    document.getElementById('deskripsi-subcpmk').value = s.deskripsi || '';
    
    const btn = document.querySelector('#subcpmk-section button[onclick="saveSubCpmk()"]');
    if (btn) btn.innerText = "Update SubCPMK";
    
    if (!document.getElementById('btn-batal-subcpmk')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-subcpmk';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditSubCpmk;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditSubCpmk() {
    editSubCpmkId = null;
    document.getElementById('kode-subcpmk').value = '';
    document.getElementById('deskripsi-subcpmk').value = '';
    
    const btn = document.querySelector('#subcpmk-section button[onclick="saveSubCpmk()"]');
    if (btn) btn.innerText = "Tambah SubCPMK";
    const batalBtn = document.getElementById('btn-batal-subcpmk');
    if (batalBtn) batalBtn.remove();
}
