export type HealthPayload =
  | {
      ok: true;
      db: { ok: true };
      openai?: { configured: boolean };
      env?: {
        hasSupabaseUrl: boolean;
        hasAnonKey: boolean;
        hasServiceRoleKey: boolean;
      };
    }
  | {
      ok: false;
      error: string;
      details?: string;
      required?: string[];
      hint?: string;
      db?: { ok: boolean };
      openai?: { configured: boolean };
      env?: {
        hasSupabaseUrl: boolean;
        hasAnonKey: boolean;
        hasServiceRoleKey: boolean;
      };
    };
