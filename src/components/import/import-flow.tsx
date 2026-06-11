"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Loading } from "@/components/ui/loading";
import { Search, Download, CheckCircle, XCircle, User, Globe } from "lucide-react";
import { searchEventsAction, importEventAction, fetchMyEventsAction } from "@/server/actions/import";
import type { NormalizedEvent } from "@/lib/playhub";
import type { UserEventStatus } from "@/lib/playhub";

interface ImportFlowProps {
  hasToken: boolean;
}

type Tab = "my-events" | "search";

export function ImportFlow({ hasToken }: ImportFlowProps) {
  const [tab, setTab] = useState<Tab>(hasToken ? "my-events" : "search");
  const [city, setCity] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [myEvents, setMyEvents] = useState<UserEventStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<Record<number, "loading" | "done" | "error" | "exists">>({});
  const [isPending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);
  const [loadedMyEvents, setLoadedMyEvents] = useState(false);

  function handleSearch() {
    if (!city.trim()) return;
    setError(null);
    setEvents([]);
    setSearched(false);
    startTransition(async () => {
      const result = await searchEventsAction({
        city: city.trim(),
        radiusMiles,
        statuses: ["past"],
        pageSize: 50,
        page: 1,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEvents(result.data.events);
        setSearched(true);
      }
    });
  }

  function handleFetchMyEvents() {
    setError(null);
    setMyEvents([]);
    setLoadedMyEvents(false);
    startTransition(async () => {
      const result = await fetchMyEventsAction();
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setMyEvents(result.data);
        setLoadedMyEvents(true);
      }
    });
  }

  function handleImport(eventId: number) {
    setImportStatus((prev) => ({ ...prev, [eventId]: "loading" }));
    startTransition(async () => {
      const result = await importEventAction(eventId);
      if (result.alreadyImported) {
        setImportStatus((prev) => ({ ...prev, [eventId]: "exists" }));
      } else if (result.error) {
        setImportStatus((prev) => ({ ...prev, [eventId]: "error" }));
      } else {
        setImportStatus((prev) => ({ ...prev, [eventId]: "done" }));
      }
    });
  }

  function renderImportButton(eventId: number) {
    const status = importStatus[eventId];
    if (status === "done") {
      return (
        <span className="flex items-center gap-1 text-xs text-success font-medium">
          <CheckCircle size={14} /> Importado
        </span>
      );
    }
    if (status === "exists") {
      return (
        <span className="flex items-center gap-1 text-xs text-muted font-medium">
          <CheckCircle size={14} /> Já importado
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="flex items-center gap-1 text-xs text-error font-medium">
          <XCircle size={14} /> Erro
        </span>
      );
    }
    if (status === "loading") {
      return <span className="text-xs text-muted animate-pulse">Importando...</span>;
    }
    return (
      <button
        onClick={() => handleImport(eventId)}
        disabled={isPending}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-accent-light hover:text-accent transition-colors disabled:opacity-50"
      >
        <Download size={12} />
        Importar
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      {hasToken && (
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setTab("my-events")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "my-events"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <User size={14} className="inline mr-1.5" />
            Meus Eventos
          </button>
          <button
            onClick={() => setTab("search")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "search"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Globe size={14} className="inline mr-1.5" />
            Buscar por Cidade
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* My Events tab */}
      {tab === "my-events" && (
        <div className="space-y-4">
          {!loadedMyEvents && (
            <Card>
              <p className="text-sm text-muted mb-3">
                Carregar todos os eventos que você participou usando sua conta PlayHub.
              </p>
              <button
                onClick={handleFetchMyEvents}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                <Download size={14} />
                Carregar Meus Eventos
              </button>
            </Card>
          )}

          {isPending && myEvents.length === 0 && !loadedMyEvents && (
            <Loading message="Buscando seus eventos no PlayHub..." />
          )}

          {loadedMyEvents && myEvents.length === 0 && (
            <p className="text-sm text-muted text-center py-8">Nenhum evento encontrado na sua conta.</p>
          )}

          {myEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted">{myEvents.length} evento(s) encontrado(s)</p>
              {myEvents.map((event) => (
                <Card key={event.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{event.eventName}</p>
                    <p className="text-xs text-muted">
                      {event.startDate && new Date(event.startDate).toLocaleDateString("pt-BR")}
                      {` · ${event.registrationStatus}`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {renderImportButton(event.eventId)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === "search" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Fortaleza, CE"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-muted mb-1">Raio (mi)</label>
                <input
                  type="number"
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(Number(e.target.value))}
                  min={5}
                  max={200}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={isPending || !city.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  <Search size={14} />
                  Buscar
                </button>
              </div>
            </div>
          </Card>

          {isPending && events.length === 0 && <Loading message="Buscando eventos..." />}

          {searched && events.length === 0 && !isPending && (
            <p className="text-sm text-muted text-center py-8">Nenhum evento encontrado para essa busca.</p>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted">{events.length} evento(s) encontrado(s)</p>
              {events.map((event) => (
                <Card key={event.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{event.name}</p>
                    <p className="text-xs text-muted">
                      {event.storeName && `${event.storeName} · `}
                      {event.city && `${event.city} · `}
                      {event.startDate && new Date(event.startDate).toLocaleDateString("pt-BR")}
                      {event.totalPlayers && ` · ${event.totalPlayers} jogadores`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {renderImportButton(event.id)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
