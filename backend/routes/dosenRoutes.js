const express = require('express');

const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
};

module.exports = (db, admin) => {
    const router = express.Router();
    // DOSEN
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('dosen').find().toArray();
            const dosens = docs.map(doc => ({
                dosen_id: doc._id,
                ...doc
            }));

            // Join ke prodi untuk dapat nama_prodi
            const prodiDocs = await db.collection('prodi').find().toArray();
            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi; // field di collection prodi
            });

            // Join ke periode untuk dapat nama periode
            const periodeDocs = await db.collection('periode_kurikulum').find().toArray();
            const periodeMap = {};
            periodeDocs.forEach(doc => {
                periodeMap[doc._id] = `${doc.tahun_mulai} - ${doc.tahun_selesai}`;
            });

            const enriched = dosens.map(d => ({
                ...d,
                dosenWali: d.dosenWali !== undefined ? d.dosenWali : !!d.angkatan,
                nama_prodi: prodiMap[d.prodi_id] || 'Tidak diketahui',
                periode_display: d.periode_id ? (periodeMap[d.periode_id] || d.periode_id) : null,
                roles: d.roles || (d.role ? [d.role] : ['dosen'])
            }));

            const { search, ...filters } = req.query;
            let results = enriched;

            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    results = results.filter(r => String(r[key]) === String(filters[key]));
                }
            });

            if (search) {
                const s = search.toLowerCase();
                results = results.filter(r => Object.values(r).some(val => val !== null && val !== undefined && val.toString().toLowerCase().includes(s)));
            }
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { nama_dosen, nidn, prodi_id, email, password, role, roles, periode_id, angkatan } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email dan password wajib diisi untuk membuat akun.' });
            }

            // 1. Buat user di Firebase Authentication
            const userRecord = await admin.auth().createUser({
                email: email,
                password: password,
                displayName: nama_dosen
            });

            // 2. Simpan profil dosen ke MongoDB, hubungkan dengan UID Firebase
            const newId = generateId();
            const docData = {
                _id: newId,
                nama_dosen,
                nidn,
                prodi_id,
                email, // Simpan referensi email di database
                roles: roles || (role ? [role] : []), // menggunakan field array roles
                uid: userRecord.uid, // Ini kunci untuk tahu dosen mana yang login
                created_at: new Date()
            };
            if (periode_id) docData.periode_id = periode_id;
            if (angkatan) {
                docData.angkatan = parseInt(angkatan) || angkatan;
                docData.dosenWali = true;
            } else {
                docData.dosenWali = false;
            }

            await db.collection('dosen').insertOne(docData);

            res.json({
                message: 'Dosen ditambahkan dan akun berhasil dibuat!',
                dosen_id: newId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { nama_dosen, nidn, prodi_id, email, password, roles, role, periode_id, angkatan } = req.body;

            const docParams = await db.collection('dosen').findOne({ _id: req.params.id });
            if (!docParams) return res.status(404).json({ error: 'Dosen tidak ditemukan' });
            const data = docParams;

            const updateFields = {
                nama_dosen,
                nidn,
                prodi_id,
                roles: roles || (role ? [role] : []),
            };
            if (email) updateFields.email = email;
            
            if (data.uid) {
                const authUpdate = {};
                if (email) authUpdate.email = email;
                if (password) authUpdate.password = password;
                if (nama_dosen) authUpdate.displayName = nama_dosen;
                
                if (Object.keys(authUpdate).length > 0) {
                    await admin.auth().updateUser(data.uid, authUpdate).catch(e => console.error('Error update auth:', e));
                }
            }

            const unsetFields = {};
            if (periode_id) updateFields.periode_id = periode_id;
            else unsetFields.periode_id = "";
            
            if (angkatan) {
                updateFields.angkatan = parseInt(angkatan) || angkatan;
                updateFields.dosenWali = true;
            } else {
                unsetFields.angkatan = "";
                updateFields.dosenWali = false;
            }

            const updateDoc = { $set: updateFields };
            if (Object.keys(unsetFields).length > 0) {
                updateDoc.$unset = unsetFields;
            }

            await db.collection('dosen').updateOne({ _id: req.params.id }, updateDoc);
            res.json({ message: 'Dosen berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            // Hapus juga akun Firebase-nya jika ada UID terhubung
            const docParams = await db.collection('dosen').findOne({ _id: req.params.id });
            if (docParams) {
                const data = docParams;
                if (data.uid) {
                    await admin.auth().deleteUser(data.uid).catch(e => console.error('Error delete auth fallback:', e));
                }
            }

            // Hapus dokumen di MongoDB
            await db.collection('dosen').deleteOne({ _id: req.params.id });
            res.json({ message: 'Dosen beserta akun login dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    return router
};