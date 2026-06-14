const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    // Crucial: sends the HttpOnly auth_token cookie on every cross-origin request
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
