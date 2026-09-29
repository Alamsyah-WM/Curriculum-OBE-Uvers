// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const admin = require('firebase-admin');
// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// // ============ PERIODE KURIKULUM ============
// app.get('/api/periode', async (req, res) => {
//   try {
//     const snapshot = await db.collection('periode_kurikulum').get();
//     const periodes = snapshot.docs.map(doc => ({ 
//       periode_id: doc.id,  // Gunakan document ID sebagai periode_id
//       ...doc.data() 
//     }));
//     res.json(periodes);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/periode', async (req, res) => {
//   try {
//     const { tahun_mulai, tahun_selesai } = req.body;
    
//     // Buat document dengan auto-generated ID dari Firebase
//     const docRef = await db.collection('periode_kurikulum').add({
//       tahun_mulai,
//       tahun_selesai,
//       created_at: admin.firestore.FieldValue.serverTimestamp()
//     });
    
//     res.json({ 
//       message: 'Periode ditambahkan!', 
//       periode_id: docRef.id  // Firebase doc ID sebagai periode_id
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.delete('/api/periode/:id', async (req, res) => {
//   try {
//     await db.collection('periode_kurikulum').doc(req.params.id).delete();
//     res.json({ message: 'Periode dihapus!' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // ============ PRODI ============
// app.get('/api/prodi', async (req, res) => {
//   try {
//     const snapshot = await db.collection('prodi').get();
//     const prodis = snapshot.docs.map(doc => ({ 
//       prodi_id: doc.id,  // Gunakan document ID sebagai prodi_id
//       ...doc.data() 
//     }));
//     res.json(prodis);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/prodi', async (req, res) => {
//   try {
//     const { kode_prodi, nama_prodi } = req.body;
    
//     const docRef = await db.collection('prodi').add({
//       kode_prodi,
//       nama_prodi,
//       created_at: admin.firestore.FieldValue.serverTimestamp()
//     });
    
//     res.json({ 
//       message: 'Prodi ditambahkan!', 
//       prodi_id: docRef.id  // Firebase doc ID sebagai prodi_id
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.delete('/api/prodi/:id', async (req, res) => {
//   try {
//     await db.collection('prodi').doc(req.params.id).delete();
//     res.json({ message: 'Prodi dihapus!' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // ============ PROFILE LULUSAN ============
// app.get('/api/profile', async (req, res) => {
//   try {
//     const snapshot = await db.collection('profile_lulusan').get();
//     const profiles = snapshot.docs.map(doc => ({
//       pl_id: doc.id,
//       ...doc.data()
//     }));
    
//     // Ambil data periode dan prodi untuk join
//     const periodeSnapshot = await db.collection('periode_kurikulum').get();
//     const prodiSnapshot = await db.collection('prodi').get();
    
//     // Buat map
//     const periodeMap = {};
//     periodeSnapshot.docs.forEach(doc => {
//       const data = doc.data();
//       periodeMap[doc.id] = `${data.tahun_mulai} - ${data.tahun_selesai}`;
//     });
    
//     const prodiMap = {};
//     prodiSnapshot.docs.forEach(doc => {
//       const data = doc.data();
//       prodiMap[doc.id] = data.nama_prodi;
//     });
    
//     // Enrich profiles dengan nama periode dan prodi
//     const enrichedProfiles = profiles.map(profile => ({
//       ...profile,
//       periode_display: periodeMap[profile.periode_id] || profile.periode_id,
//       prodi_display: prodiMap[profile.prodi_id] || profile.prodi_id
//     }));
    
//     res.json(enrichedProfiles);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// app.post('/api/profile', async (req, res) => {
//   try {
//     const { kode_pl, profesi, periode_id, prodi_id, referensi } = req.body;
    
//     const docRef = await db.collection('profile_lulusan').add({
//       kode_pl,
//       profesi,
//       periode_id,
//       prodi_id,
//       referensi,
//       created_at: admin.firestore.FieldValue.serverTimestamp()
//     });
    
//     res.json({ 
//       message: 'Profile lulusan ditambahkan!', 
//       pl_id: docRef.id  // Firebase doc ID sebagai pl_id
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.delete('/api/profile/:id', async (req, res) => {
//   try {
//     await db.collection('profile_lulusan').doc(req.params.id).delete();
//     res.json({ message: 'Profile dihapus!' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // MAHASISWA
// app.get('/api/mahasiswa', async (req, res) => {
//   try {
//     const snapshot = await db.collection('mahasiswa').get();
//     const mahasiswas = snapshot.docs.map(doc => ({
//       mahasiswa_id: doc.id, // Gunakan document ID sebagai mahasiswa_id
//       ...doc.data()
//     }));
//     // Enrich dengan nama prodi
//     const prodiSnapshot = await db.collection('prodi').get();
//     const prodiMap = {};
//     prodiSnapshot.docs.forEach(doc => {
//       const data = doc.data();
//       prodiMap[doc.id] = data.nama_prodi;
//     });
//     const enrichedMahasiswas = mahasiswas.map(m => ({
//       ...m,
//       nama_prodi: prodiMap[m.prodi_id] || 'Tidak diketahui'
//     }));
//     res.json(enrichedMahasiswas);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/mahasiswa', async (req, res) => {
//   try {
//     const { nama, nim, prodi_id, angkatan } = req.body;
//     const docRef = await db.collection('mahasiswa').add({
//       nama,
//       nim,
//       prodi_id,
//       angkatan,
//       created_at: admin.firestore.FieldValue.serverTimestamp()
//     });
//     res.json({ 
//       message: 'Mahasiswa ditambahkan!', 
//       mahasiswa_id: docRef.id // Firebase doc ID sebagai mahasiswa_id
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.delete('/api/mahasiswa/:id', async (req, res) => {
//   try {
//     await db.collection('mahasiswa').doc(req.params.id).delete();
//     res.json({ message: 'Mahasiswa dihapus!' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // DOSEN
// app.get('/api/dosen', async (req, res) => {
//   try {
//     const snapshot = await db.collection('dosen').get();
//     const dosens = snapshot.docs.map(doc => ({
//       dosen_id: doc.id,
//       ...doc.data()
//     }));

//     // Join ke prodi untuk dapat nama_prodi
//     const prodiSnapshot = await db.collection('prodi').get();
//     const prodiMap = {};
//     prodiSnapshot.docs.forEach(doc => {
//       const data = doc.data();
//       prodiMap[doc.id] = data.nama_prodi; // field di collection prodi
//     });

//     const enriched = dosens.map(d => ({
//       ...d,
//       nama_prodi: prodiMap[d.prodi_id] || 'Tidak diketahui'
//     }));

//     res.json(enriched);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/dosen', async (req, res) => {
//   try {
//     const { nama_dosen, nidn, prodi_id } = req.body;
//     const docRef = await db.collection('dosen').add({
//       nama_dosen,
//       nidn,
//       prodi_id,
//       created_at: admin.firestore.FieldValue.serverTimestamp()
//     });
//     res.json({
//       message: 'Dosen ditambahkan!',
//       dosen_id: docRef.id   // document ID sebagai dosen_id
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.delete('/api/dosen/:id', async (req, res) => {
//   try {
//     await db.collection('dosen').doc(req.params.id).delete();
//     res.json({ message: 'Dosen dihapus!' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// app.listen(PORT, () => {
//   console.log(`OBE System: http://localhost:${PORT}`);
// });
