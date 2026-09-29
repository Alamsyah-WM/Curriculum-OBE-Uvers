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

    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('periode_kurikulum').find().toArray();
            const periodes = docs.map(doc => ({
                periode_id: doc._id,
                ...doc
            }));
            const { search } = req.query;
            let results = periodes;
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
            const { tahun_mulai, tahun_selesai } = req.body;
            const newId = generateId();
            await db.collection('periode_kurikulum').insertOne({
                _id: newId,
                tahun_mulai: parseInt(tahun_mulai),
                tahun_selesai: parseInt(tahun_selesai),
                created_at: new Date()
            });
            res.json({ message: 'Periode ditambahkan!', periode_id: newId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { tahun_mulai, tahun_selesai } = req.body;
            await db.collection('periode_kurikulum').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        tahun_mulai: parseInt(tahun_mulai),
                        tahun_selesai: parseInt(tahun_selesai)
                    }
                }
            );
            res.json({ message: 'Periode berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('periode_kurikulum').deleteOne({ _id: req.params.id });
            res.json({ message: 'Periode dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
