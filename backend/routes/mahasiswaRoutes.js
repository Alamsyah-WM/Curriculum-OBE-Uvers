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
    // MAHASISWA
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('mahasiswa').find().toArray();
            const mahasiswas = docs.map(doc => ({
                mahasiswa_id: doc._id, // Gunakan document ID sebagai mahasiswa_id
                ...doc
            }));
            // Enrich dengan nama prodi
            const prodiDocs = await db.collection('prodi').find().toArray();
            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi;
            });
            const enrichedMahasiswas = mahasiswas.map(m => ({
                ...m,
                nama_prodi: prodiMap[m.prodi_id] || 'Tidak diketahui'
            }));
            const { search, ...filters } = req.query;
            let results = enrichedMahasiswas;
            
            // ROLE-BASED FILTERING
            const activeRole = req.headers['x-active-role'];
            const dosenId = req.headers['x-dosen-id'];
            
            if (activeRole === 'dosen' && dosenId) {
                // Ambil daftar mk_id yang diajar oleh dosen ini
                const mkDocs = await db.collection('mata_kuliah').find({ dosen_id: dosenId }).toArray();
                const mkIdsDosen = mkDocs.map(d => d._id);
                
                // Filter mahasiswa yang mk_ids-nya beririsan dengan mkIdsDosen
                results = results.filter(m => {
                    const mKIds = m.mk_ids || [];
                    return mKIds.some(id => mkIdsDosen.includes(id));
                });
            }

            // Dynamic exact match filters
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
            const { nama, nim, prodi_id, angkatan, mk_ids } = req.body;
            const newId = generateId();
            await db.collection('mahasiswa').insertOne({
                _id: newId,
                nama,
                nim,
                prodi_id,
                angkatan,
                mk_ids: mk_ids || [], // Inisialisasi empty array jika tidak ada
                created_at: new Date()
            });
            res.json({
                message: 'Mahasiswa ditambahkan!',
                mahasiswa_id: newId // Firebase doc ID sebagai mahasiswa_id
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { nama, nim, prodi_id, angkatan } = req.body;
            await db.collection('mahasiswa').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        nama,
                        nim,
                        prodi_id,
                        angkatan
                    }
                }
            );
            res.json({ message: 'Mahasiswa berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // UPDATE KRS (mk_ids)
    router.put('/:id/krs', async (req, res) => {
        try {
            const { mk_ids } = req.body;
            await db.collection('mahasiswa').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        mk_ids: mk_ids || []
                    }
                }
            );
            res.json({ message: 'KRS Mahasiswa berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('mahasiswa').deleteOne({ _id: req.params.id });
            res.json({ message: 'Mahasiswa dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router
};