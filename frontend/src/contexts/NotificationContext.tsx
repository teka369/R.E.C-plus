import React, { createContext, useContext, useState, ReactNode } from 'react';
const uuidv4 = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
import { Toast as BootstrapToast, ToastContainer, Modal, Button } from 'react-bootstrap';

// Tipos para las notificaciones
export type ToastType = 'success' | 'warning' | 'danger' | 'info';
export type ModalType = 'success' | 'warning' | 'danger' | 'info' | 'confirm';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface ModalConfig {
  show: boolean;
  title: string;
  message: string | React.ReactNode;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  additionalContent?: React.ReactNode;
}

interface NotificationContextType {
  // Toast methods
  showToast: (config: { type: ToastType; title: string; message: string; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }) => void;
  hideToast: (id: string) => void;
  
  // Modal methods
  showModal: (config: Omit<ModalConfig, 'show'>) => void;
  hideModal: () => void;
}

const defaultModalConfig: ModalConfig = {
  show: false,
  title: '',
  message: '',
  type: 'info',
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalConfig>(defaultModalConfig);

  // Toast methods
  const showToast = (config: { type: ToastType; title: string; message: string; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }) => {
    const newToast: ToastItem = {
      id: uuidv4(),
      title: config.title,
      message: config.message,
      type: config.type,
      position: config.position || 'top-right'
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      hideToast(newToast.id);
    }, 3000);
  };

  const hideToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Modal methods
  const showModal = (config: Omit<ModalConfig, 'show'>) => {
    setModal({ ...config, show: true });
  };

  const hideModal = () => {
    setModal(defaultModalConfig);
  };

  return (
    <NotificationContext.Provider value={{ showToast, hideToast, showModal, hideModal }}>
      {children}
      
      {/* Render toasts */}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <BootstrapToast 
            key={toast.id} 
            onClose={() => hideToast(toast.id)}
            bg={toast.type === 'danger' ? 'danger' : toast.type === 'warning' ? 'warning' : toast.type === 'success' ? 'success' : 'info'}
            delay={3000}
            autohide
          >
            <BootstrapToast.Header>
              <strong className="me-auto">{toast.title}</strong>
            </BootstrapToast.Header>
            <BootstrapToast.Body>{toast.message}</BootstrapToast.Body>
          </BootstrapToast>
        ))}
      </ToastContainer>
      
      {/* Render modal */}
      <Modal
        show={modal.show}
        onHide={hideModal}
        centered
      >
        <Modal.Header closeButton className={`bg-${modal.type}`}>
          <Modal.Title>{modal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {typeof modal.message === 'string' ? <p>{modal.message}</p> : modal.message}
          {modal.additionalContent}
        </Modal.Body>
        <Modal.Footer>
          {modal.cancelText && (
            <Button variant="secondary" onClick={() => {
              if (modal.onCancel) {
                modal.onCancel();
              }
              hideModal();
            }}>
              {modal.cancelText}
            </Button>
          )}
          {modal.confirmText && modal.onConfirm && (
            <Button variant={modal.type === 'danger' ? 'danger' : 'primary'} onClick={() => {
              if (modal.onConfirm) {
                modal.onConfirm();
              }
              hideModal();
            }}>
              {modal.confirmText}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
  }
  return context;
};