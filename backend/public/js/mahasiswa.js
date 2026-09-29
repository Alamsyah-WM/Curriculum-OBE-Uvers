// MAHASISWA FUNCTIONS
let editMahasiswaId = null;
let mahasiswaDataList = [];

async function saveMahasiswa() {
    const status = document.getElementById('mahasiswa-status');
    const data = {
        nama: document.getElementById('nama-mahasiswa').value.trim(),
        nim: document.getElementById('nim-mahasiswa').value.trim(),
        prodi_id: document.getElementById('prodi-mahasiswa-select').value,
        angkatan: document.getElementById('angkatan-mahasiswa').value.trim()
    };
    if (!data.nama || !data.nim || !data.prodi_id || !data.angkatan) {
        showStatus('mahasiswa-status', 'Semua field harus diisi!', 'error');
        return;
    }
    const method = editMahasiswaId ? 'PUT' : 'POST';
    const url = editMahasiswaId ? `/api/mahasiswa/${editMahasiswaId}` : '/api/mahasiswa';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        showStatus('mahasiswa-status', `${result.message}`, 'success');
        loadMahasiswa();
        cancelEditMahasiswa();
    } catch (error) {
        showStatus('mahasiswa-status', error.message, 'error');
    }
}

function getMahasiswaFilters() {
    const params = new URLSearchParams();
    const filters = document.querySelectorAll('.filter-mahasiswa');
    filters.forEach(f => {
        if (f.value) {
            params.append(f.name, f.value);
        }
    });
    return params.toString();
}

async function loadMahasiswa() {
    try {
        const queryString = getMahasiswaFilters();
        const res = await fetch(`/api/mahasiswa?${queryString}`);
        const mahasiswas = await res.json();
        mahasiswaDataList = mahasiswas;
        renderMahasiswaTable(mahasiswas);
    } catch (error) {
        console.error('Load mahasiswa error:', error);
    }
}

function renderMahasiswaTable(mahasiswas) {
    if (mahasiswas.length === 0) {
        document.getElementById('mahasiswa-list').innerHTML = '<p>Belum ada data mahasiswa.</p>';
        return;
    }
    document.getElementById('mahasiswa-list').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nama</th>
          <th>NIM</th>
          <th>Prodi</th>
          <th>Angkatan</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${mahasiswas.map(m => `
          <tr onclick="goToInputNilaiFromMahasiswa('${m.prodi_id}', '${m.mahasiswa_id}')" style="cursor: pointer;" title="Klik untuk Input Nilai" class="mahasiswa-row">
            <td>${m.nama}</td>
            <td>${m.nim}</td>
            <td>${m.nama_prodi}</td>
            <td>${m.angkatan}</td>
            <td>
                <button onclick="event.stopPropagation(); editMahasiswa('${m.mahasiswa_id}')">Edit</button>
                <button class="danger" onclick="event.stopPropagation(); deleteMahasiswa('${m.mahasiswa_id}')">Hapus</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function clearMahasiswaForm() {
    document.getElementById('nama-mahasiswa').value = '';
    document.getElementById('nim-mahasiswa').value = '';

    if (!window.currentUser || !window.currentUser.prodi_id) {
        document.getElementById('prodi-mahasiswa-select').value = '';
    }

    document.getElementById('angkatan-mahasiswa').value = '';
}

async function deleteMahasiswa(id) {
    if (!confirm('Hapus mahasiswa?')) return;
    try {
        await fetch(`/api/mahasiswa/${id}`, { method: 'DELETE' });
        loadMahasiswa();
    } catch (error) {
        alert(error.message);
    }
}

function editMahasiswa(id) {
    const m = mahasiswaDataList.find(x => x.mahasiswa_id === id);
    if (!m) return;
    editMahasiswaId = id;
    document.getElementById('nama-mahasiswa').value = m.nama || '';
    document.getElementById('nim-mahasiswa').value = m.nim || '';
    
    // Select prodi. Jika currentUser (disabled state), dia sudah terseleksi. Jika admin, set valuenya.
    if (!window.currentUser || !window.currentUser.prodi_id) {
        document.getElementById('prodi-mahasiswa-select').value = m.prodi_id || '';
    }
    
    document.getElementById('angkatan-mahasiswa').value = m.angkatan || '';
    
    const btn = document.querySelector('#mahasiswa-section button[onclick="saveMahasiswa()"]');
    if (btn) btn.innerText = "Update Mahasiswa";
    
    if (!document.getElementById('btn-batal-mahasiswa')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-mahasiswa';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditMahasiswa;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditMahasiswa() {
    editMahasiswaId = null;
    clearMahasiswaForm();
    const btn = document.querySelector('#mahasiswa-section button[onclick="saveMahasiswa()"]');
    if (btn) btn.innerText = "Tambah Mahasiswa";
    const batalBtn = document.getElementById('btn-batal-mahasiswa');
    if (batalBtn) batalBtn.remove();
}

async function loadProdiSelectMahasiswa() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();
        const select = document.getElementById('prodi-mahasiswa-select');
        const angkatanInput = document.getElementById('angkatan-mahasiswa');

        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
            select.innerHTML = prodis.map(p => `<option value="${p.prodi_id}" selected>${p.nama_prodi}</option>`).join('');
            select.disabled = true;
            select.style.display = 'none';
            angkatanInput.classList.add('full-width');
        } else {
            select.innerHTML = '<option value="">Pilih Prodi</option>' +
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
            select.disabled = false;
            select.style.display = 'block';
            angkatanInput.classList.remove('full-width');
        }

        // --- INJECT FILTER DROPDOWNS ---
        const filterProdi = document.getElementById('filter-prodi-mahasiswa');
        if (filterProdi) {
            filterProdi.innerHTML = '<option value="">Semua Prodi</option>' + 
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
        }

        const filterAngkatan = document.getElementById('filter-angkatan-mahasiswa');
        if (filterAngkatan) {
            let options = '<option value="">Semua Angkatan</option>';
            const currentYear = new Date().getFullYear();
            // Tampilkan beberapa tahun ke belakang hingga beberapa tahun ke depan
            for (let y = currentYear - 6; y <= currentYear + 4; y++) {
                options += `<option value="${y}">${y}</option>`;
            }
            filterAngkatan.innerHTML = options;
        }

    } catch (error) {
        console.error(error);
    }
}

function goToInputNilaiFromMahasiswa(prodiId, mahasiswaId) {
    if (typeof showTab === 'function') {
        window.autoSelectNilai = { prodiId, mahasiswaId };
        showTab('nilai');
    }
}