import { prisma } from "../prisma";
import { DatabaseError, DuplicateError, NotFoundError } from "../errors";
import type { PlayerProfile, PlayerAlias } from "@/generated/prisma/client";

export type ProfileWithAliases = PlayerProfile & { aliases: PlayerAlias[] };

export async function getPlayerProfile(): Promise<ProfileWithAliases | null> {
  try {
    return await prisma.playerProfile.findFirst({
      include: { aliases: true },
    });
  } catch (error) {
    throw new DatabaseError("Failed to retrieve player profile", "read", error);
  }
}

export async function updatePlayerProfile(data: {
  displayName?: string;
  playHubToken?: string | null;
  playHubUserId?: number | null;
}): Promise<ProfileWithAliases> {
  try {
    const existing = await prisma.playerProfile.findFirst();

    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.playHubToken !== undefined) updateData.playHubToken = data.playHubToken;
    if (data.playHubUserId !== undefined) updateData.playHubUserId = data.playHubUserId;

    if (existing) {
      return await prisma.playerProfile.update({
        where: { id: existing.id },
        data: updateData,
        include: { aliases: true },
      });
    }

    return await prisma.playerProfile.create({
      data: {
        displayName: data.displayName ?? "Player",
        playHubToken: data.playHubToken ?? null,
        playHubUserId: data.playHubUserId ?? null,
      },
      include: { aliases: true },
    });
  } catch (error) {
    throw new DatabaseError("Failed to update player profile", "write", error);
  }
}

export async function addPlayerAlias(value: string): Promise<PlayerAlias> {
  try {
    const profile = await prisma.playerProfile.findFirst();
    if (!profile) {
      throw new NotFoundError("PlayerProfile");
    }

    return await prisma.playerAlias.create({
      data: {
        value,
        profileId: profile.id,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;

    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      throw new DuplicateError("PlayerAlias", "value", value);
    }

    throw new DatabaseError("Failed to add player alias", "write", error);
  }
}

export async function removePlayerAlias(aliasId: string): Promise<void> {
  try {
    const profile = await prisma.playerProfile.findFirst({
      include: { aliases: true },
    });

    if (!profile) {
      throw new NotFoundError("PlayerProfile");
    }

    const alias = profile.aliases.find((a) => a.id === aliasId);
    if (!alias) {
      throw new NotFoundError("PlayerAlias", aliasId);
    }

    if (profile.aliases.length <= 1) {
      throw new DatabaseError(
        "Cannot remove the last alias. At least one alias is required.",
        "delete"
      );
    }

    await prisma.playerAlias.delete({ where: { id: aliasId } });
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError("Failed to remove player alias", "delete", error);
  }
}
