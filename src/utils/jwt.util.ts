import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    {
      userId,
    },
    secret,
    {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    }
  );
};