import '../../../assets/main/styles/Footer.css';
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';


const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="fadeInUp justify-content-center">
          {/* Sección de Información de la empresa y enlaces */}
          <Col md={8} className="company-info text-center">
            <h5>R.E.C.</h5>
            <p>
              Plataforma centralizada para la gestión y apoyo educativo, impulsando el éxito de estudiantes y profesores.
            </p>
            <Row className="justify-content-center">
              <Col xs={6} md={4}>
                <ul>
                  <li>
                    <a href="/Principal">Inicio</a>
                  </li>
                  <li>
                    <a href="#servicios">Servicios</a>
                  </li>
                  <li>
                    <a href="#Novedades">Novedades</a>
                  </li>
                </ul>
              </Col>
              <Col xs={6} md={4}>
                <ul>
                  <li>
                    <a href="/Portafolio">Sobre Nosotros</a>
                  </li>
                  <li>
                    <a href="#ubicacion">Ubicación</a>
                  </li>
                  <li>
                    <a href="/Contacto">Contacto</a>
                  </li>
                </ul>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Línea separadora */}
        <hr />

        <Row className="fadeInUp d-flex justify-content-center align-items-center text-center">
          <Col md={8}>
            <p>&copy; {new Date().getFullYear()} R.E.C. Todos los derechos reservados.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
