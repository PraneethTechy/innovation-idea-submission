// Errors use { error, message } with plain-language messages (draft API contract, section 6).
export class ApiError extends Error {
  constructor(error, message, status = 400) {
    super(message);
    this.error = error;
    this.status = status;
  }
}
export const asMessage = (err) => (err && err.message) || 'Something went wrong. Please try again.';
