import { neon } from '@neondatabase/serverless';
import { createWallState } from './wall.mjs';

export function createNeonStore(databaseUrl, { initialState, query = neon(databaseUrl) } = {}) {
  let initialized;
  function initialize() {
    initialized ??= query.transaction([
      query`SELECT pg_advisory_xact_lock(684123, 1)`,
      query`CREATE TABLE IF NOT EXISTS fondayo_wall (
        singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
        version bigint NOT NULL DEFAULT 0,
        payload jsonb NOT NULL
      )`,
      query`INSERT INTO fondayo_wall (singleton, payload)
        VALUES (true, ${JSON.stringify(initialState ?? createWallState())}::jsonb)
        ON CONFLICT (singleton) DO NOTHING`
    ]).catch(error => {
      initialized = undefined;
      throw error;
    });
    return initialized;
  }

  return async function transact(action) {
    await initialize();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const [row] = await query`SELECT version, payload FROM fondayo_wall WHERE singleton = true`;
      const state = row.payload;
      const before = JSON.stringify(state);
      const result = action(state);
      const updated = JSON.stringify(state);
      if (updated === before) return result;
      const [saved] = await query`UPDATE fondayo_wall
        SET payload = ${updated}::jsonb, version = version + 1
        WHERE singleton = true AND version = ${row.version}::bigint RETURNING version`;
      if (saved) return result;
    }
    return { status: 503, body: { error: 'The wall is busy. Try again in a moment.' } };
  };
}
