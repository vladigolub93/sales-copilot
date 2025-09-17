export function logIntegrationError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}
