const express = require('express');

module.exports = (db, admin) => {
    const router = express.Router();

    // Helper untuk chunk query MongoDB (mengganti Firestore 'in' limitation)
    const fetchInChunks = async (collectionRef, field, ids) => {
        if (!ids || ids.length === 0) return [];
        const docs = await collectionRef.find({ [field]: { $in: ids } }).toArray();
        return docs.map(doc => ({ id: doc._id, ...doc }));
    };

    // GET semua nilai mahasiswa berdasarkan prodi (untuk agregasi CPL Prodi)
    router.get('/prodi/:prodi_id', async (req, res) => {
        try {
            const { prodi_id } = req.params;
            
            // 1. Dapatkan daftar mahasiswa di prodi tersebut
            const mhsDocs = await db.collection('mahasiswa')
                .find({ prodi_id: prodi_id })
                .toArray();
            
            if (mhsDocs.length === 0) {
                return res.json([]);
            }
            
            const mhsIds = mhsDocs.map(doc => doc._id);
            
            // Fetch all nilai in one query using MongoDB $in
            const nilaiDocs = await db.collection('nilai_asesmen')
                .find({ mahasiswa_id: { $in: mhsIds } })
                .toArray();
                
            const results = nilaiDocs.map(doc => ({
                id: doc._id,
                ...doc
            }));
            
            res.json(results);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET nilai per mahasiswa_id
    router.get('/:mahasiswa_id', async (req, res) => {
        try {
            const { mahasiswa_id } = req.params;

            // 1. Dapatkan mk_ids dari mahasiswa
            const mhsDoc = await db.collection('mahasiswa').findOne({ _id: mahasiswa_id });
            if (!mhsDoc) {
                return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
            }
            
            const mkIds = mhsDoc.mk_ids || [];

            if (mkIds.length === 0) {
                return res.json([]);
            }

            // 2. Fetch master data berjenjang
            // a. Mata Kuliah
            const mkDocs = await db.collection('mata_kuliah').find({ _id: { $in: mkIds } }).toArray();
            const mkMap = {};
            mkDocs.forEach(doc => {
                mkMap[doc._id] = { kode: doc.kode_mk, nama: doc.nama_mk_id };
            });

            // b. CPMK
            const cpmks = await fetchInChunks(db.collection('cpmk'), 'mk_id', mkIds);
            const cpmkIds = cpmks.map(c => c.id);

            // c. SubCPMK
            let subcpmks = [];
            let subcpmkIds = [];
            const subcpmkMap = {};
            const subcpmkToMkMap = {}; // mapping subcpmk_id -> mk_id for easier reference later
            
            if (cpmkIds.length > 0) {
                subcpmks = await fetchInChunks(db.collection('subcpmk'), 'cpmk_id', cpmkIds);
                subcpmkIds = subcpmks.map(s => s.id);
                
                // create map to relate subcpmk -> cpmk -> mk
                const cpmkToMkMap = {};
                cpmks.forEach(c => cpmkToMkMap[c.id] = c.mk_id);
                
                subcpmks.forEach(s => {
                    subcpmkMap[s.id] = s.kode_subcpmk;
                    subcpmkToMkMap[s.id] = cpmkToMkMap[s.cpmk_id];
                });
            }

            // d. Asesmen
            let asesmens = [];
            if (subcpmkIds.length > 0) {
                asesmens = await fetchInChunks(db.collection('asesmen'), 'subcpmk_id', subcpmkIds);
            }

            // 3. Ambil data nilai aktual
            const nilaiDocs = await db.collection('nilai_asesmen')
                .find({ mahasiswa_id: mahasiswa_id })
                .toArray();
                
            const nilaiMap = {}; // map by asesmen_id
            nilaiDocs.forEach(doc => {
                nilaiMap[doc.asesmen_id] = {
                    id: doc._id,
                    ...doc
                };
            });

            // 4. Gabungkan
            const finalResult = asesmens.map(asesmen => {
                const mkId = subcpmkToMkMap[asesmen.subcpmk_id];
                const mkInfo = mkId && mkMap[mkId] ? mkMap[mkId] : { kode: 'Unknown', nama: 'Unknown' };
                const aktualNilai = nilaiMap[asesmen.id];

                return {
                    id: aktualNilai ? aktualNilai.id : null, // ID dokumen nilai_asesmen jika ada
                    mahasiswa_id: mahasiswa_id,
                    mk_id: mkId || null,
                    cpmk_id: subcpmks.find(s => s.id === asesmen.subcpmk_id)?.cpmk_id || null,
                    subcpmk_id: asesmen.subcpmk_id || null,
                    asesmen_id: asesmen.id || null,
                    bobot: asesmen.bobot || null,
                    nilai: aktualNilai ? aktualNilai.nilai : null,
                    kode_mk: mkInfo.kode || 'Unknown',
                    nama_mk: mkInfo.nama || 'Unknown',
                    kode_subcpmk: subcpmkMap[asesmen.subcpmk_id] || '-',
                    nama_asesmen: asesmen.nama_asesmen || '-'
                };
            });
            
            res.json(finalResult);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // POST (Upsert) Nilai Asesmen (1 Mahasiswa, 1 Asesmen)
    router.post('/', async (req, res) => {
        try {
            const { mahasiswa_id, mk_id, cpmk_id, subcpmk_id, asesmen_id, nilai } = req.body;
            
            if (nilai === undefined || nilai === null || isNaN(nilai) || nilai < 0 || nilai > 100) {
                return res.status(400).json({ error: 'Nilai harus berupa angka 0 - 100' });
            }

            // Custom ID agar 1 mahasiswa hanya punya 1 nilai per asesmen
            const customDocId = `${mahasiswa_id}_${asesmen_id}`;
            
            await db.collection('nilai_asesmen').updateOne(
                { _id: customDocId },
                {
                    $set: {
                        mahasiswa_id: mahasiswa_id || null,
                        mk_id: mk_id || null,
                        cpmk_id: cpmk_id || null,
                        subcpmk_id: subcpmk_id || null,
                        asesmen_id: asesmen_id || null,
                        nilai: parseFloat(nilai),
                        updated_at: new Date()
                    }
                },
                { upsert: true }
            );

            res.json({ message: 'Nilai berhasil disimpan!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
