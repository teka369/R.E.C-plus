"use client";
import Link from "next/link";

export default function SecretariaDashboardPage() {
  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h1 className="sec-title">Panel de Secretaría</h1>
          <p className="sec-subtitle">
            Centro operativo institucional para gestionar estudiantes, docentes, estructura académica,
            promociones, recuperaciones y registro masivo de usuarios.
          </p>
        </div>
        <span className="sec-chip">Módulo administrativo</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Link href="/secretaria/estudiantes" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Estudiantes</h2>
          <p className="sec-muted mt-1">Listar, asignar grupos y gestionar cambios de manera ágil.</p>
        </Link>
        <Link href="/secretaria/docentes" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Docentes</h2>
          <p className="sec-muted mt-1">Asignación por grupo/materia y seguimiento de cargas.</p>
        </Link>
        <Link href="/secretaria/academico" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Académico</h2>
          <p className="sec-muted mt-1">Grados, grupos, materias, directores y asignaciones.</p>
        </Link>
        <Link href="/secretaria/promociones" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Promociones</h2>
          <p className="sec-muted mt-1">Simulación y promoción controlada por grupos.</p>
        </Link>
        <Link href="/secretaria/registro-masivo" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Registro Masivo</h2>
          <p className="sec-muted mt-1">Carga de archivos, validación y creación en lote.</p>
        </Link>
        <Link href="/secretaria/recuperaciones" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Recuperaciones</h2>
          <p className="sec-muted mt-1">Periodo oficial, configuración y publicación de horario.</p>
        </Link>
        <Link href="/secretaria/secretaria" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Personal de Secretaría</h2>
          <p className="sec-muted mt-1">Gestión completa del equipo administrativo.</p>
        </Link>
        <Link href="/secretaria/usuarios" prefetch={false} className="sec-card block p-4">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Usuarios</h2>
          <p className="sec-muted mt-1">Vista global de usuarios por rol para control transversal.</p>
        </Link>
      </div>
    </section>
  );
}