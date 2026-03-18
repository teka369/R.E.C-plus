"use client";
import Link from "next/link";

export default function SecretariaDashboardPage() {
  return (
    <section className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Panel de Secretaría</h1>
      <p className="text-sm text-gray-700">Selecciona una sección para gestionar:</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/secretaria/estudiantes" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Estudiantes</h2>
          <p className="text-xs text-gray-600">Listar y administrar estudiantes</p>
        </Link>
        <Link href="/secretaria/docentes" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Docentes</h2>
          <p className="text-xs text-gray-600">Listar y administrar docentes</p>
        </Link>
        <Link href="/secretaria/academico" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Académico</h2>
          <p className="text-xs text-gray-600">Grados, grupos, materias y asignaciones</p>
        </Link>
        <Link href="/secretaria/promociones" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Promociones</h2>
          <p className="text-xs text-gray-600">Promover estudiantes al siguiente grado</p>
        </Link>
        <Link href="/secretaria/registro-masivo" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Registro Masivo</h2>
          <p className="text-xs text-gray-600">Subir CSV/JSON para crear usuarios en lote</p>
        </Link>
        <Link href="/secretaria/recuperaciones" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Recuperaciones</h2>
          <p className="text-xs text-gray-600">Configurar periodo y horario de recuperación</p>
        </Link>
        <Link href="/secretaria/secretaria" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Secretaría</h2>
          <p className="text-xs text-gray-600">Listar y administrar personal de secretaría</p>
        </Link>
      </div>
    </section>
  );
}