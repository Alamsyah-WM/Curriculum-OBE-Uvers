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
    // ============ PROFILE LULUSAN ============
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('profile_lulusan').find().toArray();
            const profiles = docs.map(doc => ({
                pl_id: doc._id,
                ...doc
            }));

            // Ambil data periode dan prodi untuk join
            const periodeDocs = await db.collection('periode_kurikulum').find().toArray();
            const prodiDocs = await db.collection('prodi').find().toArray();

            // Buat map
            const periodeMap = {};
            periodeDocs.forEach(doc => {
                periodeMap[doc._id] = `${doc.tahun_mulai} - ${doc.tahun_selesai}`;
            });

            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi;
            });

            // Enrich profiles dengan nama periode dan prodi
            const enrichedProfiles = profiles.map(profile => ({
                ...profile,
                periode_display: periodeMap[profile.periode_id] || profile.periode_id,
                prodi_display: prodiMap[profile.prodi_id] || profile.prodi_id
            }));

            const { search, ...filters } = req.query;
            let results = enrichedProfiles;

            // Dynamic exact match filter (for periode_id, prodi_id, etc.)
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    results = results.filter(r => r[key] === filters[key]);
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
            const { kode_pl, profesi, periode_id, prodi_id, referensi, deskripsi } = req.body;
            const newId = generateId();

            await db.collection('profile_lulusan').insertOne({
                _id: newId,
                kode_pl,
                profesi,
                periode_id,
                prodi_id,
                referensi,
                deskripsi: deskripsi || '',
                created_at: new Date()
            });

            res.json({
                message: 'Profile lulusan ditambahkan!',
                pl_id: newId  // Firebase doc ID sebagai pl_id
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { kode_pl, profesi, periode_id, prodi_id, referensi, deskripsi } = req.body;
            await db.collection('profile_lulusan').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        kode_pl,
                        profesi,
                        periode_id,
                        prodi_id,
                        referensi,
                        deskripsi
                    }
                }
            );
            res.json({ message: 'Profile lulusan berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('profile_lulusan').deleteOne({ _id: req.params.id });
            res.json({ message: 'Profile dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    return router
};