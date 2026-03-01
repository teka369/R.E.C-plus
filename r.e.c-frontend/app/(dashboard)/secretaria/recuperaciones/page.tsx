import Link from "next/link";

export default function SecretariaRecuperacionesPage() {
  return (
    <section className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Recuperaciones</h1>
      <p className="text-sm text-gray-700">Administra la configuración del periodo y el horario de recuperación.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/secretaria/recuperaciones/configuracion" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Configuración de periodo</h2>
          <p className="text-xs text-gray-600">Define fecha y hora de inicio/fin para recuperaciones.</p>
        </Link>
        <Link href="/secretaria/recuperaciones/horario" prefetch={false} className="block border rounded p-4 hover:bg-gray-50">
          <h2 className="font-medium">Horario de recuperación</h2>
          <p className="text-xs text-gray-600">Sube y consulta el archivo oficial del horario.</p>
        </Link>
      </div>
    </section>
  );
}
