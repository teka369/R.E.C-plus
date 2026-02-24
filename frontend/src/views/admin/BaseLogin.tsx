import React, { useState } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaUserCircle, FaUserGraduate, FaChalkboardTeacher, FaUserTie } from 'react-icons/fa';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: 'estudiante' | 'profesor' | 'administrativo';
  estado: 'activo' | 'inactivo';
  fechaRegistro: string;
}

const Usuarios: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('todos');

  const usuarios: Usuario[] = [
    { id: 1001, nombre: 'Juan David Pérez', email: 'jdperez@gmail.com', telefono: '3601234567', rol: 'estudiante', estado: 'activo', fechaRegistro: '15/01/2024' },
    { id: 1002, nombre: 'Estefania Diaz Gómez', email: 'ediaz@mail.com', telefono: '3602345678', rol: 'estudiante', estado: 'activo', fechaRegistro: '20/01/2024' },
    { id: 1003, nombre: 'Carlos Munera Rodríguez', email: 'cmunera@gmail.com', telefono: '5261234567', rol: 'profesor', estado: 'activo', fechaRegistro: '10/12/2023' },
    { id: 1004, nombre: 'Jefferson Martínez', email: 'jmartinez@gmail.com', telefono: '5765678901', rol: 'profesor', estado: 'activo', fechaRegistro: '05/01/2024' },
    { id: 1005, nombre: 'Esteban Ramírez', email: 'eramirez@gmail.com', telefono: '3211234567', rol: 'estudiante', estado: 'inactivo', fechaRegistro: '25/01/2024' },
    { id: 1006, nombre: 'María Fernanda López', email: 'mflopez@gmail.com', telefono: '3473456789', rol: 'administrativo', estado: 'activo', fechaRegistro: '12/12/2023' },
    { id: 1007, nombre: 'Andrea Sánchez', email: 'asanchez@gmail.com', telefono: '3105678901', rol: 'profesor', estado: 'activo', fechaRegistro: '18/01/2024' },
    { id: 1008, nombre: 'Roberto González', email: 'rgonzalez@gmail.com', telefono: '3209876543', rol: 'estudiante', estado: 'activo', fechaRegistro: '22/01/2024' },
    { id: 1009, nombre: 'Camila Torres', email: 'ctorres@gmail.com', telefono: '3158765432', rol: 'administrativo', estado: 'inactivo', fechaRegistro: '05/02/2024' },
  ];

  // Filtrar usuarios según búsqueda y filtro de rol
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          usuario.id.toString().includes(searchTerm);
    
    const matchesRol = filterRol === 'todos' || usuario.rol === filterRol;
    
    return matchesSearch && matchesRol;
  });

  // Función para obtener el icono según el rol
  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'estudiante':
        return <FaUserGraduate className="me-1" />;
      case 'profesor':
        return <FaChalkboardTeacher className="me-1" />;
      case 'administrativo':
        return <FaUserTie className="me-1" />;
      default:
        return <FaUserCircle className="me-1" />;
    }
  };

  // Función para obtener el color del badge según el rol
  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'estudiante':
        return 'primary';
      case 'profesor':
        return 'success';
      case 'administrativo':
        return 'info';
      default:
        return 'secondary';
    }
  };

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    return estado === 'activo' ? 'success' : 'danger';
  };

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Gestión de Usuarios</h2>
          <Link to="/agregar-usuario">
            <Button variant="danger">Agregar Usuario</Button>
          </Link>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded shadow-sm p-3 mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nombre, email o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select 
                  value={filterRol}
                  onChange={(e) => setFilterRol(e.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="estudiante">Estudiantes</option>
                  <option value="profesor">Profesores</option>
                  <option value="administrativo">Administrativos</option>
                </Form.Select>
              </InputGroup>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <Table bordered hover responsive className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((usuario, index) => (
                  <tr key={index}>
                    <td>{usuario.id}</td>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.telefono}</td>
                    <td>
                      <Badge bg={getRolBadgeColor(usuario.rol)} className="text-white">
                        {getRolIcon(usuario.rol)} {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getEstadoBadgeColor(usuario.estado)} className="text-white">
                        {usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}
                      </Badge>
                    </td>
                    <td>{usuario.fechaRegistro}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Link to={`/editar-usuario/${usuario.id}`}>
                          <Button 
                            variant="warning" 
                            size="sm"
                            className="text-white"
                          >
                            Editar
                          </Button>
                        </Link>
                        <Button 
                          variant="danger" 
                          size="sm"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No se encontraron usuarios con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        
        {/* Resumen de usuarios */}
        <div className="row mt-4 g-3">
          <div className="col-md-3">
            <div className="bg-white rounded shadow-sm p-3 text-center">
              <h4 className="mb-0">{usuarios.length}</h4>
              <p className="text-muted mb-0">Total de usuarios</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="bg-white rounded shadow-sm p-3 text-center">
              <h4 className="mb-0">{usuarios.filter(u => u.rol === 'estudiante').length}</h4>
              <p className="text-muted mb-0">Estudiantes</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="bg-white rounded shadow-sm p-3 text-center">
              <h4 className="mb-0">{usuarios.filter(u => u.rol === 'profesor').length}</h4>
              <p className="text-muted mb-0">Profesores</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="bg-white rounded shadow-sm p-3 text-center">
              <h4 className="mb-0">{usuarios.filter(u => u.estado === 'activo').length}</h4>
              <p className="text-muted mb-0">Usuarios activos</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Usuarios;