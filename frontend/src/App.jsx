import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  API_URL,
  createUsuario,
  decodeJwtPayload,
  deleteUsuario,
  getPerfil,
  getUsuarios,
  loginUser,
  probarAccesoSinToken,
  probarAccesoTokenInvalido,
  registerUser,
  updateUsuario,
} from './services/api';

const STORAGE_TOKEN_KEY = 'unemi_jwt_token';
const STORAGE_USER_KEY = 'unemi_auth_user';

const EMPTY_REGISTER = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: '',
};

const EMPTY_LOGIN = {
  email: '',
  password: '',
};

function formatearError(data) {
  if (!data) return { mensaje: 'Error inesperado.', detalles: [] };
  const detalles = data.detalles && typeof data.detalles === 'object' ? Object.values(data.detalles) : [];
  return {
    mensaje: data.error || data.mensaje || 'Error en la petición.',
    detalles,
  };
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY) || '');
  const [usuarioActual, setUsuarioActual] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_USER_KEY);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  const [authTab, setAuthTab] = useState('login');
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [usuariosMessage, setUsuariosMessage] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [securityResult, setSecurityResult] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [crudForm, setCrudForm] = useState(EMPTY_REGISTER);
  const [crudLoading, setCrudLoading] = useState(false);
  const [crudError, setCrudError] = useState(null);

  const tokenPayload = useMemo(() => decodeJwtPayload(token), [token]);

  const guardarSesion = useCallback((nuevoToken, nuevoUsuario) => {
    setToken(nuevoToken);
    setUsuarioActual(nuevoUsuario);
    localStorage.setItem(STORAGE_TOKEN_KEY, nuevoToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nuevoUsuario));
  }, []);

  const cerrarSesion = useCallback((aviso = null) => {
    setToken('');
    setUsuarioActual(null);
    setUsuarios([]);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    if (aviso) {
      setAuthMessage(aviso);
    }
  }, []);

  const cargarUsuarios = useCallback(
    async (jwtToken = token) => {
      if (!jwtToken) return;
      setUsuariosLoading(true);
      setUsuariosMessage(null);
      const res = await getUsuarios(jwtToken);
      setUsuariosLoading(false);

      if (res.ok) {
        setUsuarios(res.data.usuarios || []);
      } else if (res.status === 401) {
        cerrarSesion({
          tipo: 'error',
          mensaje: res.data.error || 'Tu sesión JWT expiró o es inválida. Inicia sesión nuevamente.',
          detalles: [],
        });
      } else {
        setUsuariosMessage({ tipo: 'error', ...formatearError(res.data) });
      }
    },
    [token, cerrarSesion]
  );

  useEffect(() => {
    if (!token) return;
    let activo = true;

    (async () => {
      const perfilRes = await getPerfil(token);
      if (!activo) return;
      if (perfilRes.ok && perfilRes.data.usuario) {
        setUsuarioActual(perfilRes.data.usuario);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(perfilRes.data.usuario));
        cargarUsuarios(token);
      } else if (perfilRes.status === 401) {
        cerrarSesion();
      }
    })();

    return () => {
      activo = false;
    };
  }, [token, cargarUsuarios, cerrarSesion]);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    const res = await loginUser(loginForm);
    setAuthLoading(false);

    if (res.ok) {
      guardarSesion(res.data.token, res.data.usuario);
      setAuthMessage({
        tipo: 'success',
        mensaje: `${res.data.mensaje} Token JWT generado correctamente.`,
        detalles: [],
      });
      setLoginForm(EMPTY_LOGIN);
    } else {
      setAuthMessage({ tipo: 'error', ...formatearError(res.data) });
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    const payload = {
      ...registerForm,
      telefono: registerForm.telefono.trim() ? registerForm.telefono.trim() : null,
    };

    const res = await registerUser(payload);
    setAuthLoading(false);

    if (res.ok) {
      guardarSesion(res.data.token, res.data.usuario);
      setAuthMessage({
        tipo: 'success',
        mensaje: `${res.data.mensaje} Sesión iniciada automáticamente con JWT.`,
        detalles: [],
      });
      setRegisterForm(EMPTY_REGISTER);
    } else {
      setAuthMessage({ tipo: 'error', ...formatearError(res.data) });
    }
  }

  function rellenarDemoLogin() {
    setAuthTab('login');
    setLoginForm({ email: 'ana.torres@correo.com', password: '123456' });
    setAuthMessage({
      tipo: 'info',
      mensaje: 'Credenciales de prueba cargadas. Haz clic en "Ingresar" para obtener el token JWT.',
      detalles: [],
    });
  }

  async function ejecutarPruebaSeguridad(modo) {
    setSecurityLoading(true);
    let etiqueta = '';
    let ruta = '/api/auth/perfil';
    let res;

    if (modo === 'perfil-auth') {
      etiqueta = 'Acceso AUTORIZADO a /api/auth/perfil (con JWT actual)';
      res = await getPerfil(token);
    } else if (modo === 'usuarios-auth') {
      etiqueta = 'Acceso AUTORIZADO a /usuarios (con JWT actual)';
      ruta = '/usuarios';
      res = await getUsuarios(token);
    } else if (modo === 'sin-token') {
      etiqueta = 'Acceso NO AUTORIZADO a /api/auth/perfil (SIN token)';
      res = await probarAccesoSinToken('/api/auth/perfil');
    } else {
      etiqueta = 'Acceso NO AUTORIZADO a /usuarios (con token INVÁLIDO)';
      ruta = '/usuarios';
      res = await probarAccesoTokenInvalido('/usuarios');
    }

    setSecurityLoading(false);
    setSecurityResult({
      etiqueta,
      ruta,
      status: res.status,
      ok: res.ok,
      data: res.data,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  function abrirModalCrear() {
    setEditingUser(null);
    setCrudForm(EMPTY_REGISTER);
    setCrudError(null);
    setModalOpen(true);
  }

  function abrirModalEditar(user) {
    setEditingUser(user);
    setCrudForm({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      password: '',
      telefono: user.telefono || '',
    });
    setCrudError(null);
    setModalOpen(true);
  }

  async function handleCrudSubmit(e) {
    e.preventDefault();
    setCrudLoading(true);
    setCrudError(null);

    let res;
    if (editingUser) {
      const payload = {
        nombre: crudForm.nombre,
        apellido: crudForm.apellido,
        email: crudForm.email,
        telefono: crudForm.telefono.trim() ? crudForm.telefono.trim() : null,
      };
      if (crudForm.password.trim()) {
        payload.password = crudForm.password;
      }
      res = await updateUsuario(editingUser.id, payload, token);
    } else {
      const payload = {
        ...crudForm,
        telefono: crudForm.telefono.trim() ? crudForm.telefono.trim() : null,
      };
      res = await createUsuario(payload);
    }

    setCrudLoading(false);

    if (res.ok) {
      setModalOpen(false);
      setUsuariosMessage({
        tipo: 'success',
        mensaje: res.data.mensaje || 'Operación realizada correctamente.',
        detalles: [],
      });
      await cargarUsuarios(token);
      if (editingUser && usuarioActual && editingUser.id === usuarioActual.id && res.data.usuario) {
        setUsuarioActual(res.data.usuario);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.data.usuario));
      }
    } else {
      setCrudError(formatearError(res.data));
    }
  }

  async function handleEliminarUsuario(user) {
    if (!window.confirm(`¿Eliminar al usuario ${user.nombre} ${user.apellido} (${user.email})?`)) {
      return;
    }

    const res = await deleteUsuario(user.id, token);
    if (res.ok) {
      setUsuariosMessage({
        tipo: 'success',
        mensaje: res.data.mensaje || 'Usuario eliminado.',
        detalles: [],
      });
      if (usuarioActual && user.id === usuarioActual.id) {
        cerrarSesion({
          tipo: 'info',
          mensaje: 'Eliminaste tu propio usuario y se cerró la sesión.',
          detalles: [],
        });
      } else {
        await cargarUsuarios(token);
      }
    } else {
      setUsuariosMessage({ tipo: 'error', ...formatearError(res.data) });
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nombre?.toLowerCase().includes(q) ||
        u.apellido?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [usuarios, busqueda]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Aplicación Full Stack — Usuarios con MongoDB & JWT</h1>
          <p>
            React + Node.js + Express + MongoDB ({API_URL})
          </p>
        </div>

        <div className="topbar-status">
          <span className={`session-pill ${token ? 'ok' : 'off'}`}>
            {token && usuarioActual
              ? `Sesión activa: ${usuarioActual.nombre} ${usuarioActual.apellido}`
              : 'Sin sesión JWT (No autenticado)'}
          </span>
          {token && (
            <button
              type="button"
              className="btn btn-logout btn-sm"
              onClick={() =>
                cerrarSesion({
                  tipo: 'info',
                  mensaje: 'Sesión cerrada. El token JWT fue eliminado del navegador.',
                  detalles: [],
                })
              }
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </header>

      <main className="grid-layout">
        {/* Columna izquierda: Autenticación / Perfil y Verificación JWT */}
        <div className="column-stack">
          {!token ? (
            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Autenticación de Usuarios</h2>
                  <p className="card-subtitle">Inicia sesión o regístrate para obtener un JWT</p>
                </div>
              </div>

              <div className="tabs">
                <button
                  type="button"
                  className={`tab-btn ${authTab === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthTab('login');
                    setAuthMessage(null);
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  className={`tab-btn ${authTab === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthTab('register');
                    setAuthMessage(null);
                  }}
                >
                  Registrarse
                </button>
              </div>

              {authMessage && (
                <div className={`alert alert-${authMessage.tipo}`}>
                  <strong>{authMessage.mensaje}</strong>
                  {authMessage.detalles?.length > 0 && (
                    <ul>
                      {authMessage.detalles.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {authTab === 'login' ? (
                <form className="form-grid" onSubmit={handleLoginSubmit}>
                  <div className="field">
                    <label htmlFor="login-email">Correo electrónico</label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="ana.torres@correo.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="login-password">Contraseña</label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      placeholder="••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={authLoading}>
                    {authLoading ? 'Validando...' : 'Ingresar y generar JWT'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={rellenarDemoLogin}>
                    Cargar usuario de prueba (ana.torres@correo.com)
                  </button>
                </form>
              ) : (
                <form className="form-grid" onSubmit={handleRegisterSubmit}>
                  <div className="form-row-2">
                    <div className="field">
                      <label htmlFor="reg-nombre">Nombre</label>
                      <input
                        id="reg-nombre"
                        type="text"
                        required
                        minLength={2}
                        placeholder="María"
                        value={registerForm.nombre}
                        onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="reg-apellido">Apellido</label>
                      <input
                        id="reg-apellido"
                        type="text"
                        required
                        minLength={2}
                        placeholder="Gómez"
                        value={registerForm.apellido}
                        onChange={(e) => setRegisterForm({ ...registerForm, apellido: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="reg-email">Correo electrónico</label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="maria.gomez@correo.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="field">
                      <label htmlFor="reg-password">Contraseña (mín. 6)</label>
                      <input
                        id="reg-password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="reg-telefono">Teléfono (opcional)</label>
                      <input
                        id="reg-telefono"
                        type="text"
                        placeholder="0991112233"
                        value={registerForm.telefono}
                        onChange={(e) => setRegisterForm({ ...registerForm, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={authLoading}>
                    {authLoading ? 'Registrando...' : 'Crear cuenta en MongoDB'}
                  </button>
                </form>
              )}
            </section>
          ) : (
            <section className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Perfil Protegido (JWT)</h2>
                  <p className="card-subtitle">Datos del usuario autenticado desde MongoDB</p>
                </div>
                <span className="badge badge-ok">Autorizado</span>
              </div>

              {authMessage && (
                <div className={`alert alert-${authMessage.tipo}`}>
                  <strong>{authMessage.mensaje}</strong>
                </div>
              )}

              {usuarioActual && (
                <div className="profile-grid">
                  <div className="profile-item">
                    <span>Nombre</span>
                    <strong>
                      {usuarioActual.nombre} {usuarioActual.apellido}
                    </strong>
                  </div>
                  <div className="profile-item">
                    <span>Email</span>
                    <strong>{usuarioActual.email}</strong>
                  </div>
                  <div className="profile-item">
                    <span>Teléfono</span>
                    <strong>{usuarioActual.telefono || 'No registrado'}</strong>
                  </div>
                  <div className="profile-item">
                    <span>ID MongoDB</span>
                    <strong>{usuarioActual.id}</strong>
                  </div>
                </div>
              )}

              <div className="field">
                <label>Token JWT activo (Authorization: Bearer)</label>
                <pre className="token-box">{token}</pre>
              </div>

              {tokenPayload && (
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Payload decodificado del JWT</label>
                  <pre className="token-box">{JSON.stringify(tokenPayload, null, 2)}</pre>
                </div>
              )}
            </section>
          )}

          {/* Panel de Demostración de Acceso Autorizado vs No Autorizado */}
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Pruebas de Control de Acceso JWT</h2>
                <p className="card-subtitle">
                  Comprueba respuestas reales del Back-End con y sin token válido
                </p>
              </div>
            </div>

            <div className="security-actions">
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={securityLoading}
                onClick={() => ejecutarPruebaSeguridad('perfil-auth')}
              >
                GET /api/auth/perfil (con sesión)
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={securityLoading}
                onClick={() => ejecutarPruebaSeguridad('usuarios-auth')}
              >
                GET /usuarios (con sesión)
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={securityLoading}
                onClick={() => ejecutarPruebaSeguridad('sin-token')}
              >
                Probar SIN Token (401)
              </button>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                disabled={securityLoading}
                onClick={() => ejecutarPruebaSeguridad('token-invalido')}
              >
                Probar Token Inválido (401)
              </button>
            </div>

            {securityResult ? (
              <div>
                <div className="card-header" style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.85rem' }}>{securityResult.etiqueta}</strong>
                  <span className={`badge ${securityResult.ok ? 'badge-ok' : 'badge-err'}`}>
                    HTTP {securityResult.status || 'ERR'} · {securityResult.timestamp}
                  </span>
                </div>
                <pre className="token-box">{JSON.stringify(securityResult.data, null, 2)}</pre>
              </div>
            ) : (
              <p className="helper-note">
                Haz clic en cualquier botón para comprobar en vivo cómo el middleware JWT permite el acceso autorizado (200) y bloquea peticiones no autorizadas (401).
              </p>
            )}
          </section>
        </div>

        {/* Columna derecha: Módulo CRUD protegido de Usuarios */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Gestión de Usuarios en MongoDB (Ruta Protegida)</h2>
              <p className="card-subtitle">
                Los endpoints GET, PUT y DELETE de /usuarios requieren token JWT válido
              </p>
            </div>
            {token && <span className="badge badge-info">{usuarios.length} usuarios</span>}
          </div>

          {!token ? (
            <div className="protected-empty">
              <h3>Acceso Restringido por JWT</h3>
              <p>
                Esta sección consume rutas protegidas del Back-End. Inicia sesión o registra una cuenta para consultar, editar o eliminar usuarios almacenados en MongoDB.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => ejecutarPruebaSeguridad('sin-token')}
              >
                Intentar acceder sin token (Ver bloqueo 401)
              </button>
            </div>
          ) : (
            <>
              {usuariosMessage && (
                <div className={`alert alert-${usuariosMessage.tipo}`}>
                  <strong>{usuariosMessage.mensaje}</strong>
                  {usuariosMessage.detalles?.length > 0 && (
                    <ul>
                      {usuariosMessage.detalles.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="toolbar">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Buscar por nombre, apellido o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => cargarUsuarios(token)}
                    disabled={usuariosLoading}
                  >
                    {usuariosLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={abrirModalCrear}>
                    + Nuevo Usuario
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Registrado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                          {usuariosLoading ? 'Consultando MongoDB...' : 'No se encontraron usuarios.'}
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>
                              {u.nombre} {u.apellido}
                            </strong>
                            {usuarioActual?.id === u.id && (
                              <span className="badge badge-ok" style={{ marginLeft: 6 }}>
                                Tú
                              </span>
                            )}
                          </td>
                          <td>{u.email}</td>
                          <td>{u.telefono || '—'}</td>
                          <td>
                            {u.creado_en
                              ? new Date(u.creado_en).toLocaleDateString('es-EC')
                              : '—'}
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => abrirModalEditar(u)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleEliminarUsuario(u)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="card-header">
              <h2 className="card-title">
                {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalOpen(false)}
              >
                Cerrar
              </button>
            </div>

            {crudError && (
              <div className="alert alert-error">
                <strong>{crudError.mensaje}</strong>
                {crudError.detalles?.length > 0 && (
                  <ul>
                    {crudError.detalles.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form className="form-grid" onSubmit={handleCrudSubmit}>
              <div className="form-row-2">
                <div className="field">
                  <label htmlFor="crud-nombre">Nombre</label>
                  <input
                    id="crud-nombre"
                    type="text"
                    required
                    minLength={2}
                    value={crudForm.nombre}
                    onChange={(e) => setCrudForm({ ...crudForm, nombre: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="crud-apellido">Apellido</label>
                  <input
                    id="crud-apellido"
                    type="text"
                    required
                    minLength={2}
                    value={crudForm.apellido}
                    onChange={(e) => setCrudForm({ ...crudForm, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="crud-email">Email</label>
                <input
                  id="crud-email"
                  type="email"
                  required
                  value={crudForm.email}
                  onChange={(e) => setCrudForm({ ...crudForm, email: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="field">
                  <label htmlFor="crud-password">
                    {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña (mín. 6)'}
                  </label>
                  <input
                    id="crud-password"
                    type="password"
                    required={!editingUser}
                    minLength={6}
                    placeholder={editingUser ? 'Dejar vacío para mantener' : '••••••'}
                    value={crudForm.password}
                    onChange={(e) => setCrudForm({ ...crudForm, password: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="crud-telefono">Teléfono (opcional)</label>
                  <input
                    id="crud-telefono"
                    type="text"
                    value={crudForm.telefono}
                    onChange={(e) => setCrudForm({ ...crudForm, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={crudLoading}>
                  {crudLoading ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

