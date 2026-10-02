import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().optional(),
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;

export class EnvironmentConfigValidator {
  public static validate(
    env: NodeJS.ProcessEnv = process.env
  ): EnvironmentConfig {
    const result = environmentSchema.safeParse(env);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new Error(`Invalid environment configuration: ${message}`);
    }

    return result.data;
  }
}
