const express = require('express');
const verifyToken = require('../middleware/authMiddleware');

module.exports = (db, admin) => {
    const router = express.Router();

    // Endpoint public untuk mendapatkan token JWT dari validasi email & pwd
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password harus diisi.' });
        }

        try {
            const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAMvkMxnxYpct1s_i3sNGwPyMXI8MF-4Xo";
            
            // Verifikasi via rest API Identity Toolkit Google
            const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, returnSecureToken: true })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorCode = data.error.message || 'Login gagal';
                let errorMessage = 'Login gagal.';
                if (errorCode === 'EMAIL_NOT_FOUND' || errorCode === 'INVALID_LOGIN_CREDENTIALS') {
                     errorMessage = 'Email atau password salah.';
                } else if (errorCode.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
                     errorMessage = 'Terlalu banyak percobaan gagal, coba lagi nanti.';
                } else {
                     errorMessage = errorCode;
                }
                return res.status(response.status).json({ error: errorMessage });
            }

            let userRoles = ['Dosen']; // Default role
            try {
                const dosenDoc = await db.collection('dosen').findOne({ uid: data.localId });
                if (dosenDoc) {
                    userRoles = dosenDoc.roles || (dosenDoc.role ? [dosenDoc.role] : ['Dosen']);
                } else {
                    // Jika data.email admin, kasih admin
                    userRoles = ['Admin'];
                }
            } catch(e) {
                console.error("Error fetching user roles during login:", e);
            }

            // Kembalikan token
            res.json({
                message: 'Login berhasil',
                token: data.idToken,       
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                uid: data.localId,         
                email: data.email,
                roles: userRoles
            });
        } catch (error) {
            res.status(500).json({ error: 'Terjadi kesalahan pada server saat melakukan proses login.' });
        }
    });

    // Harus inject verifyToken secara manual karena rute auth telah digeser di luar global verifyToken 
    router.get('/me', verifyToken, async (req, res) => {
        try {
            const uid = req.user.uid;

            // Cari dosen berdasarkan uid
            const dosenDoc = await db.collection('dosen').findOne({ uid: uid });

            if (!dosenDoc) {
                // Default jika bukan dosen (misal admin super)
                return res.json({
                    uid: uid,
                    nama_dosen: req.user.email,
                    nama_prodi: 'Admin Sistem',
                    roles: ['Admin']
                });
            }

            // Ambil nama prodi
            let nama_prodi = 'Tidak diketahui';
            if (dosenDoc.prodi_id) {
                const prodiDoc = await db.collection('prodi').findOne({ _id: dosenDoc.prodi_id });
                if (prodiDoc) {
                    nama_prodi = prodiDoc.nama_prodi;
                }
            }

            res.json({
                uid: uid,
                dosen_id: dosenDoc._id,
                nama_dosen: dosenDoc.nama_dosen,
                nidn: dosenDoc.nidn,
                prodi_id: dosenDoc.prodi_id,
                nama_prodi: nama_prodi,
                roles: dosenDoc.roles || (dosenDoc.role ? [dosenDoc.role] : ['Dosen'])
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
