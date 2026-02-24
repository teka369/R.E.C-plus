// Comentarios detallados en español para cada línea y bloque de código\nimport React, { useState, useEffect } from 'react'; // Importa React y los hooks useState y useEffect\nimport { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Nav } from 'react-bootstrap'; // Importa componentes de React Bootstrap para la interfaz\nimport { FaSearch, FaFilter, FaBook, FaVideo, FaFilePdf, FaFileAlt, FaDownload, FaEye, FaPlus, FaEdit, FaTrash, FaInfoCircle } from 'react-icons/fa'; // Importa iconos de react-icons\nimport { VerMaterialModal, EditarMaterialModal, EliminarMaterialModal } from './components/modals/MaterialModals'; // Importa los modales para ver, editar y eliminar materiales\nimport axios from 'axios'; // Importa axios para realizar peticiones HTTP\nimport { useProfesorGrupos } from '../../hooks/useProfesorGrupos'; // Hook personalizado para obtener los grupos del profesor\nimport { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos'; // Hook personalizado para obtener los grupos del estudiante\nimport type { Material, MaterialBackendPayload } from '../../types/Material'; // Importa los tipos de Material y el payload para el backend\n\n// Definición del componente principal Material\nconst Material: React.FC = () => {\n  // Estados para filtros y búsqueda\n  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda\n  const [filterTipo, setFilterTipo] = useState('todos'); // Filtro por tipo de material\n  const [filterMateria, setFilterMateria] = useState('0'); // Filtro por materia\n  const [gradoSeleccionado, setGradoSeleccionado] = useState(''); // Grado seleccionado\n  const [activeTab, setActiveTab] = useState('grid'); // Pestaña activa (grid o lista)\n  const [userRole, setUserRole] = useState<string | null>(null); // Rol del usuario\n  const [profesorId, setProfesorId] = useState<number | null>(null); // ID del profesor\n  const [userEmail, setUserEmail] = useState<string | null>(null); // Email del usuario\n  const [materiales, setMateriales] = useState<Material[]>([]); // Lista de materiales\n  const [loading, setLoading] = useState(true); // Estado de carga\n  const [error, setError] = useState<string | null>(null); // Estado de error\n  const [profesorMaterias, setProfesorMaterias] = useState<any[]>([]); // Materias del profesor\n\n  // Hooks para obtener los grupos según el rol\n  const { grupos: gruposProfesor, loading: loadingGruposProfesor, error: errorGruposProfesor } = useProfesorGrupos(profesorId);\n  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante, error: errorGruposEstudiante } = useEstudianteGrupos(userEmail);\n\n  // Estados para los modales\n  const [showAddModal, setShowAddModal] = useState(false); // Modal para agregar material\n  const [showEditModal, setShowEditModal] = useState(false); // Modal para editar material\n  const [showDeleteModal, setShowDeleteModal] = useState(false); // Modal para eliminar material\n  const [showDetailsModal, setShowDetailsModal] = useState(false); // Modal para ver detalles\n  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null); // Material actual seleccionado\n\n  // useEffect para cargar datos y establecer el rol del usuario al iniciar\n  useEffect(() => {\n    const role = localStorage.getItem('userRole'); // Obtiene el rol del usuario del localStorage\n    const userId = localStorage.getItem('userId'); // Obtiene el ID del usuario\n    const email = localStorage.getItem('userEmail'); // Obtiene el email del usuario\n    setUserRole(role);\n    setUserEmail(email);\n    \n    if (userId && role === 'profesor') {\n      setProfesorId(parseInt(userId)); // Establece el ID del profesor\n\n      // Función para obtener las materias del profesor\n      const fetchProfesorMaterias = async () => {\n        try {\n          const response = await axios.get(`http://localhost:4000/api/profesores/${email}`);\n          if (response.data.success && response.data.data.materias) {\n            setProfesorMaterias(response.data.data.materias); // Guarda las materias del profesor\n          }\n        } catch (err) {\n          console.error('Error fetching professor materias:', err);\n        }\n      };\n      fetchProfesorMaterias();\n    } else {\n        setProfesorId(null); // Si no es profesor, ID nulo\n    }\n  }, []);\n\n  // Determina los grupos y estados según el rol\n  const grupos = userRole === 'profesor' ? gruposProfesor : userRole === 'estudiante' ? gruposEstudiante : [];\n  const loadingGrupos = userRole === 'profesor' ? loadingGruposProfesor : loadingGruposEstudiante;\n  const errorGrupos = userRole === 'profesor' ? errorGruposProfesor : errorGruposEstudiante;\n\n  // useEffect para cargar materiales cuando cambia el grado seleccionado\n  useEffect(() => {\n    if (gradoSeleccionado) {\n      fetchMateriales(); // Carga los materiales del grado seleccionado\n    } else {\n      setMateriales([]); // Si no hay grado, limpia la lista\n    }\n  }, [gradoSeleccionado]);\n\n  // Función para cargar materiales desde el backend\n  const fetchMateriales = async () => {\n    try {\n      setLoading(true); // Activa el estado de carga\n      if (!gradoSeleccionado) {\n        setMateriales([]);\n        setLoading(false);\n        return;\n      }\n      const response = await axios.get(`http://localhost:4000/api/materiales/grado/${gradoSeleccionado}`);\n      if (response.data.success) {\n        setMateriales(response.data.data); // Guarda los materiales obtenidos\n      } else {\n        setError(response.data.message || 'Error al cargar los materiales');\n      }\n    } catch (error: any) {\n      console.error('Error al cargar materiales:', error);\n      setError(error.response?.data?.message || 'Error al cargar el material');\n    } finally {\n      setLoading(false); // Desactiva el estado de carga\n    }\n  };\n\n  // Funciones para manejar los modales\n  const handleAddModal = () => {\n    setCurrentMaterial(null); // Limpia el material actual\n    setShowAddModal(true); // Muestra el modal de agregar\n  };\n\n  const handleEditModal = (material: Material) => {\n    setCurrentMaterial(material); // Establece el material actual\n    setShowEditModal(true); // Muestra el modal de editar\n  };\n\n  const handleDeleteModal = (material: Material) => {\n    setCurrentMaterial(material); // Establece el material actual\n    setShowDeleteModal(true); // Muestra el modal de eliminar\n  };\n\n  const handleDetailsModal = (material: Material) => {\n    setCurrentMaterial(material); // Establece el material actual\n    handleIncrementarVistas(material.id); // Incrementa las vistas del material\n    setShowDetailsModal(true); // Muestra el modal de detalles\n  };\n\n  // Función para crear material\n  const handleCreateMaterial = async (newMaterial: MaterialBackendPayload) => {\n    try {\n      if (!profesorId) {\n        setError('Error: No se pudo identificar al profesor. Por favor, inicie sesión nuevamente.');\n        return;\n      }\n\n      const selectedGrupoId = gruposProfesor.find(g => g.nombre === gradoSeleccionado)?.id;\n      if (selectedGrupoId === undefined) {\n        setError(`Error: Grado ${gradoSeleccionado} no encontrado en los grupos del profesor.`);\n        return;\n      }\n\n      const payloadWithGroups = { \n        ...newMaterial, \n        grupos: [selectedGrupoId],\n        profesor_id: profesorId\n      };\n\n      const response = await axios.post('http://localhost:4000/api/materiales', payloadWithGroups);\n      if (response.data.success) {\n        fetchMateriales(); // Recarga los materiales\n        setShowAddModal(false); // Cierra el modal\n      } else {\n        setError(response.data.message || 'Error al crear el material');\n      }\n    } catch (error: any) {\n      console.error('Error al crear material:', error);\n      setError(error.response?.data?.message || 'Error al crear el material');\n    }\n  };\n\n  // Función para actualizar material\n  const handleUpdateMaterial = async (id: number, updatedMaterial: Partial<MaterialBackendPayload>) => {\n    try {\n      if (!profesorId) {\n        setError('Error: No se pudo identificar al profesor. Por favor, inicie sesión nuevamente.');\n        return;\n      }\n\n      const selectedGrupoId = gruposProfesor.find(g => g.nombre === gradoSeleccionado)?.id;\n      if (selectedGrupoId === undefined) {\n        setError(`Error: Grado ${gradoSeleccionado} no encontrado en los grupos del profesor.`);\n        return;\n      }\n\n      const payloadWithGroups = { \n        ...updatedMaterial, \n        grupos: [selectedGrupoId],\n        profesor_id: profesorId\n      };\n\n      const response = await axios.put(`http://localhost:4000/api/materiales/${id}`, payloadWithGroups);\n      if (response.data.success) {\n        fetchMateriales(); // Recarga los materiales\n        setShowEditModal(false); // Cierra el modal\n      } else {\n        setError(response.data.message || 'Error al actualizar el material');\n      }\n    } catch (error: any) {\n      console.error('Error al actualizar material:', error);\n      setError(error.response?.data?.message || 'Error al actualizar el material');\n    }\n  };\n\n  // Función para eliminar material\n  const handleDeleteMaterial = async (id: number) => {\n    try {\n      const response = await axios.delete(`http://localhost:4000/api/materiales/${id}`);\n      if (response.data.success) {\n        fetchMateriales(); // Recarga los materiales\n        setShowDeleteModal(false); // Cierra el modal\n      } else {\n        setError(response.data.message || 'Error al eliminar material');\n      }\n    } catch (error: any) {\n      console.error('Error al eliminar material:', error);\n      setError(error.response?.data?.message || 'Error al eliminar el material');\n    }\n
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Nav } from 'react-bootstrap';
import { FaSearch, FaFilter, FaBook, FaVideo, FaFilePdf, FaFileAlt, FaDownload, FaEye, FaPlus, FaEdit, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { VerMaterialModal, EditarMaterialModal, EliminarMaterialModal } from './components/modals/MaterialModals';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useProfesorGrupos } from '../../hooks/useProfesorGrupos';
import { useEstudianteGrupos } from '../../hooks/useEstudianteGrupos';
import type { Material, MaterialBackendPayload } from '../../types/Material';


const Material: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterMateria, setFilterMateria] = useState('0');
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [activeTab, setActiveTab] = useState('grid');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profesorId, setProfesorId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profesorMaterias, setProfesorMaterias] = useState<any[]>([]);

  const { grupos: gruposProfesor, loading: loadingGruposProfesor, error: errorGruposProfesor } = useProfesorGrupos(profesorId);
  const { grupos: gruposEstudiante, loading: loadingGruposEstudiante, error: errorGruposEstudiante } = useEstudianteGrupos(userEmail);

  // Estado para los modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);

  // Cargar datos al iniciar y establecer el rol del usuario desde AuthContext
  const { user, role } = useAuth();
  useEffect(() => {
    const currentRole = role || null;
    const email = (user?.correo as string) || (user?.correo_institucional as string) || null;
    const idValue = typeof user?.id === 'string' ? parseInt(user.id) : (user?.id as number | null);
    setUserRole(currentRole);
    setUserEmail(email);
    
    if (idValue && currentRole === 'profesor') {
      setProfesorId(idValue);

      // Fetch professor's subjects if the user is a professor
      const fetchProfesorMaterias = async () => {
        try {
          if (!email) return;
          const response = await api.get(`/profesores/${encodeURIComponent(email)}`);
          if (response.data?.success && response.data?.data?.materias) {
            setProfesorMaterias(response.data.data.materias);
          }
        } catch (err) {
          console.error('Error fetching professor materias:', err);
        }
      };
      fetchProfesorMaterias();
    } else {
        setProfesorId(null);
    }
  }, [user, role]);

  const grupos = userRole === 'profesor' ? gruposProfesor : userRole === 'estudiante' ? gruposEstudiante : [];
  const loadingGrupos = userRole === 'profesor' ? loadingGruposProfesor : loadingGruposEstudiante;
  const errorGrupos = userRole === 'profesor' ? errorGruposProfesor : errorGruposEstudiante;

  // Cargar materiales cuando el grado seleccionado cambie
  useEffect(() => {
    if (gradoSeleccionado) {
      fetchMateriales();
    } else {
      setMateriales([]);
    }
  }, [gradoSeleccionado]);

  // Función para cargar materiales
  const fetchMateriales = async () => {
    try {
      setLoading(true);
      if (!gradoSeleccionado) {
        setMateriales([]);
        setLoading(false);
        return;
      }
      const response = await api.get(`/materiales/grado/${gradoSeleccionado}`);
      if (response.data.success) {
        setMateriales(response.data.data);
      } else {
        setError(response.data.message || 'Error al cargar los materiales');
      }
    } catch (error: any) {
      console.error('Error al cargar materiales:', error);
      setError(error.response?.data?.message || 'Error al cargar el material');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar los modales
  const handleAddModal = () => {
    setCurrentMaterial(null);
    setShowAddModal(true);
  };

  const handleEditModal = (material: Material) => {
    setCurrentMaterial(material);
    setShowEditModal(true);
  };

  const handleDeleteModal = (material: Material) => {
    setCurrentMaterial(material);
    setShowDeleteModal(true);
  };

  const handleDetailsModal = (material: Material) => {
    setCurrentMaterial(material);
    handleIncrementarVistas(material.id);
    setShowDetailsModal(true);
  };

  // Función para crear material
  const handleCreateMaterial = async (newMaterial: MaterialBackendPayload) => {
    try {
      if (!profesorId) {
        setError('Error: No se pudo identificar al profesor. Por favor, inicie sesión nuevamente.');
        return;
      }

      const selectedGrupoId = gruposProfesor.find(g => g.nombre === gradoSeleccionado)?.id;
      if (selectedGrupoId === undefined) {
        setError(`Error: Grado ${gradoSeleccionado} no encontrado en los grupos del profesor.`);
        return;
      }

      const payloadWithGroups = { 
        ...newMaterial, 
        grupos: [selectedGrupoId],
        profesor_id: profesorId
      };

      const response = await api.post('/materiales', payloadWithGroups);
      if (response.data.success) {
        fetchMateriales();
        setShowAddModal(false);
      } else {
        setError(response.data.message || 'Error al crear el material');
      }
    } catch (error: any) {
      console.error('Error al crear material:', error);
      setError(error.response?.data?.message || 'Error al crear el material');
    }
  };

  // Función para actualizar material
  const handleUpdateMaterial = async (id: number, updatedMaterial: Partial<MaterialBackendPayload>) => {
    try {
      if (!profesorId) {
        setError('Error: No se pudo identificar al profesor. Por favor, inicie sesión nuevamente.');
        return;
      }

      const selectedGrupoId = gruposProfesor.find(g => g.nombre === gradoSeleccionado)?.id;
      if (selectedGrupoId === undefined) {
        setError(`Error: Grado ${gradoSeleccionado} no encontrado en los grupos del profesor.`);
        return;
      }

      const payloadWithGroups = { 
        ...updatedMaterial, 
        grupos: [selectedGrupoId],
        profesor_id: profesorId
      };

      const response = await api.put(`/materiales/${id}`, payloadWithGroups);
      if (response.data.success) {
        fetchMateriales();
        setShowEditModal(false);
      } else {
        setError(response.data.message || 'Error al actualizar el material');
      }
    } catch (error: any) {
      console.error('Error al actualizar material:', error);
      setError(error.response?.data?.message || 'Error al actualizar el material');
    }
  };

  // Función para eliminar material
  const handleDeleteMaterial = async (id: number) => {
    try {
      const response = await api.delete(`/materiales/${id}`);
      if (response.data.success) {
        fetchMateriales();
        setShowDeleteModal(false);
      } else {
        setError(response.data.message || 'Error al eliminar material');
      }
    } catch (error: any) {
      console.error('Error al eliminar material:', error);
      setError(error.response?.data?.message || 'Error al eliminar el material');
    }
  };

  // Función para incrementar vistas
  const handleIncrementarVistas = async (id: number) => {
    try {
      await api.post(`/materiales/${id}/vista`);
      fetchMateriales();
    } catch (error) {
      console.error('Error al incrementar vistas:', error);
    }
  };

  // Función para incrementar descargas
  const handleIncrementarDescargas = async (id: number) => {
    try {
      await api.post(`/materiales/${id}/descarga`);
      fetchMateriales();
    } catch (error) {
      console.error('Error al incrementar descargas:', error);
    }
  };

  // Filtrar materiales según búsqueda y filtros
  const filteredMateriales = materiales.filter(material => {
    const matchesSearch = material.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         material.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.autor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todos' || material.tipo === filterTipo;
    const matchesMateria = filterMateria === '0' || material.materia_id.toString() === filterMateria;
    
    return matchesSearch && matchesTipo && matchesMateria;
  });

  // Función para generar opciones de grado
  const generarOpcionesGrado = () => {
    if (loadingGrupos) return [<option key="loading">Cargando grupos...</option>];
    if (errorGrupos) return [<option key="error">Error al cargar grupos</option>];
    if (grupos.length === 0) return [<option key="no-groups">No hay grupos disponibles</option>];
    return [
      <option key="select" value="">Seleccionar grado</option>,
      ...grupos.map(grupo => (
        <option key={grupo.id} value={grupo.nombre}>
          Grado {grupo.nombre}
        </option>
      ))
    ];
  };

  // Obtener lista de materias únicas (con IDs)
  const materiasOptions = [
    { id: 14, nombre: 'Artística' },
    { id: 4, nombre: 'Biología' },
    { id: 8, nombre: 'Economia_Politica' },
    { id: 6, nombre: 'Educación Física' },
    { id: 2, nombre: 'Español' },
    { id: 12, nombre: 'Ética' },
    { id: 3, nombre: 'Filosofía' },
    { id: 10, nombre: 'Física' },
    { id: 13, nombre: 'Inglés' },
    { id: 1, nombre: 'Matemáticas' },
    { id: 9, nombre: 'Progrocion_software' },
    { id: 5, nombre: 'Química' },
    { id: 11, nombre: 'Religion' },
    { id: 15, nombre: 'Sociales' },
    { id: 7, nombre: 'tecnología_Informática' }
  ];

  // Función para obtener el icono según el tipo de material
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'libro':
        return <FaBook className="me-1" />;
      case 'video':
        return <FaVideo className="me-1" />;
      case 'documento':
        return <FaFilePdf className="me-1" />;
      case 'presentacion':
        return <FaFileAlt className="me-1" />;
      default:
        return <FaFileAlt className="me-1" />;
    }
  };

  // Función para obtener el color del badge según el tipo
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'libro':
        return 'primary';
      case 'video':
        return 'danger';
      case 'documento':
        return 'success';
      case 'presentacion':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // useEffect para selección automática de grado
  useEffect(() => {
    if (!gradoSeleccionado) {
      let defaultGrade = '';

      if (userRole === 'profesor' && !loadingGruposProfesor && !errorGruposProfesor && gruposProfesor.length > 0) {
        defaultGrade = gruposProfesor[0].nombre;
      } else if (userRole === 'estudiante' && !loadingGruposEstudiante && !errorGruposEstudiante && gruposEstudiante.length > 0) {
        defaultGrade = gruposEstudiante[0].nombre;
      }

      if (defaultGrade) {
        setGradoSeleccionado(defaultGrade);
      }
    }
    // eslint-disable-next-line
  }, [
    gruposProfesor, loadingGruposProfesor, errorGruposProfesor,
    gruposEstudiante, loadingGruposEstudiante, errorGruposEstudiante,
    userRole
  ]);

  useEffect(() => {
    setMateriales([]);
  }, [userRole]);

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading || (userRole === 'profesor' && loadingGrupos) || (userRole === 'estudiante' && loadingGrupos) ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Materiales de Estudio</h2>
              <div className="d-flex gap-3">
                <Form.Select
                  value={gradoSeleccionado}
                  onChange={(e) => setGradoSeleccionado(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  {generarOpcionesGrado()}
                </Form.Select>
                {userRole === 'profesor' && (
                  <Button variant="danger" onClick={handleAddModal}>
                    <FaPlus className="me-2" />
                    Agregar Material
                  </Button>
                )}
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-white rounded shadow-sm p-3 mb-4">
              <Row className="g-3">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar material..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaFilter />
                    </InputGroup.Text>
                    <Form.Select 
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                    >
                      <option value="todos">Todos los tipos</option>
                      <option value="libro">Libros</option>
                      <option value="video">Videos</option>
                      <option value="documento">Documentos</option>
                      <option value="presentacion">Presentaciones</option>
                    </Form.Select>
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaFilter />
                    </InputGroup.Text>
                    <Form.Select 
                      value={filterMateria}
                      onChange={(e) => setFilterMateria(e.target.value)}
                    >
                      <option value="0">Todas las materias</option>
                      {userRole === 'profesor' && profesorMaterias.length > 0 ? (
                        profesorMaterias.map((materia) => (
                          <option key={materia.id} value={materia.id.toString()}>
                            {materia.nombre}
                          </option>
                        ))
                      ) : (
                        materiasOptions.map((materia) => (
                          <option key={materia.id} value={materia.id.toString()}>
                            {materia.nombre}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  </InputGroup>
                </Col>
              </Row>
            </div>

            {/* Selector de vista */}
            <div className="bg-white rounded shadow-sm p-2 mb-4">
              <Nav variant="pills" className="justify-content-center">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'grid'} 
                    onClick={() => setActiveTab('grid')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-grid me-1"></i> Cuadrícula
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'list'} 
                    onClick={() => setActiveTab('list')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-list me-1"></i> Lista
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            {/* Vista de materiales */}
            {activeTab === 'grid' ? (
              // Vista de cuadrícula
              <Row className="g-4">
                {filteredMateriales.length > 0 ? (
                  filteredMateriales.map((material) => (
                    <Col md={6} lg={3} key={material.id}>
                      <Card className="h-100 shadow-sm border-0">
                        <div className="position-relative">
                          <Card.Img variant="top" src={material.imagen || `https://via.placeholder.com/300x150?text=${material.tipo}`} />
                          <Badge 
                            bg={getTipoBadgeColor(material.tipo)} 
                            className="position-absolute top-0 end-0 m-2"
                          >
                            {getTipoIcon(material.tipo)} {material.tipo}
                          </Badge>
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="text-truncate" title={material.titulo}>{material.titulo}</Card.Title>
                          <Card.Text className="text-muted small flex-grow-1">
                            {material.descripcion.length > 100 ? 
                              `${material.descripcion.substring(0, 100)}...` : material.descripcion}
                          </Card.Text>
                          <div className="d-flex justify-content-between mb-2">
                            <small className="text-muted">{material.materia_nombre}</small>
                            <small className="text-muted">{new Date(material.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
                          </div>
                          <div className="d-flex justify-content-between mb-3">
                            <small className="text-muted">
                              <FaEye className="me-1" /> {material.vistas}
                            </small>
                            <small className="text-muted">
                              <FaDownload className="me-1" /> {material.descargas}
                            </small>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="flex-grow-1"
                              as="a"
                              href={material.enlace}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleIncrementarDescargas(material.id)}
                            >
                              <FaDownload className="me-1" /> Descargar
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="flex-grow-1 mt-1"
                              onClick={() => handleDetailsModal(material)}
                            >
                              <FaInfoCircle className="me-1" /> Detalles
                            </Button>
                            {userRole === 'profesor' && (
                              <>
                                <Button 
                                  variant="outline-warning" 
                                  size="sm"
                                  className="flex-grow-1 mt-1"
                                  onClick={() => handleEditModal(material)}
                                >
                                  <FaEdit className="me-1" /> Editar
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  className="flex-grow-1 mt-1"
                                  onClick={() => handleDeleteModal(material)}
                                >
                                  <FaTrash className="me-1" /> Eliminar
                                </Button>
                              </>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col><p>No hay materiales disponibles para este grado.</p></Col>
                )}
              </Row>
            ) : (
              // Vista de lista
              <div className="bg-white rounded shadow-sm p-3">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Materia</th>
                        <th>Autor</th>
                        <th>Fecha</th>
                        <th>Interacciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMateriales.length > 0 ? (
                        filteredMateriales.map((material) => (
                          <tr key={material.id}>
                            <td>{material.titulo}</td>
                            <td><Badge bg={getTipoBadgeColor(material.tipo)}>{getTipoIcon(material.tipo)} {material.tipo}</Badge></td>
                            <td>{material.materia_nombre}</td>
                            <td>{material.autor}</td>
                            <td>{new Date(material.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            <td>
                              <small className="me-2">
                                <FaEye className="me-1" /> {material.vistas}
                              </small>
                              <small>
                                <FaDownload className="me-1" /> {material.descargas}
                              </small>
                            </td>
                            <td>
                              <div className="d-flex justify-content-center gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  as="a"
                                  href={material.enlace}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleIncrementarDescargas(material.id)}
                                >
                                  <FaDownload className="me-1" /> Descargar
                                </Button>
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => handleDetailsModal(material)}
                                >
                                  <FaInfoCircle className="me-1" /> Detalles
                                </Button>
                                {userRole === 'profesor' && (
                                  <>
                                    <Button 
                                      variant="outline-warning" 
                                      size="sm"
                                      onClick={() => handleEditModal(material)}
                                    >
                                      <FaEdit className="me-1" /> Editar
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => handleDeleteModal(material)}
                                    >
                                      <FaTrash className="me-1" /> Eliminar
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center">No hay materiales disponibles para este grado en vista de lista.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Modales */}
      <VerMaterialModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        material={currentMaterial}
      />
      {userRole === 'profesor' && (
        <>
          <EditarMaterialModal
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            onSave={handleCreateMaterial}
            materias={userRole === 'profesor' ? profesorMaterias : materiasOptions.filter(m => m.id !== 0)}
            currentGrado={gradoSeleccionado}
            grupos={gruposProfesor}
          />
          <EditarMaterialModal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            material={currentMaterial}
            onSave={async (updatedMaterial) => {
              if (currentMaterial) {
                await handleUpdateMaterial(currentMaterial.id, updatedMaterial);
              }
            }}
            materias={userRole === 'profesor' ? profesorMaterias : materiasOptions.filter(m => m.id !== 0)}
            grupos={gruposProfesor}
          />
          <EliminarMaterialModal
            show={showDeleteModal}
            onHide={() => setShowDeleteModal(false)}
            material={currentMaterial}
            onDelete={async () => {
              if (currentMaterial) {
                await handleDeleteMaterial(currentMaterial.id);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default Material;
