export default function NotificacionesPage() {
  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Notificaciones Institucionales</h2>
          <p className="sec-subtitle">
            Centraliza la comunicación académica y administrativa hacia docentes, estudiantes y familias.
          </p>
        </div>
        <span className="sec-chip">Próxima expansión</span>
      </div>

      <div className="sec-grid-cards">
        <div className="sec-stat">
          <p className="label">Canales</p>
          <p className="value">3</p>
        </div>
        <div className="sec-stat">
          <p className="label">Plantillas</p>
          <p className="value">12</p>
        </div>
        <div className="sec-stat">
          <p className="label">Estado</p>
          <p className="value">Beta</p>
        </div>
      </div>

      <div className="sec-card p-4 space-y-2">
        <h3 className="font-semibold text-[color:var(--rec-title)]">Estado del módulo</h3>
        <p className="sec-muted">
          Esta vista está preparada para integrar envíos masivos, segmentación por rol/grupo y seguimiento de lectura.
          En la siguiente iteración se conectarán acciones reales con historial y métricas de entrega.
        </p>
      </div>
    </section>
  );
}