// CPL ACHIEVEMENT FUNCTIONS

let allMahasiswasCplAchv = [];
let allCplsCplAchv = [];
let allMksCplAchv = [];
let allCpmksCplAchv = [];
let allSubCpmksCplAchv = [];
let allAsesmenCplAchv = [];

async function loadProdiCplAchievementSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Filter prodi berdasarkan user login jika bukan admin
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const select = document.getElementById('prodi-cplachv-select');
        select.innerHTML = '<option value="">Pilih Prodi</option>' + prodis.map(p =>
            `<option value="${p.prodi_id}">${p.nama_prodi}</option>`
        ).join('');

        if (prodis.length === 1) {
            select.value = prodis[0].prodi_id;
        }

        // Ambil semua data master
        await Promise.all([
            fetchAllMasterData()
        ]);

        if (prodis.length === 1) {
            onProdiCplachvChange();
        }

        select.addEventListener('change', onProdiCplachvChange);
        document.getElementById('mahasiswa-cplachv-select').addEventListener('change', () => {
            calculateCpl();
        });

    } catch (error) {
        console.error('Error load Prodi CPL Achievement:', error);
    }
}

async function fetchAllMasterData() {
    try {
        const [mhsRes, cplRes, mkRes, cpmkRes, subcpmkRes, asesmenRes] = await Promise.all([
            fetch('/api/mahasiswa'), fetch('/api/cpl'), fetch('/api/mk'), fetch('/api/cpmk'), fetch('/api/subcpmk'), fetch('/api/asesmen')
        ]);
        
        allMahasiswasCplAchv = await mhsRes.json();
        allCplsCplAchv = await cplRes.json();
        allMksCplAchv = await mkRes.json();
        allCpmksCplAchv = await cpmkRes.json();
        allSubCpmksCplAchv = await subcpmkRes.json();
        allAsesmenCplAchv = await asesmenRes.json();
    } catch (e) {
        console.error('Error fetching master data:', e);
    }
}

function onProdiCplachvChange() {
    const prodiId = document.getElementById('prodi-cplachv-select').value;
    const mhsSelect = document.getElementById('mahasiswa-cplachv-select');
    
    document.getElementById('cplachv-list').innerHTML = '';
    mhsSelect.innerHTML = '<option value="">Pilih Mahasiswa</option>';

    if (!prodiId) return;

    const filteredMhs = allMahasiswasCplAchv.filter(m => m.prodi_id === prodiId);
    mhsSelect.innerHTML = '<option value="">Pilih Mahasiswa</option>' + filteredMhs.map(m =>
        `<option value="${m.mahasiswa_id}">${m.nim} - ${m.nama}</option>`
    ).join('');
}

window.toggleCplBreakdown = function(id, iconId) {
    const el = document.getElementById(id);
    const icon = document.getElementById(iconId);
    if(el) {
        if(el.style.display === 'none') {
            el.style.display = 'block';
            if (icon) {
                icon.style.transform = 'rotate(90deg)';
            }
        } else {
            el.style.display = 'none';
            if (icon) {
                icon.style.transform = 'rotate(0deg)';
            }
        }
    }
}

async function calculateCpl() {
    const mhsId = document.getElementById('mahasiswa-cplachv-select').value;
    const prodiId = document.getElementById('prodi-cplachv-select').value;
    const listContainer = document.getElementById('cplachv-list');
    
    if (!mhsId || !prodiId) {
        showStatus('cplachv-status', 'Silakan pilih Prodi dan Mahasiswa terlebih dahulu', 'error');
        return;
    }

    listContainer.innerHTML = '<p>Menghitung data dari server...</p>';

    try {
        const resObj = await fetch(`/api/cpl/achievement/mahasiswa/${mhsId}?prodiId=${prodiId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('obe_token')}` }
        });
        
        if (!resObj.ok) {
            const errData = await resObj.json();
            throw new Error(errData.error || 'Gagal mengambil data CPL');
        }
        
        const cplData = await resObj.json();

        let htmlRender = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        
        cplData.forEach(cpl => {
            const finalScore = cpl.finalScore || 0;
            const formattedScore = finalScore.toFixed(2);
            
            let barColor = '#dc2626'; // Merah (< 50)
            let statusColor = '#dc2626';
            if (finalScore >= 50 && finalScore < 70) { barColor = '#d97706'; statusColor = '#d97706'; }
            if (finalScore >= 70 && finalScore < 85) { barColor = '#3b82f6'; statusColor = '#3b82f6'; }
            if (finalScore >= 85) { barColor = '#10b981'; statusColor = '#10b981'; }

            const isEvaluated = cpl.isEvaluated;
            const totalEarnedStr = (cpl.totalEarnedScore || 0).toFixed(2);
            const totalTargetStr = (cpl.totalTargetScore || 0).toFixed(2);
            
            // Build the breakdown HTML
            let breakdownHtml = '';
            
            if (cpl.mata_kuliahs && cpl.mata_kuliahs.length > 0) {
                cpl.mata_kuliahs.forEach(mk => {
                    const mkIconId = `icon-mk-${cpl.cpl_id}-${mk.mk_id}`;
                    const mkBodyId = `body-mk-${cpl.cpl_id}-${mk.mk_id}`;
                    
                    breakdownHtml += `
                        <div style="margin-top: 10px;">
                            <div 
                                style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 8px 10px; background: #f8fafc; border-radius: 6px; font-size: 14px; font-weight: 500;"
                                onclick="window.toggleCplBreakdown('${mkBodyId}', '${mkIconId}')"
                            >
                                <div style="flex: 1;">${mk.nama_mk}</div>
                                <div style="flex: 1; text-align: center;">Bobot: ${mk.bobot.toFixed(2)} (${mk.bobotPercentage.toFixed(2)}%)</div>
                                <div style="flex: 1; text-align: right; padding-right: 15px;">Nilai: ${mk.nilai.toFixed(2)}</div>
                                <div id="${mkIconId}" style="transition: transform 0.2s;">&#9656;</div>
                            </div>
                            
                            <div id="${mkBodyId}" style="display: none; padding-left: 20px; margin-top: 5px;">
                    `;
                    
                    if (mk.cpmks && mk.cpmks.length > 0) {
                        mk.cpmks.forEach(cpmk => {
                            breakdownHtml += `
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; font-size: 13px; color: var(--text-color); border-bottom: 1px solid #e2e8f0;">
                                    <div style="flex: 1;">${cpmk.kode_cpmk}</div>
                                    <div style="flex: 1; text-align: center;">Bobot: ${cpmk.bobot.toFixed(2)} (${cpmk.bobotPercentage.toFixed(2)}%)</div>
                                    <div style="flex: 1; text-align: right; padding-right: 25px;">Nilai: ${cpmk.nilai.toFixed(2)}</div>
                                </div>
                            `;
                        });
                    }
                    
                    breakdownHtml += `
                            </div>
                        </div>
                    `;
                });
            } else {
                breakdownHtml = `<div style="margin-top: 10px; font-size: 13px; color: var(--text-muted); text-align: center;">Tidak ada data mata kuliah (Belum ada asesmen)</div>`;
            }

            const cplIconId = `icon-cpl-${cpl.cpl_id}`;
            const cplBodyId = `body-cpl-${cpl.cpl_id}`;

            htmlRender += `
                <div style="background: var(--surface); border: 1px solid var(--border); padding: 15px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                    
                    <div style="cursor: pointer;" onclick="window.toggleCplBreakdown('${cplBodyId}', '${cplIconId}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px; font-weight: 600;">
                            <div>${cpl.kode_cpl} (${totalEarnedStr}/${totalTargetStr})</div>
                            <div>Score: ${isEvaluated ? formattedScore + '%' : 'N/A'}</div>
                            <div>Status: <span style="color: ${statusColor};">${cpl.status}</span></div>
                        </div>
                        
                        <!-- Progress Bar Container -->
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="flex: 1; height: 12px; background: #e2e8f0; border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; width: ${finalScore}%; background: ${barColor}; transition: width 0.5s ease;"></div>
                            </div>
                            <div id="${cplIconId}" style="transition: transform 0.2s; font-size: 18px; color: #64748b;">&#9656;</div>
                        </div>
                    </div>
                    
                    <!-- Expandable CPL Body (Breakdowns) -->
                    <div id="${cplBodyId}" style="display: none; margin-top: 15px; padding-top: 10px; border-top: 1px dashed var(--border);">
                        ${breakdownHtml}
                    </div>

                </div>
            `;
        });
        
        htmlRender += '</div>';
        listContainer.innerHTML = htmlRender;

    } catch (e) {
        showStatus('cplachv-status', e.message, 'error');
    }
}
