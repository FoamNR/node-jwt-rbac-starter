import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response.util';

export class UserController {
  /**
   * Get user's own profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const profile = await userService.getProfile(req.user.id);
    sendSuccess(res, { profile }, 'Profile retrieved successfully');
  }

  /**
   * Update user's own profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const updatedProfile = await userService.updateProfile(req.user.id, req.body);
    sendSuccess(res, { profile: updatedProfile }, 'Profile updated successfully');
  }

  /**
   * Change current password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    await userService.changePassword(req.user.id, req.body);
    sendSuccess(res, null, 'Password changed successfully. Please log in again if required.');
  }

  /**
   * Get all users with filters & pagination (Admin/Superadmin only)
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await userService.getAllUsers(req.query as any);
    sendSuccess(res, result.users, 'Users retrieved successfully', 200, result.pagination);
  }

  /**
   * Get user by ID (Admin/Superadmin only)
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    const user = await userService.getProfile(req.params.id);
    sendSuccess(res, { user }, 'User retrieved successfully');
  }

  /**
   * Update a user's role (Superadmin / Admin)
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const updatedUser = await userService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user.role
    );

    sendSuccess(res, { user: updatedUser }, 'User role updated successfully');
  }
}

export const userController = new UserController();
