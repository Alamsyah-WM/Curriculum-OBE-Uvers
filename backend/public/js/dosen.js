// DOSEN FUNCTIONS
let editDosenId = null;
let dosenDataList = [];
let allPeriodesDosen = [];

async function saveDosen() {
    const checkedRoles = Array.from(document.querySelectorAll('.role-checkbox:checked')).map(cb => cb.value);

    const data = {
        nama_dosen: document.getElementById('nama-dosen').value.trim(),
        nidn: document.getElementById('nidn-dosen').value.trim(),
        prodi_id: document.getElementById('prodi-dosen-select').value,
        email: document.getElementById('email-dosen').value.trim(),
        password: document.getElementById('password-dosen').value.trim(),
        roles: checkedRoles,
        periode_id: document.getElementById('periode-dosen-select').value || null,
        angkatan: document.getElementById('angkatan-dosen-select').value || null
    };

    // Saat update, password opsional
    if (!data.nama_dosen || !data.nidn || !data.prodi_id || !data.email || data.roles.length === 0) {
        showStatus('dosen-status', 'Field wajib (Nama, NIDN, Prodi, Email, Role) tidak boleh kosong!', 'error');
        return;
    }
    
    if (!editDosenId && !data.password) {
        showStatus('dosen-status', 'Password wajib diisi untuk dosen baru!', 'error');
        return;
    }

    const method = editDosenId ? 'PUT' : 'POST';
    const url = editDosenId ? `/api/dosen/${editDosenId}` : '/api/dosen';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        showStatus('dosen-status', `${result.message}`, 'success');
        loadDosen();
        cancelEditDosen();
    } catch (error) {
        showStatus('dosen-status', error.message, 'error');
    }
}

async function loadDosen() {
    try {
        const res = await fetch(`/api/dosen?search=${encodeURIComponent(document.getElementById('search-dosen') ? document.getElementById('search-dosen').value : '')}`);
        const dosens = await res.json();
        dosenDataList = dosens;
        renderDosenTable(dosens);
    } catch (error) {
        console.error('Load dosen error:', error);
    }
}

function renderDosenTable(dosens) {
    if (dosens.length === 0) {
        document.getElementById('dosen-list').innerHTML = '<p>Belum ada data dosen.</p>';
        return;
    }
    document.getElementById('dosen-list').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nama Dosen</th>
          <th>NIDN</th>
          <th>Prodi</th>
          <th>Role</th>
          <th>Status Wali</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${dosens.map(d => `
          <tr>
            <td>${d.nama_dosen}</td>
            <td>${d.nidn}</td>
            <td>${d.nama_prodi}</td>
            <td>${d.roles ? d.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ') : (d.role ? d.role.charAt(0).toUpperCase() + d.role.slice(1) : '-')}</td>
            <td>${d.periode_id && d.angkatan ? `Angkatan ${d.angkatan} (${d.periode_display || d.periode_id})` : '-'}</td>
            <td>
                <button onclick="editDosen('${d.dosen_id}')">Edit</button>
                <button class="danger" onclick="deleteDosen('${d.dosen_id}')">Hapus</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function clearDosenForm() {
    document.getElementById('nama-dosen').value = '';
    document.getElementById('nidn-dosen').value = '';

    if (!window.currentUser || !window.currentUser.prodi_id) {
        document.getElementById('prodi-dosen-select').value = '';
    }

    document.getElementById('email-dosen').value = '';
    document.getElementById('password-dosen').value = '';
    document.querySelectorAll('.role-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('periode-dosen-select').value = '';
    document.getElementById('angkatan-dosen-select').value = '';
    document.getElementById('angkatan-dosen-select').disabled = true;
}

async function deleteDosen(id) {
    if (!confirm('Hapus dosen?')) return;
    try {
        await fetch(`/api/dosen/${id}`, { method: 'DELETE' });
        loadDosen();
    } catch (error) {
        alert(error.message);
    }
}

function editDosen(id) {
    const d = dosenDataList.find(x => x.dosen_id === id);
    if (!d) return;
    editDosenId = id;
    document.getElementById('nama-dosen').value = d.nama_dosen || '';
    document.getElementById('nidn-dosen').value = d.nidn || '';
    
    if (!window.currentUser || !window.currentUser.prodi_id) {
        document.getElementById('prodi-dosen-select').value = d.prodi_id || '';
    }
    
    document.getElementById('email-dosen').value = d.email || '';
    document.getElementById('password-dosen').value = ''; // Kosongkan password
    document.getElementById('password-dosen').placeholder = 'Kosongkan jika tidak ingin mengubah';
    
    document.querySelectorAll('.role-checkbox').forEach(cb => {
        cb.checked = d.roles && d.roles.includes(cb.value);
    });
    
    document.getElementById('periode-dosen-select').value = d.periode_id || '';
    updateAngkatanDosen();
    if (d.angkatan) {
        document.getElementById('angkatan-dosen-select').value = d.angkatan;
    }
    
    const btn = document.querySelector('#dosen-section button[onclick="saveDosen()"]');
    if (btn) btn.innerText = "Update Dosen";
    
    if (!document.getElementById('btn-batal-dosen')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-dosen';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditDosen;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditDosen() {
    editDosenId = null;
    clearDosenForm();
    document.getElementById('password-dosen').placeholder = 'Password';
    const btn = document.querySelector('#dosen-section button[onclick="saveDosen()"]');
    if (btn) btn.innerText = "Tambah Dosen";
    const batalBtn = document.getElementById('btn-batal-dosen');
    if (batalBtn) batalBtn.remove();
}

async function loadProdiSelectDosen() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();
        const select = document.getElementById('prodi-dosen-select');

        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
            select.innerHTML = prodis.map(p => `<option value="${p.prodi_id}" selected>${p.nama_prodi}</option>`).join('');
            select.disabled = true;
            select.parentElement.style.display = 'none';
        } else {
            select.innerHTML = '<option value="">Pilih Prodi</option>' +
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
            select.disabled = false;
            select.parentElement.style.display = '';
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadPeriodeDosenSelect() {
    try {
        const res = await fetch('/api/periode');
        allPeriodesDosen = await res.json();
        const select = document.getElementById('periode-dosen-select');
        select.innerHTML = '<option value="">Pilihan Opsional: Pilih Periode Wali</option>' + 
            allPeriodesDosen.map(p => `<option value="${p.periode_id}">${p.tahun_mulai} - ${p.tahun_selesai}</option>`).join('');
    } catch (error) {
        console.error(error);
    }
}

function updateAngkatanDosen() {
    const periodeId = document.getElementById('periode-dosen-select').value;
    const angkatanSelect = document.getElementById('angkatan-dosen-select');
    
    if (!periodeId) {
        angkatanSelect.innerHTML = '<option value="">Pilih Angkatan Wali</option>';
        angkatanSelect.disabled = true;
        return;
    }
    
    const periode = allPeriodesDosen.find(p => p.periode_id === periodeId);
    if (!periode) return;

    let options = '<option value="">Pilih Angkatan Wali</option>';
    // Render angkatan options from tahun_mulai to tahun_selesai
    for (let y = periode.tahun_mulai; y <= periode.tahun_selesai; y++) {
        options += `<option value="${y}">${y}</option>`;
    }
    angkatanSelect.innerHTML = options;
    angkatanSelect.disabled = false;
}

// Ensure the select is loaded when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadPeriodeDosenSelect();
});