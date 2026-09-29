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
    // ============ PRODI ============
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('prodi').find().toArray();
            const prodis = docs.map(doc => ({
                prodi_id: doc._id,  // Gunakan document ID sebagai prodi_id
                ...doc
            }));
            const { search } = req.query;
            let results = prodis;
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
            const { kode_prodi, nama_prodi } = req.body;
            const newId = generateId();

            await db.collection('prodi').insertOne({
                _id: newId,
                kode_prodi,
                nama_prodi,
                created_at: new Date()
            });

            res.json({
                message: 'Prodi ditambahkan!',
                prodi_id: newId  // Firebase doc ID sebagai prodi_id
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { kode_prodi, nama_prodi } = req.body;
            await db.collection('prodi').updateOne(
                { _id: req.params.id },
                {
                    $set: {
                        kode_prodi,
                        nama_prodi
                    }
                }
            );
            res.json({ message: 'Prodi berhasil diperbarui!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('prodi').deleteOne({ _id: req.params.id });
            res.json({ message: 'Prodi dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router
};