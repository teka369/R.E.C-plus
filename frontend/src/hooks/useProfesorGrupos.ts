import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Grupo {
    id: number;
    nombre: string;
}

interface ProfesorGruposResponse {
    success: boolean;
    data: {
        profesor: {
            id: number;
            nombre: string;
            apellido: string;
        };
        grupos: Grupo[];
    };
}

export const useProfesorGrupos = (profesorId: number | null) => {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGrupos = async () => {
            if (!profesorId) {
                setGrupos([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await api.get<ProfesorGruposResponse>(
                    `/profesores/${profesorId}/grupos`
                );

                if (response.data.success) {
                    setGrupos(response.data.data.grupos);
                    setError(null);
                } else {
                    setError('Error al obtener los grupos del profesor');
                }
            } catch (err) {
                console.error('Error al obtener grupos del profesor:', err);
                setError('Error al obtener los grupos del profesor');
            } finally {
                setLoading(false);
            }
        };

        fetchGrupos();
    }, [profesorId]);

    return { grupos, loading, error };
};