import { SettingsForm } from "@/components/settings/settings-form";
import { getProfileAction } from "@/server/actions/profile";

export default async function SettingsPage() {
  const { data: profile } = await getProfileAction();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfil & Configurações</h1>
      <SettingsForm
        initialDisplayName={profile?.displayName ?? ""}
        initialAliases={profile?.aliases ?? []}
        hasToken={!!profile?.playHubToken}
        playHubUserId={profile?.playHubUserId ?? null}
      />
    </div>
  );
}
