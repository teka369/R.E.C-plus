import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CambiarContrasena: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();
  // Ya no se recupera la contraseña actual del backend. Se valida contra el backend enviando currentPassword.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres.');
        setLoading(false);
        return;
    }

    const userEmail = (JSON.parse(localStorage.getItem('authUser') || '{}')?.correo) || localStorage.getItem('userEmail');
    const userTipo = role || localStorage.getItem('userRole');

    if (!userEmail || !userTipo) {
        setError('No se pudo obtener la información del usuario. Por favor, inicia sesión de nuevo.');
        setLoading(false);
        return;
    }

    try {
      const { data } = await api.post('/password/change-password', {
        email: userEmail,
        tipo: userTipo,
        currentPassword,
        newPassword,
      });

      if (data?.success ?? true) {
        setSuccess('Contraseña cambiada con éxito. Redirigiendo...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        
        setTimeout(() => {
          navigate(userTipo === 'profesor' ? '/PerfilProfesor' : '/PerfilEstudiante');
        }, 2000);
      } else {
        setError(data?.message || 'Error al cambiar la contraseña.');
      }
    } catch (err) {
      console.error('Error al conectar con el backend:', err);
      setError('Error al conectar con el servidor. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Cambiar Contraseña</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">Contraseña Actual</label>
                  <div className="input-group">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      className="form-control"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={loading}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmNewPassword" className="form-label">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CambiarContrasena;