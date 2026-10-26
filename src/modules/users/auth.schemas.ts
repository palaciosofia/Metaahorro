import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Correo electrónico inválido').max(255);

export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  // bcrypt solo usa 72 bytes
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
