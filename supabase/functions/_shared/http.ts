const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
} as const;

export const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...extra } });

/** Errors never contain internals (no SQL text, no stack traces, no token contents). */
export const errorJson = (status: number, code: string, message: string, extra: Record<string, string> = {}): Response =>
  json(status, { error: { code, message } }, extra);

export const readJson = async (req: Request, maxBytes = 4096): Promise<unknown> => {
  const text = await req.text();
  if (text.length > maxBytes) {
    throw new Error('payload_too_large');
  }
  return JSON.parse(text);
};
