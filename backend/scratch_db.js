const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function run() {
    console.log("== MATA KULIAH ==");
    const mkSnap = await db.collection('mata_kuliah').limit(3).get();
    mkSnap.docs.forEach(d => console.log(d.id, d.data().dosen_id));
    
    console.log("== MAHASISWA ==");
    const mSnap = await db.collection('mahasiswa').limit(3).get();
    mSnap.docs.forEach(d => console.log(d.id, d.data().mk_ids));
    
    process.exit(0);
}
run();
