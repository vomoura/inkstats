"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Trash2, Plus, Save, Key, CheckCircle, XCircle } from "lucide-react";
import {
  updateProfileAction,
  addAliasAction,
  removeAliasAction,
  savePlayHubTokenAction,
  removePlayHubTokenAction,
} from "@/server/actions/profile";

interface Alias {
  id: string;
  value: string;
}

interface SettingsFormProps {
  initialDisplayName: string;
  initialAliases: Alias[];
  hasToken: boolean;
  playHubUserId: number | null;
}

export function SettingsForm({ initialDisplayName, initialAliases, hasToken, playHubUserId }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [aliases, setAliases] = useState<Alias[]>(initialAliases);
  const [newAlias, setNewAlias] = useState("");
  const [token, setToken] = useState("");
  const [tokenConnected, setTokenConnected] = useState(hasToken);
  const [userId, setUserId] = useState(playHubUserId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveProfile() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateProfileAction(displayName);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Perfil salvo com sucesso.");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  function handleAddAlias() {
    if (!newAlias.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addAliasAction(newAlias);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setAliases((prev) => [...prev, result.data!]);
        setNewAlias("");
      }
    });
  }

  function handleRemoveAlias(aliasId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeAliasAction(aliasId);
      if (result.error) {
        setError(result.error);
      } else {
        setAliases((prev) => prev.filter((a) => a.id !== aliasId));
      }
    });
  }

  function handleSaveToken() {
    if (!token.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await savePlayHubTokenAction(token);
      if (result.error) {
        setError(result.error);
      } else {
        setTokenConnected(true);
        setUserId(result.data?.userId ?? null);
        setToken("");
        setSuccess("Token PlayHub conectado com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  function handleRemoveToken() {
    setError(null);
    startTransition(async () => {
      const result = await removePlayHubTokenAction();
      if (result.error) {
        setError(result.error);
      } else {
        setTokenConnected(false);
        setUserId(null);
        setSuccess("Token removido.");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success font-medium">
          {success}
        </div>
      )}

      {/* Display Name */}
      <Card>
        <label className="block text-sm font-medium mb-2">Nome de exibição</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Seu nome"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            maxLength={100}
          />
          <button
            onClick={handleSaveProfile}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            Salvar
          </button>
        </div>
      </Card>

      {/* Aliases */}
      <Card>
        <label className="block text-sm font-medium mb-2">
          Aliases de torneio
        </label>
        <p className="text-xs text-muted mb-3">
          Nomes que você usa em torneios do PlayHub. O app usa esses nomes para encontrar seus resultados automaticamente.
        </p>

        <div className="space-y-2 mb-3">
          {aliases.map((alias) => (
            <div
              key={alias.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="text-sm">{alias.value}</span>
              <button
                onClick={() => handleRemoveAlias(alias.id)}
                disabled={isPending || aliases.length <= 1}
                className="text-muted hover:text-error disabled:opacity-30 transition-colors"
                title="Remover alias"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            placeholder="Novo alias..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            maxLength={100}
            onKeyDown={(e) => e.key === "Enter" && handleAddAlias()}
          />
          <button
            onClick={handleAddAlias}
            disabled={isPending || !newAlias.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} />
            Adicionar
          </button>
        </div>
      </Card>

      {/* PlayHub Token */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Key size={16} className="text-accent" />
          <label className="text-sm font-medium">Conexão PlayHub</label>
        </div>
        <p className="text-xs text-muted mb-3">
          Cole seu token do PlayHub para importar automaticamente todos os eventos que você participou.
          Abra o DevTools no Chrome (F12) → Network → procure requisições para api.ravensburgerplay.com → copie o valor do header &quot;Authorization: Token ...&quot;.
        </p>

        {tokenConnected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2">
              <CheckCircle size={14} className="text-success" />
              <span className="text-sm text-success font-medium">Conectado</span>
              {userId && <span className="text-xs text-muted ml-1">(User ID: {userId})</span>}
            </div>
            <button
              onClick={handleRemoveToken}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-error/30 text-error text-xs font-medium hover:bg-error/5 disabled:opacity-50 transition-colors"
            >
              <XCircle size={12} />
              Desconectar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole o token aqui..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              onClick={handleSaveToken}
              disabled={isPending || !token.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <Key size={14} />
              Conectar
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
