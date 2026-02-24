import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Overlay } from 'react-bootstrap';

interface RecuperacionConfig {
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface RecuperacionContextType {
  recuperacionConfig: RecuperacionConfig | null;
  tiempoRestante: string | null;
  cargando: boolean;
  error: string | null;
  periodoActivo: boolean;
}

const RecuperacionContext = createContext<RecuperacionContextType | undefined>(undefined);

interface RecuperacionProviderProps {
  children: ReactNode;
}

export const RecuperacionProvider: React.FC<RecuperacionProviderProps> = ({ children }) => {
  const [recuperacionConfig, setRecuperacionConfig] = useState<RecuperacionConfig | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setCargando(true);
        setError(null);
        const res = await axios.get('/api/config/recuperaciones');
        setRecuperacionConfig(res.data);
      } catch (e) {
        console.error('Error cargando configuración de recuperaciones:', e);
        setError('Error al cargar la configuración');
        setRecuperacionConfig(null);
      } finally {
        setCargando(false);
      }
    };

    fetchConfig();
  }, []);

  // Temporizador para calcular tiempo restante
  useEffect(() => {
    // Si no hay configuración activa o fecha de fin, establecer como finalizado
    if (!recuperacionConfig?.activo || !recuperacionConfig.fecha_fin) {
      setTiempoRestante('Finalizado');
      return;
    }

    // Crear el temporizador solo si hay configuración válida
    const interval = setInterval(() => {
      const ahora = new Date();
      const fin = new Date(recuperacionConfig.fecha_fin || "");
      const diff = fin.getTime() - ahora.getTime();
      
      if (diff <= 0) {
        setTiempoRestante('Finalizado');
        clearInterval(interval);
      } else {
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTiempoRestante(`${dias}d ${horas}h ${minutos}m ${segundos}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [recuperacionConfig]);

  // Calcular si el periodo está activo
  const periodoActivo = !!recuperacionConfig?.activo && tiempoRestante !== 'Finalizado';

  const value: RecuperacionContextType = {
    recuperacionConfig,
    tiempoRestante,
    cargando,
    error,
    periodoActivo
  };

  return (
    <RecuperacionContext.Provider value={value}>
      {children}
    </RecuperacionContext.Provider>
  );
};

export const useRecuperacion = (): RecuperacionContextType => {
  const context = useContext(RecuperacionContext);
  if (context === undefined) {
    throw new Error('useRecuperacion debe ser usado dentro de un RecuperacionProvider');
  }
  return context;
}; 