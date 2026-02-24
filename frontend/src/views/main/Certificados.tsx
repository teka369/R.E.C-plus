import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Accordion, Modal, Button } from 'react-bootstrap';
import { FaCertificate, FaCode, FaUserGraduate, FaSearch } from 'react-icons/fa';

const Certificados: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');

  const handleShowModal = (image: string, title: string) => {
    setSelectedImage(image);
    setSelectedTitle(title);
    setShowModal(true);
  };

  const teamMembers = [
    {
      name: "Juan David Guarin Romero",
      role: "Frontend Developer",
      certificates: [
        {
          title: "HTML5",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/Guarin/HTML.jpg",
          skills: ["Semántica", "Accesibilidad", "SEO"]
        },
        {
          title: "CSS",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/Guarin/CSS.jpg",
          skills: ["Flexbox", "Grid", "Animaciones"]
        },
        {
          title: "JavaScript",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/Guarin/JS.jpg",
          skills: ["ES6+", "DOM", "Async/Await"]
        }
      ]
    },
    {
      name: "Valeria Zapata Vargas",
      role: "Full Stack Developer",
      certificates: [
        {
          title: "HTML5",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/Valeria/HTML.jpg",
          skills: ["Forms", "Canvas", "WebStorage"]
        },
        {
          title: "CSS",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/Valeria/css.png",
          skills: ["Sass", "BEM", "Responsive"]
        },
        {
          title: "JavaScript",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/Valeria/JS.jpg",
          skills: ["TypeScript", "Testing", "Patterns"]
        }
      ]
    },
    {
      name: "David Blandon Caro",
      role: "Backend Developer",
      certificates: [
        {
          title: "HTML5",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/David/HTML.png",
          skills: ["Templates", "APIs", "Performance"]
        },
        {
          title: "CSS",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/David/CSS.png",
          skills: ["Modules", "Custom Properties", "Performance"]
        },
        {
          title: "JavaScript",
          platform: "Solo Learn",
          date: "2024",
          image: "images/Certificados/David/JS.png",
          skills: ["Node.js", "Express", "APIs"]
        }
      ]
    }
  ];

  return (
    <div className="certificates-page bg-light py-5">
      {/* Header Section */}
      <section className="mb-5 text-center">
        <Container>
          <FaCertificate className="display-1 text-primary mb-3" />
          <h1 className="display-4 mb-3">Certificaciones del Equipo</h1>
          <p className="lead text-muted">
            Nuestro compromiso con la excelencia y el aprendizaje continuo
          </p>
        </Container>
      </section>

      {/* Team Certificates Section */}
      <Container>
        {teamMembers.map((member, index) => (
          <div key={index} className="mb-5">
            <div className="member-header mb-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="h3">
                    <FaUserGraduate className="me-2 text-primary" />
                    {member.name}
                  </h2>
                  <h3 className="h5 text-muted">{member.role}</h3>
                </Col>
              </Row>
            </div>

            <Accordion className="certificate-accordion">
              {member.certificates.map((cert, certIndex) => (
                <Accordion.Item key={certIndex} eventKey={certIndex.toString()}>
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <FaCode className="me-2 text-primary" />
                      <div>
                        <strong>{cert.title}</strong>
                        <div className="text-muted small">
                          {cert.platform} • {cert.date}
                        </div>
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={6}>
                        <Card className="certificate-card">
                          <div className="certificate-image-container position-relative">
                            <Card.Img
                              variant="top"
                              src={cert.image}
                              alt={`Certificado ${cert.title}`}
                              className="certificate-image"
                            />
                            <Button
                              variant="primary"
                              className="view-certificate-btn"
                              onClick={() => handleShowModal(cert.image, cert.title)}
                            >
                              <FaSearch className="me-2" />
                              Ver Certificado
                            </Button>
                          </div>
                          <Card.Body>
                            <h5>Habilidades Adquiridas:</h5>
                            <div className="d-flex flex-wrap gap-2">
                              {cert.skills.map((skill, skillIndex) => (
                                <Badge 
                                  key={skillIndex} 
                                  bg="primary" 
                                  className="px-3 py-2"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6} className="d-flex align-items-center">
                        <div className="certificate-details">
                          <h4>Detalles del Certificado</h4>
                          <ul className="list-unstyled">
                            <li><strong>Plataforma:</strong> {cert.platform}</li>
                            <li><strong>Fecha de Obtención:</strong> {cert.date}</li>
                            <li><strong>Validación:</strong> Verificado</li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        ))}
      </Container>

      {/* Modal para ver la imagen grande */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        className="certificate-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <img
            src={selectedImage}
            alt={selectedTitle}
            className="w-100 h-auto"
            style={{ maxHeight: '80vh', objectFit: 'contain' }}
          />
        </Modal.Body>
      </Modal>

      {/* Stats Section */}
      <section className="bg-primary text-white py-5 mt-5">
        <Container>
          <Row className="text-center">
            <Col md={4}>
              <h3 className="display-4 mb-3">9</h3>
              <p className="h5">Certificados Totales</p>
            </Col>
            <Col md={4}>
              <h3 className="display-4 mb-3">3</h3>
              <p className="h5">Miembros del Equipo</p>
            </Col>
            <Col md={4}>
              <h3 className="display-4 mb-3">100%</h3>
              <p className="h5">Certificados Verificados</p>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Certificados;


