// public/js/auth.js

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsgElement = document.getElementById('errorMsg');

    try {
        // Menggunakan API /api/auth/login yang baru, yang tidak memerlukan Bearer token
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login gagal.');
        }

        // Simpan token yang dikembalikan dari API ke localStorage
        localStorage.setItem('obe_token', data.token);

        // Check if multiple roles exist
        const roles = data.roles || ['Dosen'];
        if (roles.length > 1) {
            // Hide login form and format role selector
            document.getElementById('loginForm').style.display = 'none';
            const roleContainer = document.getElementById('roleSelectionContainer');
            const buttonsContainer = document.getElementById('role-selection-buttons');
            
            buttonsContainer.innerHTML = roles.map(r => 
                `<button onclick="setActiveRoleAndRedirect('${r}')" type="button" class="login-btn" style="background: #3498db; margin-top: 5px;">Masuk sebagai ${r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()}</button>`
            ).join('');
            
            roleContainer.style.display = 'block';
        } else {
            // Single role or empty
            localStorage.setItem('active_role', roles[0] || 'Dosen');
            window.location.href = "/index.html";
        }
    } catch (error) {
        if (errorMsgElement) {
            errorMsgElement.innerText = "Gagal login: " + error.message;
        } else {
            alert("Gagal login: " + error.message);
        }
    }
});

window.setActiveRoleAndRedirect = function(role) {
    localStorage.setItem('active_role', role);
    window.location.href = "/index.html";
};
