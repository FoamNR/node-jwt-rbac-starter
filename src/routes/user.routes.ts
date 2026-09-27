import { Router } from 'express';
import { Role } from '@prisma/client';
import { userController } from '../controllers/user.controller';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  changePasswordSchema,
  getUserByIdSchema,
  queryUsersSchema,
  updateProfileSchema,
  updateUserRoleSchema,
} from '../schemas/user.schema';

const router = Router();

// Protect all user routes with authentication
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: User profile and RBAC administration
 */

/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Get currently logged in user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *   put:
 *     summary: Update profile details (first name, last name)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jane
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router
  .route('/profile')
  .get(userController.getProfile)
  .put(validate(updateProfileSchema), userController.updateProfile);

/**
 * @openapi
 * /users/change-password:
 *   post:
 *     summary: Change current user password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: BrandNewPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect current password or invalid new password
 */
router.post(
  '/change-password',
  validate(changePasswordSchema),
  userController.changePassword
);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users with filters & pagination (Admin/Superadmin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, SUPERADMIN]
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Forbidden (Requires Admin or Superadmin)
 */
router.get(
  '/',
  requireRoles(Role.ADMIN, Role.SUPERADMIN),
  validate(queryUsersSchema),
  userController.getAllUsers
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user details by ID (Admin/Superadmin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  requireRoles(Role.ADMIN, Role.SUPERADMIN),
  validate(getUserByIdSchema),
  userController.getUserById
);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin/Superadmin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPERADMIN]
 *     responses:
 *       200:
 *         description: User role updated
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/:id/role',
  requireRoles(Role.ADMIN, Role.SUPERADMIN),
  validate(updateUserRoleSchema),
  userController.updateUserRole
);

export default router;
