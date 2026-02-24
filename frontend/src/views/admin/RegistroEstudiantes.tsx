import { useState, useRef, useEffect } from 'react';
import { FaTrash, FaCopy, FaDownload, FaPlus, FaRedo, FaExclamationTriangle, FaUsers, FaCheck, FaEdit } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../../assets/main/styles/RegistroEstudiantes.css';
import { Link, useNavigate } from 'react-router-dom';
import SimpleNavbar from '../../components/SimpleNavbar';

interface Grupo {
  id: number;
  nombre: string;
}

interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  documento_identidad: string;
  correo_institucional: string;
  grupos: Grupo[];
  estado?: 'pendiente' | 'registrado' | 'error';
}

interface FormData {
  nombre: string;
  apellido: string;
  documento_identidad: string;
  correo_institucional: string;
  grupos: number[];
}

const RegistroEstudiantes = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    documento_identidad: '',
    correo_institucional: '',
    grupos: []
  });
  const [masivoData, setMasivoData] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [activeTab, setActiveTab] = useState('individual');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estudianteToDelete, setEstudianteToDelete] = useState<Estudiante | null>(null);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [selectedGrupoTemp, setSelectedGrupoTemp] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);
  const [editFormData, setEditFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    documento_identidad: '',
    correo_institucional: '',
    grupos: []
  });
  const [showEditGrupoModal, setShowEditGrupoModal] = useState(false);
  const [selectedEditGrupoTemp, setSelectedEditGrupoTemp] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:4000/api/estudiantes';

  const handleLogout = () => {
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/login-secretaria');
  };

  const fetchData = async () => {
    try {
      const [estudiantesRes, gruposRes] = await Promise.all([
        fetch(API_BASE_URL),
        fetch('http://localhost:4000/api/grupos')
      ]);
      
      if (!estudiantesRes.ok || !gruposRes.ok) {
        throw new Error('Error al cargar los datos');
      }

      const estudiantesData = await estudiantesRes.json();
      const gruposData = await gruposRes.json();

      setEstudiantes(estudiantesData.map((est: any) => ({ ...est, estado: 'registrado' })));
      setGrupos(gruposData);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      showToast('Error', 'No se pudieron cargar los datos', 'danger');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (title: string, message: string, type: string) => {
    setAlertMessage({ title, message, type });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGrupoChange = (grupoId: number) => {
    setFormData(prev => ({
      ...prev,
      grupos: [grupoId]
    }));
    setSelectedGrupoTemp(grupoId);
  };

  const handleConfirmGrupoSelection = () => {
    if (selectedGrupoTemp !== null) {
      setFormData(prev => ({ ...prev, grupos: [selectedGrupoTemp] }));
    } else {
      setFormData(prev => ({ ...prev, grupos: [] }));
    }
    setShowGrupoModal(false);
  };

  const validarEstudiante = (estudiante: Partial<FormData>): boolean => {
    if (!estudiante.nombre || !estudiante.apellido || !estudiante.documento_identidad || 
        !estudiante.correo_institucional || !estudiante.grupos || estudiante.grupos.length === 0) {
      return false;
    }
    if (!estudiante.correo_institucional.trim().includes('@iejavieralondonobarriosevilla.edu.co')) {
      return false;
    }
    if (!/^\d{8,10}$/.test(estudiante.documento_identidad)) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarEstudiante(formData)) {
      showToast('Error', 'Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar estudiante');
      }

      showToast('Éxito', 'Estudiante registrado correctamente', 'success');
      setFormData({
        nombre: '',
        apellido: '',
        documento_identidad: '',
        correo_institucional: '',
        grupos: []
      });
      fetchData();

    } catch (error: any) {
      console.error('Error al registrar estudiante:', error);
      showToast('Error', error.message || 'Ocurrió un error al registrar el estudiante', 'danger');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convertir los datos a formato de texto para el textarea
        const textData = jsonData.map((row: any) => {
          return `${row.Nombre},${row.Apellido},${row.Documento_Identidad},${row.Grado_Grupo},${row.Correo_Institucional}`;
        }).join('\n');

        setMasivoData(textData);
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        showToast('Error', 'Error al procesar el archivo. Asegúrese de que el formato sea correcto.', 'danger');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMasivoSubmit = async () => {
    if (!masivoData.trim()) {
      showToast('Error', 'Por favor ingrese datos para el registro masivo', 'danger');
      return;
    }

    setProcesando(true);
    setProgreso(0);
    
    try {
      let lineas = masivoData.split('\n').filter(line => line.trim());
      const estudiantesParaEnviar: Partial<FormData>[] = [];
      const totalLineas = lineas.length;

      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        let datos = linea.split(',').map(item => item.trim());
        
        if (datos.length !== 5) {
          datos = linea.split('\t').map(item => item.trim());
        }

        if (datos.length !== 5) {
          datos = linea.split(/\s+/).map(item => item.trim());
        }

        if (datos.length !== 5) {
          showToast('Advertencia', `Línea ${i + 1} tiene un formato incorrecto: ${linea}`, 'warning');
          continue;
        }

        let [nombre, apellido, documento_identidad, grado_grupo, correo_institucional] = datos;
        
        // Buscar el ID del grupo basado en el nombre
        const grupoEncontrado = grupos.find(g => g.nombre === grado_grupo);
        if (!grupoEncontrado) {
          showToast('Advertencia', `Grupo no encontrado: ${grado_grupo}`, 'warning');
          continue;
        }

        const estudiante: Partial<FormData> = {
          nombre,
          apellido,
          documento_identidad,
          correo_institucional,
          grupos: [grupoEncontrado.id]
        };

        if (validarEstudiante(estudiante)) {
          estudiantesParaEnviar.push(estudiante);
        } else {
          showToast('Advertencia', `Línea ${i + 1} inválida o incompleta: ${linea}`, 'warning');
        }

        setProgreso(((i + 1) / totalLineas) * 100);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (estudiantesParaEnviar.length === 0) {
        showToast('Error', 'No se encontraron estudiantes válidos para registrar', 'danger');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/masivo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estudiantes: estudiantesParaEnviar }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al realizar el registro masivo');
      }

      const exitosos = data.resultados.exitosos.length;
      const errores = data.resultados.errores.length;

      showToast(
        'Proceso completado',
        `Se registraron ${exitosos} estudiantes. ${errores} con errores.`,
        exitosos > 0 ? 'success' : 'danger'
      );
      setMasivoData('');
      fetchData();

    } catch (error: any) {
      console.error('Error en registro masivo:', error);
      showToast('Error', error.message || 'Ocurrió un error al procesar los datos', 'danger');
    } finally {
      setProcesando(false);
    }
  };

  const handleDelete = async (id: number) => {
    const estudianteAEliminar = estudiantes.find(e => e.id === id);
    if (!estudianteAEliminar) return;

    setEstudianteToDelete(estudianteAEliminar);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!estudianteToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${estudianteToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar estudiante');
      }

      showToast(
        'Estudiante eliminado',
        `${estudianteToDelete.nombre} ${estudianteToDelete.apellido} ha sido eliminado`,
        'info'
      );
      fetchData();

    } catch (error: any) {
      console.error('Error al eliminar estudiante:', error);
      showToast('Error', error.message || 'Ocurrió un error al eliminar el estudiante', 'danger');
    } finally {
      setShowDeleteModal(false);
      setEstudianteToDelete(null);
    }
  };

  const exportarCredenciales = () => {
    const credenciales = estudiantes
      .filter(e => e.estado === 'registrado')
      .map(est => 
        `${est.nombre} ${est.apellido},${est.correo_institucional},${est.documento_identidad}`
      ).join('\n');
    
    if (credenciales.trim() === '') {
      showToast('Información', 'No hay credenciales para exportar.', 'info');
      return;
    }
    
    navigator.clipboard.writeText(credenciales);
    showToast('Éxito', 'Credenciales copiadas al portapapeles', 'success');
  };

  const downloadTemplate = () => {
    // Datos de ejemplo
    const data = [
      {
        Nombre: 'Juan David',
        Apellido: 'Guarin Romero',
        Documento_Identidad: '123456789',
        Grado_Grupo: '6-1',
        Correo_Institucional: 'juanguarinr@iejavieralondonobarriosevilla.edu.co'
      },
      {
        Nombre: 'María José',
        Apellido: 'Rodríguez López',
        Documento_Identidad: '987654321',
        Grado_Grupo: '7-2',
        Correo_Institucional: 'mariarodriguezl@iejavieralondonobarriosevilla.edu.co'
      }
    ];

    // Crear una nueva hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);

    // Crear un nuevo libro
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");

    // Generar el archivo Excel
    XLSX.writeFile(wb, "plantilla_registro_estudiantes.xlsx");
  };

  const downloadCsvTemplate = () => {
    const template = '\uFEFFNombre,Apellido,Documento_Identidad,Grado_Grupo,Correo_Institucional\nJuan David,Guarin Romero,123456789,\'6-1\',juanguarinr@iejavieralondonobarriosevilla.edu.co\nMaría José,Rodríguez López,987654321,\'7-2\',mariarodriguezl@iejavieralondonobarriosevilla.edu.co';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_registro_estudiantes.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleEdit = (estudiante: Estudiante) => {
    setEditingEstudiante(estudiante);
    setEditFormData({
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      documento_identidad: estudiante.documento_identidad,
      correo_institucional: estudiante.correo_institucional,
      grupos: estudiante.grupos.map(g => g.id)
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditGrupoChange = (grupoId: number) => {
    setEditFormData(prev => ({
      ...prev,
      grupos: [grupoId]
    }));
    setSelectedEditGrupoTemp(grupoId);
  };

  const handleConfirmEditGrupoSelection = () => {
    if (selectedEditGrupoTemp !== null) {
      setEditFormData(prev => ({ ...prev, grupos: [selectedEditGrupoTemp] }));
    } else {
      setEditFormData(prev => ({ ...prev, grupos: [] }));
    }
    setShowEditGrupoModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarEstudiante(editFormData)) {
      showToast('Error', 'Por favor complete todos los campos correctamente', 'danger');
      return;
    }

    if (!editingEstudiante) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${editingEstudiante.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar estudiante');
      }

      showToast('Éxito', 'Estudiante actualizado correctamente', 'success');
      setShowEditModal(false);
      setEditingEstudiante(null);
      fetchData();

    } catch (error: any) {
      console.error('Error al actualizar estudiante:', error);
      showToast('Error', error.message || 'Ocurrió un error al actualizar el estudiante', 'danger');
    }
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingEstudiante(null);
    setEditFormData({
      nombre: '',
      apellido: '',
      documento_identidad: '',
      correo_institucional: '',
      grupos: []
    });
  };

  // Función para filtrar estudiantes
  const filteredEstudiantes = estudiantes.filter(estudiante => {
    const searchLower = searchTerm.toLowerCase();
    return (
      estudiante.nombre.toLowerCase().includes(searchLower) ||
      estudiante.apellido.toLowerCase().includes(searchLower) ||
      estudiante.documento_identidad.includes(searchTerm) ||
      estudiante.correo_institucional.toLowerCase().includes(searchLower) ||
      `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase().includes(searchLower)
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
    <div className="registro-estudiantes">
      <SimpleNavbar />
      {showAlert && (
        <div className={`alert alert-${alertMessage.type} alert-dismissible fade show`} role="alert">
          <strong>{alertMessage.title}</strong> {alertMessage.message}
          <button type="button" className="btn-close" onClick={() => setShowAlert(false)}></button>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Registro de Estudiantes</h2>
          <div className="d-flex gap-2">
            <Link to="/registro-profesores" className="btn btn-light">
              <i className="bi bi-person-badge me-2"></i>
              Ir a Registro de Profesores
            </Link>
            <button onClick={handleLogout} className="btn btn-outline-light">
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <ul className="nav nav-tabs mb-4" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'individual' ? 'active' : ''}`}
              id="individual-tab"
              data-bs-toggle="tab"
              data-bs-target="#individual"
              type="button"
              role="tab"
              onClick={() => setActiveTab('individual')}
            >
              Registro Individual
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'masivo' ? 'active' : ''}`}
              id="masivo-tab"
              data-bs-toggle="tab"
              data-bs-target="#masivo"
              type="button"
              role="tab"
              onClick={() => setActiveTab('masivo')}
            >
              Registro Masivo
            </button>
          </li>
        </ul>

        <div className="tab-content" id="myTabContent">
          <div className={`tab-pane fade ${activeTab === 'individual' ? 'show active' : ''}`} id="individual" role="tabpanel">
            <div className="card">
              <div className="card-header">
                <h5 className="text-white card-title mb-0">Nuevo Estudiante</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input
                          type="text"
                          className="form-control"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          placeholder="Nombre del estudiante"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Apellido</label>
                        <input
                          type="text"
                          className="form-control"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleInputChange}
                          placeholder="Apellido del estudiante"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Documento de Identidad</label>
                        <input
                          type="text"
                          className="form-control"
                          name="documento_identidad"
                          value={formData.documento_identidad}
                          onChange={handleInputChange}
                          placeholder="Número de documento"
                          pattern="[0-9]{8,10}"
                          title="El documento debe tener entre 8 y 10 dígitos"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Grado y Grupo</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={formData.grupos.length > 0 ? grupos.find(g => g.id === formData.grupos[0])?.nombre || '' : ''}
                            placeholder="Seleccione un grupo"
                            readOnly
                            required
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => {
                              setShowGrupoModal(true);
                              setSelectedGrupoTemp(formData.grupos.length > 0 ? formData.grupos[0] : null);
                            }}
                          >
                            Seleccionar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Correo Institucional</label>
                        <input
                          type="email"
                          className="form-control"
                          name="correo_institucional"
                          value={formData.correo_institucional}
                          onChange={handleInputChange}
                          placeholder="ejemplo@iejavieralondonobarriosevilla.edu.co"
                          pattern="[a-zA-Z0-9._%+-]+@iejavieralondonobarriosevilla\.edu\.co"
                          title="Debe ser un correo institucional válido"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <button type="submit" className="btn btn-primary w-100" disabled={formData.grupos.length === 0}>
                        <FaPlus className="me-2" />
                        Registrar Estudiante
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className={`tab-pane fade ${activeTab === 'masivo' ? 'show active' : ''}`} id="masivo" role="tabpanel">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0 text-white">Registro Masivo</h5>
<p className="text-white mt-2 small">
  Elija una de las siguientes opciones para registrar estudiantes:
  <br />
  Formatos aceptados: (las columnas deben estar en el siguiente orden)
  <br />
  - Excel/CSV: Nombre | Apellido | Documento_Identidad | Grado_Grupo | Correo_Institucional
  <br />
  - Lista: nombre,apellido,documento_identidad,grado_grupo,correo_institucional
  <br />
  Ejemplo: Juan David,Guarin Romero,123456789,6-1,juanguarinr@iejavieralondonobarriosevilla.edu.co
</p>

              </div>
              <div className="card-body">
                <div className="d-flex gap-3 mb-3">
                  <button
                    className="btn btn-primary flex-grow-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaDownload className="me-2" />
                    Subir Archivo Excel/CSV
                  </button>
                  <button
                    className="btn btn-success flex-grow-1"
                    onClick={downloadTemplate}
                  >
                    <FaDownload className="me-2" />
                    Descargar Plantilla Excel
                  </button>
                  <button
                    className="btn btn-info flex-grow-1"
                    onClick={downloadCsvTemplate}
                  >
                    <FaDownload className="me-2" />
                    Descargar Plantilla CSV
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="d-none"
                />

                <div className="form-group mb-3">
                  <textarea
                    className="form-control"
                    value={masivoData}
                    onChange={(e) => setMasivoData(e.target.value)}
                    placeholder="Pegue aquí los datos de los estudiantes (desde Excel o lista)"
                    rows={10}
                  />
                </div>

                {procesando && (
                  <div className="mb-3">
                    <div className="progress">
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ width: `${progreso}%` }}
                      >
                        {Math.round(progreso)}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-3">
                  <button
                    className="btn btn-primary flex-grow-1"
                    onClick={handleMasivoSubmit}
                    disabled={procesando}
                  >
                    <FaPlus className="me-2" />
                    {procesando ? 'Procesando...' : 'Registrar Estudiantes'}
                  </button>
                  <button
                    className="btn btn-secondary flex-grow-1"
                    onClick={() => setMasivoData('')}
                    disabled={procesando}
                  >
                    <FaRedo className="me-2" />
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {estudiantes.length > 0 && (
          <div className="card mt-4">
            <div className="card-header bg-white text-dark d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                Estudiantes Registrados ({filteredEstudiantes.filter(e => e.estado === 'registrado').length})
              </h5>
              <div className="d-flex gap-2">
                {!showSearch ? (
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowSearch(true)}
                    title="Buscar estudiantes"
                  >
                    <i className="bi bi-search"></i>
                  </button>
                ) : (
                  <div className="input-group" style={{ width: '300px' }}>
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por nombre, documento o correo..."
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
                <button
                  className="btn btn-success"
                  onClick={exportarCredenciales}
                >
                  <FaCopy className="me-2" />
                  Exportar Credenciales
                </button>
                <button
                  className="btn btn-primary"
                  onClick={downloadTemplate}
                >
                  <FaDownload className="me-2" />
                  Descargar Plantilla
                </button>
              </div>
            </div>
            <div className="card-body">
              {searchTerm && filteredEstudiantes.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-2">No se encontraron estudiantes que coincidan con "{searchTerm}"</p>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : showSearch && !searchTerm ? (
                <div className="text-center py-4">
                  <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-2">Busca estudiantes en la barra de búsqueda</p>
                  <p className="text-muted small">Puedes buscar por:</p>
                  <ul className="text-muted small text-start d-inline-block">
                    <li>Nombre completo o parcial</li>
                    <li>Número de documento de identidad</li>
                    <li>Correo institucional</li>
                    <li>Grado y grupo</li>
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
              ) : showSearch && !searchTerm ? (
                <div className="text-center py-4">
                  <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-2">Busca estudiantes en la barra de búsqueda</p>
                  <p className="text-muted small">Puedes buscar por:</p>
                  <ul className="text-muted small text-start d-inline-block">
                    <li>Nombre completo o parcial</li>
                    <li>Número de documento de identidad</li>
                    <li>Correo institucional</li>
                    <li>Grado y grupo</li>
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
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Documento de Identidad</th>
                        <th>Grupos</th>
                        <th>Correo Institucional</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEstudiantes.map((estudiante) => (
                        <tr key={estudiante.id}>
                          <td>{`${estudiante.nombre} ${estudiante.apellido}`}</td>
                          <td>{estudiante.documento_identidad}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {estudiante.grupos?.map((g) => (
                                <span key={g.id} className="badge bg-info">{g.nombre}</span>
                              ))}
                            </div>
                          </td>
                          <td>{estudiante.correo_institucional}</td>
                          <td>
                            <span className={`badge bg-${estudiante.estado === 'registrado' ? 'success' : estudiante.estado === 'error' ? 'danger' : 'warning'}`}>
                              {estudiante.estado}
                            </span>
                            <div className="btn-group ms-2" role="group">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEdit(estudiante)}
                                title="Editar estudiante"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(estudiante.id)}
                                title="Eliminar estudiante"
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
           id="deleteModal" 
           tabIndex={-1} 
           aria-labelledby="deleteModalLabel" 
           aria-hidden={!showDeleteModal}
           style={{ display: showDeleteModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title" id="deleteModalLabel">
                <FaExclamationTriangle className="me-2" />
                Confirmar Eliminación
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setEstudianteToDelete(null);
                }}
                aria-label="Close">
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                ¿Está seguro que desea eliminar al estudiante <strong>{estudianteToDelete?.nombre} {estudianteToDelete?.apellido}</strong>?
              </p>
              <p className="text-danger mt-2">
                <small>Esta acción no se puede deshacer.</small>
              </p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setEstudianteToDelete(null);
                }}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={confirmDelete}>
                <FaTrash className="me-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && (
        <div className="modal-backdrop fade show"></div>
      )}

      {/* Modal para selección de Grupos (estilo mejorado) */}
      <div className={`modal fade ${showGrupoModal ? 'show' : ''}`} 
           id="grupoModal" 
           tabIndex={-1} 
           aria-labelledby="grupoModalLabel" 
           aria-hidden={!showGrupoModal}
           style={{ display: showGrupoModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title" id="grupoModalLabel">
                <FaUsers className="me-2" />
                Seleccionar Grado y Grupo
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowGrupoModal(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {grupos.length === 0 ? (
                <p className="text-center text-muted">No hay grupos disponibles.</p>
              ) : (
                <div className="list-group">
                  {[...grupos]
                    .sort(compararGrupos)
                    .map(grupo => (
                      <button
                        key={grupo.id}
                        type="button"
                        className={`list-group-item list-group-item-action ${selectedGrupoTemp === grupo.id ? 'active' : ''}`}
                        onClick={() => setSelectedGrupoTemp(grupo.id)}
                      >
                        {grupo.nombre}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowGrupoModal(false)}>Cancelar</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmGrupoSelection}
                disabled={selectedGrupoTemp === null}
              >
                <FaCheck className="me-2" />
                Confirmar Selección
              </button>
            </div>
          </div>
        </div>
      </div>
      {showGrupoModal && (
        <div className="modal-backdrop fade show"></div>
      )}

      {/* Modal de Edición de Estudiante */}
      <div className={`modal fade ${showEditModal ? 'show' : ''}`} 
           id="editModal" 
           tabIndex={-1} 
           aria-labelledby="editModalLabel" 
           aria-hidden={!showEditModal}
           style={{ display: showEditModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title" id="editModalLabel">
                <FaEdit className="me-2" />
                Editar Estudiante
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={cancelEdit}
                aria-label="Close">
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre"
                        value={editFormData.nombre}
                        onChange={handleEditInputChange}
                        placeholder="Nombre del estudiante"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Apellido</label>
                      <input
                        type="text"
                        className="form-control"
                        name="apellido"
                        value={editFormData.apellido}
                        onChange={handleEditInputChange}
                        placeholder="Apellido del estudiante"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Documento de Identidad</label>
                      <input
                        type="text"
                        className="form-control"
                        name="documento_identidad"
                        value={editFormData.documento_identidad}
                        onChange={handleEditInputChange}
                        placeholder="Número de documento"
                        pattern="[0-9]{8,10}"
                        title="El documento debe tener entre 8 y 10 dígitos"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Grado y Grupo</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={editFormData.grupos.length > 0 ? grupos.find(g => g.id === editFormData.grupos[0])?.nombre || '' : ''}
                          placeholder="Seleccione un grupo"
                          readOnly
                          required
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => {
                            setShowEditGrupoModal(true);
                            setSelectedEditGrupoTemp(editFormData.grupos.length > 0 ? editFormData.grupos[0] : null);
                          }}
                        >
                          Seleccionar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group">
                      <label className="form-label">Correo Institucional</label>
                      <input
                        type="email"
                        className="form-control"
                        name="correo_institucional"
                        value={editFormData.correo_institucional}
                        onChange={handleEditInputChange}
                        placeholder="ejemplo@iejavieralondonobarriosevilla.edu.co"
                        pattern="[a-zA-Z0-9._%+-]+@iejavieralondonobarriosevilla\.edu\.co"
                        title="Debe ser un correo institucional válido"
                        required
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={cancelEdit}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleEditSubmit}
                disabled={editFormData.grupos.length === 0}>
                <FaEdit className="me-2" />
                Actualizar Estudiante
              </button>
            </div>
          </div>
        </div>
      </div>
      {showEditModal && (
        <div className="modal-backdrop fade show"></div>
      )}

      {/* Modal para selección de Grupos en Edición */}
      <div className={`modal fade ${showEditGrupoModal ? 'show' : ''}`} 
           id="editGrupoModal" 
           tabIndex={-1} 
           aria-labelledby="editGrupoModalLabel" 
           aria-hidden={!showEditGrupoModal}
           style={{ display: showEditGrupoModal ? 'block' : 'none' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title" id="editGrupoModalLabel">
                <FaUsers className="me-2" />
                Seleccionar Grado y Grupo
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditGrupoModal(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {grupos.length === 0 ? (
                <p className="text-center text-muted">No hay grupos disponibles.</p>
              ) : (
                <div className="list-group">
                  {[...grupos]
                    .sort(compararGrupos)
                    .map(grupo => (
                      <button
                        key={grupo.id}
                        type="button"
                        className={`list-group-item list-group-item-action ${selectedEditGrupoTemp === grupo.id ? 'active' : ''}`}
                        onClick={() => setSelectedEditGrupoTemp(grupo.id)}
                      >
                        {grupo.nombre}
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditGrupoModal(false)}>Cancelar</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmEditGrupoSelection}
                disabled={selectedEditGrupoTemp === null}
              >
                <FaCheck className="me-2" />
                Confirmar Selección
              </button>
            </div>
          </div>
        </div>
      </div>
      {showEditGrupoModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

export default RegistroEstudiantes; 