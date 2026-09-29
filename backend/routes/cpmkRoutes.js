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

    // GET semua CPMK
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('cpmk').find().toArray();
            const cpmks = docs.map(doc => ({
                cpmk_id: doc._id,
                ...doc
            }));

            // Join ke Mata Kuliah
            const mkDocs = await db.collection('mata_kuliah').find().toArray();
            const mkMap = {};
            const prodiMapFromMk = {}; // untuk bantu dapat prodi_id
            mkDocs.forEach(doc => {
                mkMap[doc._id] = doc.nama_mk_id; // Simpan nama MK ID
                prodiMapFromMk[doc._id] = doc.prodi_id;
            });

            // Join ke Prodi
            const prodiDocs = await db.collection('prodi').find().toArray();
            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi;
            });

            // Join ke CPL
            const cplDocs = await db.collection('cpl').find().toArray();
            const cplMap = {};
            cplDocs.forEach(doc => {
                cplMap[doc._id] = doc.kode_cpl;
            });

            // Join ke SubCPMK (untuk ambil mapping ke CPMK)
            const subcpmkDocs = await db.collection('subcpmk').find().toArray();
            const subcpmkMap = {};
            subcpmkDocs.forEach(doc => {
                subcpmkMap[doc._id] = doc.cpmk_id;
            });

            // Join ke Asesmen (untuk agregasi bobot)
            const asesmenDocs = await db.collection('asesmen').find().toArray();
            const cpmkBobotCalculated = {};
            asesmenDocs.forEach(doc => {
                const subId = doc.subcpmk_id;
                if (subId && subcpmkMap[subId]) {
                    const cpmkId = subcpmkMap[subId];
                    if (!cpmkBobotCalculated[cpmkId]) cpmkBobotCalculated[cpmkId] = 0;
                    cpmkBobotCalculated[cpmkId] += parseFloat(doc.bobot) || 0;
                }
            });

            const enriched = cpmks.map(cpmk => {
                const prodiId = prodiMapFromMk[cpmk.mk_id];
                return {
                    ...cpmk,
                    bobot: parseFloat((cpmkBobotCalculated[cpmk.cpmk_id] || 0).toFixed(2)),
                    prodi_id: prodiId,
                    nama_cpl: cpmk.cpl_id ? (cplMap[cpmk.cpl_id] || 'Tidak diketahui') : '-',
                    nama_mk: mkMap[cpmk.mk_id] || 'Tidak diketahui',
                    nama_prodi: prodiMap[prodiId] || 'Tidak diketahui'
                };
            });

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

    // POST tambah CPMK
    router.post('/', async (req, res) => {
        try {
            const { mk_id, cpl_id, kode_cpmk, deskripsi } = req.body;
            const newId = generateId();

            await db.collection('cpmk').insertOne({
                _id: newId,
                mk_id,
                cpl_id: cpl_id || null, // Tambahan CPL ID
                kode_cpmk,
                deskripsi,
                created_at: new Date()
            });

            res.json({
                message: 'CPMK ditambahkan!',
                cpmk_id: newId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { mk_id, cpl_id, kode_cpmk, deskripsi } = req.body;
            await db.collection('cpmk').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        mk_id,
                        cpl_id: cpl_id || null,
                        kode_cpmk,
                        deskripsi
                    }
                }
            );
            res.json({ message: 'CPMK berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE hapus CPMK
    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('cpmk').deleteOne({ _id: req.params.id });
            res.json({ message: 'CPMK dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
