// middleware/authMiddleware.js
const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (!bearerHeader || !bearerHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const idToken = bearerHeader.split('Bearer ')[1];

    try {
        // Verifikasi token menggunakan Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Data user dari token disimpan di req.user
        next(); // Token valid, lanjut ke route berikutnya
    } catch (error) {
        return res.status(401).json({ error: 'Token tidak valid atau sudah expired.' });
    }
};

module.exports = verifyToken;
