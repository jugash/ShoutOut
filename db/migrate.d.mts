export const MIGRATIONS_DIR: string;
export function migrate(options: {
  connectionString: string;
  dir?: string;
  log?: (message: string) => void;
}): Promise<string[]>;
export function main(options?: {
  env?: Record<string, string | undefined>;
  attempts?: number;
  delayMs?: number;
  run?: typeof migrate;
  log?: (message: string) => void;
}): Promise<number>;
