import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface LoginBubbleProps {
  isAuthenticated: boolean;
}

const LoginBubble: React.FC<LoginBubbleProps> = ({ isAuthenticated }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });

  useEffect(() => {
    console.log('LoginBubble: isAuthenticated =', isAuthenticated);
    
    // Si el usuario está autenticado, no hacer nada.
    if (isAuthenticated) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.pageYOffset;
      console.log('LoginBubble: scrollY =', scrollY);
      
      // Mostrar la burbuja si se ha bajado más de 200px
      if (scrollY > 200) {
        console.log('LoginBubble: Mostrando burbuja');
        setIsVisible(true);
      } else {
        console.log('LoginBubble: Ocultando burbuja');
        setIsVisible(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Actualizar la posición de la burbuja para seguir el cursor
      setPosition({ x: e.clientX, y: e.clientY });
    };

    // Añadir los listeners de eventos
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Limpiar los listeners al desmontar el componente
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isAuthenticated]);

  // Debug: siempre mostrar si no está autenticado
  if (!isAuthenticated) {
    console.log('LoginBubble: Renderizando componente, isVisible =', isVisible);
  }

  return (
    <>
      <style>{`
        .login-bubble-follower {
          position: fixed;
          z-index: 999999;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .login-bubble-link {
          display: block;
          pointer-events: auto;
          background: linear-gradient(135deg, #ff0000, #ff6600);
          color: #ffffff;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          text-decoration: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
          font-weight: bold;
          font-size: 1rem;
          border: 4px solid rgba(255, 255, 255, 0.3);
        }

        .login-bubble-link:hover {
          transform: translate(-50%, -50%) scale(1.2);
          background: linear-gradient(135deg, #ff6600, #ff0000);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
        }

        .login-bubble-text {
          font-size: 1rem;
          font-weight: bold;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <div
        className="login-bubble-follower"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          opacity: isVisible ? 1 : 0,
          display: isAuthenticated ? 'none' : 'block',
        }}
      >
        <Link to="/login" className="login-bubble-link" aria-label="Iniciar Sesión">
          <span className="login-bubble-text">Iniciar<br/>Sesión</span>
        </Link>
      </div>
    </>
  );
};

export default LoginBubble; 