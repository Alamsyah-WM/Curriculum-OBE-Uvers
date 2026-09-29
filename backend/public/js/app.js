// let currentTab = 'periode';

// function showTab(tab) {
//   document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
//   document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
//   document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
//   document.getElementById(tab + '-section').classList.add('active');
//   currentTab = tab;
//   loadData(tab);
// }

// function loadData(tab) {
//   if (tab === 'periode') loadPeriode();
//   else if (tab === 'prodi') loadProdi();
//   else if (tab === 'profile') {
//     loadPeriodeSelect();
//     loadProdiSelect();
//     loadProfile();
//   }
//   else if (tab === 'mahasiswa') {
//     loadProdiSelectMahasiswa();
//     loadMahasiswa();
//   }
//   else if (tab === 'dosen') {
//     loadProdiSelectDosen();
//     loadDosen();
//   }
// }



// // PERIODE FUNCTIONS
// async function savePeriode() {
//   const status = document.getElementById('periode-status');
//   const data = {
//     tahun_mulai: document.getElementById('tahun-mulai').value.trim(),
//     tahun_selesai: document.getElementById('tahun-selesai').value.trim()
//   };
//   if (!data.tahun_mulai || !data.tahun_selesai) {
//     showStatus('periode-status', 'Semua field harus diisi!', 'error');
//     return;
//   }
//   try {
//     const res = await fetch('/api/periode', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     const result = await res.json();
//     showStatus('periode-status', `${result.message} - ID: ${result.periode_id}`, 'success');
//     loadPeriode();
//     clearPeriodeForm();
//     if (currentTab === 'profile') loadPeriodeSelect();
//   } catch (error) {
//     showStatus('periode-status', error.message, 'error');
//   }
// }

// async function loadPeriode() {
//   try {
//     const res = await fetch('/api/periode');
//     const periodes = await res.json();
//     renderPeriodeTable(periodes);
//   } catch (error) {
//     console.error('Load periode error:', error);
//   }
// }

// function renderPeriodeTable(periodes) {
//   document.getElementById('periode-list').innerHTML = `
//     <table>
//       <thead>
//         <tr>
//           <th>Tahun Mulai</th>
//           <th>Tahun Selesai</th>
//           <th>Aksi</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${periodes.map(p => `
//           <tr>
//             <td>${p.tahun_mulai}</td>
//             <td>${p.tahun_selesai}</td>
//             <td><button class="danger" onclick="deletePeriode('${p.periode_id}')">Hapus</button></td>
//           </tr>
//         `).join('')}
//       </tbody>
//     </table>
//   `;
// }


// function clearPeriodeForm() {
//   document.getElementById('tahun-mulai').value = '';
//   document.getElementById('tahun-selesai').value = '';
// }

// async function deletePeriode(id) {
//   if (!confirm('Hapus periode?')) return;
//   try {
//     await fetch(`/api/periode/${id}`, { method: 'DELETE' });
//     loadPeriode();
//     if (currentTab === 'profile') loadPeriodeSelect();
//   } catch (error) {
//     alert(error.message);
//   }
// }

// // PRODI FUNCTIONS
// async function saveProdi() {
//   const status = document.getElementById('prodi-status');
//   const data = {
//     // Hapus prodi_id dari input, akan di-generate otomatis
//     kode_prodi: document.getElementById('kode-prodi').value.trim(),
//     nama_prodi: document.getElementById('nama-prodi').value.trim()
//   };

//   if (!data.kode_prodi || !data.nama_prodi) {
//     showStatus('prodi-status', 'Semua field harus diisi!', 'error');
//     return;
//   }

//   try {
//     const res = await fetch('/api/prodi', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     const result = await res.json();
//     showStatus('prodi-status', `${result.message} - ID: ${result.prodi_id}`, 'success');
//     loadProdi();
//     clearProdiForm();
//     if (currentTab === 'profile') loadProdiSelect();
//   } catch (error) {
//     showStatus('prodi-status', error.message, 'error');
//   }
// }

// async function loadProdi() {
//   try {
//     const res = await fetch('/api/prodi');
//     const prodis = await res.json();
//     renderProdiTable(prodis);
//   } catch (error) { console.error('Load prodi error:', error); }
// }

// function renderProdiTable(prodis) {
//   document.getElementById('prodi-list').innerHTML = `
//     <table>
//       <thead>
//         <tr>
//           <th>Kode</th>
//           <th>Nama</th>
//           <th>Aksi</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${prodis.map(p => `
//           <tr>
//             <td>${p.kode_prodi}</td>
//             <td>${p.nama_prodi}</td>
//             <td><button class="danger" onclick="deleteProdi('${p.prodi_id}')">Hapus</button></td>
//           </tr>
//         `).join('')}
//       </tbody>
//     </table>
//   `;
// }


// function clearProdiForm() {
//   document.getElementById('kode-prodi').value =
//     document.getElementById('nama-prodi').value = '';
// }

// async function deleteProdi(id) {
//   if (!confirm('Hapus prodi?')) return;
//   try {
//     await fetch(`/api/prodi/${id}`, { method: 'DELETE' });
//     loadProdi(); if (currentTab === 'profile') loadProdiSelect();
//   } catch (error) { alert(error.message); }
// }

// async function loadProdiSelect() {
//   try {
//     const res = await fetch('/api/prodi'); const prodis = await res.json();
//     document.getElementById('prodi-select').innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p => `<option value="${p.prodi_id}">${p.prodi_id} - ${p.nama_prodi}</option>`).join('');
//   } catch (error) { console.error(error); }
// }

// async function saveProfile() {
//   const status = document.getElementById('profile-status');
//   const data = {
//     periode_id: document.getElementById('periode-select').value,
//     prodi_id: document.getElementById('prodi-select').value,
//     kode_pl: document.getElementById('kode-pl').value.trim(),
//     profesi: document.getElementById('profesi').value.trim(),
//     referensi: document.getElementById('referensi').value.trim()
//   };

//   // Validasi field wajib
//   if (!data.periode_id || !data.prodi_id || !data.kode_pl || !data.profesi) {
//     showStatus('profile-status', 'Field wajib: Periode, Prodi, Kode PL, Profesi!', 'error');
//     return;
//   }

//   try {
//     const res = await fetch('/api/profile', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });

//     const result = await res.json();

//     // Perbaikan: gunakan result.pl_id untuk ID yang di-generate
//     showStatus('profile-status', `${result.message} - ID: ${result.pl_id}`, 'success');

//     loadProfile();
//     clearProfileForm();
//   } catch (error) {
//     showStatus('profile-status', `Error: ${error.message}`, 'error');
//   }
// }


// async function loadProfile() {
//   try {
//     const res = await fetch('/api/profile');
//     const profiles = await res.json();
//     renderProfileTable(profiles);
//   } catch (error) {
//     console.error('Load profile error:', error);
//   }
// }


// function renderProfileTable(profiles) {
//   if (profiles.length === 0) {
//     document.getElementById('profile-list').innerHTML = '<p>Belum ada data profile lulusan.</p>';
//     return;
//   }

//   document.getElementById('profile-list').innerHTML = `
//     <table>
//       <thead>
//         <tr>
//           <th>Kode PL</th>
//           <th>Profesi</th>
//           <th>Periode</th>
//           <th>Prodi</th>
//           <th>Referensi</th>
//           <th>Aksi</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${profiles.map(p => `
//           <tr>
//             <td>${p.kode_pl || '-'}</td>
//             <td>${p.profesi || '-'}</td>
//             <td>${p.periode_display || '-'}</td>
//             <td>${p.prodi_display || '-'}</td>
//             <td>${p.referensi || '-'}</td>
//             <td><button class="danger" onclick="deleteProfile('${p.pl_id}')">Hapus</button></td>
//           </tr>
//         `).join('')}
//       </tbody>
//     </table>
//   `;
// }


// function clearProfileForm() {
//   document.getElementById('periode-select').value = '';
//   document.getElementById('prodi-select').value = '';
//   document.getElementById('kode-pl').value = '';
//   document.getElementById('profesi').value = '';
//   document.getElementById('referensi').value = '';
// }

// async function deleteProfile(id) {
//   if (!confirm('Hapus profile?')) return;
//   try {
//     await fetch(`/api/profile/${id}`, { method: 'DELETE' });
//     loadProfile();
//   } catch (error) {
//     alert(error.message);
//   }
// }

// async function loadPeriodeSelect() {
//   try {
//     const res = await fetch('/api/periode');
//     const periodes = await res.json();

//     const select = document.getElementById('periode-select');
//     // Tampilkan tahun mulai - tahun selesai, tapi value tetap periode_id
//     select.innerHTML = '<option value="">Pilih Periode</option>' +
//       periodes.map(p =>
//         `<option value="${p.periode_id}">${p.tahun_mulai} - ${p.tahun_selesai}</option>`
//       ).join('');
//   } catch (error) {
//     console.error('Load periode select error:', error);
//   }
// }


// async function loadProdiSelect() {
//   try {
//     const res = await fetch('/api/prodi');
//     const prodis = await res.json();

//     const select = document.getElementById('prodi-select');
//     // Tampilkan nama prodi saja, tapi value tetap prodi_id
//     select.innerHTML = '<option value="">Pilih Prodi</option>' +
//       prodis.map(p =>
//         `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
//       ).join('');
//   } catch (error) {
//     console.error('Load prodi select error:', error);
//   }
// }

// // MAHASISWA FUNCTIONS
// async function saveMahasiswa() {
//   const status = document.getElementById('mahasiswa-status');
//   const data = {
//     nama: document.getElementById('nama-mahasiswa').value.trim(),
//     nim: document.getElementById('nim-mahasiswa').value.trim(),
//     prodi_id: document.getElementById('prodi-mahasiswa-select').value,
//     angkatan: document.getElementById('angkatan-mahasiswa').value.trim()
//   };
//   if (!data.nama || !data.nim || !data.prodi_id || !data.angkatan) {
//     showStatus('mahasiswa-status', 'Semua field harus diisi!', 'error');
//     return;
//   }
//   try {
//     const res = await fetch('/api/mahasiswa', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     const result = await res.json();
//     showStatus('mahasiswa-status', `${result.message} - ID: ${result.mahasiswa_id}`, 'success');
//     loadMahasiswa();
//     clearMahasiswaForm();
//   } catch (error) {
//     showStatus('mahasiswa-status', error.message, 'error');
//   }
// }

// async function loadMahasiswa() {
//   try {
//     const res = await fetch('/api/mahasiswa');
//     const mahasiswas = await res.json();
//     renderMahasiswaTable(mahasiswas);
//   } catch (error) {
//     console.error('Load mahasiswa error:', error);
//   }
// }

  // function renderMahasiswaTable(mahasiswas) {
  //   if (mahasiswas.length === 0) {
  //     document.getElementById('mahasiswa-list').innerHTML = '<p>Belum ada data mahasiswa.</p>';
  //     return;
  //   }
  //   document.getElementById('mahasiswa-list').innerHTML = `
  //     <table>
  //       <thead>
  //         <tr>
  //           <th>Nama</th>
  //           <th>NIM</th>
  //           <th>Prodi</th>
  //           <th>Angkatan</th>
  //           <th>Aksi</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         ${mahasiswas.map(m => `
  //           <tr>
  //             <td>${m.nama}</td>
  //             <td>${m.nim}</td>
  //             <td>${m.nama_prodi}</td>
  //             <td>${m.angkatan}</td>
  //             <td><button class="danger" onclick="deleteMahasiswa('${m.mahasiswa_id}')">Hapus</button></td>
  //           </tr>
  //         `).join('')}
  //       </tbody>
  //     </table>
  //   `;
  // }

// function clearMahasiswaForm() {
//   document.getElementById('nama-mahasiswa').value = '';
//   document.getElementById('nim-mahasiswa').value = '';
//   document.getElementById('prodi-mahasiswa-select').value = '';
//   document.getElementById('angkatan-mahasiswa').value = '';
// }

// async function deleteMahasiswa(id) {
//   if (!confirm('Hapus mahasiswa?')) return;
//   try {
//     await fetch(`/api/mahasiswa/${id}`, { method: 'DELETE' });
//     loadMahasiswa();
//   } catch (error) {
//     alert(error.message);
//   }
// }

// async function loadProdiSelectMahasiswa() {
//   try {
//     const res = await fetch('/api/prodi');
//     const prodis = await res.json();
//     const select = document.getElementById('prodi-mahasiswa-select');
//     select.innerHTML = '<option value="">Pilih Prodi</option>' +
//       prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
//   } catch (error) {
//     console.error(error);
//   }
// }

// // DOSEN FUNCTIONS
// async function saveDosen() {
//   const data = {
//     nama_dosen: document.getElementById('nama-dosen').value.trim(),
//     nidn: document.getElementById('nidn-dosen').value.trim(),
//     prodi_id: document.getElementById('prodi-dosen-select').value
//   };

//   if (!data.nama_dosen || !data.nidn || !data.prodi_id) {
//     showStatus('dosen-status', 'Semua field harus diisi!', 'error');
//     return;
//   }

//   try {
//     const res = await fetch('/api/dosen', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     const result = await res.json();
//     showStatus('dosen-status', `${result.message} - ID: ${result.dosen_id}`, 'success');
//     loadDosen();
//     clearDosenForm();
//   } catch (error) {
//     showStatus('dosen-status', error.message, 'error');
//   }
// }

// async function loadDosen() {
//   try {
//     const res = await fetch('/api/dosen');
//     const dosens = await res.json();
//     renderDosenTable(dosens);
//   } catch (error) {
//     console.error('Load dosen error:', error);
//   }
// }

// function renderDosenTable(dosens) {
//   if (dosens.length === 0) {
//     document.getElementById('dosen-list').innerHTML = '<p>Belum ada data dosen.</p>';
//     return;
//   }
//   document.getElementById('dosen-list').innerHTML = `
//     <table>
//       <thead>
//         <tr>
//           <th>Nama Dosen</th>
//           <th>NIDN</th>
//           <th>Prodi</th>
//           <th>Aksi</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${dosens.map(d => `
//           <tr>
//             <td>${d.nama_dosen}</td>
//             <td>${d.nidn}</td>
//             <td>${d.nama_prodi}</td>
//             <td><button class="danger" onclick="deleteDosen('${d.dosen_id}')">Hapus</button></td>
//           </tr>
//         `).join('')}
//       </tbody>
//     </table>
//   `;
// }

// function clearDosenForm() {
//   document.getElementById('nama-dosen').value = '';
//   document.getElementById('nidn-dosen').value = '';
//   document.getElementById('prodi-dosen-select').value = '';
// }

// async function deleteDosen(id) {
//   if (!confirm('Hapus dosen?')) return;
//   try {
//     await fetch(`/api/dosen/${id}`, { method: 'DELETE' });
//     loadDosen();
//   } catch (error) {
//     alert(error.message);
//   }
// }

// async function loadProdiSelectDosen() {
//   try {
//     const res = await fetch('/api/prodi');
//     const prodis = await res.json();
//     const select = document.getElementById('prodi-dosen-select');
//     select.innerHTML = '<option value="">Pilih Prodi</option>' +
//       prodis.map(p => `<option value="${p.prodi_id}">${p.nama_prodi}</option>`).join('');
//   } catch (error) {
//     console.error(error);
//   }
// }



// function showStatus(elementId, message, type) {
//   const status = document.getElementById(elementId);
//   status.innerHTML = `<div class="${type}">${message}</div>`;
//   setTimeout(() => status.innerHTML = '', 5000);
// }

// document.addEventListener('DOMContentLoaded', () => showTab('periode'));
