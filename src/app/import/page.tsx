import { ImportFlow } from "@/components/import/import-flow";
import { getProfileAction } from "@/server/actions/profile";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings } from "lucide-react";

export default async function ImportPage() {
  const { data: profile } = await getProfileAction();

  if (!profile || profile.aliases.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Importar Eventos</h1>
        <EmptyState
          icon={<Settings size={48} />}
          title="Configure seu perfil primeiro"
          description="Você precisa definir pelo menos um alias para que o app possa encontrar seus resultados nos eventos."
          actionLabel="Ir para Configurações"
          actionHref="/settings"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Importar Eventos</h1>
      <p className="text-sm text-muted">
        Busque eventos de Lorcana no PlayHub e importe para sua base local.
      </p>
      <ImportFlow hasToken={!!profile.playHubToken} />
    </div>
  );
}
