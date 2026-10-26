function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl(): string {
    return required('DATABASE_URL');
  },
  get databaseSsl(): boolean {
    return process.env.DATABASE_SSL !== 'false';
  },
  get jwtSecret(): string {
    return required('JWT_SECRET');
  },
  get jwtExpiresInSeconds(): number {
    return Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);
  },
};
