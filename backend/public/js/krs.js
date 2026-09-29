// KRS (Kartu Rencana Studi) / Pemetaan Mahasiswa - Mata Kuliah Functions

let allMahasiswasKrs = [];
let allMksKrs = [];

// Muat daftar Prodi
async function loadProdiKrsSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Filter prodi berdasarkan user login jika bukan admin
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-krs-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        const filterProdi = document.getElementById('filter-prodi-krs');
        if (filterProdi) {
            filterProdi.innerHTML = '<option value="">Semua Prodi</option>' + 
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
        }

        // Muat data master MK dan Mahasiswa setelah prodi dimuat
        await Promise.all([
            fetchAllMahasiswaKrs(),
            fetchAllMkKrs()
        ]);
        
        renderKrsTable(); // Tampilkan tabel data di awal

        if (prodis.length === 1) {
            // Langsung trigger change jika cuma 1 prodi (seperti role Kaprodi)
            onProdiKrsChange();
        }

        select.addEventListener('change', onProdiKrsChange);
        document.getElementById('mahasiswa-krs-select').addEventListener('change', renderMkKrsCheckboxes);
    } catch (error) {
        console.error('Error load Prodi KRS:', error);
    }
}

// Fetch semua Mahasiswa dari server
async function fetchAllMahasiswaKrs() {
    try {
        const res = await fetch('/api/mahasiswa');
        allMahasiswasKrs = await res.json();
    } catch (error) {
        console.error('Error load Mahasiswa KRS:', error);
    }
}

// Fetch semua Mata Kuliah dari server
async function fetchAllMkKrs() {
    try {
        const res = await fetch('/api/mk');
        allMksKrs = await res.json();
    } catch (error) {
        console.error('Error load MK KRS:', error);
    }
}

// Saat dropdown Prodi berubah
function onProdiKrsChange() {
    const selectedProdiId = document.getElementById('prodi-krs-select').value;
    const mhsSelect = document.getElementById('mahasiswa-krs-select');
    const mkContainer = document.getElementById('mk-krs-checkbox-container');

    if (!selectedProdiId) {
        mhsSelect.innerHTML = '<option value="">Pilih Mahasiswa</option>';
        mkContainer.innerHTML = '<p style="color: #999;">Pilih Prodi terlebih dahulu</p>';
        return;
    }

    // Filter list Mahasiswa by Prodi
    const filteredMhs = allMahasiswasKrs.filter(m => m.prodi_id == selectedProdiId);
    mhsSelect.innerHTML = '<option value="">Pilih Mahasiswa</option>' + filteredMhs.map(m =>
        `<option value="${m.mahasiswa_id}">${m.nim} - ${m.nama}</option>`
    ).join('');

    renderMkKrsCheckboxes();
    renderKrsTable(); // Render table
}

// Update UI Checkbox MK berdasarkan Mahasiswa yang dipilih
function renderMkKrsCheckboxes() {
    const selectedProdiId = document.getElementById('prodi-krs-select').value;
    const selectedMhsId = document.getElementById('mahasiswa-krs-select').value;
    const mkContainer = document.getElementById('mk-krs-checkbox-container');

    if (!selectedProdiId || !selectedMhsId) {
        mkContainer.innerHTML = '<p style="color: #999;">Pilih Mahasiswa terlebih dahulu</p>';
        return;
    }

    // Filter MK berdasarkan Prodi
    const filteredMks = allMksKrs.filter(mk => mk.prodi_id == selectedProdiId);

    if (filteredMks.length === 0) {
        mkContainer.innerHTML = '<p style="color: #999;">Tidak ada daftar Mata Kuliah di Prodi ini.</p>';
        return;
    }

    // Cari data tipe Mahasiswa yang ter-select
    const selectedMhs = allMahasiswasKrs.find(m => m.mahasiswa_id === selectedMhsId);
    const takenMks = selectedMhs && selectedMhs.mk_ids ? selectedMhs.mk_ids : [];

    // Render checkbox MK
    mkContainer.innerHTML = filteredMks.map(mk => {
        const isChecked = takenMks.includes(mk.mk_id) ? 'checked' : '';
        return `
            <label style="display: flex; align-items: flex-start; margin-bottom: 12px; cursor: pointer; padding: 8px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e1e8ed;">
                <input type="checkbox" name="mk_krs_checkbox" value="${mk.mk_id}" ${isChecked} style="margin-right: 10px; margin-top: 3px; width: 16px; height: 16px; flex-shrink: 0;">
                <div style="flex: 1; line-height: 1.4;">
                    <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">${mk.kode_mk} - ${mk.nama_mk_id}</div>
                    <div style="color: #7f8c8d; font-size: 13px; margin-top: 2px;">Semester ${mk.semester}</div>
                </div>
            </label>
        `;
    }).join('');
}

// Simpan mapping Mahasiswa -> [MK]
async function saveKrs() {
    const mhsId = document.getElementById('mahasiswa-krs-select').value;
    if (!mhsId) {
        showStatus('krs-status', 'Pilih Mahasiswa terlebih dahulu!', 'error');
        return;
    }

    const checkedMks = Array.from(document.querySelectorAll('input[name="mk_krs_checkbox"]:checked'))
        .map(cb => cb.value);

    try {
        const res = await fetch(`/api/mahasiswa/${mhsId}/krs`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mk_ids: checkedMks })
        });
        const result = await res.json();
        
        if (res.ok) {
            showStatus('krs-status', result.message, 'success');
            
            // Perbarui cache internal di array allMahasiswasKrs agar tanpa refresh tab, 
            // data state local juga berdasar state server yang baru!
            const mhsIndex = allMahasiswasKrs.findIndex(m => m.mahasiswa_id === mhsId);
            if(mhsIndex !== -1) {
                allMahasiswasKrs[mhsIndex].mk_ids = checkedMks;
            }
            
            // Re-render table untuk merefleksikan perubahan KRS barusan
            renderKrsTable();
        } else {
            showStatus('krs-status', result.error, 'error');
        }
    } catch (error) {
        showStatus('krs-status', error.message, 'error');
    }
}

function getKrsFilters() {
    const params = new URLSearchParams();
    const filters = document.querySelectorAll('.filter-krs');
    filters.forEach(f => {
        if (f.value) {
            params.append(f.name, f.value);
        }
    });
    return params.toString();
}

// Render tabel KRS via API Filtering
async function renderKrsTable() {
    const listContainer = document.getElementById('krs-list');

    try {
        const queryString = getKrsFilters();
        const res = await fetch(`/api/mahasiswa?${queryString}`);
        const filteredMhs = await res.json();

        if (filteredMhs.length === 0) {
            listContainer.innerHTML = '<p>Belum ada data mahasiswa / KRS.</p>';
            return;
        }

    listContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>NIM</th>
                    <th>Nama Mahasiswa</th>
                    <th>Prodi</th>
                    <th>Mata Kuliah yang Diambil (KRS)</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${filteredMhs.map(m => {
                    const takenMks = m.mk_ids || [];
                    const mkNames = takenMks.map(mkId => {
                        const mkObj = allMksKrs.find(x => x.mk_id === mkId);
                        return mkObj ? mkObj.nama_mk_id : mkId;
                    });
                    
                    const mkDisplay = mkNames.length > 0 ? mkNames.join(', ') : '-';
                    
                    return `
                    <tr>
                        <td>${m.nim}</td>
                        <td>${m.nama}</td>
                        <td>${m.nama_prodi || '-'}</td>
                        <td>${mkDisplay}</td>
                        <td>
                            <button onclick="editKrs('${m.mahasiswa_id}', '${m.prodi_id}')">Edit</button>
                            ${takenMks.length > 0 ? `<button class="danger" onclick="clearKrs('${m.mahasiswa_id}')">Hapus</button>` : ''}
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    } catch (error) {
        console.error('Render KRS error:', error);
    }
}

// Fitur Edit KRS (Menampilkan kembali di form atas)
function editKrs(mahasiswaId, prodiId) {
    document.getElementById('prodi-krs-select').value = prodiId;
    onProdiKrsChange(); // Refresh otomatis list Mahasiswa

    document.getElementById('mahasiswa-krs-select').value = mahasiswaId;
    renderMkKrsCheckboxes(); // Menampilkan checkbox dengan status tercentang

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fitur Kosongkan KRS (Menghapus jadwal tanpa menghapus mahasiswa)
async function clearKrs(mahasiswaId) {
    if (!confirm('Yakin ingin mengosongkan KRS (seluruh mata kuliah) untuk mahasiswa ini?')) return;

    try {
        const res = await fetch(`/api/mahasiswa/${mahasiswaId}/krs`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mk_ids: [] }) // Mengirim array kosong
        });
        const result = await res.json();
        
        if (res.ok) {
            showStatus('krs-status', 'KRS berhasil dikosongkan!', 'success');
            
            // Perbarui cache internal di array allMahasiswasKrs
            const mhsIndex = allMahasiswasKrs.findIndex(m => m.mahasiswa_id === mahasiswaId);
            if(mhsIndex !== -1) {
                allMahasiswasKrs[mhsIndex].mk_ids = [];
            }
            
            // Re-render table dan checkbox di atas jika sedang dibuka
            renderKrsTable();
            if (document.getElementById('mahasiswa-krs-select').value === mahasiswaId) {
                renderMkKrsCheckboxes();
            }
        } else {
            showStatus('krs-status', result.error, 'error');
        }
    } catch (error) {
        showStatus('krs-status', error.message, 'error');
    }
}

