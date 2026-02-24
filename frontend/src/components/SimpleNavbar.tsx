import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/main/styles/Sidebar.css';

const SimpleNavbar: React.FC = () => {
  return (
    <nav className="navbar-horizontal" role="navigation" aria-label="Navegación principal">
      <div className="navbar-content">
        {/* Logo */}
        <Link to="#" className="navbar-logo" aria-label="secretaria">
          <img src="/image.png" alt="Logo R.E.C" className="logo-img" />
          <span className="logo-text">R.E.C</span>
        </Link>
        {/* Botón para ir al registro de secretarias */}
        <Link to="/registro-secretarias" className="btn btn-outline-danger ms-3" style={{marginLeft: '1rem'}}>
          Registro de Secretarias
        </Link>
        {/* Botón para ir a la configuración de recuperación */}
        <Link to="/configuracion-recuperacion" className="btn btn-outline-primary ms-3" style={{marginLeft: '1rem'}}>
          Configuración de Recuperación
        </Link>
      </div>
    </nav>
  );
};

export default SimpleNavbar; 