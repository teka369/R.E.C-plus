import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/main/styles/Login.css';

const ForgotPassword: React.FC = () => {
  return (
    <div className="auth-container">
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-left-side">
            <h1>¿Olvidaste tu contraseña?</h1>
            <p className="login-subtitle">
              Si eres <b>estudiante</b>, solo acércate a <b>Secretaría</b> y allí te restablecen la contraseña usando tu número de documento.<br /><br />
              Si eres <b>profesor</b>, en Secretaría pueden recordarte tu contraseña o restablecerla a <b>12345</b> para que luego la cambies por una segura.<br /><br />
              <b>El cambio o recordatorio de contraseña es presencial en Secretaría.</b>
            </p>
            <div className="login-image-container">
              <img src="/image.png" alt="Recuperar contraseña" className="login-image" />
            </div>
            <p className="login-helper-text">
              <Link to="/login" className="login-link">
                <i className="bi bi-arrow-left"></i> Volver al inicio de sesión
              </Link>
            </p>
          </div>
          <div className="login-right-side d-flex align-items-center justify-content-center">
            <div className="login-form-card text-center">
              <h2>Recuperación de Contraseña</h2>
              <p className="mt-3 mb-0">
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2.5rem', color: '#f59e42' }}></i>
              </p>
              <p className="mt-3" style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 500 }}>
                No es posible recuperar la contraseña por este medio.<br />
                Acércate a Secretaría para recibir ayuda personalizada.<br /><br />
                <b>Estudiantes:</b> solo deben ir a Secretaría, allí se restablece la contraseña usando el número de documento.<br />
                <b>Profesores:</b> pueden pedir que se les recuerde la contraseña o que se la restablezcan a <b>12345</b> para luego cambiarla por una segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 