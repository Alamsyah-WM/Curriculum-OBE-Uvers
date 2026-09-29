// Frontend/service/auth.ts

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  roles: string[];
  // tambahkan field lain sesuai response backend (user, role, dll)
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // bisa ambil pesan error dari backend
    let message = "Login failed";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch (_) {
      // ignore
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data as LoginResponse;
}

export async function logout(): Promise<void> {
  // Clear cookie token
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  
  // Clear localStorage
  localStorage.removeItem("role");
  localStorage.removeItem("roles");
  localStorage.removeItem("userProfile");
}