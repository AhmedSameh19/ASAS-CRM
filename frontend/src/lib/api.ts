// All requests go to /api/* which Next.js proxies to the backend worker.
// This keeps cookies same-origin so the HttpOnly auth_token cookie is sent automatically.
const API_BASE = '/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    // Same-origin after the proxy, but keep this for safety
    credentials: 'include',
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  get:    (endpoint: string) =>
    request(endpoint),
  post:   (endpoint: string, body: any) =>
    request(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put:    (endpoint: string, body: any) =>
    request(endpoint, { method: 'PUT',  body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: (endpoint: string) =>
    request(endpoint, { method: 'DELETE' }),
};
