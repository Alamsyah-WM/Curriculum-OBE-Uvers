// public/js/cpl.js
let editCplId = null;
let cplDataList = [];

// load daftar profile_lulusan ke select pl_id
async function loadPlSelect() {
  try {
    const res = await fetch('/api/profile');
    let profiles = await res.json();

    // Filter profile berdasarkan prodi dosen login
    if (window.currentUser && window.currentUser.prodi_id) {
      profiles = profiles.filter(p => p.prodi_id === window.currentUser.prodi_id);
    }

    const select = document.getElementById('pl-select');
    const select2 = document.getElementById('pl-select-2');
    
    const optionsHTML = '<option value="">-- Pilih Profile Lulusan --</option>' +
      profiles
        .map(
          p =>
            `<option value="${p.pl_id}">
              ${p.kode_pl} - ${p.profesi}
            </option>`
        )
        .join('');
        
    select.innerHTML = optionsHTML;
    select2.innerHTML = '<option value="">-- Pilih Profile Lulusan 2 (Opsional) --</option>' + 
      profiles
        .map(
          p =>
            `<option value="${p.pl_id}">
              ${p.kode_pl} - ${p.profesi}
            </option>`
        )
        .join('');
  } catch (error) {
    console.error('Error load PL:', error);
  }
}

// simpan CPL baru (CREATE)
async function saveCpl() {
  const plId1 = document.getElementById('pl-select').value;
  const plId2 = document.getElementById('pl-select-2').value;
  
  const plIds = [];
  if (plId1) plIds.push(plId1);
  if (plId2 && plId2 !== plId1) plIds.push(plId2);

  const data = {
    pl_ids: plIds,
    kode_cpl: document.getElementById('kode-cpl').value.trim(),
    deskripsi: document.getElementById('deskripsi-cpl').value.trim(),
    referensi: document.getElementById('referensi-cpl').value.trim()
  };

  if (data.pl_ids.length === 0 || !data.kode_cpl || !data.deskripsi) {
    showStatus('cpl-status', 'Field wajib: PL (Minimal 1), Kode CPL, Deskripsi!', 'error');
    return;
  }

  const method = editCplId ? 'PUT' : 'POST';
  const url = editCplId ? `/api/cpl/${editCplId}` : '/api/cpl';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    showStatus(
      'cpl-status',
      `${result.message}`,
      'success'
    );

    loadCpl();
    cancelEditCpl();
  } catch (error) {
    showStatus('cpl-status', `Error: ${error.message}`, 'error');
  }
}

function clearCplForm() {
  document.getElementById('pl-select').value = '';
  document.getElementById('pl-select-2').value = '';
  document.getElementById('kode-cpl').value = '';
  document.getElementById('deskripsi-cpl').value = '';
  document.getElementById('referensi-cpl').value = '';
}

function getCplFilters() {
    const params = new URLSearchParams();
    const filters = document.querySelectorAll('.filter-cpl');
    filters.forEach(f => {
        if (f.value) {
            params.append(f.name, f.value);
        }
    });
    return params.toString();
}

// READ: load daftar CPL
async function loadCpl() {
  try {
    const queryString = getCplFilters();
    const res = await fetch(`/api/cpl?${queryString}`);
    const cplList = await res.json();
    cplDataList = cplList;
    renderCplTable(cplList);
  } catch (error) {
    console.error('Load CPL error:', error);
  }
}

// RENDER tabel CPL
function renderCplTable(cplList) {
  const container = document.getElementById('cpl-list');

  if (!cplList || cplList.length === 0) {
    container.innerHTML = 'Belum ada data CPL.';
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Kode CPL</th>
          <th>Deskripsi</th>
          <th>Profile Lulusan 1</th>
          <th>Profile Lulusan 2</th>
          <th>Referensi</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${cplList.map(c => `
          <tr>
            <td>${c.kode_cpl || '-'}</td>
            <td>${c.deskripsi || '-'}</td>
            <td>${c.profile_display || c.pl_id || '-'}</td>
            <td>${c.profile_display_2 || c.pl_id_2 || '-'}</td>
            <td>${c.referensi || '-'}</td>
            <td>
              <button onclick="editCpl('${c.cpl_id}')">Edit</button>
              <button class="danger" onclick="deleteCpl('${c.cpl_id}')">Hapus</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function editCpl(id) {
    const c = cplDataList.find(x => x.cpl_id === id);
    if (!c) return;
    editCplId = id;
    
    const plIds = c.pl_ids || [];
    if (c.pl_id && !plIds.includes(c.pl_id)) plIds.push(c.pl_id);
    if (c.pl_id_2 && !plIds.includes(c.pl_id_2)) plIds.push(c.pl_id_2);

    document.getElementById('pl-select').value = plIds[0] || '';
    document.getElementById('pl-select-2').value = plIds[1] || '';
    document.getElementById('kode-cpl').value = c.kode_cpl || '';
    document.getElementById('deskripsi-cpl').value = c.deskripsi || '';
    document.getElementById('referensi-cpl').value = c.referensi || '';
    
    const btn = document.querySelector('#cpl-section button[onclick="saveCpl()"]');
    if (btn) btn.innerText = "Update CPL";
    
    if (!document.getElementById('btn-batal-cpl')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-cpl';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditCpl;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditCpl() {
    editCplId = null;
    clearCplForm();
    const btn = document.querySelector('#cpl-section button[onclick="saveCpl()"]');
    if (btn) btn.innerText = "Tambah CPL";
    const batalBtn = document.getElementById('btn-batal-cpl');
    if (batalBtn) batalBtn.remove();
}

// DELETE CPL
async function deleteCpl(id) {
  if (!confirm('Yakin hapus CPL?')) return;

  try {
    const res = await fetch(`/api/cpl/${id}`, { method: 'DELETE' });
    const result = await res.json();
    showStatus('cpl-status', result.message, 'success');
    loadCpl();
  } catch (error) {
    showStatus('cpl-status', `Error: ${error.message}`, 'error');
  }
}

async function loadProdiCplFilter() {
    try {
        const res = await fetch('/api/prodi');
        const prodis = await res.json();
        const filterSelect = document.getElementById('filter-prodi-cpl');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Semua Prodi</option>' + 
                prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
        }
    } catch (error) {
        console.error('Load prodi filter error:', error);
    }
}

// panggil saat halaman load (pastikan ada event DOMContentLoaded di index.html atau file utama)
document.addEventListener('DOMContentLoaded', () => {
  loadPlSelect();
  loadProdiCplFilter();
  loadCpl();
});
