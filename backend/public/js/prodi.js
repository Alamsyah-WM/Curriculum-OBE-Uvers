let editProdiId = null;
let prodiDataList = [];

async function saveProdi() {
    const status = document.getElementById('prodi-status');
    const data = {
        // Hapus prodi_id dari input, akan di-generate otomatis
        kode_prodi: document.getElementById('kode-prodi').value.trim(),
        nama_prodi: document.getElementById('nama-prodi').value.trim()
    };

    if (!data.kode_prodi || !data.nama_prodi) {
        showStatus('prodi-status', 'Semua field harus diisi!', 'error');
        return;
    }

    const method = editProdiId ? 'PUT' : 'POST';
    const url = editProdiId ? `/api/prodi/${editProdiId}` : '/api/prodi';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        showStatus('prodi-status', `${result.message}`, 'success');
        loadProdi();
        cancelEditProdi();
        if (currentTab === 'profile') loadProdiSelect();
    } catch (error) {
        showStatus('prodi-status', error.message, 'error');
    }
}

async function loadProdi() {
    try {
        const res = await fetch(`/api/prodi?search=${encodeURIComponent(document.getElementById('search-prodi') ? document.getElementById('search-prodi').value : '')}`);
        const prodis = await res.json();
        prodiDataList = prodis;
        renderProdiTable(prodis);
    } catch (error) { console.error('Load prodi error:', error); }
}

function renderProdiTable(prodis) {
    document.getElementById('prodi-list').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Kode</th>
          <th>Nama</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${prodis.map(p => `
          <tr>
            <td>${p.kode_prodi}</td>
            <td>${p.nama_prodi}</td>
            <td>
                <button onclick="editProdi('${p.prodi_id}')">Edit</button>
                <button class="danger" onclick="deleteProdi('${p.prodi_id}')">Hapus</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function clearProdiForm() {
    document.getElementById('kode-prodi').value =
        document.getElementById('nama-prodi').value = '';
}

function editProdi(id) {
    const p = prodiDataList.find(x => x.prodi_id === id);
    if (!p) return;
    editProdiId = id;
    document.getElementById('kode-prodi').value = p.kode_prodi;
    document.getElementById('nama-prodi').value = p.nama_prodi;
    
    const btn = document.querySelector('#prodi-section button[onclick="saveProdi()"]');
    if (btn) btn.innerText = "Update Prodi";
    
    if (!document.getElementById('btn-batal-prodi')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-prodi';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditProdi;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditProdi() {
    editProdiId = null;
    clearProdiForm();
    const btn = document.querySelector('#prodi-section button[onclick="saveProdi()"]');
    if (btn) btn.innerText = "Tambah Prodi";
    const batalBtn = document.getElementById('btn-batal-prodi');
    if (batalBtn) batalBtn.remove();
}

async function deleteProdi(id) {
    if (!confirm('Hapus prodi?')) return;
    try {
        await fetch(`/api/prodi/${id}`, { method: 'DELETE' });
        loadProdi(); if (currentTab === 'profile') loadProdiSelect();
    } catch (error) { alert(error.message); }
}