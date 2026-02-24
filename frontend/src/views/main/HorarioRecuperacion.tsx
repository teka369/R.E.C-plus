import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaUpload, FaFilePdf, FaChevronLeft, FaChevronRight, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

const HorarioRecuperacion: React.FC = () => {
  const navigate = useNavigate();
  const [horarioUrl, setHorarioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      changePage(-1);
    }
  };

  const nextPage = () => {
    if (numPages && pageNumber < numPages) {
      changePage(1);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    fetchHorario();
  }, []);

  const fetchHorario = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/config/horario', {
        responseType: 'blob', // Importante para manejar archivos
      });
      
      // Crear una URL para el blob
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileUrl = URL.createObjectURL(file);
      setHorarioUrl(fileUrl);

    } catch (e) {
      setError('No se pudo cargar el horario. Es posible que no se haya subido ninguno.');
      setHorarioUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append('horario', selectedFile);

    try {
      const res = await axios.post('http://localhost:4000/api/config/horario', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success) {
        setUploadSuccess('¡Horario subido exitosamente!');
        fetchHorario(); // Recargar el horario
      }
    } catch (e) {
      setError('Error al subir el horario.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Volver
          </Button>
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <FaClock className="text-info" /> Horario de Recuperación
          </h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {horarioUrl ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                {numPages && (
                  <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={previousPage} disabled={pageNumber <= 1}>
                      <FaChevronLeft />
                    </Button>
                    <span>
                      Página {pageNumber} de {numPages}
                    </span>
                    <Button variant="outline-secondary" size="sm" onClick={nextPage} disabled={pageNumber >= numPages}>
                      <FaChevronRight />
                    </Button>
                  </div>
                )}
                <Button as="a" href={horarioUrl} download variant="info">
                  <FaDownload className="me-2" /> Descargar PDF
                </Button>
              </div>
              <div className="d-flex justify-content-center bg-light p-3 border rounded">
                <Document
                  file={horarioUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading="Cargando PDF..."
                  error="Error al cargar el PDF."
                >
                  <Page pageNumber={pageNumber} />
                </Document>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <FaFilePdf size={48} className="mb-3" />
              <h5>No hay un horario de recuperación disponible.</h5>
              <p>
                {userRole === 'profesor'
                  ? 'Sube el archivo del horario para que esté visible.'
                  : 'Por favor, contacta a un profesor o al coordinador para más información.'}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {userRole === 'profesor' && (
        <Card className="mt-4 shadow-sm">
          <Card.Header>
            <h5 className="mb-0">
              <FaUpload className="me-2" /> Subir o Actualizar Horario
            </h5>
          </Card.Header>
          <Card.Body>
            {uploadSuccess && <Alert variant="success">{uploadSuccess}</Alert>}
            <Form.Group>
              <Form.Label>Selecciona el archivo del horario (PDF recomendado)</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
            </Form.Group>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="mt-3"
            >
              {uploading ? 'Subiendo...' : 'Subir Horario'}
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default HorarioRecuperacion;
