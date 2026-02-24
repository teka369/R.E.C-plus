import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/main/styles/PerfilUsuario.css';

interface User {
  id: number;
  username: string;
  rol: string;
  perfil?: {
    id: number;
    nombre: string;
    correo_electronico: string;
    foto_perfil?: string;
  };
}

const Error: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar perfil desde localStorage en lugar de hacer una petición de verificación
    const userData = localStorage.getItem('userData');
    if (!userData) {
      setError('No se encontraron datos de usuario. Por favor, inicia sesión.');
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (err) {
      console.error('Error al procesar datos de usuario:', err);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    // Eliminar datos de usuario del almacenamiento local
    localStorage.removeItem('userData');
    
    // Redireccionar a la página de login
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="perfil-page">
        <div className="loading-text">Cargando perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-page">
        <div className="container d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
          <div className="card shadow" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="card-header bg-danger text-white text-center">
              <h4>Error</h4>
            </div>
            <div className="card-body text-center">
              <p>{error}</p>
              <button 
                onClick={() => navigate('/')} 
                className="btn btn-outline-danger"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="perfil-page">
        <div className="loading-text">No se pudo cargar el perfil</div>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <h1>Perfil del Estudiante</h1>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>
      <section className="perfil-content">
        <div className="avatar-container">
          <img 
            src={user.perfil?.foto_perfil ? `http://localhost:3000${user.perfil.foto_perfil}` : '/default-avatar.png'} 
            alt="Avatar" 
            className="avatar-image"
          />
        </div>
        <div className="perfil-info-card">
          <h2>{user.perfil?.nombre || user.username}</h2>
          <div className="info-row">
            <strong>ID:</strong>
            <span>{user.id}</span>
          </div>
          <div className="info-row">
            <strong>Usuario:</strong>
            <span>{user.username}</span>
          </div>
          {user.perfil?.correo_electronico && (
            <div className="info-row">
              <strong>Correo:</strong>
              <span>{user.perfil.correo_electronico}</span>
            </div>
          )}
          <div className="info-row">
            <strong>Rol:</strong>
            <span>{user.rol === 'estudiante' ? 'Estudiante' : user.rol}</span>
          </div>
        </div>
      </section>
      <footer className="perfil-footer">
        <p>Bienvenido a tu perfil en el Sistema REC.</p>
      </footer>
    </div>
  );
};

export default Error;