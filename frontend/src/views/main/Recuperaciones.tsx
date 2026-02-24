import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Alert, Form } from 'react-bootstrap';
import { FaGraduationCap, FaPlus, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaChartBar, FaComments, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import type { SolicitudRecuperacion, EstadisticasRecuperacion, MateriaConProfesor } from '../../types/Recuperacion';
import SolicitudModal from './components/modals/SolicitudModal';
import DetalleSolicitudModal from './components/modals/DetalleSolicitudModal';
import ActividadesModal from './components/modals/ActividadesModal';
import SeguimientoModal from './components/modals/SeguimientoModal';
import { useProfesorGrupos } from '../../hooks/useProfesorGrupos';
import { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos';
import { useNavigate } from 'react-router-dom';
import { useRecuperacion } from '../../contexts/RecuperacionContext';
import { useNotification } from '../../contexts/NotificationContext';

const Recuperaciones: React.FC = () => {
  // 1. TODOS los useState
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudRecuperacion[]>([]);
  const [materias, setMaterias] = useState<MateriaConProfesor[]>([]);
  const [materiasFiltradas, setMateriasFiltradas] = useState<MateriaConProfesor[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasRecuperacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMateria, setSelectedMateria] = useState<string>('');
  const [selectedGrado, setSelectedGrado] = useState<string>('');
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showActividadesModal, setShowActividadesModal] = useState(false);
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRecuperacion | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<string>('Todas');

  // 2. TODOS los hooks personalizados y de contexto
  const { periodoActivo, cargando: cargandoConfig } = useRecuperacion();
  const { showToast, showModal } = useNotification();
  const { grupos: gruposProfesor, loading: loadingGruposProfesor, error: errorGruposProfesor } = useProfesorGrupos(userId ? parseInt(userId) : null);
  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante, error: errorGruposEstudiante } = useEstudianteGrupos(userEmail || '');
  const navigate = useNavigate();

  // 3. TODOS los useEffect
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    setUserRole(role);
    setUserId(id);
    setUserEmail(email);
  }, []);

  // Determinar qué grupos usar según el rol
  const grupos = userRole === 'profesor' ? gruposProfesor : userRole === 'estudiante' ? gruposEstudiante : [];
  const loadingGrupos = userRole === 'profesor' ? loadingGruposProfesor : userRole === 'estudiante' ? loadingGruposEstudiante : false;
  const errorGrupos = userRole === 'profesor' ? errorGruposProfesor : userRole === 'estudiante' ? errorGruposEstudiante : null;

  // Seleccionar grado por defecto cuando se cargan los grupos
  useEffect(() => {
    if (grupos.length > 0 && !selectedGrado) {
      setSelectedGrado(grupos[0].nombre);
    }
  }, [grupos, selectedGrado]);

  // Cargar datos cada vez que cambie el grado seleccionado
  useEffect(() => {
    if (selectedGrado && userRole && userId) {
      cargarDatos();
    }
  }, [selectedGrado, userRole, userId]);

  // Redirigir si el periodo no está activo, evitando navegar durante el render
  useEffect(() => {
    if (!cargandoConfig && !loading && !periodoActivo) {
      navigate('/', { replace: true });
    }
  }, [cargandoConfig, loading, periodoActivo, navigate]);

  // Filtrar materias cuando cambia el grado seleccionado
  useEffect(() => {
    if (selectedGrado && materias.length > 0) {
      setMateriasFiltradas(materias);
    } else {
      setMateriasFiltradas([]);
    }
  }, [selectedGrado, materias]);

  // 4. Función para cargar datos
  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar materias para todos los usuarios
      const materiasRes = await axios.get('http://localhost:4000/api/recuperacion/materias');
      setMaterias(materiasRes.data.data);

      if (userRole === 'estudiante' && userId) {
        // Cargar solicitudes del estudiante
        const [solicitudesRes, estadisticasRes] = await Promise.all([
          axios.get(`http://localhost:4000/api/recuperacion/estudiante/${userId}`),
          axios.get(`http://localhost:4000/api/recuperacion/estadisticas/estudiante/${userId}`)
        ]);
        setSolicitudes(solicitudesRes.data.data);
        setEstadisticas(estadisticasRes.data.data);
      } else if (userRole === 'profesor' && userId && selectedGrado) {
        // Cargar solicitudes del grupo seleccionado para el profesor
        const [solicitudesRes, estadisticasRes] = await Promise.all([
          axios.get(`http://localhost:4000/api/recuperacion/grupo/${selectedGrado}`),
          axios.get(`http://localhost:4000/api/recuperacion/estadisticas/profesor/${userId}`)
        ]);
        setSolicitudes(solicitudesRes.data.data);
        setEstadisticas(estadisticasRes.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 5. Funciones auxiliares
  const generarOpcionesGrado = () => {
    if (userRole === 'profesor') {
      if (loadingGruposProfesor) return [<option key="loading">Cargando grados...</option>];
      if (errorGruposProfesor) return [<option key="error">Error al cargar grados</option>];
      if (gruposProfesor.length === 0) return [<option key="no-groups">No hay grados disponibles</option>];

      return [
        <option key="select" value="">Seleccionar grado</option>,
        ...gruposProfesor.map(grupo => (
          <option key={grupo.id} value={grupo.nombre}>
            Grado {grupo.nombre}
          </option>
        ))
      ];
    } else {
      if (loadingGruposEstudiante) return [<option key="loading">Cargando grados...</option>];
      if (errorGruposEstudiante) return [<option key="error">Error al cargar grados</option>];
      if (gruposEstudiante.length === 0) return [<option key="no-groups">No hay grados disponibles</option>];

      return [
        <option key="select" value="">Seleccionar grado</option>,
        ...gruposEstudiante.map(grupo => (
          <option key={grupo.id} value={grupo.nombre}>
            Grado {grupo.nombre}
          </option>
        ))
      ];
    }
  };

  const handleNuevaSolicitud = () => {
    if (!selectedGrado) {
      showToast({
        type: 'warning',
        title: 'Atención',
        message: 'Por favor, selecciona un grado primero'
      });
      return;
    }
    setShowSolicitudModal(true);
  };

  const handleVerDetalle = (solicitud: SolicitudRecuperacion) => {
    setSelectedSolicitud(solicitud);
    setShowDetalleModal(true);
  };

  const handleVerActividades = (solicitud: SolicitudRecuperacion) => {
    setSelectedSolicitud(solicitud);
    setShowActividadesModal(true);
  };

  const handleVerSeguimiento = (solicitud: SolicitudRecuperacion) => {
    setSelectedSolicitud(solicitud);
    setShowSeguimientoModal(true);
  };
  
  const handleEliminarSolicitud = (solicitud: SolicitudRecuperacion) => {
    setSelectedSolicitud(solicitud);
    
    showModal({
      type: 'danger',
      title: '¿Eliminar solicitud?',
      message: `¿Estás seguro que deseas eliminar la solicitud de recuperación para ${solicitud.materia_nombre}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: confirmarEliminarSolicitud
    });
  };

  const confirmarEliminarSolicitud = async () => {
    if (!selectedSolicitud) return;
    
    try {
      await axios.delete(`http://localhost:4000/api/recuperacion/${selectedSolicitud.id}`, {
        data: { estudiante_id: userId }
      });
      // Actualizar la lista de solicitudes
      cargarDatos();
      // Mostrar mensaje de éxito con un toast estético
      showToast({
        type: 'success',
        title: 'Éxito',
        message: 'Solicitud eliminada correctamente'
      });
    } catch (error: any) {
      console.error('Error al eliminar solicitud:', error);
      showToast({
        type: 'danger',
        title: 'Error',
        message: error.response?.data?.message || 'Error al eliminar la solicitud'
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: { bg: 'warning', icon: <FaClock />, text: 'Pendiente' },
      aprobada: { bg: 'success', icon: <FaCheckCircle />, text: 'Aprobada' },
      rechazada: { bg: 'danger', icon: <FaTimesCircle />, text: 'Rechazada' },
      completada: { bg: 'info', icon: <FaGraduationCap />, text: 'Completada' }
    };
    const variant = variants[estado as keyof typeof variants] || { bg: 'secondary', icon: <FaExclamationTriangle />, text: estado };
    
    return (
      <Badge bg={variant.bg} className="d-flex align-items-center gap-1">
        {variant.icon}
        {variant.text}
      </Badge>
    );
  };

  const getTipoSolicitudBadge = (tipo: string) => {
    return (
      <Badge bg={tipo === 'recuperacion' ? 'primary' : 'info'}>
        {tipo === 'recuperacion' ? 'Recuperación' : 'Refuerzo'}
      </Badge>
    );
  };

  // 6. Cálculos y filtros
  const solicitudesFiltradas = filtroActivo === 'Todas'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtroActivo);

  const estadisticasLocales = {
    total_solicitudes: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    aprobadas: solicitudes.filter(s => s.estado === 'aprobada').length,
    completadas: solicitudes.filter(s => s.estado === 'completada').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length,
  };

  const tarjetas = [
    {
      key: 'Todas',
      label: 'Total Solicitudes',
      valor: estadisticasLocales.total_solicitudes,
      icon: <FaChartBar className="mb-2" size={24} />,
      color: 'primary',
    },
    {
      key: 'pendiente',
      label: 'Pendientes',
      valor: estadisticasLocales.pendientes,
      icon: <FaClock className="mb-2" size={24} />,
      color: 'warning',
    },
    {
      key: 'aprobada',
      label: 'Aprobadas',
      valor: estadisticasLocales.aprobadas,
      icon: <FaCheckCircle className="mb-2" size={24} />,
      color: 'success',
    },
    {
      key: 'rechazada',
      label: 'Rechazadas',
      valor: estadisticasLocales.rechazadas,
      icon: <FaTimesCircle className="mb-2" size={24} />,
      color: 'danger',
    },
    {
      key: 'completada',
      label: 'Completadas',
      valor: estadisticasLocales.completadas,
      icon: <FaGraduationCap className="mb-2" size={24} />,
      color: 'info',
    },
  ];

  // 7. Returns condicionales
  if (!userRole || !userId || !userEmail) {
    return null;
  }

  if (cargandoConfig) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando recuperaciones...</span>
        </div>
        <p className="mt-2">Cargando sistema de recuperaciones...</p>
      </Container>
    );
  }

  if (!periodoActivo) {
    return null;
  }

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando sistema de recuperaciones...</p>
        </div>
      </Container>
    );
  }

  // 8. Renderizado principal
  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="d-flex align-items-center gap-2">
              <FaGraduationCap className="text-primary" />
              Sistema de Recuperaciones
            </h2>
            <p className="text-muted">
              Gestiona las solicitudes de recuperación y refuerzo académico
            </p>
          </div>
          <Button variant="info" onClick={() => navigate('/HorarioRecuperacion')}>
            Ver horario de recuperación
          </Button>
        </Col>
      </Row>

      {/* Selector de Grado */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Seleccionar Grado</h5>
                <div className="d-flex gap-3">
                  <Form.Select
                    value={selectedGrado}
                    onChange={(e) => setSelectedGrado(e.target.value)}
                    style={{ width: 'auto' }}
                    disabled={loadingGrupos || Boolean(errorGrupos)}
                  >
                    {generarOpcionesGrado()}
                  </Form.Select>
                  {userRole === 'estudiante' && (
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleNuevaSolicitud}
                      className="d-flex align-items-center gap-2"
                      disabled={!selectedGrado}
                    >
                      <FaPlus />
                      Nueva Solicitud de Recuperación
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Dashboard de Estadísticas */}
      <Row className="mb-4">
        {tarjetas.map(tarjeta => (
          <Col md={2} key={tarjeta.key}>
            <Card
              className={`text-center border-${tarjeta.color} shadow-sm ${filtroActivo === tarjeta.key ? 'bg-opacity-25 border-3 border' : ''}`}
              style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: filtroActivo === tarjeta.key ? '0 0 0 2px #0d6efd' : undefined }}
              onClick={() => setFiltroActivo(tarjeta.key)}
            >
              <Card.Body>
                <div className={`text-${tarjeta.color}`}>{tarjeta.icon}</div>
                <h4>{tarjeta.valor}</h4>
                <p className="text-muted mb-0">{tarjeta.label}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Lista de Solicitudes */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                {userRole === 'estudiante' ? 'Mis Solicitudes' : 'Solicitudes de Estudiantes'}
                {selectedGrado && (
                  <span className="text-muted ms-2">- Grado {selectedGrado}</span>
                )}
                {filtroActivo !== 'Todas' && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="ms-3"
                    onClick={() => setFiltroActivo('Todas')}
                  >
                    Ver todas
                  </Button>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              {!selectedGrado ? (
                <div className="text-center py-4">
                  <FaGraduationCap size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Selecciona un grado</h5>
                  <p className="text-muted">
                    Por favor, selecciona un grado para ver las solicitudes de recuperación
                  </p>
                </div>
              ) : solicitudesFiltradas.length === 0 ? (
                <div className="text-center py-4">
                  <FaGraduationCap size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No hay solicitudes</h5>
                  <p className="text-muted">
                    {userRole === 'estudiante' 
                      ? 'Aún no has creado ninguna solicitud de recuperación'
                      : 'No hay solicitudes pendientes de revisión'
                    }
                  </p>
                  {userRole === 'estudiante' && (
                    <Button variant="primary" onClick={handleNuevaSolicitud}>
                      Crear Primera Solicitud
                    </Button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        {userRole === 'profesor' && <th>Estudiante</th>}
                        <th>Materia</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesFiltradas.map((solicitud) => (
                        <tr key={solicitud.id}>
                          <td>
                            {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
                          </td>
                          {userRole === 'profesor' && (
                            <td>{solicitud.estudiante_nombre}</td>
                          )}
                          <td>{solicitud.materia_nombre}</td>
                          <td>{getTipoSolicitudBadge(solicitud.tipo_solicitud)}</td>
                          <td>{getEstadoBadge(solicitud.estado)}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleVerDetalle(solicitud)}
                              >
                                <FaFileAlt />
                              </Button>
                              {solicitud.estado === 'aprobada' && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleVerActividades(solicitud)}
                                >
                                  <FaGraduationCap />
                                </Button>
                              )}
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleVerSeguimiento(solicitud)}
                              >
                                <FaComments />
                              </Button>
                              {userRole === 'estudiante' && solicitud.estado === 'pendiente' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleEliminarSolicitud(solicitud)}
                                >
                                  <FaTimesCircle />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modales */}
      <SolicitudModal
        show={showSolicitudModal}
        onHide={() => setShowSolicitudModal(false)}
        materias={materiasFiltradas}
        onSuccess={cargarDatos}
      />

      <DetalleSolicitudModal
        show={showDetalleModal}
        onHide={() => setShowDetalleModal(false)}
        solicitud={selectedSolicitud}
        userRole={userRole}
        onSuccess={cargarDatos}
      />

      <ActividadesModal
        show={showActividadesModal}
        onHide={() => setShowActividadesModal(false)}
        solicitud={selectedSolicitud}
        userRole={userRole}
        onSuccess={cargarDatos}
      />
      
      {/* El modal de confirmación ahora se maneja a través del sistema de notificaciones */}

      <SeguimientoModal
        show={showSeguimientoModal}
        onHide={() => setShowSeguimientoModal(false)}
        solicitud={selectedSolicitud}
        userRole={userRole}
        userId={userId}
        onSuccess={cargarDatos}
      />
    </Container>
  );
};

export default Recuperaciones;
