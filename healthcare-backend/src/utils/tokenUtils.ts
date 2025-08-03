import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

export function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) as string,
    { expiresIn: '7d' } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: '15m'
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
    ) as TokenPayload;
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
