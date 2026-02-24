import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaQuestionCircle, FaBolt } from 'react-icons/fa';
import Lottie from 'lottie-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import '../../assets/main/styles/Login.css'; 

// Importar la animación del astronauta
import astronautAnimation from '../../assets/animations/astronauta-bonito.json';

// Definiciones de estrellas para el modo animado
const shootingStars = Array.from({ length: 4 });
const luminescentStars = [
  { top: '12%', left: '18%' },
  { top: '28%', left: '75%' },
  { top: '60%', left: '40%' },
  { top: '80%', left: '65%' },
  { top: '50%', left: '10%' },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, role } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  // Se mantiene en true para iniciar en modo simple
  const [simpleMode, setSimpleMode] = useState(true); 
  const [transitioning, setTransitioning] = useState(false);
  const [transitionToSimple, setTransitionToSimple] = useState(false);

  const showToast = (title: string, message: string, type: string) => {
    setAlertMessage({ title, message, type });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.type === 'email' ? 'email' : 'password']: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showToast('Error', 'Por favor complete todos los campos', 'danger');
      return;
    }

    try {
      const { success, message } = await login(formData.email, formData.password);
      if (success) {
        // role y user se establecen dentro del AuthContext
        const redirectPath = role === 'profesor' ? '/PerfilProfesor' : role === 'secretario' ? '/registro-estudiantes' : '/PerfilEstudiante';
        navigate(redirectPath);
        showToast('Éxito', 'Inicio de sesión exitoso', 'success');
      } else {
        showToast('Error', message || 'Error al iniciar sesión, vuelve a intentar', 'danger');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      showToast(
        'Error', 
        error?.response?.data?.message || 'Error al iniciar sesión, vuelve a intentar', 
        'danger'
      );
    }
  };

  const handleCircularReveal = () => {
    setTransitionToSimple(!simpleMode);
    setTransitioning(true);
  };

  return (
    <div className={`auth-container${simpleMode ? ' simple-mode' : ''}`}>
      {/* Capa de transición de fondo con círculo */}
      {transitioning && (
        <div
          className={`background-transition-layer${transitionToSimple ? ' to-simple' : ' to-animado'}`}
          onAnimationEnd={() => {
            setSimpleMode((prev) => !prev);
            setTransitioning(false);
          }}
        ></div>
      )}
      
      {/* Botón de modo simple/animado */}
      <button
        className="simple-mode-toggle"
        title={simpleMode ? 'Activar modo animado (más recursos)' : 'Activar modo rápido (menos recursos)'}
        onClick={handleCircularReveal}
        style={{ 
          position: 'fixed', top: 24, right: 24, zIndex: 1001, 
          background: simpleMode ? '#ffe082' : '#fff', 
          border: '2px solid #fbc02d', 
          borderRadius: '50%', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', 
          width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s, border 0.2s' 
        }}
        aria-label={simpleMode ? 'Modo animado' : 'Modo rápido (menos recursos)'}
      >
        <FaBolt color={simpleMode ? '#222' : '#1976d2'} size={30} />
      </button>
      
      {/* Texto explicativo debajo del botón */}
      <div style={{ position: 'fixed', top: 80, right: 18, zIndex: 1001, textAlign: 'center', fontSize: '13px', color: '#fbc02d', fontWeight: 600, textShadow: '0 1px 4px #fff8' }}>
        {simpleMode ? 'Ahorro de recursos' : 'Modo detallado'}
      </div>
      
      {/* Animaciones y fondo solo si NO está en modo simple */}
      {!simpleMode && (
        <>
          {luminescentStars.map((star, i) => (
            <div key={i} className="luminescent-star" style={{ top: star.top, left: star.left }}></div>
          ))}
          {shootingStars.map((_, i) => (
            <div key={i} className={`shooting-star shooting-star-${i+1}`}>
              <div className="shooting-star-tail"></div>
              <div className="shooting-star-head"></div>
            </div>
          ))}
          <div className="astronaut-container top-left-astro">
            <Lottie
              animationData={astronautAnimation}
              loop={true}
              style={{ width: 220, height: 220 }}
            />
          </div>
        </>
      )}

      {/* Contenedor Principal de Login (siempre visible) */}
      <div className="login-container">
        
        {/* Alerta / Toast */}
        {showAlert && (
          <div className={`login-message ${alertMessage.type}`} role="alert">
            <strong>{alertMessage.title}</strong> {alertMessage.message}
            <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
          </div>
        )}

        <div className="login-wrapper">
          <div className="login-left-side">
            <h1>Bienvenido</h1>
            <p className="login-subtitle">Sistema de Gestión Educativa</p>
            <div className="login-image-container">
              <img src="image.png" alt="Logo" className="login-image" /> 
            </div>
            <p className="login-helper-text">
              ¿Necesitas ayuda? <Link to="/Contacto" className="login-link">Contáctanos</Link>
            </p>
          </div>
          <div className="login-right-side">
            <div className="login-form-card">
              <h2>Iniciar Sesión</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    <FaUser className="me-2" />
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ejemplo@iejavieralondonobarriosevilla.edu.co"
                    required
                  />
                </div>
                <div className="form-group password-group">
                  <label className="form-label">
                    <FaLock className="me-2" />
                    Contraseña
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Ingrese su contraseña"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="login-button">
                  Iniciar Sesión
                </button>
                <div className="forgot-password">
                  <Link 
                    to="/forgot-password" 
                    className="forgot-password-link" 
                    // ✨ CAMBIO CLAVE: Estilo condicional para el color del texto
                    style={{ 
                        color: simpleMode ? '#444' : '#ffffff', // Color oscuro en modo simple, blanco en modo detallado
                        textDecoration: 'none',
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: '400',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                  }}>
                    <FaQuestionCircle className="me-1" />
                    ¿Olvidaste tu Contraseña?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;