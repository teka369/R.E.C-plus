import React, { useState, useEffect } from 'react';
import { Toast as BootstrapToast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faInfoCircle, 
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';

interface ToastProps {
  show: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  autoHide?: boolean;
  delay?: number;
  position?: 'top-start' | 'top-center' | 'top-end' | 'middle-start' | 'middle-center' | 'middle-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
}

const Toast: React.FC<ToastProps> = ({
  show,
  onClose,
  message,
  type = 'info',
  autoHide = true,
  delay = 3000,
  position = 'top-end'
}) => {
  const [showToast, setShowToast] = useState(show);

  useEffect(() => {
    setShowToast(show);
  }, [show]);

  const handleClose = () => {
    setShowToast(false);
    onClose();
  };

  // Configuración según el tipo de toast
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgClass: 'bg-success',
          icon: faCheckCircle,
          title: 'Éxito'
        };
      case 'warning':
        return {
          bgClass: 'bg-warning text-dark',
          icon: faExclamationTriangle,
          title: 'Advertencia'
        };
      case 'danger':
        return {
          bgClass: 'bg-danger',
          icon: faTimesCircle,
          title: 'Error'
        };
      case 'info':
      default:
        return {
          bgClass: 'bg-info',
          icon: faInfoCircle,
          title: 'Información'
        };
    }
  };

  const config = getToastConfig();
  
  // Determinar la posición del toast
  const getPosition = () => {
    const positions = position.split('-');
    return {
      position: 'fixed',
      top: positions[0] === 'top' ? '20px' : positions[0] === 'middle' ? '50%' : 'auto',
      bottom: positions[0] === 'bottom' ? '20px' : 'auto',
      left: positions[1] === 'start' ? '20px' : positions[1] === 'center' ? '50%' : 'auto',
      right: positions[1] === 'end' ? '20px' : 'auto',
      transform: (positions[0] === 'middle' || positions[1] === 'center') ? 'translate(-50%, -50%)' : 'none',
      zIndex: 9999
    };
  };

  return (
    <ToastContainer position={position} className="p-3" style={{ zIndex: 9999 }}>
      <BootstrapToast 
        show={showToast} 
        onClose={handleClose} 
        delay={delay} 
        autohide={autoHide}
        className="shadow-lg"
      >
        <BootstrapToast.Header className={`${config.bgClass} text-white`}>
          <FontAwesomeIcon icon={config.icon} className="me-2" />
          <strong className="me-auto">{config.title}</strong>
          <small>ahora</small>
        </BootstrapToast.Header>
        <BootstrapToast.Body className="d-flex align-items-center">
          <div className="me-3">
            <FontAwesomeIcon icon={config.icon} className={`text-${type}`} size="lg" />
          </div>
          <div>{message}</div>
        </BootstrapToast.Body>
      </BootstrapToast>
    </ToastContainer>
  );
};

// Componente para gestionar múltiples toasts
interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  }>;
  onClose: (id: string) => void;
  position?: 'top-start' | 'top-center' | 'top-end' | 'middle-start' | 'middle-center' | 'middle-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
}

export const ToastManager: React.FC<ToastManagerProps> = ({
  toasts,
  onClose,
  position = 'top-end'
}) => {
  return (
    <ToastContainer position={position} className="p-3" style={{ zIndex: 9999 }}>
      {toasts.map((toast) => (
        <BootstrapToast 
          key={toast.id}
          onClose={() => onClose(toast.id)} 
          delay={3000} 
          autohide
          className="shadow-lg mb-2"
        >
          <BootstrapToast.Header className={`bg-${toast.type} ${toast.type === 'warning' ? 'text-dark' : 'text-white'}`}>
            <FontAwesomeIcon 
              icon={
                toast.type === 'success' ? faCheckCircle : 
                toast.type === 'warning' ? faExclamationTriangle : 
                toast.type === 'danger' ? faTimesCircle : 
                faInfoCircle
              } 
              className="me-2" 
            />
            <strong className="me-auto">
              {toast.type === 'success' ? 'Éxito' : 
               toast.type === 'warning' ? 'Advertencia' : 
               toast.type === 'danger' ? 'Error' : 
               'Información'}
            </strong>
            <small>ahora</small>
          </BootstrapToast.Header>
          <BootstrapToast.Body className="d-flex align-items-center">
            <div className="me-3">
              <FontAwesomeIcon 
                icon={
                  toast.type === 'success' ? faCheckCircle : 
                  toast.type === 'warning' ? faExclamationTriangle : 
                  toast.type === 'danger' ? faTimesCircle : 
                  faInfoCircle
                } 
                className={`text-${toast.type}`} 
                size="lg" 
              />
            </div>
            <div>{toast.message}</div>
          </BootstrapToast.Body>
        </BootstrapToast>
      ))}
    </ToastContainer>
  );
};

export default Toast;