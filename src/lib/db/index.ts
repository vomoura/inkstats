export { prisma } from "./prisma";
export { DatabaseError, NotFoundError, DuplicateError } from "./errors";

export {
  getPlayerProfile,
  updatePlayerProfile,
  addPlayerAlias,
  removePlayerAlias,
} from "./repositories/profile";

export {
  listEvents,
  getEventById,
  saveImportedEvent,
  confirmTournamentResult,
} from "./repositories/events";

export type { ProfileWithAliases } from "./repositories/profile";
export type { EventWithResults, ImportEventData } from "./repositories/events";
