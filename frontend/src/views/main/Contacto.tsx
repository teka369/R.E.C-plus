import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../assets/main/styles/Contacto.css';

export const Contacto = () => {
  return (
    <section id="contacto" className="app-section contact-section glass-bg">
      <div className="container contacto-grid">
        {/* Bloque lateral con ilustración */}
        <div className="contacto-ilustracion">
          {/* Puedes reemplazar el SVG por una imagen propia si lo deseas */}
          <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="110" cy="110" rx="110" ry="110" fill="#6366f1" fillOpacity="0.13"/>
            <ellipse cx="110" cy="110" rx="80" ry="80" fill="#f472b6" fillOpacity="0.10"/>
            <ellipse cx="110" cy="110" rx="50" ry="50" fill="#fff" fillOpacity="0.7"/>
            <text x="50%" y="54%" textAnchor="middle" fill="#6366f1" fontSize="2.2rem" fontWeight="bold" fontFamily="Montserrat, sans-serif">REC</text>
          </svg>
          <div className="contacto-frase">"Conectando aprendizaje y pasión"</div>
        </div>
        {/* Bloque principal de contacto */}
        <div className="contacto-main">
          <div className="text-left mb-4">
            <h2 className="section-title mb-3">📩 ¡Conversemos!</h2>
            <p className="section-text lead">
              ¿Estás listo para elevar tu aprendizaje? Estamos aquí para apoyarte en cada paso. Contáctanos y descubre cómo podemos colaborar.
            </p>
          </div>
          <div className="contacto-tarjetas">
            {/* Tarjeta: Correo Electrónico */}
            <div className="contact-card contacto-card anim-fade-up" style={{ zIndex: 2 }}>
              <div className="card-body">
                <div className="icon-wrapper mb-3">
                  <div className="icon-circle glass-icon bg-danger">
                    <i className="bi bi-envelope"></i>
                  </div>
                </div>
                <h5 className="card-title">Correo Electrónico</h5>
                <p className="card-text text-dark">Envíanos un mensaje para consultas o propuestas.</p>
                <a href="mailto:rec.proyect@gmail.com" className="btn btn-danger">
                  ✉️ Enviar Correo
                </a>
              </div>
            </div>
            {/* Tarjeta: WhatsApp */}
            <div className="contact-card contacto-card anim-fade-up delay-1" style={{ zIndex: 3 }}>
              <div className="card-body">
                <div className="icon-wrapper mb-3">
                  <div className="icon-circle glass-icon bg-success">
                    <i className="bi bi-whatsapp"></i>
                  </div>
                </div>
                <h5 className="card-title">WhatsApp</h5>
                <p className="card-text text-dark">Contáctanos para respuestas rápidas.</p>
                <a href="https://wa.me/573104713054" target="_blank" rel="noopener noreferrer" className="btn btn-success">
                  💬 Enviar Mensaje
                </a>
              </div>
            </div>
            {/* Tarjeta: Ubicación */}
            <div className="contact-card contacto-card anim-fade-up delay-2" style={{ zIndex: 1 }}>
              <div className="card-body">
                <div className="icon-wrapper mb-3">
                  <div className="icon-circle glass-icon bg-primary">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                </div>
                <h5 className="card-title">Visítanos</h5>
                <p className="card-text text-dark">Av. Principal 1234, Ciudad</p>
                <a href="#mapa" className="btn btn-primary">
                  📍 Ver Mapa
                </a>
              </div>
            </div>
          </div>
          <div className="contacto-footer">
            <span>¿Tienes otra consulta? <a href="mailto:rec.proyect@gmail.com">Escríbenos</a></span>
          </div>
        </div>
      </div>
    </section>
  );
};