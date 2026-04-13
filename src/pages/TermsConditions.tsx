import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsConditions = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Términos y Condiciones</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 prose prose-sm text-foreground">
        <p className="text-muted-foreground text-xs mb-4">Última actualización: Abril 2026</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">1. Aceptación de los términos</h2>
        <p className="text-sm text-muted-foreground mb-3">Al registrarte y usar ViajeCompartido, aceptás estos términos y condiciones. Si no estás de acuerdo, no uses la plataforma.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">2. Descripción del servicio</h2>
        <p className="text-sm text-muted-foreground mb-3">ViajeCompartido es una plataforma que conecta choferes y pasajeros para compartir viajes. No somos una empresa de transporte ni un servicio de remis. Facilitamos la conexión entre usuarios que comparten rutas y horarios.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">3. Registro y cuenta</h2>
        <p className="text-sm text-muted-foreground mb-3">Para usar la plataforma debés crear una cuenta con información veraz y actualizada. Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad que ocurra bajo tu cuenta.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">4. Responsabilidades del usuario</h2>
        <p className="text-sm text-muted-foreground mb-3">Como usuario te comprometés a: proporcionar información veraz, respetar los acuerdos de viaje, mantener un comportamiento respetuoso, no usar la plataforma para actividades ilegales, y cumplir con todas las leyes de tránsito aplicables.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">5. Responsabilidades del chofer</h2>
        <p className="text-sm text-muted-foreground mb-3">Los choferes deben contar con licencia de conducir vigente, seguro del vehículo al día, vehículo en condiciones aptas para circular, y deben respetar todas las normas de tránsito.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">6. Pagos y tarifas</h2>
        <p className="text-sm text-muted-foreground mb-3">Los precios son fijados por el chofer dentro de rangos sugeridos por la plataforma. La plataforma puede cobrar una comisión por el uso del servicio. Los pagos se procesan a través de los métodos habilitados en la plataforma.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">7. Cancelaciones</h2>
        <p className="text-sm text-muted-foreground mb-3">Tanto choferes como pasajeros pueden cancelar viajes. Las cancelaciones reiteradas pueden afectar la reputación del usuario dentro de la plataforma.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">8. Limitación de responsabilidad</h2>
        <p className="text-sm text-muted-foreground mb-3">ViajeCompartido actúa únicamente como intermediario. No nos hacemos responsables por accidentes, daños, pérdidas o cualquier incidente que ocurra durante los viajes compartidos.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">9. Contacto</h2>
        <p className="text-sm text-muted-foreground mb-3">Para consultas sobre estos términos, contactanos a través de la sección de Ayuda dentro de la app.</p>
      </div>
    </div>
  );
};

export default TermsConditions;
