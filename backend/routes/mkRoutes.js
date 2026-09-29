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

    // GET semua MK
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('mata_kuliah').find().toArray();
            const mks = docs.map(doc => ({
                mk_id: doc._id,
                ...doc
            }));

            // Join ke dosen
            const dosenDocs = await db.collection('dosen').find().toArray();
            const dosenMap = {};
            dosenDocs.forEach(doc => {
                dosenMap[doc._id] = doc.nama_dosen;
            });

            // Join ke prodi
            const prodiDocs = await db.collection('prodi').find().toArray();
            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi;
            });

            // Join ke CPL untuk ambil kode_cpl
            const cplDocs = await db.collection('cpl').find().toArray();
            const cplMap = {};
            cplDocs.forEach(doc => {
                cplMap[doc._id] = doc.kode_cpl;
            });

            const enriched = mks.map(mk => {
                // Konversi array cpl_ids jadi string "CPL01, CPL02"
                const cplDisplay = mk.cpl_ids && mk.cpl_ids.length > 0
                    ? mk.cpl_ids.map(id => cplMap[id] || id).join(', ')
                    : '-';

                return {
                    ...mk,
                    nama_dosen: dosenMap[mk.dosen_id] || 'Tidak diketahui',
                    nama_prodi: prodiMap[mk.prodi_id] || 'Tidak diketahui',
                    cpl_display: cplDisplay
                };
            });

            const { search, ...filters } = req.query;
            let results = enriched;

            // Dynamic exact match filter
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

    // POST tambah MK
    router.post('/', async (req, res) => {
        try {
            const { kode_mk, nama_mk_id, nama_mk_en, prodi_id, dosen_id, semester, cpl_ids } = req.body;
            const newId = generateId();

            await db.collection('mata_kuliah').insertOne({
                _id: newId,
                kode_mk,
                nama_mk_id,
                nama_mk_en,
                prodi_id,
                dosen_id,
                semester: parseInt(semester),
                cpl_ids: cpl_ids || [], // Array CPL IDs
                created_at: new Date()
            });

            res.json({
                message: 'Mata Kuliah ditambahkan!',
                mk_id: newId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { kode_mk, nama_mk_id, nama_mk_en, prodi_id, dosen_id, semester, cpl_ids } = req.body;
            await db.collection('mata_kuliah').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        kode_mk,
                        nama_mk_id,
                        nama_mk_en,
                        prodi_id,
                        dosen_id,
                        semester: parseInt(semester),
                        cpl_ids: cpl_ids || []
                    }
                }
            );
            res.json({ message: 'Mata Kuliah berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE hapus MK
    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('mata_kuliah').deleteOne({ _id: req.params.id });
            res.json({ message: 'Mata Kuliah dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
