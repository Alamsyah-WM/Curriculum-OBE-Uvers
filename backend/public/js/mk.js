// MATA KULIAH FUNCTIONS

let allCpls = [];
let allDosens = [];
let editMkId = null;
let mkDataList = [];

async function loadCplSelect() {
    try {
        const res = await fetch('/api/cpl');
        allCpls = await res.json();
    } catch (error) {
        console.error('Error load CPL:', error);
    }
}

async function loadDosenMkSelect() {
    try {
        const res = await fetch('/api/dosen');
        allDosens = await res.json();
    } catch (error) {
        console.error('Error load Dosen:', error);
    }
}

async function loadProdiMkSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Jika user punya prodi_id, filter
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-mk-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        // Auto-populate filter dropdown if it exists
        const filterSelect = document.getElementById('filter-prodi-mk');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Semua Prodi</option>' + 
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
        }

        select.addEventListener('change', () => {
            filterCplByProdi();
            filterDosenByProdi();
        });
    } catch (error) {
        console.error('Error load Prodi MK:', error);
    }
}

// Filter Dosen berdasarkan prodi
function filterDosenByProdi() {
    const selectedProdiId = document.getElementById('prodi-mk-select').value;
    const dosenSelect = document.getElementById('dosen-mk-select');

    // Semua yang bisa akses tab MK (Admin, Kaprodi) berhak memilih Dosen pengampu
    dosenSelect.style.display = 'inline-block';

    if (!selectedProdiId) {
        dosenSelect.innerHTML = '<option value="">Pilih Dosen</option>';
        return;
    }

    const filteredDosens = allDosens.filter(d => d.prodi_id == selectedProdiId);
    dosenSelect.innerHTML = '<option value="">Pilih Dosen</option>' + filteredDosens.map(d =>
        `<option value="${d.dosen_id}">${d.nama_dosen}</option>`
    ).join('');
}

// Filter CPL berdasarkan prodi
function filterCplByProdi() {
    const selectedProdiId = document.getElementById('prodi-mk-select').value;
    const cplContainer = document.getElementById('cpl-checkbox-container');

    console.log('🔍 Selected Prodi ID:', selectedProdiId);
    console.log('📦 All CPLs:', allCpls);

    if (!selectedProdiId) {
        cplContainer.innerHTML = '<p style="color: #999;">Pilih Prodi terlebih dahulu</p>';
        return;
    }

    // Filter CPL yang prodi_id-nya sama dengan prodi MK
    const filteredCpls = allCpls.filter(c => c.prodi_id == selectedProdiId);

    console.log('✅ Filtered CPLs:', filteredCpls);

    if (filteredCpls.length === 0) {
        cplContainer.innerHTML = '<p style="color: #999;">Tidak ada CPL untuk prodi ini. Silakan tambahkan CPL di tab CPL terlebih dahulu.</p>';
        return;
    }

    // Render checkbox dengan layout yang lebih compact
    cplContainer.innerHTML = filteredCpls.map(c => {
        const kodeCpl = c.kode_cpl || `[ID: ${c.cpl_id}]`;
        const deskripsi = c.deskripsi || 'Deskripsi tidak tersedia';

        console.log(`Rendering: ${kodeCpl} - ${deskripsi}`);

        return `
            <label style="display: flex; align-items: flex-start; margin-bottom: 12px; cursor: pointer; padding: 8px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e1e8ed;">
                <input type="checkbox" name="cpl_checkbox" value="${c.cpl_id}" style="margin-right: 10px; margin-top: 3px; width: 16px; height: 16px; flex-shrink: 0;">
                <div style="flex: 1; line-height: 1.4;">
                    <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">${kodeCpl}</div>
                    <div style="color: #7f8c8d; font-size: 13px; margin-top: 2px;">${deskripsi}</div>
                </div>
            </label>
        `;
    }).join('');
}


// Simpan MK baru
async function saveMk() {
    // Ambil CPL yang di-check
    const checkedCpls = Array.from(document.querySelectorAll('input[name="cpl_checkbox"]:checked'))
        .map(cb => cb.value);

    // Ambil ID dosen dari dropdown yang dipilih
    const dosenId = document.getElementById('dosen-mk-select').value;
    const prodiId = document.getElementById('prodi-mk-select').value;

    if (!dosenId) {
        showStatus('mk-status', 'Error: Dosen belum dipilih/terdaftar.', 'error');
        return;
    }

    if (!prodiId) {
        showStatus('mk-status', 'Pilih Prodi terlebih dahulu!', 'error');
        return;
    }

    const data = {
        kode_mk: document.getElementById('kode-mk').value.trim(),
        nama_mk_id: document.getElementById('nama-mk-id').value.trim(),
        nama_mk_en: document.getElementById('nama-mk-en').value.trim(),
        prodi_id: prodiId,
        dosen_id: dosenId, 
        semester: document.getElementById('semester-select').value,
        cpl_ids: checkedCpls
    };

    if (!data.kode_mk || !data.nama_mk_id || !data.nama_mk_en || !data.prodi_id || !data.dosen_id || !data.semester) {
        showStatus('mk-status', 'Semua field wajib harus diisi!', 'error');
        return;
    }

    if (checkedCpls.length === 0) {
        showStatus('mk-status', 'Pilih minimal 1 CPL!', 'error');
        return;
    }

    const method = editMkId ? 'PUT' : 'POST';
    const url = editMkId ? `/api/mk/${editMkId}` : '/api/mk';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        showStatus('mk-status', `${result.message}`, 'success');
        loadMk();
        cancelEditMk();
    } catch (error) {
        showStatus('mk-status', error.message, 'error');
    }
}

function getMkFilters() {
    const params = new URLSearchParams();
    const filters = document.querySelectorAll('.filter-mk');
    filters.forEach(f => {
        if (f.value) {
            params.append(f.name, f.value);
        }
    });
    return params.toString();
}

// Load daftar MK
async function loadMk() {
    try {
        const queryString = getMkFilters();
        const res = await fetch(`/api/mk?${queryString}`);
        const mks = await res.json();
        mkDataList = mks;
        renderMkTable(mks);
    } catch (error) {
        console.error('Load MK error:', error);
    }
}

// Render tabel MK
function renderMkTable(mks) {
    if (mks.length === 0) {
        document.getElementById('mk-list').innerHTML = '<p>Belum ada data mata kuliah.</p>';
        return;
    }

    document.getElementById('mk-list').innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Kode MK</th>
                    <th>Nama MK (ID)</th>
                    <th>Nama MK (EN)</th>
                    <th>Prodi</th>
                    <th>Dosen</th>
                    <th>Semester</th>
                    <th>CPL</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${mks.map(mk => `
                    <tr>
                        <td>${mk.kode_mk}</td>
                        <td>${mk.nama_mk_id}</td>
                        <td>${mk.nama_mk_en}</td>
                        <td>${mk.nama_prodi}</td>
                        <td>${mk.nama_dosen}</td>
                        <td>${mk.semester}</td>
                        <td>${mk.cpl_display || '-'}</td>
                        <td>
                            <button onclick="editMk('${mk.mk_id}')">Edit</button>
                            <button class="danger" onclick="deleteMk('${mk.mk_id}')">Hapus</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Hapus MK
async function deleteMk(id) {
    if (!confirm('Yakin hapus mata kuliah ini?')) return;

    try {
        const res = await fetch(`/api/mk/${id}`, { method: 'DELETE' });
        const result = await res.json();
        showStatus('mk-status', result.message, 'success');
        loadMk();
    } catch (error) {
        showStatus('mk-status', error.message, 'error');
    }
}

// Clear form MK
function clearMkForm() {
    document.getElementById('kode-mk').value = '';
    document.getElementById('nama-mk-id').value = '';
    document.getElementById('nama-mk-en').value = '';

    if (!window.currentUser || !window.currentUser.prodi_id) {
        document.getElementById('prodi-mk-select').value = '';
        document.getElementById('cpl-checkbox-container').innerHTML = '<p style="color: #999;">Pilih Prodi terlebih dahulu</p>';
        document.getElementById('dosen-mk-select').innerHTML = '<option value="">Pilih Dosen</option>';
    } else {
        // jika prodi disabled karena difilter, dia sudah otomatis terselect 1 opsi
        filterCplByProdi();
        filterDosenByProdi();
    }

    document.getElementById('semester-select').value = '';

    // Uncheck seluruh checkbox CPL
    const checkboxes = document.querySelectorAll('input[name="cpl_checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function editMk(id) {
    const mk = mkDataList.find(x => x.mk_id === id);
    if (!mk) return;
    editMkId = id;
    
    document.getElementById('prodi-mk-select').value = mk.prodi_id || '';
    filterCplByProdi();
    filterDosenByProdi();
    
    document.getElementById('dosen-mk-select').value = mk.dosen_id || '';
    
    document.getElementById('kode-mk').value = mk.kode_mk || '';
    document.getElementById('nama-mk-id').value = mk.nama_mk_id || '';
    document.getElementById('nama-mk-en').value = mk.nama_mk_en || '';
    document.getElementById('semester-select').value = mk.semester || '';
    
    // Check checkboxes
    const checkboxes = document.querySelectorAll('input[name="cpl_checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = mk.cpl_ids && mk.cpl_ids.includes(cb.value);
    });
    
    const btn = document.querySelector('#mk-section button[onclick="saveMk()"]');
    if (btn) btn.innerText = "Update Mata Kuliah";
    
    if (!document.getElementById('btn-batal-mk')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-mk';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditMk;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditMk() {
    editMkId = null;
    clearMkForm();
    const btn = document.querySelector('#mk-section button[onclick="saveMk()"]');
    if (btn) btn.innerText = "Tambah Mata Kuliah";
    const batalBtn = document.getElementById('btn-batal-mk');
    if (batalBtn) batalBtn.remove();
}
