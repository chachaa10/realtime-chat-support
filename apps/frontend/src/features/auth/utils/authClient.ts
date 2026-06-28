const API_BASE = 'http://localhost:3001';

export async function fetchApi(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? 'Request failed');
  }

  return res.json();
}

export async function loginApi(email: string, password: string) {
  const res = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'agent',
) {
  const res = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  return res.data;
}
