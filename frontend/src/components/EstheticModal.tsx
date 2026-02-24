import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faCheck, 
  faExclamationTriangle, 
  faInfoCircle,
  faTrash,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

interface EstheticModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'confirm';
  size?: 'sm' | 'lg' | 'xl';
  centered?: boolean;
  backdrop?: 'static' | boolean;
  additionalContent?: React.ReactNode;
}

const EstheticModal: React.FC<EstheticModalProps> = ({
  show,
  onHide,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  type = 'info',
  size,
  centered = true,
  backdrop = true,
  additionalContent
}) => {
  // Configuración según el tipo de modal
  const getModalConfig = () => {
    switch (type) {
      case 'success':
        return {
          headerClass: 'bg-success text-white',
          icon: faCheck,
          confirmVariant: 'success',
          iconClass: 'text-success'
        };
      case 'warning':
        return {
          headerClass: 'bg-warning text-dark',
          icon: faExclamationTriangle,
          confirmVariant: 'warning',
          iconClass: 'text-warning'
        };
      case 'danger':
        return {
          headerClass: 'bg-danger text-white',
          icon: faTrash,
          confirmVariant: 'danger',
          iconClass: 'text-danger'
        };
      case 'confirm':
        return {
          headerClass: 'bg-primary text-white',
          icon: faQuestionCircle,
          confirmVariant: 'primary',
          iconClass: 'text-primary'
        };
      case 'info':
      default:
        return {
          headerClass: 'bg-info text-white',
          icon: faInfoCircle,
          confirmVariant: 'info',
          iconClass: 'text-info'
        };
    }
  };

  const config = getModalConfig();

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered={centered} 
      backdrop={backdrop}
      size={size}
      animation={true}
    >
      <Modal.Header className={`${config.headerClass} py-3`} closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FontAwesomeIcon icon={config.icon} className="me-2" />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="d-flex align-items-start mb-3">
          <div className="me-3">
            <FontAwesomeIcon icon={config.icon} className={`${config.iconClass} fa-2x`} />
          </div>
          <div>
            {typeof message === 'string' ? (
              <p className="mb-0">{message}</p>
            ) : (
              message
            )}
          </div>
        </div>
        {additionalContent && (
          <div className="mt-3">
            {additionalContent}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light py-3">
        <Button variant="secondary" onClick={onHide} className="d-flex align-items-center">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {cancelText}
        </Button>
        {onConfirm && (
          <Button 
            variant={config.confirmVariant} 
            onClick={onConfirm}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={config.icon} className="me-2" />
            {confirmText}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EstheticModal;