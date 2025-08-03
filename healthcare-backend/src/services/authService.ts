import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils.js';
import { sendVerificationEmail } from '../utils/emailService.js';

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
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      
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
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
      
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

  private async logUserActivity(userId: string, activityType: string, details: object) {
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
