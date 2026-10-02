import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email format')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export type SignupDto = z.infer<typeof signupSchema>;

// Login
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email format')),

  password: z
    .string()
    .min(1, 'Password is required')
    .max(72, 'Password must be at most 72 characters'),
});

export type LoginDto = z.infer<typeof loginSchema>;