// Importa los componentes necesarios de react-router-dom para el manejo de rutas
import { BrowserRouter, Route, Routes, useLocation, Navigate } from 'react-router-dom'
// Importa StrictMode para ayudar a detectar problemas potenciales en la aplicación
import React, { StrictMode, Suspense } from 'react'
// Importa createRoot para renderizar la aplicación en el DOM
import { createRoot } from 'react-dom/client'

// Importa el componente de la barra lateral del layout principal
import Sidebar from './views/main/components/Barra'
// Importa el componente del pie de página del layout principal
import Footer from './views/main/components/Footer'

// Importa el contexto de recuperaciones para proveer datos globales relacionados
import { RecuperacionProvider } from './contexts/RecuperacionContext'
// Importa el contexto de notificaciones para mensajes modales estéticos
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Importa las páginas principales de la aplicación
import App from './views/main/Principal'
import Login from './views/main/Login'
import LoginSecretaria from './views/main/LoginSecretaria'
import ForgotPassword from './views/main/ForgotPassword'
import { NotFound } from './views/main/NotPages'
import MainContent from './views/main/Portafolio'
import Certificados from './views/main/Certificados'
const PerfilEstudiante = React.lazy(() => import('./views/admin/PerfilEstudiante'))
const PerfilProfesor = React.lazy(() => import('./views/admin/PerfilProfesor'))
const Horario = React.lazy(() => import('./views/admin/BaseHorario'))
const Material = React.lazy(() => import('./views/admin/BaseMaterial'))
const Observaciones = React.lazy(() => import('./views/admin/BaseObservaciones'))
const Reportes = React.lazy(() => import('./views/main/BaseReportes'))
const Temarios = React.lazy(() => import('./views/admin/BaseTemarios'))
import { Contacto } from './views/main/Contacto'
import RegistroEstudiantes from './views/admin/RegistroEstudiantes'
import RegistroProfesores from './views/admin/RegistroProfesores'
import Tutorial from './views/main/Tutorial'
import CambiarContrasena from './views/shared/CambiarContrasena'
import Informacion from './views/main/Informacion'
import GestionTareas from './views/admin/GestionAcademica'
import Recuperaciones from './views/main/Recuperaciones'
import HorarioRecuperacion from './views/main/HorarioRecuperacion';
import ConfiguracionRecuperacion from './views/main/ConfiguracionRecuperacion';

// Componente para proteger rutas según el rol del usuario
const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole: string }) => {
  const { token, role } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/Principal" replace />;
  }
  return children;
};

// Componente principal que controla el layout y las rutas
const AppLayout = () => {
  // Obtiene la ubicación actual de la ruta
  const location = useLocation();
  // Autenticación vía contexto
  const { role, token } = useAuth();
  const userRole = role;
  const isAuthenticated = !!token;
  // Determina si la página actual es de autenticación
  const isAuthPage = ['/login', '/login-secretaria', '/forgot-password'].includes(location.pathname);
  // Verifica si el usuario es secretaria
  const isSecretaria = userRole === 'secretario';

  // Si es secretaria y está autenticada, pero no está en una página de registro, redirige a registro de estudiantes
  const isRegistroPage = ['/registro-estudiantes', '/registro-profesores', '/configuracion-recuperacion'].includes(location.pathname);
  if (isSecretaria && isAuthenticated && !isAuthPage && !isRegistroPage) {
    return <Navigate to="/registro-estudiantes" replace />;
  }

  // Renderiza el layout principal con el proveedor de contexto y las rutas
  return (
    <NotificationProvider>
      <RecuperacionProvider>
        {/* Muestra la barra lateral si no está en una página de autenticación ni es secretaria */}
        {!isAuthPage && !isSecretaria && <Sidebar />}
        <Suspense fallback={<div style={{padding: '24px'}}>Cargando...</div>}>
        <Routes>
        {/* Rutas de Autenticación */}
        <Route path='/login' element={<Login />} />
        <Route path='/login-secretaria' element={<LoginSecretaria />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        
        {/* Rutas Principales */}
        <Route path='/' element={<Navigate to="/Principal" replace />} />
        <Route path='/Principal' element={<App />} />
        <Route path='/Portafolio' element={<MainContent />} />
        <Route path='/tutorial' element={<Tutorial />} />
        <Route path='/cambiar-contrasena' element={<CambiarContrasena/>}/>
        
        {/* Rutas de Perfiles */}
        <Route path='/PerfilEstudiante' element={
          <ProtectedRoute requiredRole={''}>
            <PerfilEstudiante />
          </ProtectedRoute>
        } />
        <Route path='/PerfilProfesor' element={
          <ProtectedRoute requiredRole={'profesor'}>
            <PerfilProfesor />
          </ProtectedRoute>
        } />
        
        {/* Rutas Académicas */}
        <Route path='/Horario' element={<Horario />} />
        <Route path='/Material' element={
          <ProtectedRoute requiredRole={''}>
            <Material />
          </ProtectedRoute>
        } />
        <Route path='/Temarios' element={<Temarios />} />
        <Route path='/Certificados' element={<Certificados />} />
        <Route path='/Informacion' element={<Informacion />} />
        <Route path='/GestionAcademica' element={<GestionTareas />} />
        <Route path='/Recuperaciones' element={<Recuperaciones />} />
        <Route path='/HorarioRecuperacion' element={<HorarioRecuperacion />} />
        <Route path='/configuracion-recuperacion' element={<ConfiguracionRecuperacion />} />
        
        {/* Rutas de Administración */}
        <Route 
          path='/registro-estudiantes' 
          element={
            <ProtectedRoute requiredRole="secretario">
              <RegistroEstudiantes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/registro-profesores' 
          element={
            <ProtectedRoute requiredRole="secretario">
              <RegistroProfesores />
            </ProtectedRoute>
          } 
        />
        
        {/* Rutas de Comunicación y Seguimiento */}
        <Route path='/Contacto' element={<Contacto/>}/>
        <Route path='/Observaciones' element={<Observaciones />} />
        <Route path='/Reportes' element={<Reportes />} />
        
        {/* Ruta 404 */}
        <Route path='*' element={<NotFound />} />
      </Routes>
      </Suspense>
      {/* Muestra el pie de página si no está en una página de autenticación ni es secretaria */}
      {!isAuthPage && !isSecretaria && <Footer />}
    </RecuperacionProvider>
    </NotificationProvider>
  );
};

// Renderiza la aplicación en el elemento con id 'root' usando StrictMode y BrowserRouter
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
