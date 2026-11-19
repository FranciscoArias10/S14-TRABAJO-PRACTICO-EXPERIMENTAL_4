const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function request(endpoint, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: {
        error: 'No se pudo conectar con el Back-End. Verifica que el servidor Express esté corriendo en http://localhost:3000.',
        detalle: error.message,
      },
    };
  }
}

export function registerUser(payload) {
  return request('/api/auth/register', { method: 'POST', body: payload });
}

export function loginUser(payload) {
  return request('/api/auth/login', { method: 'POST', body: payload });
}

export function getPerfil(token) {
  return request('/api/auth/perfil', { method: 'GET', token });
}

export function getUsuarios(token) {
  return request('/usuarios', { method: 'GET', token });
}

export function createUsuario(payload) {
  return request('/usuarios', { method: 'POST', body: payload });
}

export function updateUsuario(id, payload, token) {
  return request(`/usuarios/${id}`, { method: 'PUT', body: payload, token });
}

export function deleteUsuario(id, token) {
  return request(`/usuarios/${id}`, { method: 'DELETE', token });
}

export function probarAccesoSinToken(ruta = '/api/auth/perfil') {
  return request(ruta, { method: 'GET' });
}

export function probarAccesoTokenInvalido(ruta = '/api/auth/perfil') {
  return request(ruta, {
    method: 'GET',
    token: 'token.jwt.invalido_de_prueba',
  });
}

export function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) return null;
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export { API_URL };

