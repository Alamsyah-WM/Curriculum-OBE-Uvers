const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/mahasiswa');
        const mhs = await res.json();
        if(mhs.length > 0) {
            const mhsId = mhs[0].mahasiswa_id;
            console.log("Testing with Mhs ID:", mhsId);
            const res2 = await fetch('http://localhost:3000/api/nilai/' + mhsId);
            const data = await res2.json();
            console.log(JSON.stringify(data.slice(0, 2), null, 2));
            
            if (data.length > 0) {
                // test post
                const payload = {
                    mahasiswa_id: data[0].mahasiswa_id,
                    mk_id: data[0].mk_id,
                    cpmk_id: data[0].cpmk_id,
                    subcpmk_id: data[0].subcpmk_id,
                    asesmen_id: data[0].asesmen_id,
                    nilai: 85
                };
                console.log("Posting payload:", payload);
                const res3 = await fetch('http://localhost:3000/api/nilai', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const resText = await res3.text();
                console.log("Post response:", resText);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
test();
