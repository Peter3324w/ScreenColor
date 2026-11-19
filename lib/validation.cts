export function object(value: unknown): value is Record<string, unknown> {
  return value!==null && typeof value==='object' && !Array.isArray(value);
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
export function errorCode(error: unknown): unknown { return object(error)?error.code:undefined; }
