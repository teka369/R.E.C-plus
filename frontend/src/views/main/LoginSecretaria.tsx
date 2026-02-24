import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import '../../assets/main/styles/Login.css';
import { FaBolt } from 'react-icons/fa';

// Importar la animación del astronauta
import Lottie from 'lottie-react';
import astronautAnimation from '../../assets/animations/astronauta-bonito.json';

// --- Constantes de decoración (se mantienen si se cambia a modo animado) ---
const shootingStars = Array.from({ length: 4 });
const luminescentStars = [
    { top: '12%', left: '18%' },
    { top: '28%', left: '75%' },
    { top: '60%', left: '40%' },
    { top: '80%', left: '65%' },
    { top: '50%', left: '10%' },
];

const LoginSecretaria: React.FC = () => {
    const navigate = useNavigate();
    const { login, role } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
    const [showMessage, setShowMessage] = useState(false);
    const [loading, setLoading] = useState(false);

    // 🔑 CAMBIO 1: Inicia en true para el modo de ahorro de recursos por defecto
    const [simpleMode, setSimpleMode] = useState(true); 
    
    // Estados para la transición animada (solo al hacer clic en el botón)
    const [transitioning, setTransitioning] = useState(false);
    const [transitionToSimple, setTransitionToSimple] = useState(false);

    // 🔑 CAMBIO 2: Estado para controlar si es la primera carga (para evitar la transición en el primer render)
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 🔑 CAMBIO 3: useEffect para manejar la primera carga
    useEffect(() => {
        // En la primera carga, el componente ya está en simpleMode=true, 
        // y este efecto asegura que isInitialLoad se marque como falso después del primer render.
        // Esto permite que el siguiente cambio de modo (con el botón) use la animación de transición.
        setIsInitialLoad(false);
    }, []);

    const displayMessage = (msg: string, type: 'success' | 'error' | 'info') => {
        setMessage(msg);
        setMessageType(type);
        setShowMessage(true);
        if (type !== 'error') {
            setTimeout(() => setShowMessage(false), 3000);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setShowMessage(false);
        setMessage('');

        if (!formData.email || !formData.password) {
            displayMessage('Correo y contraseña son requeridos', 'error');
            setLoading(false);
            return;
        }

        try {
            const { success, message } = await login(formData.email, formData.password);
            if (success) {
                displayMessage('Inicio de sesión exitoso', 'success');
                setTimeout(() => navigate('/registro-estudiantes'), 1000);
            } else {
                displayMessage(message || 'Error desconocido al iniciar sesión', 'error');
            }
        } catch (error: any) {
            console.error('Error en login de secretaría:', error);
            displayMessage(error?.response?.data?.message || 'Error desconocido al iniciar sesión.', 'error');
        }

        setLoading(false);
    };

    const handleCircularReveal = () => {
        // Al hacer clic, siempre se inicia la transición
        setTransitionToSimple(!simpleMode);
        setTransitioning(true);
    };

    // La lógica de renderizado se mantiene igual
    return (
        <div className={`auth-container${simpleMode ? ' simple-mode' : ''}`}>
            {/* Capa de transición de fondo con círculo: SOLO se muestra si NO es la carga inicial */}
            {transitioning && !isInitialLoad && (
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
                title={simpleMode ? 'Modo animado' : 'Modo rápido (menos recursos)'}
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
                {simpleMode ? 'Ahorro de recursos' : 'Modo rápido'}
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
            <div className="login-container">
                {showMessage && (
                    <div className={`login-message ${messageType}`}>
                        <i className={`bi ${
                            messageType === 'success' ? 'bi-check-circle-fill' : 
                            messageType === 'error' ? 'bi-exclamation-triangle-fill' : 
                            'bi-info-circle-fill'
                        }`}></i>
                        {message}
                    </div>
                )}
                <div className="login-wrapper">
                    <div className="login-left-side">
                        <h1>Acceso Secretaría</h1>
                        <p className="login-subtitle">
                            Accede al sistema para gestionar el registro de estudiantes
                        </p>
                        <div className="login-image-container">
                            <img src="/image.png" alt="Visual de inicio de sesión" className="login-image" />
                        </div>
                        <p className="login-helper-text">
                            ¿Eres estudiante? <Link to="/Principal" className="login-link">Volver a la página principal</Link>
                        </p>
                    </div>
                    <div className="login-right-side">
                        <div className="login-form-card">
                            <h2>Información de Secretaría</h2>
                            <form onSubmit={handleLoginSubmit}>
                                <div className="form-group">
                                    <label>Correo Institucional</label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            placeholder="secretaria@iejavieralondonobarriosevilla.edu.co"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required
                                        />
                                        <span className="input-icon">
                                            <i className="bi bi-person"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Contraseña</label>
                                    <div className="input-with-icon">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                        />
                                        <span className="input-icon" onClick={() => setShowPassword(!showPassword)}>
                                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </span>
                                    </div>
                                </div>
                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? 'Procesando...' : 'Iniciar Sesión'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginSecretaria;