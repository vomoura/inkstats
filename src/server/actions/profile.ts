"use server";

import {
  getPlayerProfile,
  updatePlayerProfile,
  addPlayerAlias,
  removePlayerAlias,
} from "@/lib/db";
import { validateToken } from "@/lib/playhub";

export async function getProfileAction() {
  try {
    return { data: await getPlayerProfile(), error: null };
  } catch {
    return { data: null, error: "Não foi possível carregar o perfil." };
  }
}

export async function updateProfileAction(displayName: string) {
  if (!displayName.trim()) {
    return { data: null, error: "O nome de exibição é obrigatório." };
  }
  try {
    const profile = await updatePlayerProfile({ displayName: displayName.trim() });
    return { data: profile, error: null };
  } catch {
    return { data: null, error: "Erro ao salvar o perfil." };
  }
}

export async function savePlayHubTokenAction(token: string) {
  if (!token.trim()) {
    return { data: null, error: "O token não pode estar vazio." };
  }

  try {
    const validation = await validateToken(token.trim());
    if (!validation.valid) {
      return { data: null, error: "Token inválido ou expirado. Verifique e tente novamente." };
    }

    const profile = await updatePlayerProfile({
      playHubToken: token.trim(),
      playHubUserId: validation.userId ?? null,
    });

    return {
      data: { profile, userId: validation.userId, name: validation.name },
      error: null,
    };
  } catch {
    return { data: null, error: "Erro ao salvar o token." };
  }
}

export async function removePlayHubTokenAction() {
  try {
    const profile = await updatePlayerProfile({ playHubToken: null, playHubUserId: null });
    return { data: profile, error: null };
  } catch {
    return { data: null, error: "Erro ao remover o token." };
  }
}

export async function addAliasAction(value: string) {
  if (!value.trim()) {
    return { data: null, error: "O alias não pode estar vazio." };
  }
  try {
    const alias = await addPlayerAlias(value.trim());
    return { data: alias, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao adicionar alias.";
    return { data: null, error: message };
  }
}

export async function removeAliasAction(aliasId: string) {
  try {
    await removePlayerAlias(aliasId);
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao remover alias.";
    return { error: message };
  }
}
