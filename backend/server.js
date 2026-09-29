require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const verifyToken = require('./middleware/authMiddleware');

const { connectDB } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

connectDB().then((db) => {
    // inject db & admin ke routes
    // auth ditaruh sebelum global token verification supaya login tidak ter-block
    app.use('/api/auth', require('./routes/authRoutes')(db, admin));

    // Protect all /api routes
    // app.use('/api', verifyToken);

    // sisa routes yang otomatis terlindungi
    app.use('/api/periode', require('./routes/periodeRoutes')(db, admin));
    app.use('/api/prodi', require('./routes/prodiRoutes')(db, admin));
    app.use('/api/profile', require('./routes/profileRoutes')(db, admin));
    app.use('/api/mahasiswa', require('./routes/mahasiswaRoutes')(db, admin));
    app.use('/api/dosen', require('./routes/dosenRoutes')(db, admin));
    app.use('/api/cpl', require('./routes/cplRoutes')(db, admin));
    app.use('/api/mk', require('./routes/mkRoutes')(db, admin));
    app.use('/api/cpmk', require('./routes/cpmkRoutes')(db, admin));
    app.use('/api/subcpmk', require('./routes/subcpmkRoutes')(db, admin));
    app.use('/api/asesmen', require('./routes/asesmenRoutes')(db, admin));
    app.use('/api/nilai', require('./routes/nilaiRoutes')(db, admin));

    app.listen(PORT, () => {
        console.log(`OBE System: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Gagal memulai server karena koneksi database gagal:", err);
});
