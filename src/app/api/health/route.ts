// Cheap liveness check: no database, used by the host's health check and by the
// keep-warm workflow so the free instance does not sleep.
export function GET() {
  return Response.json({ ok: true, ts: Date.now() });
}
