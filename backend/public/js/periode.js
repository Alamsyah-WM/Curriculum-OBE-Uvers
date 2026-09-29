// PERIODE FUNCTIONS
let editPeriodeId = null;
let periodeDataList = [];

async function savePeriode() {
    const status = document.getElementById('periode-status');
    const data = {
        tahun_mulai: document.getElementById('tahun-mulai').value.trim(),
        tahun_selesai: document.getElementById('tahun-selesai').value.trim()
    };
    if (!data.tahun_mulai || !data.tahun_selesai) {
        showStatus('periode-status', 'Semua field harus diisi!', 'error');
        return;
    }
    const method = editPeriodeId ? 'PUT' : 'POST';
    const url = editPeriodeId ? `/api/periode/${editPeriodeId}` : '/api/periode';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        showStatus('periode-status', `${result.message}`, 'success');
        loadPeriode();
        cancelEditPeriode(); // reset form
        if (currentTab === 'profile') loadPeriodeSelect();
    } catch (error) {
        showStatus('periode-status', error.message, 'error');
    }
}

async function loadPeriode() {
    try {
        const res = await fetch(`/api/periode?search=${encodeURIComponent(document.getElementById('search-periode') ? document.getElementById('search-periode').value : '')}`);
        const periodes = await res.json();
        periodeDataList = periodes;
        renderPeriodeTable(periodes);
    } catch (error) {
        console.error('Load periode error:', error);
    }
}

function renderPeriodeTable(periodes) {
    document.getElementById('periode-list').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Tahun Mulai</th>
          <th>Tahun Selesai</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${periodes.map(p => `
          <tr>
            <td>${p.tahun_mulai}</td>
            <td>${p.tahun_selesai}</td>
            <td>
                <button onclick="editPeriode('${p.periode_id}')">Edit</button>
                <button class="danger" onclick="deletePeriode('${p.periode_id}')">Hapus</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function clearPeriodeForm() {
    document.getElementById('tahun-mulai').value = '';
    document.getElementById('tahun-selesai').value = '';
}

function editPeriode(id) {
    const p = periodeDataList.find(x => x.periode_id === id);
    if (!p) return;
    editPeriodeId = id;
    document.getElementById('tahun-mulai').value = p.tahun_mulai;
    document.getElementById('tahun-selesai').value = p.tahun_selesai;
    
    const btn = document.querySelector('#periode-section button[onclick="savePeriode()"]');
    if (btn) btn.innerText = "Update Periode";
    
    if (!document.getElementById('btn-batal-periode')) {
        const batalBtn = document.createElement('button');
        batalBtn.id = 'btn-batal-periode';
        batalBtn.innerText = "Batal Edit";
        batalBtn.className = "danger";
        batalBtn.style.marginLeft = "10px";
        batalBtn.onclick = cancelEditPeriode;
        btn.parentNode.insertBefore(batalBtn, btn.nextSibling);
    }
}

function cancelEditPeriode() {
    editPeriodeId = null;
    clearPeriodeForm();
    const btn = document.querySelector('#periode-section button[onclick="savePeriode()"]');
    if (btn) btn.innerText = "Tambah Periode";
    const batalBtn = document.getElementById('btn-batal-periode');
    if (batalBtn) batalBtn.remove();
}

async function deletePeriode(id) {
    if (!confirm('Hapus periode?')) return;
    try {
        await fetch(`/api/periode/${id}`, { method: 'DELETE' });
        loadPeriode();
        if (currentTab === 'profile') loadPeriodeSelect();
    } catch (error) {
        alert(error.message);
    }
}