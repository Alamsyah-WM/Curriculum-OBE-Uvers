let editProfileId = null;
let profileDataList = [];

async function loadProdiSelect() {
    try {
        const res = await fetch('/api/prodi'); const prodis = await res.json();
        document.getElementById('prodi-select').innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p => `<option value="${p.prodi_id}">${p.prodi_id} - ${p.nama_prodi}</option>`).join('');
    } catch (error) { console.error(error); }
}

async function saveProfile() {
    const status = document.getElementById('profile-status');
    const data = {
        periode_id: document.getElementById('periode-select').value,
        prodi_id: document.getElementById('prodi-select').value,
        kode_pl: document.getElementById('kode-pl').value.trim(),
        profesi: document.getElementById('profesi').value.trim(),
        referensi: document.getElementById('referensi').value.trim()
    };

    // Validasi field wajib
    if (!data.periode_id || !data.prodi_id || !data.kode_pl || !data.profesi) {
        showStatus('profile-status', 'Field wajib: Periode, Prodi, Kode PL, Profesi!', 'error');
        return;
    }

    const method = editProfileId ? 'PUT' : 'POST';
    const url = editProfileId ? `/api/profile/${editProfileId}` : '/api/profile';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        showStatus('profile-status', `${result.message}`, 'success');

        loadProfile();
        cancelEditProfile();
    } catch (error) {
        showStatus('profile-status', `Error: ${error.message}`, 'error');
    }
}


function getProfileFilters() {
    const params = new URLSearchParams();
    const filters = document.querySelectorAll('.filter-profile');
    filters.forEach(f => {
        if (f.value) {
            params.append(f.name, f.value);
        }
    });
    return params.toString();
}

async function loadProfile() {
    try {
        const queryString = getProfileFilters();
        const res = await fetch(`/api/profile?${queryString}`);
        const profiles = await res.json();
        profileDataList = profiles;
        renderProfileTable(profiles);
    } catch (error) {
        console.error('Load profile error:', error);
    }
}


function renderProfileTable(profiles) {
    if (profiles.length === 0) {
        document.getElementById('profile-list').innerHTML = '<p>Belum ada data profile lulusan.</p>';
        return;
    }

    document.getElementById('profile-list').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Kode PL</th>
          <th>Profesi</th>
          <th>Periode</th>
          <th>Prodi</th>
          <th>Referensi</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${profiles.map(p => `
          <tr>
            <td>${p.kode_pl || '-'}</td>
            <td>${p.profesi || '-'}</td>
            <td>${p.periode_display || '-'}</td>
            <td>${p.prodi_display || '-'}</td>
            <td>${p.referensi || '-'}</td>
            <td>
                <button onclick="editProfile('${p.pl_id}')">Edit</button>
                <button class="danger" onclick="deleteProfile('${p.pl_id}')">Hapus</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function clearProfileForm() {
    document.getElementById('periode-select').value = '';
    document.getElementById('prodi-select').value = '';
    document.getElementById('kode-pl').value = '';
    document.getElementById('profesi').value = '';
    document.getElementById('referensi').value = '';
}

function editProfile(id) {
    const p = profileDataList.find(x => x.pl_id === id);
    if (!p) return;
    editProfileId = id;
    document.getElementById('periode-select').value = p.periode_id || '';
    document.getElementById('prodi-select').value = p.prodi_id || '';
    document.getElementById('kode-pl').value = p.kode_pl || '';
    document.getElementById('profesi').value = p.profesi || '';
    document.getElementById('referensi').value = p.referensi || '';
    
    const btn = document.querySelector('#profile-section button[onclick="saveProfile()"]');
    if (btn) btn.innerText = "Update Profile Lulusan";
    
    if (!document.getElementById('btn-batal-profile')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-profile';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditProfile;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditProfile() {
    editProfileId = null;
    clearProfileForm();
    const btn = document.querySelector('#profile-section button[onclick="saveProfile()"]');
    if (btn) btn.innerText = "Tambah Profile Lulusan";
    const batalBtn = document.getElementById('btn-batal-profile');
    if (batalBtn) batalBtn.remove();
}

async function deleteProfile(id) {
    if (!confirm('Hapus profile?')) return;
    try {
        await fetch(`/api/profile/${id}`, { method: 'DELETE' });
        loadProfile();
    } catch (error) {
        alert(error.message);
    }
}

async function loadPeriodeSelect() {
    try {
        const res = await fetch('/api/periode');
        const periodes = await res.json();

        const select = document.getElementById('periode-select');
        const optionsHTML = periodes.map(p =>
            `<option value="${p.periode_id}">${p.tahun_mulai} - ${p.tahun_selesai}</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Pilih Periode</option>' + optionsHTML;

        // Auto-populate filter dropdown if it exists
        const filterSelect = document.getElementById('filter-periode-profile');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Semua Periode</option>' + optionsHTML;
        }
    } catch (error) {
        console.error('Load periode select error:', error);
    }
}


async function loadProdiSelect() {
    try {
        const res = await fetch('/api/prodi');
        const prodis = await res.json();

        const select = document.getElementById('prodi-select');
        // Tampilkan nama prodi saja, tapi value tetap prodi_id
        select.innerHTML = '<option value="">Pilih Prodi</option>' +
            prodis.map(p =>
                `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
            ).join('');
    } catch (error) {
        console.error('Load prodi select error:', error);
    }
}