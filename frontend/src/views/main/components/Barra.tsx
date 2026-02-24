import React, { useState, useEffect } from 'react';
import '../../../assets/main/styles/Sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import WalkingCharacter from '../../../components/WalkingCharacter';
import { useRecuperacion } from '../../../contexts/RecuperacionContext';
import { useAuth } from '../../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAccordionOpen, setAccordionOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { token, user, role, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [userInitial, setUserInitial] = useState('');
  const [userRole, setUserRole] = useState<string | null>(role || null);
  const [userFirstName, setUserFirstName] = useState('');
  const location = useLocation();
  const [hoverIndex, setHoverIndex] = useState<string | null>(null);
  
  // Usar el contexto global de recuperaciones
  const { recuperacionConfig, tiempoRestante, periodoActivo } = useRecuperacion();

  // Verificar si el usuario está autenticado al cargar el componente
  useEffect(() => {
    setIsAuthenticated(!!token);
    const composedName = user?.nombre && user?.apellido ? `${user.nombre} ${user.apellido}` : (user?.nombre || user?.apellido || '');
    if (composedName) {
      setUserInitial(composedName.charAt(0).toUpperCase());
      const firstName = composedName.split(' ')[0];
      setUserFirstName(firstName);
    } else {
      setUserInitial('');
      setUserFirstName('');
    }
    setUserRole(role || null);
  }, [token, user, role]);

  // Cerrar el sidebar cuando se cambia de ruta
  useEffect(() => {
    setSidebarOpen(false);
    document.body.style.overflow = '';
  }, [location]);

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-nav')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openNavbar = () => {
    setSidebarOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeNavbar = () => {
    setSidebarOpen(false);
    document.body.style.overflow = '';
  };

  const toggleAccordion = () => {
    setAccordionOpen(!isAccordionOpen);
  };

  const toggleDropdown = (dropdownName: string) => {
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdownName);
    }
  };

  // Función para manejar el cierre de sesión
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setIsAuthenticated(false);
    setUserInitial('');
    setUserRole(null);
    setUserFirstName('');
    window.location.href = '/';
  };

  // Función para verificar si una ruta está activa
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Botón Hamburguesa (solo visible en móviles) */}
      <button
        id="openMenu"
        className="hamburger-btn"
        onClick={openNavbar}
        aria-label="Abrir menú"
        aria-expanded={isSidebarOpen}
        data-tooltip="Abrir menú"
      >
        <div className="relative-container">
          <i className="bi bi-list hamburger-icon"></i>
          <div className="brightness-effect"></div>
          <div className="pulse-effect"></div>
        </div>
      </button>

      {/* Navbar horizontal para PC */}
      <nav className="navbar-horizontal" role="navigation" aria-label="Navegación principal">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/Principal" className="navbar-logo" aria-label="Ir a inicio">
            <img src="/image.png" alt="Logo R.E.C" className="logo-img" />
            <span className="logo-text">R.E.C</span>
          </Link>
          {/* Temporizador de recuperaciones */}
          {periodoActivo && tiempoRestante && (
            <div className="recuperacion-timer bg-info text-white px-3 py-1 rounded shadow-sm mx-3" style={{fontWeight: 'bold', fontSize: '1rem'}}>
              Recuperaciones activas: <span>{tiempoRestante}</span>
            </div>
          )}
          {/* Menú de opciones horizontal */}
          <ul className="navbar-menu" role="menubar">
            {[
              {
                to: "/Principal",
                icon: "bi-house-door me-1",
                label: "Inicio",
                show: true
              },
              ...(isAuthenticated ? [
                {
                  dropdown: true,
                  name: "academico",
                  icon: "bi-book me-1",
                  label: "Académico",
                  show: true
                },
                {
                  to: "/Observaciones",
                  icon: "bi-search me-1",
                  label: "Feedback",
                  show: true
                }
              ] : []),
              {
                to: "/Reportes",
                icon: "bi-trophy me-1",
                label: "Ligas",
                show: true
              },
              {
                dropdown: true,
                name: "mas",
                icon: "bi-collection me-1",
                label: "Más",
                show: true
              }
            ].map((item, idx) => (
              item.show ? (
                item.dropdown ? (
                  <li
                    key={item.name}
                    className="menu-item-container dropdown-nav"
                    role="none"
                    onMouseEnter={() => setHoverIndex(`dropdown-${idx}`)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <WalkingCharacter width={160} height={160} visible={hoverIndex === `dropdown-${idx}`} />
                    <button
                      className={`menu-item dropdown-toggle ${activeDropdown === item.name ? 'active' : ''}`}
                      onClick={() => toggleDropdown(item.name)}
                      role="menuitem"
                      aria-haspopup="true"
                      aria-expanded={activeDropdown === item.name}
                      data-tooltip={`Ver opciones de ${item.label.toLowerCase()}`}
                    >
                      <i className={`bi ${item.icon}`} aria-hidden="true"></i>{item.label}
                    </button>
                    {item.name === "academico" && (
                      <ul className={`submenu ${activeDropdown === item.name ? 'show' : ''}`} role="menu" aria-label="Submenú académico">
                        <li role="none" onMouseEnter={() => setHoverIndex('academico-1')} onMouseLeave={() => setHoverIndex(null)}>
                          <WalkingCharacter width={160} height={160} visible={hoverIndex === 'academico-1'} />
                          <Link to="/Material" className={`submenu-item ${isActiveRoute('/Material') ? 'active' : ''}`} role="menuitem" data-tooltip="Ver material">
                            <i className="bi bi-file-earmark me-1" aria-hidden="true"></i>Material
                          </Link>
                        </li>
                        <li role="none" onMouseEnter={() => setHoverIndex('academico-2')} onMouseLeave={() => setHoverIndex(null)}>
                          <WalkingCharacter width={160} height={160} visible={hoverIndex === 'academico-2'} />
                          <Link to="/Temarios" className={`submenu-item ${isActiveRoute('/Temarios') ? 'active' : ''}`} role="menuitem" data-tooltip="Ver temarios">
                            <i className="bi bi-card-list me-1" aria-hidden="true"></i>Temarios
                          </Link>
                        </li>
                        <li role="none" onMouseEnter={() => setHoverIndex('academico-3')} onMouseLeave={() => setHoverIndex(null)}>
                          <WalkingCharacter width={160} height={160} visible={hoverIndex === 'academico-3'} />
                          <Link to="/Horario" className={`submenu-item ${isActiveRoute('/Horario') ? 'active' : ''}`} role="menuitem" data-tooltip="Ver horario">
                            <i className="bi bi-calendar me-1" aria-hidden="true"></i>Horario
                          </Link>
                        </li>
                        <li role="none" onMouseEnter={() => setHoverIndex('academico-4')} onMouseLeave={() => setHoverIndex(null)}>
                          <WalkingCharacter width={160} height={160} visible={hoverIndex === 'academico-4'} />
                          {periodoActivo ? (
                            <Link to="/Recuperaciones" className={`submenu-item ${isActiveRoute('/Recuperaciones') ? 'active' : ''}`} role="menuitem" data-tooltip="Sistema de recuperaciones">
                              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Recuperaciones
                            </Link>
                          ) : (
                            <span className="submenu-item disabled text-muted" style={{cursor: 'not-allowed', background: '#e0e0e0'}} title="Fuera de periodo de recuperaciones">
                              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Recuperaciones (deshabilitado)
                            </span>
                          )}
                        </li>
                      </ul>
                    )}
                    {item.name === "mas" && (
                      <ul className={`submenu ${activeDropdown === item.name ? 'show' : ''}`} role="menu" aria-label="Submenú más opciones">
                        <li role="none" onMouseEnter={() => setHoverIndex('mas-1')} onMouseLeave={() => setHoverIndex(null)}>
                          <WalkingCharacter width={160} height={160} visible={hoverIndex === 'mas-1'} />
                          <Link to="/Portafolio" className={`submenu-item ${isActiveRoute('/Portafolio') ? 'active' : ''}`} role="menuitem" data-tooltip="Ver portafolio" onClick={() => setActiveDropdown(null)}>
                            <i className="bi bi-folder me-1" aria-hidden="true"></i>Portafolio
                          </Link>
                        </li>
                        <li role="none" onMouseEnter={() => setHoverIndex('mas-2')} onMouseLeave={() => setHoverIndex(null)}>
                          <WalkingCharacter width={160} height={160} visible={hoverIndex === 'mas-2'} />
                          <Link to="/Certificados" className={`submenu-item ${isActiveRoute('/Certificados') ? 'active' : ''}`} role="menuitem" data-tooltip="Ver certificados" onClick={() => setActiveDropdown(null)}>
                            <i className="bi bi-award me-1" aria-hidden="true"></i>Certificados
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                ) : (
                  item.to ? (
                    <li
                      key={item.to}
                      className="menu-item-container"
                      role="none"
                      onMouseEnter={() => setHoverIndex(`main-${idx}`)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <WalkingCharacter width={160} height={160} visible={hoverIndex === `main-${idx}`} />
                      <Link
                        to={item.to}
                        className={`menu-item ${isActiveRoute(item.to) ? 'active' : ''}`}
                        role="menuitem"
                        data-tooltip={`Ir a ${item.label.toLowerCase()}`}
                      >
                        <i className={`bi ${item.icon}`} aria-hidden="true"></i>{item.label}
                      </Link>
                    </li>
                  ) : null
                )
              ) : null
            ))}
          </ul>
          
          {/* Perfil de usuario - Solo visible si está autenticado */}
          {isAuthenticated ? (
            <div className="navbar-profile">
              <div className="dropdown">
                <button 
                  className="dropdown-toggle profile-btn" 
                  type="button"
                  aria-label="Menú de perfil"
                  data-tooltip="Ver perfil"
                >
                  <div className="profile-initial">{userInitial}</div>
                  <div className="profile-info">
                    <span className="profile-name">{userFirstName}</span>
                    <span className="profile-role">
                      ({userRole === 'profesor' ? 'Profesor' : userRole === 'estudiante' ? 'Estudiante' : userRole === 'secretario' ? 'Secretario' : 'Usuario'})
                    </span>
                  </div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" role="menu" aria-label="Menú de perfil">
                  <li role="none">
                    <Link 
                      to={userRole === 'profesor' ? "/PerfilProfesor" : "/PerfilEstudiante"} 
                      className="dropdown-item"
                      role="menuitem"
                      data-tooltip="Ver perfil"
                    >
                      <i className="bi bi-person me-2" aria-hidden="true"></i>Perfil
                    </Link>
                  </li>
                  <li role="none">
                    <hr className="dropdown-divider" />
                  </li>
                  <li role="none">
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={handleLogout}
                      role="menuitem"
                      data-tooltip="Cerrar sesión"
                    >
                      <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : location.pathname !== '/Principal' && (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn" data-tooltip="Iniciar sesión">
                <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>Iniciar Sesión
              </Link>
              <Link to="/login-secretaria" className="auth-btn register-btn" data-tooltip="Acceso secretaría">
                <i className="bi bi-person-plus me-2" aria-hidden="true"></i>Acceso Secretaría
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar para móviles */}
      <nav 
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Menú móvil"
      >
        <div className="sidebar-content">
          {/* Encabezado */}
          <div className="sidebar-header">
            <div className="user-info">
              <div className="user-avatar" aria-hidden="true">
                {userInitial}
              </div>
              <div className="user-details">
                <span className="user-name">{localStorage.getItem('userName') || 'Usuario'}</span>
                <span className="user-role">
                  {userRole === 'profesor' ? 'Profesor' : userRole === 'estudiante' ? 'Estudiante' : 'Invitado'}
                </span>
              </div>
            </div>
            <button 
              className="close-btn" 
              onClick={closeNavbar}
              aria-label="Cerrar menú"
              data-tooltip="Cerrar menú"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>

          <nav className="sidebar-nav">
            <ul role="menu">
              <li role="none">
                <Link 
                  to="/Principal" 
                  className={`menu-item ${isActiveRoute('/Principal') ? 'active' : ''}`}
                  onClick={closeNavbar}
                  role="menuitem"
                  data-tooltip="Ir a inicio"
                >
                  <i className="bi bi-house-door" aria-hidden="true"></i>
                  <span>Inicio</span>
                </Link>
              </li>

              {/* Mostrar enlaces de registro solo para secretarios */}
              {localStorage.getItem('userRole') === 'secretario' && (
                <>
                  <li role="none">
                    <Link 
                      to="/registro-estudiantes" 
                      className={`menu-item ${isActiveRoute('/registro-estudiantes') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Registrar estudiantes"
                    >
                      <i className="bi bi-person-plus" aria-hidden="true"></i>
                      <span>Registro de Estudiantes</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/registro-profesores" 
                      className={`menu-item ${isActiveRoute('/registro-profesores') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Registrar profesores"
                    >
                      <i className="bi bi-person-badge" aria-hidden="true"></i>
                      <span>Registro de Profesores</span>
                    </Link>
                  </li>
                </>
              )}

              {/* Opciones visibles solo si está autenticado */}
              {isAuthenticated ? (
                <>
                  {/* Menú Académico */}
                  <li role="none">
                    <div className="menu-section">
                      <span className="menu-section-title">
                        <i className="bi bi-book" aria-hidden="true"></i>
                        Académico
                      </span>
                    </div>
                  </li>
                  <li role="none">
                    <Link 
                      to="/Material" 
                      className={`menu-item ${isActiveRoute('/Material') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Ver material"
                    >
                      <i className="bi bi-file-earmark" aria-hidden="true"></i>
                      <span>Material</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/Temarios" 
                      className={`menu-item ${isActiveRoute('/Temarios') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Ver temarios"
                    >
                      <i className="bi bi-card-list" aria-hidden="true"></i>
                      <span>Temarios</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/Horario" 
                      className={`menu-item ${isActiveRoute('/Horario') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Ver horario"
                    >
                      <i className="bi bi-calendar" aria-hidden="true"></i>
                      <span>Horario</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/Observaciones" 
                      className={`menu-item ${isActiveRoute('/Observaciones') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Ver observaciones"
                    >
                      <i className="bi bi-search" aria-hidden="true"></i>
                      <span>Feedback</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/Reportes" 
                      className={`menu-item ${isActiveRoute('/Reportes') ? 'active' : ''}`}
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Ver reportes"
                    >
                      <i className="bi bi-trophy" aria-hidden="true"></i>
                      <span>Ligas</span>
                    </Link>
                  </li>
                  <li role="none">
                    {periodoActivo ? (
                      <Link 
                        to="/Recuperaciones" 
                        className={`menu-item ${isActiveRoute('/Recuperaciones') ? 'active' : ''}`}
                        onClick={closeNavbar}
                        role="menuitem"
                        data-tooltip="Sistema de recuperaciones"
                      >
                        <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        <span>Recuperaciones</span>
                      </Link>
                    ) : (
                      <span className="menu-item disabled text-muted" style={{cursor: 'not-allowed', background: '#e0e0e0'}} title="Fuera de periodo de recuperaciones">
                        <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        <span>Recuperaciones (deshabilitado)</span>
                      </span>
                    )}
                  </li>
                </>
              ) : location.pathname !== '/Principal' && (
                <>
                  <li role="none">
                    <Link 
                      to="/login" 
                      className="menu-item"
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Iniciar sesión"
                    >
                      <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                      <span>Iniciar Sesión</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/login-secretaria" 
                      className="menu-item"
                      onClick={closeNavbar}
                      role="menuitem"
                      data-tooltip="Acceso secretaría"
                    >
                      <i className="bi bi-person-plus" aria-hidden="true"></i>
                      <span>Acceso Secretaría</span>
                    </Link>
                  </li>
                </>
              )}

              {/* Mostrar contacto solo si no está autenticado */}
              {!isAuthenticated && location.pathname !== '/Principal' && (
                <li role="none">
                  <Link 
                    to="/contacto" 
                    className={`menu-item ${isActiveRoute('/contacto') ? 'active' : ''}`}
                    onClick={closeNavbar}
                    role="menuitem"
                    data-tooltip="Contacto"
                  >
                    <i className="bi bi-envelope" aria-hidden="true"></i>
                    <span>Contacto</span>
                  </Link>
                </li>
              )}
            </ul>

            {/* Acordeón de Más Opciones - Visible siempre */}
            <div className="accordion-container">
              <button 
                className="accordion-button" 
                onClick={toggleAccordion}
                aria-expanded={isAccordionOpen}
                data-tooltip="Más opciones"
              >
                <span className="accordion-title">
                  <i className="bi bi-collection" aria-hidden="true"></i>
                  <span>Más Opciones</span>
                </span>
                <i 
                  className={`bi ${isAccordionOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                  aria-hidden="true"
                ></i>
              </button>
              <div 
                className={`accordion-content ${isAccordionOpen ? 'open' : ''}`}
                role="region"
                aria-label="Contenido del acordeón"
              >
                <ul role="menu">
                  <li role="none">
                    <Link 
                      to="/Portafolio" 
                      className={`menu-item ${isActiveRoute('/Portafolio') ? 'active' : ''}`} 
                      role="menuitem" 
                      data-tooltip="Ver portafolio"
                      onClick={() => {
                        setActiveDropdown(null);
                        closeNavbar();
                      }}
                    >
                      <i className="bi bi-folder" aria-hidden="true"></i>
                      <span>Portafolio</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/Certificados" 
                      className={`menu-item ${isActiveRoute('/Certificados') ? 'active' : ''}`} 
                      role="menuitem" 
                      data-tooltip="Ver certificados"
                      onClick={() => {
                        setActiveDropdown(null);
                        closeNavbar();
                      }}
                    >
                      <i className="bi bi-award" aria-hidden="true"></i>
                      <span>Certificados</span>
                    </Link>
                  </li>
                  {isAuthenticated && (
                    <li role="none">
                      <Link 
                        to={userRole === 'profesor' ? "/PerfilProfesor" : "/PerfilEstudiante"} 
                        className={`menu-item ${isActiveRoute('/PerfilProfesor') || isActiveRoute('/PerfilEstudiante') ? 'active' : ''}`} 
                        role="menuitem" 
                        data-tooltip="Ver perfil"
                        onClick={() => {
                          setActiveDropdown(null);
                          closeNavbar();
                        }}
                      >
                        <i className="bi bi-person" aria-hidden="true"></i>
                        <span>Mi Perfil</span>
                      </Link>
                    </li>
                  )}
                  <li role="none">
                    <Link 
                      to="/tutorial" 
                      className={`menu-item ${isActiveRoute('/tutorial') ? 'active' : ''}`} 
                      role="menuitem" 
                      data-tooltip="Ver tutorial"
                      onClick={() => {
                        setActiveDropdown(null);
                        closeNavbar();
                      }}
                    >
                      <i className="bi bi-question-circle" aria-hidden="true"></i>
                      <span>Tutorial</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link 
                      to="/contacto" 
                      className={`menu-item ${isActiveRoute('/contacto') ? 'active' : ''}`} 
                      role="menuitem" 
                      data-tooltip="Contacto"
                      onClick={() => {
                        setActiveDropdown(null);
                        closeNavbar();
                      }}
                    >
                      <i className="bi bi-envelope" aria-hidden="true"></i>
                      <span>Contacto</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </nav>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          id="overlay" 
          className="overlay" 
          onClick={closeNavbar}
          role="presentation"
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default Sidebar;