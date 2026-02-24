import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light"
    >
      <div className="text-center px-4" style={{ maxWidth: '600px' }}>
        <FaExclamationTriangle 
          className="text-danger mb-4" 
          style={{ fontSize: '5rem', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }}
        />
        
        <h1 className="display-1 fw-bold text-gradient mb-3">
          404
        </h1>
        
        <h2 className="h3 mb-4 text-muted">
          ¡Ups! Página no encontrada
        </h2>
        
        <p className="lead mb-5">
          La página que estás buscando podría haber sido eliminada, haber cambiado de nombre o no estar disponible temporalmente.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/Principal" 
            className="btn btn-lg rounded-pill px-5 py-3 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #dc3545, #c82333)',
              color: '#fff',
              border: 'none',
              transition: 'all 0.3s ease',
              fontWeight: '500'
            }}
          >
            Volver al Inicio
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};