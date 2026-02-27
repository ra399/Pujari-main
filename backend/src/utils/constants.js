export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export const ROLES = {
  USER: "USER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
};
