import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../assets/main/styles/Tutorial.css';

// Define la ruta del video en una constante para fácil manejo
// ¡IMPORTANTE!: Asegúrate de que esta ruta sea la correcta para tu proyecto.
const VIDEO_SOURCE_PATH = '/videos/secretaria.mp4'; 

const Tutorial: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('userAuthenticated');
    setIsAuthenticated(auth === 'true');
  }, []);

  return (
    <div className="tutorial-container">
      <div className="tutorial-header">
        <div className="container">
          <h1 className="tutorial-title">Tutorial de la Plataforma</h1>
          <p className="tutorial-subtitle">Aprende a utilizar todas las funcionalidades de R.E.C</p>
        </div>
      </div>

      <div className="container my-5">
        <div className="row">
          {/* Sección del Video Tutorial */}
          <div className="col-lg-8">
            <div className="video-container mb-3">
              <div className="ratio ratio-16x9">
                {/* Componente <video> para cargar el video de tu proyecto */}
                <video
                  controls
                  className="rounded shadow w-100 h-100"
                >
                  <source src={VIDEO_SOURCE_PATH} type="video/secretaria.mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
            </div>

            {/* Botón de Descarga del Video (NUEVO) */}
            <div className="text-end mb-4">
              <a
                href={VIDEO_SOURCE_PATH}  // Usa la misma ruta que la fuente del video
                download="Tutorial_R.E.C.mp4"  // El atributo 'download' fuerza la descarga y sugiere un nombre de archivo
                className="btn btn-primary"
              >
                <i className="bi bi-download me-2"></i>Descargar Video
              </a>
            </div>
            
            {/* Sección de Descripción del Video (Comentada) */}
            {/* ... (Código de la descripción comentado) ... */}
          </div>
{/* -------------------------------------------------------------------------------------------------------------------------------------- */}

          {/* Quick Links Sidebar */}
          <div className="col-lg-4">
            <div className="quick-links-card p-4 bg-white rounded shadow-sm">
              <h3 className="mb-4">Enlaces Rápidos</h3>
              <div className="list-group">
                {!isAuthenticated && (
                  <Link to="/login" className="list-group-item list-group-item-action">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Iniciar Sesión
                  </Link>
                )}
                <Link to="/Material" className="list-group-item list-group-item-action">
                  <i className="bi bi-book me-2"></i>
                  Materiales de Estudio
                </Link>
                <Link to="/Observaciones" className="list-group-item list-group-item-action">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Observaciones
                </Link>
                <Link to="/Horario" className="list-group-item list-group-item-action">
                  <i className="bi bi-calendar-week me-2"></i>
                  Horarios
                </Link>
                <Link to="/Contacto" className="list-group-item list-group-item-action">
                  <i className="bi bi-envelope me-2"></i>
                  Contacto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;