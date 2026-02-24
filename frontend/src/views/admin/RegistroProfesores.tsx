import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit } from 'react-icons/fa';
import '../../assets/main/styles/RegistroProfesores.css';
import SimpleNavbar from '../../components/SimpleNavbar';
import axios from 'axios';

interface Materia {
  id: number;
  nombre: string;
}

interface Grupo {
  id: number;
  nombre: string;
}

interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  materias: Materia[];
  grupos: Grupo[];
  estado?: 'pendiente' | 'registrado' | 'error';
}

const RegistroProfesores: React.FC = () => {
  const navigate = useNavigate();
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const [gruposDisponibles, setGruposDisponibles] = useState<Grupo[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    materias: [] as Materia[],
    grupos: [] as Grupo[]
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profesorToDeleteId, setProfesorToDeleteId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    materias: [] as Materia[],
    grupos: [] as Grupo[]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [materiasRes, gruposRes, profesoresRes] = await Promise.all([
          axios.get('http://localhost:4000/api/profesores/materias'),
          axios.get('http://localhost:4000/api/profesores/grupos'),
          axios.get('http://localhost:4000/api/profesores/')
        ]);
        setMateriasDisponibles(materiasRes.data);
        setGruposDisponibles(gruposRes.data);
        setProfesores(profesoresRes.data);
      } catch (error) {
        showToast('Error', 'Error al cargar los datos iniciales', 'danger');
      }
    };
    cargarDatosIniciales();
  }, []);

  const showToast = (title: string, message: string, type: string) => {
    setAlertMessage({ title, message, type });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleMateriaChange = (materia: Materia) => {
    setFormData(prev => {
      const existe = prev.materias.some(m => m.id === materia.id);
      return {
        ...prev,
        materias: existe
          ? prev.materias.filter(m => m.id !== materia.id)
          : [...prev.materias, materia]
      };
    });
  };

  const handleGrupoChange = (grupo: Grupo) => {
    setFormData(prev => {
      const existe = prev.grupos.some(g => g.id === grupo.id);
      return {
        ...prev,
        grupos: existe
          ? prev.grupos.filter(g => g.id !== grupo.id)
          : [...prev.grupos, grupo]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarProfesor(formData)) {
      showToast('Error', 'Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    try {
      const profesorData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        correo_institucional: formData.email,
        contrasena: formData.contrasena,
        materias: formData.materias.map(m => m.id),
        grupos: formData.grupos.map(g => g.id)
      };

      const response = await axios.post('http://localhost:4000/api/profesores/profesores-registro', profesorData);
      
      if (response.status === 201) {
        const nuevoProfesor: Profesor = {
          id: response.data.profesor.id,
          nombre: response.data.profesor.nombre,
          apellido: response.data.profesor.apellido,
          email: response.data.profesor.correo_institucional,
          telefono: response.data.profesor.telefono,
          materias: response.data.profesor.materias,
          grupos: response.data.profesor.grupos,
          estado: 'registrado' as const
        };

        setProfesores(prev => [...prev, nuevoProfesor]);
        showToast('Éxito', 'Profesor registrado correctamente', 'success');
        
        // Limpiar el formulario
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          contrasena: '',
          materias: [],
          grupos: []
        });
      }
    } catch (error: any) {
      const mensajeError = error.response?.data?.message || 'Error al registrar el profesor';
      showToast('Error', mensajeError, 'danger');
    }
  };

  const handleDelete = (id: string) => {
    setProfesorToDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!profesorToDeleteId) return;

    try {
      const response = await axios.delete(`http://localhost:4000/api/profesores/${profesorToDeleteId}`);
      if (response.status === 200) {
        setProfesores(prev => prev.filter(prof => prof.id !== profesorToDeleteId));
        showToast('Éxito', response.data.message || 'Profesor eliminado correctamente', 'success');
      }
    } catch (error: any) {
      const mensajeError = error.response?.data?.message || 'Error al eliminar el profesor';
      showToast('Error', mensajeError, 'danger');
    } finally {
      setShowDeleteModal(false);
      setProfesorToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProfesorToDeleteId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/login-secretaria');
  };

  const validarProfesor = (profesor: any): boolean => {
    if (!profesor.nombre || !profesor.apellido || !profesor.email || 
        !profesor.telefono || !profesor.materias || profesor.materias.length === 0 ||
        !profesor.grupos || profesor.grupos.length === 0) {
      return false;
    }
    if (!profesor.email.includes('@iejavieralondonobarriosevilla.edu.co')) {
      return false;
    }
    return true;
  };

  const handleEdit = (profesor: Profesor) => {
    setEditingProfesor(profesor);
    setEditFormData({
      nombre: profesor.nombre,
      apellido: profesor.apellido,
      email: profesor.email,
      telefono: profesor.telefono,
      contrasena: '', // No mostrar la contraseña actual por seguridad
      materias: profesor.materias,
      grupos: profesor.grupos
    });
    setShowEditModal(true);
  };

  const handleEditMateriaChange = (materia: Materia) => {
    setEditFormData(prev => {
      const existe = prev.materias.some(m => m.id === materia.id);
      return {
        ...prev,
        materias: existe
          ? prev.materias.filter(m => m.id !== materia.id)
          : [...prev.materias, materia]
      };
    });
  };

  const handleEditGrupoChange = (grupo: Grupo) => {
    setEditFormData(prev => {
      const existe = prev.grupos.some(g => g.id === grupo.id);
      return {
        ...prev,
        grupos: existe
          ? prev.grupos.filter(g => g.id !== grupo.id)
          : [...prev.grupos, grupo]
      };
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarProfesor(editFormData)) {
      showToast('Error', 'Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    if (!editingProfesor) return;

    try {
      const profesorData = {
        nombre: editFormData.nombre,
        apellido: editFormData.apellido,
        telefono: editFormData.telefono,
        correo_institucional: editFormData.email,
        contrasena: editFormData.contrasena || 'sin_cambiar', // Si no se cambia la contraseña
        materias: editFormData.materias.map(m => m.id),
        grupos: editFormData.grupos.map(g => g.id)
      };

      const response = await axios.put(`http://localhost:4000/api/profesores/${editingProfesor.id}`, profesorData);
      
      if (response.status === 200) {
        const profesorActualizado: Profesor = {
          id: response.data.profesor.id,
          nombre: response.data.profesor.nombre,
          apellido: response.data.profesor.apellido,
          email: response.data.profesor.email,
          telefono: response.data.profesor.telefono,
          materias: response.data.profesor.materias,
          grupos: response.data.profesor.grupos,
          estado: 'registrado' as const
        };

        setProfesores(prev => prev.map(p => p.id === editingProfesor.id ? profesorActualizado : p));
        showToast('Éxito', 'Profesor actualizado correctamente', 'success');
        setShowEditModal(false);
        setEditingProfesor(null);
      }
    } catch (error: any) {
      const mensajeError = error.response?.data?.message || 'Error al actualizar el profesor';
      showToast('Error', mensajeError, 'danger');
    }
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingProfesor(null);
    setEditFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      contrasena: '',
      materias: [],
      grupos: []
    });
  };

  // Función para filtrar profesores
  const filteredProfesores = profesores.filter(profesor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profesor.nombre.toLowerCase().includes(searchLower) ||
      profesor.apellido.toLowerCase().includes(searchLower) ||
      profesor.email.toLowerCase().includes(searchLower) ||
      profesor.telefono.includes(searchTerm) ||
      `${profesor.nombre} ${profesor.apellido}`.toLowerCase().includes(searchLower)
    );
  });

  // Función para ordenar grupos tipo "6-1", "7-2", etc.
  function compararGrupos(a: Grupo, b: Grupo) {
    const regex = /^(\d+)[- ]?([A-Za-z0-9]+)$/;
    const matchA = a.nombre.match(regex);
    const matchB = b.nombre.match(regex);

    if (matchA && matchB) {
      const gradoA = parseInt(matchA[1], 10);
      const grupoA = isNaN(Number(matchA[2])) ? matchA[2] : parseInt(matchA[2], 10);
      const gradoB = parseInt(matchB[1], 10);
      const grupoB = isNaN(Number(matchB[2])) ? matchB[2] : parseInt(matchB[2], 10);

      if (gradoA !== gradoB) return gradoA - gradoB;
      if (grupoA !== grupoB) return grupoA > grupoB ? 1 : -1;
      return 0;
    }
    return a.nombre.localeCompare(b.nombre);
  }

  return (
    <div className="registro-profesores">
      <SimpleNavbar />
      {showAlert && (
        <div className={`alert alert-${alertMessage.type} alert-dismissible fade show`} role="alert">
          <strong>{alertMessage.title}</strong> {alertMessage.message}
          <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Registro de Profesores</h2>
          <div className="d-flex gap-2">
            <Link to="/registro-estudiantes" className="btn btn-light">
              <i className="bi bi-person-plus me-2"></i>
              Ir a Registro de Estudiantes
            </Link>
            <button onClick={handleLogout} className="btn btn-outline-light">
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Información Personal */}
              <div className="col-12">
                <h5 className="border-bottom pb-2 mb-3">Información Personal</h5>
              </div>
              
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Nombre del profesor"
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    placeholder="Apellido del profesor"
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="Número de teléfono"
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({...formData, contrasena: e.target.value})}
                    placeholder="Contraseña para el profesor"
                    required
                  />
                </div>
              </div>

              {/* Información Institucional */}
              <div className="col-12">
                <h5 className="border-bottom pb-2 mb-3 mt-4">Información Institucional</h5>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Correo Institucional</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="profesor.nombre@iejavieralondonobarriosevilla.edu.co"
                    required
                  />
                </div>
              </div>

              {/* Materias y Grupos */}
              <div className="col-12">
                <h5 className="border-bottom pb-2 mb-3 mt-4">Asignación de Materias y Grupos</h5>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Materias que Enseña</label>
                  <div className="materias-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="row">
                      {materiasDisponibles.length === 0 ? (
                        <div className="text-muted">No hay materias disponibles</div>
                      ) : (
                        materiasDisponibles.map((materia) => (
                          <div key={materia.id} className="col-md-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`materia-${materia.id}`}
                                checked={formData.materias.some(m => m.id === materia.id)}
                                onChange={() => handleMateriaChange(materia)}
                              />
                              <label className="form-check-label" htmlFor={`materia-${materia.id}`}>{materia.nombre}</label>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Grupos a Cargo</label>
                  <div className="grupos-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="row">
                      {gruposDisponibles.length === 0 ? (
                        <div className="text-muted">No hay grupos disponibles</div>
                      ) : (
                        [...gruposDisponibles]
                          .sort(compararGrupos)
                          .map((grupo) => (
                            <div key={grupo.id} className="col-md-4">
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`grupo-${grupo.id}`}
                                  checked={formData.grupos.some(g => g.id === grupo.id)}
                                  onChange={() => handleGrupoChange(grupo)}
                                />
                                <label className="form-check-label" htmlFor={`grupo-${grupo.id}`}>{grupo.nombre}</label>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 mt-4">
                <button type="submit" className="btn btn-danger w-100">
                  Registrar Profesor
                </button>
              </div>
            </div>
          </form>

          {/* Tabla de Profesores */}
          {profesores.length > 0 && (
            <div className="card mt-4">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    Profesores Registrados ({filteredProfesores.length})
                  </h5>
                  <div className="d-flex gap-2">
                    {!showSearch ? (
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setShowSearch(true)}
                        title="Buscar profesores"
                      >
                        <i className="bi bi-search"></i>
                      </button>
                    ) : (
                      <div className={`input-group search-anim ${showSearch ? 'open' : ''}`} style={{ width: '300px' }}>
                        <span className="input-group-text">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar por nombre, email o teléfono..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                        {searchTerm && (
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setSearchTerm('')}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => {
                            setShowSearch(false);
                            setSearchTerm('');
                          }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body">
                {showSearch && !searchTerm ? (
                  <div className="text-center py-4 fade-slide">
                    <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-2">Busca profesores en la barra de búsqueda</p>
                    <p className="text-muted small">Puedes buscar por:</p>
                    <ul className="text-muted small text-start d-inline-block">
                      <li>Nombre completo o parcial</li>
                      <li>Email institucional</li>
                      <li>Teléfono</li>
                      <li>Grupos o materias</li>
                    </ul>
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setShowSearch(false)}
                      >
                        Cerrar búsqueda
                      </button>
                    </div>
                  </div>
                ) : (
                  searchTerm && filteredProfesores.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                      <p className="text-muted mt-2">No se encontraron profesores que coincidan con "{searchTerm}"</p>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchTerm('')}
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Materias</th>
                            <th>Grupos</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProfesores.map((profesor) => (
                            <tr key={profesor.id}>
                              <td>{`${profesor.nombre} ${profesor.apellido}`}</td>
                              <td>{profesor.email}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {profesor.materias.map((materia) => (
                                    <span key={materia.id} className="badge bg-secondary">
                                      {materia.nombre}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {profesor.grupos.map((grupo) => (
                                    <span key={grupo.id} className="badge bg-info">
                                      {grupo.nombre}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>{profesor.telefono}</td>
                              <td>
                                <span className={`badge bg-${profesor.estado === 'registrado' ? 'success' : profesor.estado === 'error' ? 'danger' : 'warning'}`}>
                                  {profesor.estado}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleEdit(profesor)}
                                    title="Editar profesor"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(profesor.id)}
                                    title="Eliminar profesor"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirmar Eliminación</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar a este profesor? Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDelete}>Cancelar</button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Profesor */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaEdit className="me-2" />
                  Editar Profesor
                </h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={cancelEdit}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditSubmit}>
                  <div className="row g-3">
                    {/* Información Personal */}
                    <div className="col-12">
                      <h5 className="border-bottom pb-2 mb-3">Información Personal</h5>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.nombre}
                          onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                          placeholder="Nombre del profesor"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Apellido</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.apellido}
                          onChange={(e) => setEditFormData({...editFormData, apellido: e.target.value})}
                          placeholder="Apellido del profesor"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Teléfono</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editFormData.telefono}
                          onChange={(e) => setEditFormData({...editFormData, telefono: e.target.value})}
                          placeholder="Número de teléfono"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                          type="password"
                          className="form-control"
                          value={editFormData.contrasena}
                          onChange={(e) => setEditFormData({...editFormData, contrasena: e.target.value})}
                          placeholder="Dejar vacío para mantener la actual"
                        />
                        <small className="form-text text-muted">Dejar vacío para mantener la contraseña actual</small>
                      </div>
                    </div>

                    {/* Información Institucional */}
                    <div className="col-12">
                      <h5 className="border-bottom pb-2 mb-3 mt-4">Información Institucional</h5>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Correo Institucional</label>
                        <input
                          type="email"
                          className="form-control"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          placeholder="profesor.nombre@iejavieralondonobarriosevilla.edu.co"
                          required
                        />
                      </div>
                    </div>

                    {/* Materias y Grupos */}
                    <div className="col-12">
                      <h5 className="border-bottom pb-2 mb-3 mt-4">Asignación de Materias y Grupos</h5>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Materias que Enseña</label>
                        <div className="materias-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <div className="row">
                            {materiasDisponibles.length === 0 ? (
                              <div className="text-muted">No hay materias disponibles</div>
                            ) : (
                              materiasDisponibles.map((materia) => (
                                <div key={materia.id} className="col-md-6">
                                  <div className="form-check">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`edit-materia-${materia.id}`}
                                      checked={editFormData.materias.some(m => m.id === materia.id)}
                                      onChange={() => handleEditMateriaChange(materia)}
                                    />
                                    <label className="form-check-label" htmlFor={`edit-materia-${materia.id}`}>{materia.nombre}</label>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Grupos a Cargo</label>
                        <div className="grupos-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <div className="row">
                            {gruposDisponibles.length === 0 ? (
                              <div className="text-muted">No hay grupos disponibles</div>
                            ) : (
                              [...gruposDisponibles]
                                .sort(compararGrupos)
                                .map((grupo) => (
                                  <div key={grupo.id} className="col-md-4">
                                    <div className="form-check">
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id={`edit-grupo-${grupo.id}`}
                                        checked={editFormData.grupos.some(g => g.id === grupo.id)}
                                        onChange={() => handleEditGrupoChange(grupo)}
                                      />
                                      <label className="form-check-label" htmlFor={`edit-grupo-${grupo.id}`}>{grupo.nombre}</label>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={handleEditSubmit}>
                  <FaEdit className="me-2" />
                  Actualizar Profesor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroProfesores; 