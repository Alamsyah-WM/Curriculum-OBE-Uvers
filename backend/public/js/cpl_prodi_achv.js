// CPL PRODI ACHIEVEMENT FUNCTIONS

let allCplsCplProdi = [];
let allMksCplProdi = [];
let allCpmksCplProdi = [];
let allSubCpmksCplProdi = [];
let allAsesmenCplProdi = [];

let currentProdiCplAchvId = null;

async function loadProdiCplProdiAchvSelect() {
    try {
        const res = await fetch('/api/prodi');
        let prodis = await res.json();

        // Filter prodi berdasarkan user login jika bukan admin
        if (window.currentUser && window.currentUser.prodi_id) {
            prodis = prodis.filter(p => p.prodi_id === window.currentUser.prodi_id);
        }

        const tabsContainer = document.getElementById('prodi-cplprodiachv-tabs');
        tabsContainer.innerHTML = prodis.map(p =>
            `<div class="prodi-cpl-tab" data-id="${p.prodi_id}" onclick="selectProdiCplTab(this, '${p.prodi_id}')" style="padding: 10px 15px; cursor: pointer; color: #475569; border-bottom: 2px solid transparent; font-size: 15px;">${p.nama_prodi}</div>`
        ).join('');

        // Ambil semua data master
        await fetchAllMasterDataProdiAchv();

        if (prodis.length > 0) {
            // Pilih tab pertama
            selectProdiCplTab(tabsContainer.firstElementChild, prodis[0].prodi_id);
        }

    } catch (error) {
        console.error('Error load Prodi CPL Prodi Achv:', error);
    }
}

function selectProdiCplTab(element, prodiId) {
    currentProdiCplAchvId = prodiId;
    const tabsContainer = document.getElementById('prodi-cplprodiachv-tabs');
    Array.from(tabsContainer.children).forEach(tab => {
        tab.style.color = '#475569';
        tab.style.borderBottom = '2px solid transparent';
        tab.style.fontWeight = 'normal';
    });
    
    element.style.color = '#1e3a8a';
    element.style.borderBottom = '2px solid #1e3a8a';
    element.style.fontWeight = '600';
    
    calculateCplProdi();
}

async function fetchAllMasterDataProdiAchv() {
    try {
        const [cplRes, mkRes, cpmkRes, subcpmkRes, asesmenRes] = await Promise.all([
            fetch('/api/cpl'), fetch('/api/mk'), fetch('/api/cpmk'), fetch('/api/subcpmk'), fetch('/api/asesmen')
        ]);
        
        allCplsCplProdi = await cplRes.json();
        allMksCplProdi = await mkRes.json();
        allCpmksCplProdi = await cpmkRes.json();
        allSubCpmksCplProdi = await subcpmkRes.json();
        allAsesmenCplProdi = await asesmenRes.json();
    } catch (e) {
        console.error('Error fetching master data:', e);
    }
}

async function calculateCplProdi() {
    const prodiId = currentProdiCplAchvId;
    const listContainer = document.getElementById('cplprodiachv-list');
    
    if (!prodiId) {
        showStatus('cplprodiachv-status', 'Silakan pilih Prodi terlebih dahulu', 'error');
        return;
    }

    listContainer.innerHTML = '<p>Mengambil dan menghitung data dari server... Mohon tunggu.</p>';

    try {
        const resObj = await fetch(`/api/cpl/achievement/prodi/${prodiId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('obe_token')}` }
        });
        
        if (!resObj.ok) {
            const errData = await resObj.json();
            throw new Error(errData.error || 'Gagal mengambil data CPL Prodi');
        }
        
        const cplData = await resObj.json();

        let htmlRender = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        
        cplData.forEach(cpl => {
            const skorLabel = cpl.isEvaluated
                ? `Rata-rata Evaluasi Prodi dari ${cpl.evaluatorCount || 0} Mahasiswa` 
                : 'Belum ada data evaluasi mahasiswa untuk CPL ini';

            // Build the breakdown HTML
            let breakdownHtml = '';
            
            if (cpl.mata_kuliahs && cpl.mata_kuliahs.length > 0) {
                cpl.mata_kuliahs.forEach(mk => {
                    const mkIconId = `p-icon-mk-${cpl.cpl_id}-${mk.mk_id}`;
                    const mkBodyId = `p-body-mk-${cpl.cpl_id}-${mk.mk_id}`;
                    
                    breakdownHtml += `
                        <div style="margin-top: 10px;">
                            <div 
                                style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 8px 10px; background: #f8fafc; border-radius: 6px; font-size: 14px; font-weight: 500;"
                                onclick="window.toggleCplBreakdown('${mkBodyId}', '${mkIconId}')"
                            >
                                <div style="flex: 1;">${mk.nama_mk}</div>
                                <div style="flex: 1; text-align: center;">${mk.formatted_bobot}</div>
                                <div style="flex: 1; text-align: right; padding-right: 15px;">${mk.formatted_nilai}</div>
                                <div id="${mkIconId}" style="transition: transform 0.2s;">&#9656;</div>
                            </div>
                            
                            <div id="${mkBodyId}" style="display: none; padding-left: 20px; margin-top: 5px;">
                    `;
                    
                    if (mk.cpmks && mk.cpmks.length > 0) {
                        mk.cpmks.forEach(cpmk => {
                            breakdownHtml += `
                                <div style="display: flex; justify-content: space-between; padding: 6px 10px; font-size: 13px; color: var(--text-color); border-bottom: 1px solid #e2e8f0;">
                                    <div style="flex: 1;">${cpmk.kode_cpmk}</div>
                                    <div style="flex: 1; text-align: center;">${cpmk.formatted_bobot}</div>
                                    <div style="flex: 1; text-align: right; padding-right: 25px;">${cpmk.formatted_nilai}</div>
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
                breakdownHtml = `<div style="margin-top: 10px; font-size: 13px; color: var(--text-muted); text-align: center;">Tidak ada data mata kuliah (Belum ada asesmen prodi)</div>`;
            }

            const cplIconId = `p-icon-cpl-${cpl.cpl_id}`;
            const cplBodyId = `p-body-cpl-${cpl.cpl_id}`;

            htmlRender += `
                <div style="background: var(--surface); border: 1px solid var(--border); padding: 15px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                    
                    <div style="cursor: pointer;" onclick="window.toggleCplBreakdown('${cplBodyId}', '${cplIconId}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px; font-weight: 600;">
                            <div>${cpl.kode_cpl} ${cpl.formattedHeaderScore}</div>
                            <div>Avg Score: ${cpl.isEvaluated ? cpl.formattedScore : 'N/A'}</div>
                            <div>Status: <span style="color: ${cpl.statusColor};">${cpl.status}</span></div>
                        </div>
                        
                        <!-- Progress Bar Container -->
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div style="flex: 1; height: 12px; background: #e2e8f0; border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; width: ${cpl.finalScore}%; background: ${cpl.barColor}; transition: width 0.5s ease;"></div>
                            </div>
                            <div id="${cplIconId}" style="transition: transform 0.2s; font-size: 18px; color: #64748b;">&#9656;</div>
                        </div>
                        
                        <div style="font-size: 13px; color: var(--text-muted);">
                            <span>${skorLabel}</span>
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
        showStatus('cplprodiachv-status', e.message, 'error');
    }
}
