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

    // GET semua SubCPMK
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('subcpmk').find().toArray();
            const subcpmks = docs.map(doc => ({
                subcpmk_id: doc._id,
                ...doc
            }));

            // Join ke CPMK
            const cpmkDocs = await db.collection('cpmk').find().toArray();
            const cpmkMap = {};
            const mkIdMapFromCpmk = {}; 
            cpmkDocs.forEach(doc => {
                cpmkMap[doc._id] = doc.kode_cpmk;
                mkIdMapFromCpmk[doc._id] = doc.mk_id; 
            });

            // Join ke Mata Kuliah
            const mkDocs = await db.collection('mata_kuliah').find().toArray();
            const mkMap = {};
            const prodiMapFromMk = {};
            mkDocs.forEach(doc => {
                mkMap[doc._id] = doc.nama_mk_id;
                prodiMapFromMk[doc._id] = doc.prodi_id; 
            });
            
            // Join ke Prodi
            const prodiDocs = await db.collection('prodi').find().toArray();
            const prodiMap = {};
            prodiDocs.forEach(doc => {
                prodiMap[doc._id] = doc.nama_prodi;
            });

            // Join ke Asesmen (untuk agregasi bobot)
            const asesmenDocs = await db.collection('asesmen').find().toArray();
            const subcpmkBobotCalculated = {};
            asesmenDocs.forEach(doc => {
                const subId = doc.subcpmk_id;
                if (subId) {
                    if (!subcpmkBobotCalculated[subId]) subcpmkBobotCalculated[subId] = 0;
                    subcpmkBobotCalculated[subId] += parseFloat(doc.bobot) || 0;
                }
            });

            const enriched = subcpmks.map(sub => {
                const mkId = mkIdMapFromCpmk[sub.cpmk_id];
                const prodiId = mkId ? prodiMapFromMk[mkId] : null;
                
                return {
                    ...sub,
                    bobot: parseFloat((subcpmkBobotCalculated[sub.subcpmk_id] || 0).toFixed(2)),
                    kode_cpmk: cpmkMap[sub.cpmk_id] || 'Tidak diketahui',
                    nama_mk: mkId ? mkMap[mkId] : 'Tidak diketahui',
                    nama_prodi: prodiId ? prodiMap[prodiId] : 'Tidak diketahui',
                    mk_id: mkId,
                    prodi_id: prodiId
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

    // POST tambah SubCPMK
    router.post('/', async (req, res) => {
        try {
            const { cpmk_id, kode_subcpmk, deskripsi } = req.body;
            const newId = generateId();

            // Simpan data langsung tanpa validasi bobot
            await db.collection('subcpmk').insertOne({
                _id: newId,
                cpmk_id,
                kode_subcpmk,
                deskripsi,
                created_at: new Date()
            });

            res.json({
                message: 'SubCPMK ditambahkan!',
                subcpmk_id: newId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { cpmk_id, kode_subcpmk, deskripsi } = req.body;

            await db.collection('subcpmk').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        cpmk_id,
                        kode_subcpmk,
                        deskripsi
                    }
                }
            );
            res.json({ message: 'SubCPMK berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE hapus SubCPMK
    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('subcpmk').deleteOne({ _id: req.params.id });
            res.json({ message: 'SubCPMK dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
