let currentTab = 'periode';

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab + '-section').classList.add('active');
    currentTab = tab;
    loadData(tab);
}

function loadData(tab) {
    if (tab === 'periode') loadPeriode();
    else if (tab === 'prodi') loadProdi();
    else if (tab === 'profile') {
        loadPeriodeSelect();
        loadProdiSelect();
        loadProfile();
    } else if (tab === 'cpl') {
        loadPlSelect();
        loadCpl();
    } else if (tab === 'mk') {
        loadMk();
        Promise.all([
            loadCplSelect(),
            loadProdiMkSelect(),
            loadDosenMkSelect()
        ]).then(() => {
            filterCplByProdi();
            if (typeof filterDosenByProdi === 'function') filterDosenByProdi();
        });
    } else if (tab === 'cpmk') {
        loadCpmk();
        loadProdiCpmkSelect();
    } else if (tab === 'subcpmk') {
        loadSubCpmk();
        loadProdiSubCpmkSelect();
    } else if (tab === 'asesmen') {
        loadAsesmen();
        loadProdiAsesmenSelect();
    } else if (tab === 'mahasiswa') {
        loadProdiSelectMahasiswa();
        loadMahasiswa();
    } else if (tab === 'krs') {
        if (typeof loadProdiKrsSelect === 'function') loadProdiKrsSelect();
    } else if (tab === 'nilai') {
        if (typeof loadProdiNilaiSelect === 'function') loadProdiNilaiSelect();
    } else if (tab === 'cpl-achievement') {
        if (typeof loadProdiCplAchievementSelect === 'function') loadProdiCplAchievementSelect();
    } else if (tab === 'cpl-prodi-achv') {
        if (typeof loadProdiCplProdiAchvSelect === 'function') loadProdiCplProdiAchvSelect();
    } else if (tab === 'dosen') {
        loadProdiSelectDosen();
        loadDosen();
    }
}



function showStatus(elementId, message, type) {
    const status = document.getElementById(elementId);
    status.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => { status.innerHTML = ''; }, 5000);
}

// Menimpa fungsi fetch default untuk menyisipkan Token JWT secara otomatis
const originalFetch = window.fetch;
window.fetch = async function () {
    let [resource, config] = arguments;
    if (typeof resource === 'string' && resource.startsWith('/api')) {
        if (!config) config = {};
        if (!config.headers) config.headers = {};

        const token = localStorage.getItem('obe_token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }

        if (window.currentUser) {
            if (window.currentUser.active_role) {
                config.headers['X-Active-Role'] = window.currentUser.active_role;
            }
            if (window.currentUser.dosen_id) {
                config.headers['X-Dosen-Id'] = window.currentUser.dosen_id;
            }
        }
    }
    const response = await originalFetch(resource, config);
    if (response.status === 401) {
        // Jika token tidak valid / ditolak, logout user
        logout();
    }
    return response;
};

// Fungsi Logout
function logout() {
    localStorage.removeItem('obe_token');
    window.location.href = '/login.html';
}

// Mengecek status login saat pertama kali halaman index dimuat
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('obe_token');
    if (!token) {
        // Pindah ke halaman login karena status belum login
        window.location.href = '/login.html';
        return;
    }

    // Mengambil data user
    try {
        const response = await fetch('/api/auth/me'); // Endpoint yang akan dibuat
        if (response.ok) {
            const user = await response.json();
            window.currentUser = user; // Eksport user ke global
            
            // ROLE SELECTION LOGIC
            // Ensure roles is an array
            const roles = user.roles || (user.role ? [user.role] : ['Dosen']);
            user.roles = roles;
            
            let activeRole = localStorage.getItem('active_role');
            
            if (!activeRole || !roles.includes(activeRole)) {
                if (roles.length > 1) {
                    // Show modal and stop tab loading
                    const modal = document.getElementById('role-selection-modal');
                    const buttonsContainer = document.getElementById('role-selection-buttons');
                    
                    buttonsContainer.innerHTML = roles.map(r => 
                        `<button onclick="setActiveRole('${r}')" style="padding: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Pilih sebagai ${r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()}</button>`
                    ).join('');
                    
                    modal.style.display = 'flex';
                    return; // DO NOT Load Tabs yet
                } else {
                    activeRole = roles[0];
                    localStorage.setItem('active_role', activeRole);
                }
            }
            
            user.active_role = activeRole;
            finishInitialization();

        } else {
            logout();
        }
    } catch (e) {
        console.error('Error verifying token:', e);
        logout();
    }
});

function setActiveRole(role) {
    localStorage.setItem('active_role', role);
    document.getElementById('role-selection-modal').style.display = 'none';
    window.currentUser.active_role = role;
    finishInitialization();
}

function finishInitialization() {
    const user = window.currentUser;
    // Tampilkan info user di Header (index.html)
    const userInfo = document.getElementById('user-info');
    let switchRoleHtml = '';
    if (user.roles && user.roles.length > 1) {
        switchRoleHtml = ` | <a href="#" onclick="switchRole(); return false;" style="color: #f39c12;">Switch Role</a>`;
    }
    
    if (userInfo) userInfo.innerHTML = `Login sebagai: <strong>${user.nama_dosen || 'Admin'}</strong> (${user.nama_prodi || 'Sistem'}) [Role: ${user.active_role.charAt(0).toUpperCase() + user.active_role.slice(1).toLowerCase()}]${switchRoleHtml} | <a href="#" onclick="logout(); return false;">Logout</a>`;

    // ROLE BASED TABS
    const roleTabs = {
        admin: ['periode', 'prodi', 'profile', 'cpl', 'mk', 'cpmk', 'subcpmk', 'asesmen', 'mahasiswa', 'krs', 'nilai', 'cpl-achievement', 'cpl-prodi-achv', 'dosen'],
        dosen: ['mahasiswa', 'nilai'],
        kaprodi: ['periode', 'prodi', 'profile', 'cpl', 'mk', 'cpmk', 'subcpmk', 'asesmen'],
        dekan: ['cpl', 'cpl-achievement', 'cpl-prodi-achv']
    };

    const normalizedRole = user.active_role ? user.active_role.toLowerCase() : 'dosen';
    const allowedTabs = roleTabs[normalizedRole] || roleTabs['dosen'];

    // Sembunyikan tab yang tidak diperbolehkan
    document.querySelectorAll('.tab').forEach(t => {
        // Ekstrak nama tab dari atribut onclick (contoh: showTab('periode'))
        const onclickAttr = t.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/'([^']+)'/);
            if (match && match[1]) {
                const tabName = match[1];
                if (!allowedTabs.includes(tabName)) {
                    t.style.display = 'none';
                } else {
                    t.style.display = 'inline-block';
                }
            }
        }
    });

    // Lanjut tampilkan tab pertama yang diizinkan
    if (allowedTabs.length > 0) {
        showTab(allowedTabs[0]);
    } else {
        // Fallback
        showTab('periode');
    }
}

window.switchRole = function() {
    localStorage.removeItem('active_role');
    window.location.reload();
};

// Navigation Functions for hierarchy clicking
window.navigateToSubCpmk = async function(prodiId, mkId, cpmkId, kodeCpmk) {
    showTab('subcpmk'); // Triggers tab focus and initial load

    // Wait until options are ready to prevent overrides
    if (typeof fetchAllMksForSubCpmk === 'function') {
        await Promise.all([
            fetchAllMksForSubCpmk(),
            fetchAllCpmksForSubCpmk()
        ]);
    }

    // Set hierarchies sequentially
    const prodiSel = document.getElementById('prodi-subcpmk-select');
    if(prodiSel) {
        prodiSel.value = prodiId;
        if(typeof filterMkSubCpmkByProdi === 'function') filterMkSubCpmkByProdi();
    }
    
    const mkSel = document.getElementById('mk-subcpmk-select');
    if(mkSel) {
        mkSel.value = mkId;
        if(typeof filterCpmkByMk === 'function') filterCpmkByMk();
    }

    const cpmkSel = document.getElementById('cpmk-subcpmk-select');
    if(cpmkSel) {
        cpmkSel.value = cpmkId;
    }

    // Optionally reload tables if needed, but since dropdowns don't automatically trigger global table re-filter on their own, 
    // it's up to user preference. The table will remain showing all items.
    if(typeof loadSubCpmk === 'function') loadSubCpmk();
};

window.navigateToAsesmen = async function(prodiId, mkId, cpmkId, subcpmkId, kodeSubcpmk) {
    showTab('asesmen');

    if (typeof fetchAllMksForAsesmen === 'function') {
        await Promise.all([
            fetchAllMksForAsesmen(),
            fetchAllCpmksForAsesmen(),
            fetchAllSubCpmksForAsesmen()
        ]);
    }

    const prodiSel = document.getElementById('prodi-asesmen-select');
    if(prodiSel) {
        prodiSel.value = prodiId;
        if(typeof filterMkAsesmenByProdi === 'function') filterMkAsesmenByProdi();
    }
    
    const mkSel = document.getElementById('mk-asesmen-select');
    if(mkSel) {
        mkSel.value = mkId;
        if(typeof filterCpmkAsesmenByMk === 'function') filterCpmkAsesmenByMk();
    }

    const cpmkSel = document.getElementById('cpmk-asesmen-select');
    if(cpmkSel) {
        cpmkSel.value = cpmkId;
        if(typeof filterSubCpmkAsesmenByCpmk === 'function') filterSubCpmkAsesmenByCpmk();
    }

    const subcpmkSel = document.getElementById('subcpmk-asesmen-select');
    if(subcpmkSel) {
        subcpmkSel.value = subcpmkId;
    }

    if(typeof loadAsesmen === 'function') loadAsesmen();
};
