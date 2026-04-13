import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Política de Privacidad</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 prose prose-sm text-foreground">
        <p className="text-muted-foreground text-xs mb-4">Última actualización: Abril 2026</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">1. Información que recopilamos</h2>
        <p className="text-sm text-muted-foreground mb-3">Recopilamos la información que nos proporcionás al crear tu cuenta: nombre, apellido, email, número de celular y ciudad. Si te registrás como chofer, también recopilamos datos de tu vehículo, patente y licencia de conducir.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">2. Cómo usamos tu información</h2>
        <p className="text-sm text-muted-foreground mb-3">Usamos tu información para conectarte con otros usuarios de la plataforma, gestionar viajes compartidos, verificar identidades, procesar pagos y mejorar la experiencia del servicio.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">3. Compartir información</h2>
        <p className="text-sm text-muted-foreground mb-3">Solo compartimos información básica de tu perfil (nombre, reputación, ciudad) con otros usuarios cuando participás en un viaje compartido. No vendemos ni compartimos tus datos personales con terceros para fines comerciales.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">4. Seguridad</h2>
        <p className="text-sm text-muted-foreground mb-3">Protegemos tu información con medidas de seguridad estándar de la industria, incluyendo encriptación de datos y acceso restringido a la información personal.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">5. Tus derechos</h2>
        <p className="text-sm text-muted-foreground mb-3">Podés acceder, modificar o eliminar tu información personal en cualquier momento desde la sección de Configuración de tu cuenta. Para solicitar la eliminación completa de tus datos, contactanos a través de la sección de Ayuda.</p>

        <h2 className="text-base font-heading font-bold mt-4 mb-2">6. Contacto</h2>
        <p className="text-sm text-muted-foreground mb-3">Si tenés preguntas sobre esta política, podés contactarnos a través de la sección de Ayuda dentro de la app.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
