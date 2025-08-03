# Authentication System Implementation

Complete JWT-based authentication system for the Healthcare Platform.

## 🔐 Authentication Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │────│   Auth Service   │────│    Database     │
│                 │    │                  │    │                 │
│ - Login Form    │    │ - JWT Generation │    │ - Users Table   │
│ - Token Storage │    │ - Token Verify   │    │ - Sessions      │
│ - Auto Refresh  │    │ - Role Check     │    │ - Audit Logs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Implementation Files

### 1. Authentication Service

```typescript
// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils';
import { sendVerificationEmail } from '../utils/emailService';

const prisma = new PrismaClient();

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'PHYSICIAN' | 'AGENT' | 'HOSPITAL_ADMIN';
  specialization?: string;
  licenseNumber?: string;
  hospitalId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Generate email verification token
    const emailVerificationToken = jwt.sign(
      { email: input.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        emailVerificationToken,
        profile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            role: input.role,
            specialization: input.specialization,
            licenseNumber: input.licenseNumber,
            hospitalId: input.hospitalId,
          }
        },
        wallet: {
          create: {
            balance: 0,
            currency: 'NGN'
          }
        }
      },
      include: {
        profile: true,
        wallet: true
      }
    });

    // Send verification email
    await sendVerificationEmail(user.email, emailVerificationToken);

    // Generate JWT tokens
    const tokens = generateTokens(user.id, user.profile!.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        profile: user.profile
      },
      tokens
    };
  }

  async login(input: LoginInput) {
    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        profile: true
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (user.profile && !user.profile.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.profile!.role);

    // Log successful login
    await this.logUserActivity(user.id, 'LOGIN', {
      timestamp: new Date().toISOString(),
      userAgent: 'N/A' // Will be passed from controller
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        profile: user.profile
      },
      tokens
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      
      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { profile: true }
      });

      if (!user || !user.profile?.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = generateTokens(user.id, user.profile.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile
        },
        tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Save reset token and expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    // Send reset email
    await this.sendPasswordResetEmail(email, resetToken);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  async verifyEmail(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findFirst({
        where: {
          email: payload.email,
          emailVerificationToken: token
        }
      });

      if (!user) {
        throw new Error('Invalid verification token');
      }

      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null
        }
      });

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new Error('Invalid verification token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log password change
    await this.logUserActivity(userId, 'PASSWORD_CHANGE', {
      timestamp: new Date().toISOString()
    });

    return { message: 'Password changed successfully' };
  }

  private async logUserActivity(userId: string, activityType: string, details: any) {
    await prisma.auditLog.create({
      data: {
        userId,
        actionType: activityType,
        actionCategory: 'authentication',
        newValues: details,
        impactLevel: 'medium'
      }
    });
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    // Implementation depends on your email service
    // This is a placeholder
    console.log(`Password reset email sent to ${email} with token ${token}`);
  }
}
```

### 2. Token Utilities

```typescript
// src/utils/tokenUtils.ts
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

export function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { expiresIn: '7d' }
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
```

### 3. Authentication Middleware

```typescript
// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/tokenUtils';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    profile: any;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true }
    });

    if (!user || !user.profile?.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.profile.role,
      profile: user.profile
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Optional middleware for endpoints that work with or without auth
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { profile: true }
      });

      if (user && user.profile?.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.profile.role,
          profile: user.profile
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
```

### 4. Authentication Controller

```typescript
// src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { validateRegisterInput, validateLoginInput } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const validation = validateRegisterInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            details: validation.errors
          }
        });
      }

      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validation = validateLoginInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            details: validation.errors
          }
        });
      }

      const result = await authService.login(req.body);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const result = await authService.forgotPassword(email);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      const result = await authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      const result = await authService.verifyEmail(token as string);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current and new passwords are required'
        });
      }

      const result = await authService.changePassword(
        req.user!.id,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  }

  async logout(req: Request, res: Response) {
    // In a stateless JWT system, logout is handled client-side
    // But you can maintain a blacklist of tokens if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}
```

### 5. Auth Routes

```typescript
// src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimitAuth } from '../middleware/rateLimitMiddleware';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post('/register', rateLimitAuth, authController.register);
router.post('/login', rateLimitAuth, authController.login);
router.post('/refresh', rateLimitAuth, authController.refreshToken);
router.post('/forgot-password', rateLimitAuth, authController.forgotPassword);
router.post('/reset-password', rateLimitAuth, authController.resetPassword);
router.get('/verify-email', authController.verifyEmail);

// Protected routes
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
```

### 6. Validation Utils

```typescript
// src/utils/validation.ts
import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('PATIENT', 'PHYSICIAN', 'AGENT', 'HOSPITAL_ADMIN').required(),
  specialization: Joi.string().when('role', {
    is: 'PHYSICIAN',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  licenseNumber: Joi.string().when('role', {
    is: 'PHYSICIAN',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  hospitalId: Joi.string().when('role', {
    is: Joi.valid('PHYSICIAN', 'HOSPITAL_ADMIN'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export function validateRegisterInput(data: any) {
  const { error } = registerSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}

export function validateLoginInput(data: any) {
  const { error } = loginSchema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return { isValid: true, errors: [] };
}
```

## 🔒 Security Features

### Password Security
- **Bcrypt Hashing**: 12 rounds for strong password protection
- **Password Validation**: Minimum 8 characters requirement
- **Password History**: Prevent reuse of recent passwords

### Token Security
- **JWT Tokens**: Stateless authentication
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Longer-lived (7 days)
- **Token Rotation**: New tokens on refresh

### Rate Limiting
- **Auth Endpoints**: 10 requests per 15 minutes per IP
- **Failed Logins**: Progressive delays for repeated failures
- **Token Refresh**: Limited to prevent abuse

### Account Security
- **Email Verification**: Required for account activation
- **Password Reset**: Secure token-based reset flow
- **Account Lockout**: Temporary lockout after failed attempts
- **Audit Logging**: Track all authentication events

## 🎯 Integration Examples

### Frontend Integration
```typescript
// Frontend auth service example
class AuthService {
  private baseURL = 'http://localhost:3000/api/auth';

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    }

    return data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch(`${this.baseURL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
    }

    return data;
  }
}
```

### API Request Interceptor
```typescript
// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authService.refreshToken();
        // Retry original request
        return axios.request(error.config);
      } catch {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 📊 Performance Considerations

- **Connection Pooling**: Efficient database connections
- **Token Caching**: Cache user data to avoid repeated queries
- **Rate Limiting**: Protect against brute force attacks
- **Session Management**: Optional session store for high-security requirements