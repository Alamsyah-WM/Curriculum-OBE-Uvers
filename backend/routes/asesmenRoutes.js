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

    // GET semua Asesmen
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('asesmen').find().toArray();
            const asesmenList = docs.map(doc => ({
                asesmen_id: doc._id,
                ...doc
            }));

            // Fetch relations
            const subcpmkDocs = await db.collection('subcpmk').find().toArray();
            const subcpmkMap = {};
            const cpmkIdMapFromSubcpmk = {};
            subcpmkDocs.forEach(doc => {
                subcpmkMap[doc._id] = doc.kode_subcpmk;
                cpmkIdMapFromSubcpmk[doc._id] = doc.cpmk_id;
            });
            
            const cpmkDocs = await db.collection('cpmk').find().toArray();
            const cpmkMap = {};
            const mkIdMapFromCpmk = {};
            cpmkDocs.forEach(doc => {
                cpmkMap[doc._id] = doc.kode_cpmk;
                mkIdMapFromCpmk[doc._id] = doc.mk_id;
            });

            const mkDocs = await db.collection('mata_kuliah').find().toArray();
            const mkMap = {};
            const prodiMapFromMk = {};
            mkDocs.forEach(doc => {
                mkMap[doc._id] = doc.nama_mk_id;
                prodiMapFromMk[doc._id] = doc.prodi_id;
            });

            const prodiDocs = await db.collection('prodi').find().toArray();
            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi;
            });

            // Enrich asesmen data
            const enriched = asesmenList.map(item => {
                const cpmkId = cpmkIdMapFromSubcpmk[item.subcpmk_id];
                const mkId = cpmkId ? mkIdMapFromCpmk[cpmkId] : null;
                const prodiId = mkId ? prodiMapFromMk[mkId] : null;

                return {
                    ...item,
                    kode_subcpmk: subcpmkMap[item.subcpmk_id] || 'Tidak diketahui',
                    kode_cpmk: cpmkId ? cpmkMap[cpmkId] : 'Tidak diketahui',
                    nama_mk: mkId ? mkMap[mkId] : 'Tidak diketahui',
                    nama_prodi: prodiId ? prodiMap[prodiId] : 'Tidak diketahui'
                };
            });

            const { search } = req.query;
            let results = enriched;
            if (search) {
                const s = search.toLowerCase();
                results = results.filter(r => Object.values(r).some(val => val !== null && val !== undefined && val.toString().toLowerCase().includes(s)));
            }
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // POST tambah Asesmen
    router.post('/', async (req, res) => {
        try {
            const { subcpmk_id, nama_asesmen, deskripsi, bobot, teknik_penilaian } = req.body;
            const bobotBaru = parseFloat(bobot) || 0;
            const newId = generateId();

            // Simpan data
            await db.collection('asesmen').insertOne({
                _id: newId,
                subcpmk_id,
                nama_asesmen,
                deskripsi,
                bobot: bobotBaru,
                teknik_penilaian: teknik_penilaian || null,
                created_at: new Date()
            });

            res.json({
                message: 'Asesmen berhasil ditambahkan!',
                asesmen_id: newId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { subcpmk_id, nama_asesmen, deskripsi, bobot, teknik_penilaian } = req.body;
            const bobotBaru = parseFloat(bobot) || 0;

            await db.collection('asesmen').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        subcpmk_id,
                        nama_asesmen,
                        deskripsi,
                        bobot: bobotBaru,
                        teknik_penilaian: teknik_penilaian || null
                    }
                }
            );

            res.json({ message: 'Asesmen berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE hapus Asesmen
    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('asesmen').deleteOne({ _id: req.params.id });
            res.json({ message: 'Asesmen dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
