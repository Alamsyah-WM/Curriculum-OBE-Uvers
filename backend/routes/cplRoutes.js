// routes/cplRoutes.js
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

    // GET semua CPL
    router.get('/', async (req, res) => {
        try {
            const docs = await db.collection('cpl').find().toArray();
            const cplList = docs.map(doc => ({
                cpl_id: doc._id,
                ...doc
            }));

            // Join ke profile_lulusan untuk ambil kode_pl / profesi dan prodi_id
            const profileDocs = await db.collection('profile_lulusan').find().toArray();
            const profileMap = {};
            profileDocs.forEach(doc => {
                profileMap[doc._id] = {
                    kode_pl: doc.kode_pl,
                    profesi: doc.profesi,
                    prodi_id: doc.prodi_id // untuk filter by prodi
                };
            });

            const enrichedCpl = cplList.map(cpl => {
                const plIds = cpl.pl_ids || [];
                if (cpl.pl_id && !plIds.includes(cpl.pl_id)) plIds.push(cpl.pl_id);
                if (cpl.pl_id_2 && !plIds.includes(cpl.pl_id_2)) plIds.push(cpl.pl_id_2);

                const profileDisplays = plIds.map(id => profileMap[id] ? `${profileMap[id].kode_pl} - ${profileMap[id].profesi}` : id);
                
                return {
                    ...cpl,
                    pl_ids: plIds, // Unified array
                    profile_display: profileDisplays[0] || null,
                    profile_display_2: profileDisplays[1] || null,
                    prodi_id: plIds.length > 0 && profileMap[plIds[0]] ? profileMap[plIds[0]].prodi_id : null
                };
            });

            const { search, ...filters } = req.query;
            let results = enrichedCpl;

            // Dynamic exact match filter (for prodi_id, dll.)
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    results = results.filter(r => r[key] === filters[key]);
                }
            });

            if (search) {
                const s = search.toLowerCase();
                results = results.filter(r => Object.values(r).some(val => val !== null && val !== undefined && val.toString().toLowerCase().includes(s)));
            }
            res.json(results);
        } catch (error) {
            console.error('Error GET /api/cpl:', error); // Tambah log error
            res.status(500).json({ error: error.message });
        }
    });

    // POST tambah CPL
    router.post('/', async (req, res) => {
        try {
            const { deskripsi, kode_cpl, pl_ids, referensi } = req.body;

            if (!deskripsi || !kode_cpl || !pl_ids || !Array.isArray(pl_ids) || pl_ids.length === 0) {
                return res.status(400).json({
                    error: 'Field wajib: deskripsi, kode_cpl, minimal 1 pilihan profile lulusan (pl_ids)'
                });
            }

            const newId = generateId();
            await db.collection('cpl').insertOne({
                _id: newId,
                deskripsi,
                kode_cpl,
                pl_ids, // Simpan array
                referensi: referensi || '',
                created_at: new Date()
            });

            res.json({
                message: 'CPL ditambahkan!',
                cpl_id: newId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // PUT update CPL
    router.put('/:id', async (req, res) => {
        try {
            const { deskripsi, kode_cpl, pl_ids, referensi } = req.body;

            const updateData = {
                deskripsi,
                kode_cpl,
                pl_ids, // Update array
                referensi
            };

            await db.collection('cpl').updateOne(
                { _id: req.params.id },
                {
                    $set: updateData,
                    $unset: { pl_id: "", pl_id_2: "" }
                }
            );

            res.json({ message: 'CPL diupdate!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE hapus CPL
    router.delete('/:id', async (req, res) => {
        try {
            await db.collection('cpl').deleteOne({ _id: req.params.id });
            res.json({ message: 'CPL dihapus!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ============================================
    // CPL ACHIEVEMENT REPORT & BREAKDOWN API
    // ============================================

    // Helper calculateCplBreakdown
    async function calculateCplBreakdown(db, nilaiDocs, prodiId) {
        const [cplDocs, mkDocs, cpmkDocs, subcpmkDocs, asesmenDocs, profileDocs] = await Promise.all([
            db.collection('cpl').find().toArray(),
            db.collection('mata_kuliah').find().toArray(),
            db.collection('cpmk').find().toArray(),
            db.collection('subcpmk').find().toArray(),
            db.collection('asesmen').find().toArray(),
            db.collection('profile_lulusan').find().toArray()
        ]);

        const allCpl = cplDocs.map(d => ({ cpl_id: d._id, ...d }));
        const allMk = mkDocs.map(d => ({ mk_id: d._id, ...d }));
        const allCpmk = cpmkDocs.map(d => ({ cpmk_id: d._id, ...d }));
        const allSubcpmk = subcpmkDocs.map(d => ({ subcpmk_id: d._id, ...d }));
        const allAsesmen = asesmenDocs.map(d => ({ asesmen_id: d._id, ...d }));
        
        const profileMap = {};
        profileDocs.forEach(d => { profileMap[d._id] = d; });
        
        const prodiCpls = allCpl.filter(c => {
            const plIds = c.pl_ids || [];
            if (c.pl_id && !plIds.includes(c.pl_id)) plIds.push(c.pl_id);
            if (c.pl_id_2 && !plIds.includes(c.pl_id_2)) plIds.push(c.pl_id_2);
            
            return plIds.some(id => profileMap[id] && profileMap[id].prodi_id === prodiId);
        });

        const nilaiByMahasiswa = {};
        if (nilaiDocs && Array.isArray(nilaiDocs)) {
            nilaiDocs.forEach(n => {
                if (!nilaiByMahasiswa[n.mahasiswa_id]) {
                    nilaiByMahasiswa[n.mahasiswa_id] = [];
                }
                nilaiByMahasiswa[n.mahasiswa_id].push(n);
            });
        }

        // Build Base Aggregator mapping all connected MKs and CPMKs First
        const cpmkBobotMap = {};
        allAsesmen.forEach(asm => {
            const asmBobot = parseFloat(asm.bobot) || 0;
            const subObj = allSubcpmk.find(s => s.subcpmk_id === asm.subcpmk_id);
            if (subObj) {
                const cpmkId = subObj.cpmk_id;
                if (!cpmkBobotMap[cpmkId]) cpmkBobotMap[cpmkId] = 0;
                cpmkBobotMap[cpmkId] += asmBobot;
            }
        });

        const breakdownSkeleton = {};
        prodiCpls.forEach(c => {
            breakdownSkeleton[c.cpl_id] = {};
            const relatedCpmks = allCpmk.filter(cpmk => cpmk.cpl_id === c.cpl_id);
            
            relatedCpmks.forEach(cpmk => {
                const mkId = cpmk.mk_id;
                const mkObj = allMk.find(m => m.mk_id === mkId);
                const mkName = mkObj ? (mkObj.nama_mk_id || mkObj.nama_mk || 'Unknown MK') : 'Unknown MK'; 
                
                if (!breakdownSkeleton[c.cpl_id][mkId]) {
                    breakdownSkeleton[c.cpl_id][mkId] = {
                        mk_id: mkId,
                        nama_mk: mkName,
                        cpmks: {}
                    };
                }
                breakdownSkeleton[c.cpl_id][mkId].cpmks[cpmk.cpmk_id] = {
                    cpmk_id: cpmk.cpmk_id,
                    kode_cpmk: cpmk.kode_cpmk,
                    bobot: cpmkBobotMap[cpmk.cpmk_id] || 1,
                    totalNilai: 0,
                    mhsCount: 0,
                    nilai: 0
                };
            });
        });

        const mhsResults = [];
        for (const mhsId in nilaiByMahasiswa) {
            const historyNilai = nilaiByMahasiswa[mhsId];
            const cpmkEarned = {}; 
            
            // 1. Hitung point murni per CPMK
            historyNilai.forEach(n => {
                const asm = allAsesmen.find(a => a.asesmen_id === n.asesmen_id);
                if (asm) {
                    const subObj = allSubcpmk.find(s => s.subcpmk_id === asm.subcpmk_id);
                    if (subObj) {
                        const cpmkId = subObj.cpmk_id;
                        const asmbobot = parseFloat(asm.bobot) || 0;
                        const asmNilai = parseFloat(n.nilai) || 0;
                        const earnedPoints = asmNilai * (asmbobot / 100);
                        if (!cpmkEarned[cpmkId]) cpmkEarned[cpmkId] = 0;
                        cpmkEarned[cpmkId] += earnedPoints;
                    }
                }
            });

            // 2. Map CPMK ke CPL (Agregasi level mahasiswa)
            const cplAggregator = {};
            prodiCpls.forEach(c => {
                cplAggregator[c.cpl_id] = { 
                    total: 0, 
                    count: 0, 
                    isEvaluated: false, 
                    mkBreakdown: JSON.parse(JSON.stringify(breakdownSkeleton[c.cpl_id]))
                };
            });

            for (let cpmkId in cpmkEarned) {
                const earned = cpmkEarned[cpmkId];
                const cpmkObj = allCpmk.find(c => c.cpmk_id === cpmkId);
                
                if (cpmkObj && cpmkObj.cpl_id) {
                    const cpmkBobot = cpmkBobotMap[cpmkId] || 1;
                    let masteryPercentage = (earned / cpmkBobot) * 100;
                    if (masteryPercentage > 100) masteryPercentage = 100;
                    
                    const cplId = cpmkObj.cpl_id;
                    if (cplAggregator[cplId]) {
                        cplAggregator[cplId].total += masteryPercentage;
                        cplAggregator[cplId].count += 1;
                        cplAggregator[cplId].isEvaluated = true;
                        
                        const mkId = cpmkObj.mk_id;
                        if (cplAggregator[cplId].mkBreakdown[mkId] && cplAggregator[cplId].mkBreakdown[mkId].cpmks[cpmkId]) {
                            cplAggregator[cplId].mkBreakdown[mkId].cpmks[cpmkId].nilai = masteryPercentage;
                            cplAggregator[cplId].mkBreakdown[mkId].cpmks[cpmkId].isEvaluated = true;
                        }
                    }
                }
            }
            mhsResults.push(cplAggregator);
        }

        // 3. Agregasi Global (Level Prodi: rata-rata dari semua mahasiswa yang dipilih)
        const finalProdiAggregator = {};
        prodiCpls.forEach(c => {
            finalProdiAggregator[c.cpl_id] = { 
                kode_cpl: c.kode_cpl,
                deskripsi: c.deskripsi,
                totalMahasiswaScore: 0, 
                mahasiswaCount: 0,
                mkMastery: JSON.parse(JSON.stringify(breakdownSkeleton[c.cpl_id])) // Base framework
            };
        });

        mhsResults.forEach(cplAgg => {
            for (let cplId in cplAgg) {
                const dataCalc = cplAgg[cplId];
                if (dataCalc.isEvaluated && dataCalc.count > 0) {
                    const finalMhsScore = dataCalc.total / dataCalc.count;
                    finalProdiAggregator[cplId].totalMahasiswaScore += finalMhsScore;
                    finalProdiAggregator[cplId].mahasiswaCount += 1;
                    
                    for (let mkId in dataCalc.mkBreakdown) {
                        for (let cpmkId in dataCalc.mkBreakdown[mkId].cpmks) {
                            const cpmkObj = dataCalc.mkBreakdown[mkId].cpmks[cpmkId];
                            if (cpmkObj.isEvaluated) {
                                finalProdiAggregator[cplId].mkMastery[mkId].cpmks[cpmkId].totalNilai += cpmkObj.nilai;
                                finalProdiAggregator[cplId].mkMastery[mkId].cpmks[cpmkId].mhsCount += 1;
                            }
                        }
                    }
                }
            }
        });

        // 4. Formatting output structure untuk frontend
        return prodiCpls.map(cpl => {
            const cplData = finalProdiAggregator[cpl.cpl_id];
            
            let finalScore = 0;
            if (cplData.mahasiswaCount > 0) {
                finalScore = cplData.totalMahasiswaScore / cplData.mahasiswaCount;
            }
            
            let mata_kuliahs = [];
            let totalCPLBobot = 0;
            
            for (let mkId in cplData.mkMastery) {
                const mkRaw = cplData.mkMastery[mkId];
                let cpmksArray = [];
                let totalMKBobot = 0;
                
                for (let cpmkId in mkRaw.cpmks) {
                    const cpmkRaw = mkRaw.cpmks[cpmkId];
                    let avgNilai = 0;
                    if (cpmkRaw.mhsCount > 0) {
                        avgNilai = cpmkRaw.totalNilai / cpmkRaw.mhsCount;
                    }
                    totalMKBobot += cpmkRaw.bobot;
                    
                    cpmksArray.push({
                        cpmk_id: cpmkRaw.cpmk_id,
                        kode_cpmk: cpmkRaw.kode_cpmk,
                        bobot: cpmkRaw.bobot,
                        nilai: avgNilai
                    });
                }
                
                // Sorted CPMKs by bobot or kode_cpmk
                cpmksArray.sort((a,b) => a.kode_cpmk.localeCompare(b.kode_cpmk));
                
                let mkWeightedSum = cpmksArray.reduce((acc, curr) => acc + (curr.nilai * curr.bobot), 0);
                let mkAvgNilai = totalMKBobot > 0 ? mkWeightedSum / totalMKBobot : 0;
                
                totalCPLBobot += totalMKBobot;
                
                mata_kuliahs.push({
                    mk_id: mkId,
                    nama_mk: mkRaw.nama_mk,
                    bobot: totalMKBobot,
                    nilai: mkAvgNilai,
                    cpmks: cpmksArray
                });
            }
            
            // Calculate bobot percentages and formats
            mata_kuliahs.forEach(mk => {
                const bobotPercentage = totalCPLBobot > 0 ? (mk.bobot / totalCPLBobot) * 100 : 0;
                mk.bobotPercentage = bobotPercentage;
                mk.formatted_bobot = `Bobot: ${mk.bobot.toFixed(2)} (${bobotPercentage.toFixed(2)}%)`;
                mk.formatted_nilai = `Nilai: ${mk.nilai.toFixed(2)}`;
                
                mk.cpmks.forEach(cpmk => {
                    const cbobotPercentage = mk.bobot > 0 ? (cpmk.bobot / mk.bobot) * 100 : 0;
                    cpmk.bobotPercentage = cbobotPercentage;
                    cpmk.formatted_bobot = `Bobot: ${cpmk.bobot.toFixed(2)} (${cbobotPercentage.toFixed(2)}%)`;
                    cpmk.formatted_nilai = `Nilai: ${cpmk.nilai.toFixed(2)}`;
                });
            });

            // Status and Colors
            let status = 'TIDAK LULUS';
            let statusColor = '#dc2626'; // Merah (< 50)
            let barColor = '#dc2626';
            
            if (finalScore >= 85) { 
                status = 'LULUS'; 
                statusColor = '#10b981'; 
                barColor = '#10b981'; 
            } else if (finalScore >= 70) { 
                status = 'LULUS AA'; 
                statusColor = '#3b82f6'; 
                barColor = '#3b82f6'; 
            } else if (finalScore >= 50) { 
                status = 'PERINGATAN BB'; 
                statusColor = '#d97706'; 
                barColor = '#d97706'; 
            }

            let totalEarnedPoints = mata_kuliahs.reduce((acc, mk) => acc + (mk.bobot * (mk.nilai / 100)), 0);

            return {
                cpl_id: cpl.cpl_id,
                kode_cpl: cpl.kode_cpl,
                deskripsi: cpl.deskripsi,
                finalScore: finalScore,
                formattedScore: finalScore.toFixed(2) + '%',
                status: status,
                statusColor: statusColor,
                barColor: barColor,
                totalEarnedScore: totalEarnedPoints,
                totalTargetScore: totalCPLBobot,
                formattedHeaderScore: `(${totalEarnedPoints.toFixed(2)}/${totalCPLBobot.toFixed(2)})`,
                isEvaluated: cplData.mahasiswaCount > 0,
                evaluatorCount: cplData.mahasiswaCount,
                mata_kuliahs: mata_kuliahs
            };
        });
    }

    // GET CPL Breakdown by Mahasiswa
    router.get('/achievement/mahasiswa/:mhsId', async (req, res) => {
        try {
            const mhsId = req.params.mhsId;
            const prodiId = req.query.prodiId;
            
            if (!prodiId) {
                return res.status(400).json({ error: 'prodiId query parameter is required' });
            }

            const nilaiDocs = await db.collection('nilai_asesmen').find({ mahasiswa_id: mhsId }).toArray();
            const result = await calculateCplBreakdown(db, nilaiDocs, prodiId);
            res.json(result);
        } catch (error) {
            console.error('Error GET CPL breakdown Mhs:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // GET CPL Breakdown by Prodi
    router.get('/achievement/prodi/:prodiId', async (req, res) => {
        try {
            const prodiId = req.params.prodiId;
            const query = { prodi_id: prodiId };

            if (req.query.angkatan) {
                const angkatanList = req.query.angkatan.split(',').flatMap(val => {
                    const num = parseInt(val);
                    return isNaN(num) ? [val] : [val, num];
                });
                query.angkatan = { $in: angkatanList };
            }

            const mhsDocs = await db.collection('mahasiswa').find(query).toArray();
            const mhsIds = mhsDocs.map(doc => doc._id);
            
            const nilaiDocs = await db.collection('nilai_asesmen').find({ mahasiswa_id: { $in: mhsIds } }).toArray();
            
            const result = await calculateCplBreakdown(db, nilaiDocs, prodiId);
            res.json(result);
        } catch (error) {
            console.error('Error GET CPL breakdown Prodi:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
