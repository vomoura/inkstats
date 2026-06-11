export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} with id "${id}" not found` : `${entity} not found`,
      "read"
    );
    this.name = "NotFoundError";
  }
}

export class DuplicateError extends DatabaseError {
  constructor(entity: string, field: string, value: string) {
    super(
      `${entity} with ${field} "${value}" already exists`,
      "create"
    );
    this.name = "DuplicateError";
  }
}
