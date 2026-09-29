// CPMK FUNCTIONS

let allMksForCpmk = [];
let allCplsForCpmk = [];
let editCpmkId = null;
let cpmkDataList = [];

async function loadProdiCpmkSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Jika user punya prodi_id (bukan admin), filter berdasar prodi user login
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-cpmk-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        // Auto-populate filter dropdown if it exists
        const filterSelect = document.getElementById('filter-prodi-cpmk');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Semua Prodi</option>' + 
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
        }

        select.addEventListener('change', filterMkByProdi);

        // Langsung panggil fetch MK & CPL sekalian agar datanya ada di memory
        await Promise.all([
            fetchAllMksForCpmk(),
            fetchAllCplsForCpmk()
        ]);
        
        // Panggil filter juga agar jika hanya 1 prodi, lgsg nge-set MK-nya
        if (prodis.length === 1) {
             filterMkByProdi();
        }
    } catch (error) {
        console.error('Error load Prodi CPMK:', error);
    }
}

async function fetchAllMksForCpmk() {
    try {
        const res = await fetch('/api/mk');
        allMksForCpmk = await res.json();
    } catch (error) {
        console.error('Error load MK for CPMK:', error);
    }
}

async function fetchAllCplsForCpmk() {
    try {
        const res = await fetch('/api/cpl');
        allCplsForCpmk = await res.json();
    } catch (error) {
        console.error('Error load CPL for CPMK:', error);
    }
}

function filterMkByProdi() {
    const selectedProdiId = document.getElementById('prodi-cpmk-select').value;
    const mkSelect = document.getElementById('mk-cpmk-select');

    if (!selectedProdiId) {
        mkSelect.innerHTML = '<option value="">Pilih Mata Kuliah</option>';
        return;
    }

    // Filter MK berdasarkan prodi
    const filteredMks = allMksForCpmk.filter(m => m.prodi_id === selectedProdiId);
    
    mkSelect.innerHTML = '<option value="">Pilih Mata Kuliah</option>' + filteredMks.map(m =>
        `<option value="${m.mk_id}">${m.kode_mk} - ${m.nama_mk_id}</option>`
    ).join('');

    mkSelect.addEventListener('change', filterCplByMkForCpmk);
    
    // reset cpl dropdown also
    document.getElementById('cpl-cpmk-select').innerHTML = '<option value="">Pilih CPL (Pilih Mata Kuliah Dahulu)</option>';
}

function filterCplByMkForCpmk() {
    const selectedMkId = document.getElementById('mk-cpmk-select').value;
    const cplSelect = document.getElementById('cpl-cpmk-select');

    if (!selectedMkId) {
        cplSelect.innerHTML = '<option value="">Pilih CPL (Pilih Mata Kuliah Dahulu)</option>';
        return;
    }

    // Cari MK obj
    const mkObj = allMksForCpmk.find(m => m.mk_id === selectedMkId);
    if (!mkObj || !mkObj.cpl_ids || mkObj.cpl_ids.length === 0) {
        cplSelect.innerHTML = '<option value="">(MK ini belum memiliki relasi CPL)</option>';
        return;
    }

    // Ambil CPL detail berdasarkan cpl_ids array di MK
    const filteredCpls = allCplsForCpmk.filter(c => mkObj.cpl_ids.includes(c.cpl_id));

    cplSelect.innerHTML = '<option value="">Pilih CPL</option>' + filteredCpls.map(c => 
        `<option value="${c.cpl_id}">${c.kode_cpl} - ${c.deskripsi}</option>`
    ).join('');
}

// Simpan CPMK baru
async function saveCpmk() {
    const mkId = document.getElementById('mk-cpmk-select').value;
    const cplId = document.getElementById('cpl-cpmk-select').value;
    const kodeCpmk = document.getElementById('kode-cpmk').value.trim();
    const deskripsi = document.getElementById('deskripsi-cpmk').value.trim();

    if (!mkId || !cplId || !kodeCpmk || !deskripsi) {
        showStatus('cpmk-status', 'Semua field wajib diisi (Mata Kuliah, CPL, Kode, Deskripsi)!', 'error');
        return;
    }

    const data = {
        mk_id: mkId,
        cpl_id: cplId,
        kode_cpmk: kodeCpmk,
        deskripsi: deskripsi
    };

    const method = editCpmkId ? 'PUT' : 'POST';
    const url = editCpmkId ? `/api/cpmk/${editCpmkId}` : '/api/cpmk';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Gagal menyimpan CPMK');
        }
        
        showStatus('cpmk-status', `${result.message}`, 'success');
        
        cancelEditCpmk();
        
        loadCpmk();
    } catch (error) {
        showStatus('cpmk-status', error.message, 'error');
    }
}

function getCpmkFilters() {
    const params = new URLSearchParams();
    const filters = document.querySelectorAll('.filter-cpmk');
    filters.forEach(f => {
        if (f.value) {
            params.append(f.name, f.value);
        }
    });
    return params.toString();
}

// Load daftar CPMK
async function loadCpmk() {
    try {
        const queryString = getCpmkFilters();
        const res = await fetch(`/api/cpmk?${queryString}`);
        const cpmks = await res.json();
        cpmkDataList = cpmks;
        renderCpmkTable(cpmks);
    } catch (error) {
        console.error('Load CPMK error:', error);
    }
}

// Render tabel CPMK
function renderCpmkTable(cpmks) {
    if (cpmks.length === 0) {
        document.getElementById('cpmk-list').innerHTML = '<p>Belum ada data CPMK.</p>';
        return;
    }

    // Sort by prodi, kemudian by mk, lalu kode cpmk
    cpmks.sort((a, b) => {
        if (a.nama_prodi !== b.nama_prodi) return a.nama_prodi.localeCompare(b.nama_prodi);
        if (a.nama_mk !== b.nama_mk) return a.nama_mk.localeCompare(b.nama_mk);
        return a.kode_cpmk.localeCompare(b.kode_cpmk);
    });

    document.getElementById('cpmk-list').innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Prodi</th>
                    <th>Mata Kuliah</th>
                    <th>CPL Terkait</th>
                    <th>Kode CPMK</th>
                    <th>Deskripsi</th>
                    <th>Bobot (%)</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${cpmks.map(c => `
                    <tr onclick="navigateToSubCpmk('${c.prodi_id}', '${c.mk_id}', '${c.cpmk_id}', '${c.kode_cpmk}')" style="cursor: pointer;" class="hover-row">
                        <td>${c.nama_prodi}</td>
                        <td>${c.nama_mk}</td>
                        <td>${c.nama_cpl}</td>
                        <td>${c.kode_cpmk}</td>
                        <td>${c.deskripsi}</td>
                        <td>${c.bobot}</td>
                        <td>
                            <button onclick="event.stopPropagation(); editCpmk('${c.cpmk_id}')">Edit</button>
                            <button class="danger" onclick="event.stopPropagation(); deleteCpmk('${c.cpmk_id}')">Hapus</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Hapus CPMK
async function deleteCpmk(id) {
    if (!confirm('Yakin hapus CPMK ini?')) return;

    try {
        const res = await fetch(`/api/cpmk/${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Gagal menghapus CPMK');
        }
        
        showStatus('cpmk-status', result.message, 'success');
        loadCpmk();
    } catch (error) {
        showStatus('cpmk-status', error.message, 'error');
    }
}

function editCpmk(id) {
    const c = cpmkDataList.find(x => x.cpmk_id === id);
    if (!c) return;
    editCpmkId = id;
    
    document.getElementById('prodi-cpmk-select').value = c.prodi_id || '';
    filterMkByProdi();
    document.getElementById('mk-cpmk-select').value = c.mk_id || '';
    filterCplByMkForCpmk();
    document.getElementById('cpl-cpmk-select').value = c.cpl_id || '';
    
    document.getElementById('kode-cpmk').value = c.kode_cpmk || '';
    document.getElementById('deskripsi-cpmk').value = c.deskripsi || '';
    
    const btn = document.querySelector('#cpmk-section button[onclick="saveCpmk()"]');
    if (btn) btn.innerText = "Update CPMK";
    
    if (!document.getElementById('btn-batal-cpmk')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-cpmk';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditCpmk;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditCpmk() {
    editCpmkId = null;
    document.getElementById('cpl-cpmk-select').value = '';
    document.getElementById('kode-cpmk').value = '';
    document.getElementById('deskripsi-cpmk').value = '';
    
    const btn = document.querySelector('#cpmk-section button[onclick="saveCpmk()"]');
    if (btn) btn.innerText = "Tambah CPMK";
    const batalBtn = document.getElementById('btn-batal-cpmk');
    if (batalBtn) batalBtn.remove();
}
