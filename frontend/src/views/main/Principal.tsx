import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../assets/main/styles/Principal.css';
import LoginBubble from './components/LoginBubble';
import { useAuth } from '../../contexts/AuthContext';

// Props simuladas para demostración
interface HomePageProps {
  isAuthenticated?: boolean;
}

const App: React.FC<HomePageProps> = () => {
  const { token, role } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [userRole, setUserRole] = useState(role || '');
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!token);
    setUserRole(role || '');

    // Lógica simplificada solo para el botón de scroll
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [token, role]);

  // Función para desplazarse arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Desplazamiento suave
    });
  };

  return (
    <>
      <style>{`
        /* Variables CSS para colores */
        :root {
          --primary-color: #1e40af; /* Azul oscuro */
          --secondary-color: #3730a3; /* Índigo */
          --accent-color: #7c3aed; /* Violeta */
          --light-bg: #f8fafc; /* Gris muy claro */
          --dark-text: #1e293b; /* Texto oscuro */
          --light-text: #ffffff; /* Texto claro */
          --card-bg: #ffffff; /* Fondo de tarjeta */
          --shadow-color: rgba(0, 0, 0, 0.1);
          --light-shadow: rgba(0, 0, 0, 0.05);
        }

        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--light-bg) 0%, #e2e8f0 100%);
          color: var(--dark-text);
        }

        /* Header mejorado con imagen de estudio */
        .app-header {
          position: relative;
          background-image: url('https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          min-height: 85vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 20px 60px var(--shadow-color);
        }

        .app-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.8) 0%, rgba(55, 48, 163, 0.7) 50%, rgba(124, 58, 237, 0.6) 100%);
          z-index: 1;
        }

        .header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.15); /* Overlay más sutil */
          z-index: 2;
        }

        @keyframes float { /* Consider removing if not used */
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.01); }
        }

        .app-title {
          font-size: 5rem; /* Tamaño de fuente ajustado */
          font-weight: 800;
          color: var(--light-text);
          text-shadow: 0 5px 25px rgba(0, 0, 0, 0.4); /* Sombra ajustada */
          margin-bottom: 0.5rem; /* Margen ajustado */
          letter-spacing: 0.1em;
          line-height: 1.1;
        }

        .header-subtitle {
          font-size: 1.6rem; /* Tamaño de fuente ajustado */
          color: rgba(255, 255, 255, 0.95); /* Color ajustado */
          font-weight: 300;
          margin-bottom: 3rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); /* Sombra ajustada */
        }

        /* Botones mejorados */
        .btn-modern {
          padding: 14px 36px; /* Padding ajustado */
          border-radius: 30px; /* Más redondeado */
          font-weight: 600;
          font-size: 1.15rem; /* Tamaño de fuente ajustado */
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          position: relative;
          overflow: hidden;
          box-shadow: 0 5px 18px var(--shadow-color);
        }

        .btn-modern:hover {
          transform: translateY(-3px); /* Desplazamiento ajustado */
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); /* Sombra ajustada */
        }

        .btn-modern i {
            margin-right: 8px;
        }

        .btn-light-modern {
          background: var(--card-bg);
          color: var(--primary-color);
          backdrop-filter: blur(10px);
        }

        .btn-light-modern:hover {
          background: #f0f0f0; /* Fondo ligeramente más oscuro en hover */
          color: var(--primary-color);
        }

        .btn-outline-modern {
          background: rgba(255, 255, 255, 0.15); /* Más visible */
          color: var(--light-text);
          border: 2px solid rgba(255, 255, 255, 0.4); /* Borde más visible */
          backdrop-filter: blur(10px);
        }

        .btn-outline-modern:hover {
          background: rgba(255, 255, 255, 0.25); /* Fondo en hover */
          color: var(--light-text);
          border-color: rgba(255, 255, 255, 0.6); /* Borde en hover */
        }

        /* Main content mejorado */
        .app-main {
          position: relative;
          z-index: 10;
          margin-top: -80px; /* Ajustar margen superior */
        }

        .app-section {
          padding: 4rem 0; /* Padding de sección */
        }

        .section-title {
          font-size: 2.5rem; /* Tamaño de título de sección */
          font-weight: 700;
          color: var(--dark-text);
          margin-bottom: 2.5rem; /* Margen ajustado */
          text-align: center;
          position: relative;
        }
        
        .section-title::after {
            content: '';
            display: block;
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
            margin: 10px auto 0;
            border-radius: 2px;
        }

        .welcome-banner {
          background: var(--card-bg);
          border-radius: 15px; /* Menos redondeado */
          padding: 3rem 2rem; /* Padding */
          box-shadow: 0 10px 40px var(--shadow-color); /* Sombra */
          border: 1px solid rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
          margin-bottom: 4rem; /* Margen inferior */
        }

        .welcome-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px; /* Altura ajustada */
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
        }

        .welcome-banner h2 {
          color: var(--dark-text);
          font-weight: 700;
          font-size: 2rem; /* Tamaño de fuente */
          margin-bottom: 0.8rem; /* Margen */
        }

        .welcome-banner .lead {
          color: #525f7f; /* Color de texto ajustado */
          font-size: 1.1rem; /* Tamaño de fuente */
          font-weight: 400;
          line-height: 1.6;
        }

        /* What's New Section */
        .news-item {
          background: var(--card-bg);
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 5px 15px var(--light-shadow);
          transition: transform 0.3s ease;
        }

        .news-item:hover {
          transform: translateY(-5px);
        }

        .news-item h5 {
          color: var(--dark-text);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .news-item p {
          color: #64748b;
          font-size: 0.95rem;
        }

        .news-item .badge {
            font-size: 0.8rem;
            padding: 0.4em 0.6em;
            border-radius: 4px;
        }

        .news-image {
          border-radius: 10px;
          box-shadow: 0 10px 30px var(--shadow-color);
        }

        /* Services Section */
        .services-section .service-card {
          border: none;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px var(--light-shadow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: var(--card-bg);
        }

        .services-section .service-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 45px var(--shadow-color);
        }

        .service-icon {
          font-size: 4rem !important; /* Tamaño del icono */
          color: var(--primary-color); /* Color del icono */
          margin-bottom: 1rem;
        }

        .service-card .card-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--dark-text);
          margin-bottom: 1rem;
        }

        .service-card .card-text {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.6;
        }

        .service-card .btn {
            border-radius: 20px;
            font-size: 0.9rem;
            padding: 8px 20px;
        }

        /* Stats Section */
       .stats-section {
           background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
           color: var(--light-text);
           text-align: center;
       }

       .stat-item {
           margin-bottom: 2rem;
       }

       .stat-icon {
           font-size: 3.5rem !important;
           color: rgba(255, 255, 255, 0.8);
           margin-bottom: 0.8rem;
       }

       .stat-item h3 {
           font-size: 2.8rem;
           font-weight: 700;
           margin-bottom: 0.5rem;
           color: var(--light-text);
       }

       .stat-item p {
           font-size: 1.1rem;
           font-weight: 300;
           color: rgba(255, 255, 255, 0.9);
       }

        /* Testimonials Section */
        .testimonials-section {
          background: var(--light-bg);
        }

        .blockquote {
          font-size: 1.3rem;
          color: #4b5563; /* Color de texto */
          border-left: 5px solid var(--primary-color); /* Borde izquierdo */
          padding-left: 1.5rem;
          margin: 2rem auto;
          max-width: 700px;
        }

        .blockquote-footer {
          font-size: 1rem;
          color: #6b7280;
          margin-top: 1rem;
        }

        .carousel-control-prev-icon, .carousel-control-next-icon {
            filter: invert(1) grayscale(100%); /* Iconos claros */
        }

        .carousel-control-prev, .carousel-control-next {
            width: 5%;
        }

        /* CTA Section */
        .cta-section {
           background: linear-gradient(135deg, #dc3545, #fd7e14); /* Gradiente de peligro/advertencia */
           color: var(--light-text);
           text-align: center;
           padding: 5rem 0;
        }

        .cta-section h2 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
        }

        .cta-section p {
            font-size: 1.2rem;
            font-weight: 300;
            margin-bottom: 2.5rem;
            color: rgba(255, 255, 255, 0.9);
        }

        .cta-section .btn {
             border-radius: 30px;
             padding: 12px 30px;
             font-size: 1.1rem;
             font-weight: 600;
        }

         .cta-section .btn-light {
             background-color: var(--light-text);
             color: #dc3545;
         }

        /* About Us Section */
        .about-container {
            background: #eef2ff; /* Fondo suave */
        }

        .mission-vision-card {
            border: none;
            border-radius: 15px;
            box-shadow: 0 8px 25px var(--light-shadow);
            padding: 1.5rem;
            background: var(--card-bg);
        }

        .mission-vision-card .card-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--dark-text);
            margin-bottom: 1rem;
        }

        .mission-vision-card .card-text {
            color: #64748b;
            font-size: 1rem;
            line-height: 1.6;
        }

        .icon-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .icon-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--primary-color);
        }

        /* Contact Section */
        .contact-section {
            background: var(--light-bg);
        }

         .contact-section .section-title::after {
            background: linear-gradient(90deg, #dc3545, #fd7e14); /* Gradiente para el título de contacto */
         }

        .contact-card {
            border: none;
            border-radius: 15px;
            box-shadow: 0 8px 25px var(--light-shadow);
            padding: 2rem 1.5rem;
            background: var(--card-bg);
            transition: transform 0.3s ease;
        }

        .contact-card:hover {
            transform: translateY(-8px);
        }

        .contact-card .card-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: var(--dark-text);
            margin-bottom: 1rem;
        }

        .contact-card .card-text {
             color: #64748b;
             font-size: 1rem;
             line-height: 1.6;
        }

        .contact-card .icon-circle {
             background-color: var(--primary-color); /* Color por defecto */
        }

        .contact-card .btn {
            border-radius: 20px;
            font-size: 0.95rem;
            padding: 10px 25px;
        }

        /* Map Section */
        .mapa-section {
            background: #f1f5f9; /* Fondo para la sección del mapa */
            padding-bottom: 0;
        }
         .mapa-section .section-title::after {
            background: linear-gradient(90deg, #dc3545, #fd7e14); /* Gradiente para el título del mapa */
         }

        .mapa-iframe {
            border-radius: 15px 15px 0 0;
            overflow: hidden;
            box-shadow: 0 10px 30px var(--shadow-color);
        }

        /* Quick Access Section */
        .quick-access-card {
             border: none;
            border-radius: 15px;
            box-shadow: 0 8px 25px var(--light-shadow);
            padding: 1.5rem;
            background: var(--card-bg);
             transition: transform 0.3s ease;
        }
         .quick-access-card:hover {
             transform: translateY(-8px);
         }
         .quick-access-card .card-title {
             font-size: 1.2rem;
             font-weight: 600;
             color: var(--dark-text);
         }

        /* Student/Professor Info Section */
        .student-info-card {
            border: none;
            border-radius: 15px;
            box-shadow: 0 8px 25px var(--light-shadow);
            padding: 2rem;
            background: var(--card-bg);
        }

        .student-info-card h3 {
            color: var(--dark-text);
            font-weight: 700;
        }

        .student-info-card h5 {
            color: #334155;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.8rem;
        }

        .student-info-card .list-unstyled li {
            margin-bottom: 0.5rem;
            color: #4b5563;
        }

        .student-info-card .badge {
            font-size: 1rem;
            padding: 0.3em 0.6em;
        }

        .student-info-card .d-grid .btn {
            border-radius: 20px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .app-title {
            font-size: 3.5rem; /* Ajuste responsive */
          }

          .header-subtitle {
            font-size: 1.2rem; /* Ajuste responsive */
          }

          .btn-modern {
            padding: 10px 24px;
            font-size: 1rem;
            margin-bottom: 10px;
          }

          .app-main {
              margin-top: -40px; /* Ajuste responsive */
          }

           .app-section {
                padding: 3rem 0;
            }

          .section-title {
              font-size: 2rem; /* Ajuste responsive */
          }

           .welcome-banner {
               padding: 2rem 1.5rem;
               margin-bottom: 3rem;
           }

           .welcome-banner h2 {
               font-size: 1.6rem;
           }

            .welcome-banner .lead {
                font-size: 1rem;
            }

          .service-card, .mission-vision-card, .contact-card, .quick-access-card, .student-info-card {
              padding: 1.5rem;
          }

          .service-icon {
              font-size: 3rem !important;
          }

           .stat-item h3 {
               font-size: 2rem;
           }
            .stat-item p {
                font-size: 0.9rem;
            }

          .blockquote {
             font-size: 1.1rem;
             padding-left: 1rem;
          }

          .cta-section h2 {
              font-size: 2rem;
          }
           .cta-section p {
               font-size: 1rem;
           }

            .cta-section .btn {
                font-size: 1rem;
                padding: 10px 25px;
            }

             .quick-access-card .card-title {
                 font-size: 1rem;
             }

             .student-info-card h3 {
                 font-size: 1.8rem;
             }
              .student-info-card h5 {
                  font-size: 1.2rem;
              }

               .student-info-card .badge {
                   font-size: 0.9rem;
               }

        }

        /* Responsive design para pantallas muy pequeñas */
        @media (max-width: 576px) {
             .app-title {
                font-size: 2.5rem;
             }
             .header-subtitle {
                 font-size: 1rem;
             }
              .btn-modern {
                  font-size: 0.9rem;
                  padding: 8px 20px;
              }
               .section-title {
                   font-size: 1.8rem;
               }

        }


        /* Animaciones */
        .fade-in { /* Animate on load */
          opacity: 0;
          animation: fadeIn 0.8s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .slide-up { /* Animate on load with delay */
          opacity: 0;
          transform: translateY(30px);
          animation: slideUp 0.8s ease-out forwards 0.3s;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Scroll to Top Button */
        .scroll-to-top {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: var(--primary-color); /* Usa color primario */
          color: var(--light-text);
          width: 45px; /* Tamaño ajustado */
          height: 45px; /* Tamaño ajustado */
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.2s ease; /* Transición mejorada */
          z-index: 1000;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .scroll-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .scroll-to-top i {
            font-size: 1.5rem; /* Tamaño del icono */
        }

        .scroll-to-top.show {
          opacity: 1;
          visibility: visible;
        }

        /* Equipo Section */
        .team-section {
          padding: 5rem 0;
        }

        .team-member-img-container {
          width: 250px; /* Ajustado según la solicitud */
          height: 400px; /* Ajustado según la solicitud */
          border-radius: 15px;
          overflow: hidden;
          margin: 0 auto 1rem;
          box-shadow: 0 10px 30px var(--shadow-color);
        }

        .team-member-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .team-member-img-container:hover .team-member-img {
          transform: scale(1.05);
        }

        .card-subtitle {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--dark-text);
        }

        .card-text {
          font-size: 1rem;
          font-weight: 400;
          color: var(--dark-text);
        }

        /* Estilos para los botones flotantes */
        .floating-buttons-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 1000;
        }

        .scroll-to-top, .login-bubble {
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: var(--light-text);
          border: none;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 4px 15px var(--shadow-color);
          cursor: pointer;
          transition: transform 0.3s ease, opacity 0.3s ease, background 0.3s ease;
          opacity: 0;
          transform: scale(0.8);
          text-decoration: none;
        }
        
        .scroll-to-top.show, .login-bubble.show {
          opacity: 1;
          transform: scale(1);
        }

        .scroll-to-top:hover, .login-bubble:hover {
          transform: scale(1.1);
          background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
        }

        .login-bubble .bubble-text {
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          line-height: 1.2;
        }
      `}</style>

      <div className="app-container">
        {/* Enhanced Header with Parallax Effect */}
        <header className="app-header">
          <div className="header-overlay"></div>
          <div className="container text-center position-relative" style={{ zIndex: 3 }}>
            <h1 className="app-title fade-in">R.E.C</h1>
            <p className="header-subtitle fade-in">Refuerzo Educativo Complementario</p>
            <div className="mt-4 slide-up">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/login" 
                    className="btn btn-modern btn-light-modern me-3"
                  >
                    <i className="bi bi-box-arrow-in-right"></i> Iniciar Sesión
                  </Link>
                  <Link 
                    to="/login-secretaria" 
                    className="btn btn-modern btn-outline-modern me-3"
                  >
                    <i className="bi bi-person-badge"></i>
                    Acceso Secretaría
                  </Link>
                  <Link 
                    to="/tutorial" 
                    className="btn btn-modern btn-outline-modern"
                  >
                    <i className="bi bi-book"></i> Tutorial
                  </Link>
                </>
              ) : (
                <>
                  {/* Ajustar texto y ícono según rol */}
                  <Link 
                    to={userRole === 'profesor' ? "/PerfilProfesor" : (userRole === 'estudiante' ? "/PerfilEstudiante" : "#")} 
                    className="btn btn-modern btn-light-modern me-3"
                  >
                    {userRole === 'profesor' ? <i className="bi bi-person-video"></i> : <i className="bi bi-person"></i>} Mi Perfil
                  </Link>
                   {userRole !== 'secretario' && (
                     <Link 
                       to="/tutorial" 
                       className="btn btn-modern btn-outline-modern"
                     >
                       <i className="bi bi-book"></i> Tutorial
                     </Link>
                   )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="app-main container my-5">
          {/* Welcome Banner - Solo mostrar si no está autenticado */}
          {!isAuthenticated && (
            <section className="welcome-banner text-center animate__animated animate__fadeInUp">
              <h2>¡Bienvenido a tu portal académico!</h2>
              <p className="lead">Tu espacio para crecer, aprender y alcanzar tus metas educativas</p>
            </section>
          )}

          {/* Student Dashboard Preview - Solo mostrar si el usuario está autenticado */}
          {isAuthenticated && userRole === 'estudiante' && (
            <section className="app-section bg-light p-4 rounded student-info-card mt-5" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Overlay y mensaje en línea */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                borderRadius: '1rem',
                backdropFilter: 'blur(2.5px) brightness(0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="bi bi-hourglass-split mb-3" style={{ fontSize: '3rem', color: '#6366f1' }}></i>
                <h2 className="section-title text-center mb-2" style={{ color: '#1e293b', textShadow: '0 2px 8px #fff8' }}>¡Muy pronto disponible!</h2>
                <p className="lead text-center" style={{ color: '#334155', fontWeight: 500 }}>Esta sección estará habilitada en una próxima actualización.</p>
              </div>
              {/* Contenido desenfocado y deshabilitado */}
              <div style={{ opacity: 0.45, pointerEvents: 'none', filter: 'blur(1.5px) grayscale(0.2)' }}>
                <h2 className="section-title text-center mb-4">Tu Información Estudiantil</h2>
                <div className="row g-4">
                  <div className="col-md-3 col-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-calendar-check text-primary mb-3" style={{ fontSize: '2rem' }}></i>
                        <h5>Asistencia</h5>
                        <h3 className="text-primary">--</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-award text-success mb-3" style={{ fontSize: '2rem' }}></i>
                        <h5>Promedio</h5>
                        <h3 className="text-success">--</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-book text-warning mb-3" style={{ fontSize: '2rem' }}></i>
                        <h5>Tareas</h5>
                        <h3 className="text-warning">--</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-bell text-danger mb-3" style={{ fontSize: '2rem' }}></i>
                        <h5>Pendientes</h5>
                        <h3 className="text-danger">--</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Accesos Rápidos Section - Solo mostrar si el usuario está autenticado */}
          {isAuthenticated && (userRole !== 'secretario') && (
            <section id="accesos-rapidos" className="app-section mt-5 bg-white p-4 rounded">
              <h2 className="section-title text-center mb-4">Accesos Rápidos</h2>
              <div className="row g-4">
                <div className="col-md-3 col-6">
                  <Link to="/horario" className="text-decoration-none">
                    <div className="card quick-access-card h-100 text-center">
                      <div className="card-body">
                        <i className="bi bi-calendar-week display-4 text-primary"></i>
                        <h5 className="card-title mt-2">Horarios</h5>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to="/Material" className="text-decoration-none">
                    <div className="card quick-access-card h-100 text-center">
                      <div className="card-body">
                        <i className="bi bi-book display-4 text-success"></i>
                        <h5 className="card-title mt-2">Materiales</h5>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                  <Link to="/Observaciones" className="text-decoration-none">
                    <div className="card quick-access-card h-100 text-center">
                      <div className="card-body">
                        <i className="bi bi-eye display-4 text-warning"></i>
                        <h5 className="card-title mt-2">Feedback</h5>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-3 col-6">
                   <Link to="/Reportes" className="text-decoration-none">
                     <div className="card quick-access-card h-100 text-center">
                       <div className="card-body">
                         <i className="bi bi-file-earmark-text display-4 text-danger"></i>
                         <h5 className="card-title mt-2">Ligas</h5>
                       </div>
                     </div>
                   </Link>
                 </div>
              </div>
            </section>
          )}

          {/* Servicios Section with enhanced cards */}
          <section id="servicios" className="app-section bg-light">
            <div className="container">
              <h2 className="section-title text-center mb-5">Servicios Académicos</h2>
              <div className="row row-cols-1 row-cols-md-2 g-4">
                <div className="col">
                  <div className="card service-card h-100">
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <i className="bi bi-graph-up-arrow service-icon text-danger"></i>
                      </div>
                      <h5 className="card-title text-center">Feedback académico</h5>
                      <p className="card-text text-center">
                        Visualiza y gestiona las observaciones académicas de los estudiantes, identificando áreas de mejora y fortalezas con nuestro sistema de seguimiento.
                      </p>
                    </div>
                    <div className="card-footer bg-transparent border-0 text-center">
                      <Link to={isAuthenticated ? "/Observaciones" : "/login"} className="btn btn-outline-danger">
                        {isAuthenticated ? "Ver Feedback" : "Iniciar Sesión para Acceder"}
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card service-card h-100">
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <i className="bi bi-journal-richtext service-icon text-primary"></i>
                      </div>
                      <h5 className="card-title text-center">Recursos Educativos</h5>
                      <p className="card-text text-center">
                        Accede a materiales de estudio personalizados que complementan tus clases y promueven un aprendizaje integral y enriquecedor.
                      </p>
                    </div>
                    <div className="card-footer bg-transparent border-0 text-center">
                      <Link to={isAuthenticated ? "/Material" : "/login"} className="btn btn-outline-primary">
                        {isAuthenticated ? "Explorar Recursos" : "Iniciar Sesión para Acceder"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What's New Section */}
          <section className="app-section mb-5">
            <div className="row align-items-center">
              <div className="col-md-6 order-md-1 order-2">
                <h2 className="section-title text-start">Novedades</h2>
                <div className="news-item mb-3">
                  <span className="badge bg-danger mb-2">Nuevo</span>
                  <h5>Calendario de Exámenes Actualizado</h5>
                  <p>Se ha publicado el calendario de exámenes para el segundo semestre.</p>
                </div>
                <div className="news-item mb-3">
                  <span className="badge bg-success mb-2">Evento</span>
                  <h5>Feria de Ciencias</h5>
                  <p>No te pierdas nuestra Feria de Ciencias el próximo 15 de mayo.</p>
                </div>
              </div>
              <div className="col-md-6 text-center order-md-2 order-1 mb-4 mb-md-0">
                <img src="/nopoyo.gif" alt="Novedades" className="img-fluid rounded shadow-lg news-image"/>
              </div>
            </div>
          </section>
        </main>

        {/* About Us Section with mission and vision */}
        <div className="about-container py-5">
          <div className="container">
             <h2 className="section-title text-center mb-5">Sobre R.E.C.</h2>
             <div className="row justify-content-center mb-5">
               <div className="col-md-6 text-center">
                 <img src="/image.png" alt="Logo R.E.C" className="img-fluid mb-4" style={{ maxWidth: '300px' }} />
                 <h3 className="mb-4">Refuerzo Educativo Complementario</h3>
                 <p className="lead">
                   Somos una plataforma dedicada a potenciar el rendimiento académico de los estudiantes, 
                   ofreciendo un sistema integral de apoyo educativo que complementa y enriquece el proceso de aprendizaje.
                 </p>
               </div>
             </div>
            <div className="row">
              <div className="col-md-4 mb-4">
                <div className="card h-100 mission-vision-card">
                  <div className="card-body text-center">
                    <div className="icon-wrapper mb-3">
                      <div className="icon-circle bg-danger">
                        <i className="bi bi-building" style={{ fontSize: '2rem', color: 'var(--light-text)' }}></i>
                      </div>
                    </div>
                    <h3 className="card-title">Nuestra Filosofía</h3>
                    <p className="card-text">
                      Creemos en el <strong className="text-danger">poder transformador de la educación</strong>. 
                      Nuestra filosofía se basa en tres pilares fundamentales: excelencia académica, 
                      desarrollo personal y apoyo continuo para alcanzar el máximo potencial de cada estudiante.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card h-100 mission-vision-card">
                  <div className="card-body text-center">
                    <div className="icon-wrapper mb-3">
                      <div className="icon-circle bg-success">
                        <i className="bi bi-bullseye" style={{ fontSize: '2rem', color: 'var(--light-text)' }}></i>
                      </div>
                    </div>
                    <h3 className="card-title">Misión</h3>
                    <p className="card-text">
                      Nuestra misión es <strong className="text-success">potenciar el aprendizaje</strong> y el rendimiento académico mediante un sistema innovador y personalizado, comprometido con el éxito de cada estudiante.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card h-100 mission-vision-card">
                  <div className="card-body text-center">
                    <div className="icon-wrapper mb-3">
                      <div className="icon-circle bg-primary">
                        <i className="bi bi-eye" style={{ fontSize: '2rem', color: 'var(--light-text)' }}></i>
                      </div>
                    </div>
                    <h3 className="card-title">Visión</h3>
                    <p className="card-text">
                      Aspiramos a ser la plataforma <strong className="text-primary">líder en refuerzo educativo</strong>, reconocida por transformar la manera en que los estudiantes aprenden y se preparan para el futuro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Equipo Section */}
        <section className="py-5 team-section">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="section-title">Nuestro Equipo</h2>
              <div className="section-underline mx-auto"></div>
              <p className="section-subtitle">Profesionales apasionados por la tecnología y la innovación</p>
            </div>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100 shadow-lg border-0">
                  <div className="text-center p-4">
                    <div className="team-member-img-container mb-4">
                      <img 
                        src="/Guarin.png" 
                        alt="Juan David Guarin Romero" 
                        className="team-member-img" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="card-body p-0">
                      <h3 className="card-title fw-bold mb-3">Juan David Guarin Romero</h3>
                      <p className="card-subtitle text-muted mb-3">Desarrollador Full Stack</p>
                      <p className="card-text">Apasionado por crear soluciones escalables con las mejores tecnologías web.</p>
                      <div className="mt-3">
                        <span className="badge bg-primary me-2 mb-2">React</span>
                        <span className="badge bg-primary me-2 mb-2">Next.js</span>
                        <span className="badge bg-primary me-2 mb-2">MySQL</span>
                        <span className="badge bg-primary me-2 mb-2">PostgreSQL</span>
                        <span className="badge bg-primary me-2 mb-2">Tailwind</span>
                        <span className="badge bg-primary me-2 mb-2">CSS</span>
                        <span className="badge bg-primary me-2 mb-2">HTML</span>
                        <span className="badge bg-primary me-2 mb-2">JavaScript</span>
                        <span className="badge bg-primary me-2 mb-2">TypeScript</span>
                        <span className="badge bg-primary me-2 mb-2">Node.js</span>
                        <span className="badge bg-primary me-2 mb-2">Express</span>
                        <span className="badge bg-primary me-2 mb-2">Bootstrap</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card h-100 shadow-lg border-0">
                  <div className="text-center p-4">
                    <div className="team-member-img-container mb-4">
                      <img 
                        src="/Valeria.png" 
                        alt="Valeria Zapata Vargas" 
                        className="team-member-img" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="card-body p-0">
                      <h3 className="card-title fw-bold mb-3">Valeria Zapata Vargas</h3>
                      <p className="card-subtitle text-muted mb-3">Desarrolladora Full Stack</p>
                      <p className="card-text">Desarrolladora profesional con gran capacidad de liderazgo y experiencia en proyectos web.</p>
                      <div className="mt-3">
                        <span className="badge bg-primary me-2 mb-2">HTML</span>
                        <span className="badge bg-primary me-2 mb-2">CSS</span>
                        <span className="badge bg-primary me-2 mb-2">JavaScript</span>
                        <span className="badge bg-primary me-2 mb-2">Bootstrap</span>
                        <span className="badge bg-primary me-2 mb-2">React</span>
                        <span className="badge bg-primary me-2 mb-2">MySQL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card h-100 shadow-lg border-0">
                  <div className="text-center p-4">
                    <div className="team-member-img-container mb-4">
                      <img 
                        src="/david.png" 
                        alt="David Blandon Caro" 
                        className="team-member-img" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="card-body p-0">
                      <h3 className="card-title fw-bold mb-3">David Blandon Caro</h3>
                      <p className="card-subtitle text-muted mb-3">Desarrollador Full Stack</p>
                      <p className="card-text">Eficiente en su trabajo con amplio conocimiento en tecnologías front-end y back-end.</p>
                      <div className="mt-3">
                        <span className="badge bg-primary me-2 mb-2">HTML</span>
                        <span className="badge bg-primary me-2 mb-2">CSS</span>
                        <span className="badge bg-primary me-2 mb-2">JavaScript</span>
                        <span className="badge bg-primary me-2 mb-2">Bootstrap</span>
                        <span className="badge bg-primary me-2 mb-2">React</span>
                        <span className="badge bg-primary me-2 mb-2">MySQL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
       <section className="testimonials-section py-5">
        <div className="container">
          <h2 className="section-title text-center mb-5 animate__animated animate__slideInUp">Lo que dicen nuestros estudiantes</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div id="testimonialCarousel" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {/* Testimonial 1 */}
                  <div className="carousel-item active">
                    <blockquote className="blockquote text-center">
                      <p className="mb-0">"R.E.C. ha simplificado mi vida académica. Encontrar materiales de estudio y seguir mis notas nunca fue tan fácil."</p>
                      <footer className="blockquote-footer mt-2">María López, <cite title="Source Title">Estudiante</cite></footer>
                    </blockquote>
                  </div>
                  {/* Testimonial 2 */}
                  <div className="carousel-item">
                    <blockquote className="blockquote text-center">
                      <p className="mb-0">"La comunicación con mis profesores ha mejorado muchísimo gracias a la plataforma. Puedo ver mis observaciones y comentarios al instante."</p>
                      <footer className="blockquote-footer mt-2">Juan Pérez, <cite title="Source Title">Estudiante</cite></footer>
                    </blockquote>
                  </div>
                  {/* Testimonial 3 */}
                   <div className="carousel-item">
                    <blockquote className="blockquote text-center">
                      <p className="mb-0">"calendario de actividades es genial para no perderme de nada. Siempre sé cuándo tengo exámenes o eventos importantes."</p>
                      <footer className="blockquote-footer mt-2">Ana García, <cite title="Source Title">Estudiante</cite></footer>
                    </blockquote>
                  </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
       <section className="cta-section">
        <div className="container">
          <h2 className="mb-4 animate__animated animate__slideInUp">¿Listo para Iniciar sesión?</h2>
          <p className="lead mb-4 animate__animated animate__fadeInUp">Aprovecha todas las herramientas que R.E.C. tiene para ti.</p>
          <Link to="/login" className="btn btn-light btn-lg animate__animated animate__pulse" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}>
            <i className="bi bi-person-plus"></i> Iniciar Sesión
          </Link>
        </div>
      </section>
      )}

      {/* Map Section with the iframe */}
        <section id="ubicacion" className="app-section mapa-section">
          <div className="container">
            <h2 className="section-title text-danger mb-4">Encuéntranos</h2>
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="ratio ratio-4x3 mapa-iframe">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.971647332243!2d-75.56584356985823!3d6.267459214305058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4428e79f3bec01%3A0x503402f6bfb9bb3!2sInstituci%C3%B3n%20Educativa%20Javiera%20Londo%C3%B1o!5e0!3m2!1ses!2sco!4v1731885474552!5m2!1ses!2sco"
                    style={{ border: '0', filter: 'saturate(1.1)' }}
                    allowFullScreen
                    loading="lazy"
                    title="Mapa de ubicación"
                  ></iframe>
                </div>
              </div>
              <div className="col-md-6">
                <div className="ps-md-4">
                  <h3 className="mb-3">Institución Educativa Javiera Londoño</h3>
                  <p className="lead mb-4">
                    Visítanos en nuestra sede principal en Medellín, donde podrás encontrar todas nuestras instalaciones y servicios educativos.
                  </p>
                  <div className="mb-4">
                    <h5 className="mb-3">Información de Contacto:</h5>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                        Dirección: Calle 48 # 45-45, Medellín
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-telephone-fill text-danger me-2"></i>
                        Teléfono: (604) 123-4567
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-envelope-fill text-danger me-2"></i>
                        Email: info@javieralondono.edu.co
                      </li>
                    </ul>
                  </div>
                  <Link
                    to="https://www.google.com/maps/dir/6.2792818,-75.5625925/javiera+londo%C3%B1o+sevilla+google+maps/@6.2737058,-75.5694721,16z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x8e4428e79f3bec01:0x503402f6bfb9bb3!2m2!1d-75.5649638!2d6.2679338?entry=ttu&g_ep=EgoyMDI1MDIxMi4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-modern btn-light-modern"
                  >
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Cómo llegar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Botón Flotante de Scroll */}
        <div className="floating-buttons-container">
          {showScrollButton && (
            <button onClick={scrollToTop} className={`scroll-to-top ${showScrollButton ? 'show' : ''}`} aria-label="Volver arriba">
              <i className="bi bi-arrow-up"></i>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
