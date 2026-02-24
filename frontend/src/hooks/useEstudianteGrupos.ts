import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Grupo {
    id: number;
    nombre: string;
}

interface EstudianteGruposResponse {
    success: boolean;
    data: {
        id: number;
        nombre: string;
        apellido: string;
        documento_identidad: string;
        correo_institucional: string;
        grupos: Grupo[];
    };
}

export const useEstudianteGrupos = (email: string | null) => {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGrupos = async () => {
            if (!email) {
                setGrupos([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const safeEmail = encodeURIComponent(email);
                const response = await api.get<EstudianteGruposResponse>(
                    `/estudiantes/${safeEmail}`,
                );

                if (response.data.success) {
                    setGrupos(response.data.data.grupos);
                    setError(null);
                } else {
                    setError('Error al obtener los grupos del estudiante');
                }
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    setGrupos([]);
                    setError('Estudiante no encontrado');
                } else {
                    console.error('Error al obtener grupos del estudiante:', err);
                    setError('Error al obtener los grupos del estudiante');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchGrupos();
    }, [email]);

    return { grupos, loading, error };
};
