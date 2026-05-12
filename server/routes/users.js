import express from 'express';
import { 
    hashPassword, 
    verifyPassword, 
    getAllActiveUsers,
    getUserByUsername,
    getUser,
    createUser,
    updateUser,
    deactivateUser
} from '../db.js';

const router = express.Router();

// GET /api/users - Get all active users
router.get('/', async (req, res) => {
    try {
        const users = await getAllActiveUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
    try {
        const { firstName, middleName, lastName, phoneNumber, username, role, password } = req.body;

        // Validation
        if (!firstName || !lastName || !phoneNumber || !username || !role || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Validate phone number (at least 10 digits)
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number must have at least 10 digits' 
            });
        }

        // Validate username (alphanumeric, min 3 chars)
        if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username must be alphanumeric and at least 3 characters' 
            });
        }

        // Validate password (min 8 chars)
        if (password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 8 characters' 
            });
        }

        // Check if username already exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                error: 'Username already exists' 
            });
        }

        // Validate role
        if (!['Manager', 'Cashier'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role' 
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user (employee + account)
        const newUser = await createUser({
            firstName: firstName.trim(),
            middleName: middleName ? middleName.trim() : null,
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            username: username.trim(),
            role: role.trim(),
            password: hashedPassword
        });

        res.status(201).json({ 
            success: true, 
            data: newUser,
            message: 'User created successfully' 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
});

// PUT /api/users/:accountID - Update user
router.put('/:accountID', async (req, res) => {
    try {
        const { accountID } = req.params;
        const { firstName, middleName, lastName, phoneNumber, username, role, password } = req.body;

        // Validation
        if (!firstName || !lastName || !phoneNumber || !username || !role) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Validate phone number (at least 10 digits)
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number must have at least 10 digits' 
            });
        }

        // Validate username (alphanumeric, min 3 chars)
        if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username must be alphanumeric and at least 3 characters' 
            });
        }

        // Validate password if provided (min 8 chars)
        if (password && password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 8 characters' 
            });
        }

        // Check if role is valid
        if (!['Manager', 'Cashier'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role' 
            });
        }

        // Get current user to verify account exists
        const currentUser = await getUser(accountID);
        if (!currentUser) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Check if username is being changed and if new username already exists
        if (username !== currentUser.username) {
            const existingUser = await getUserByUsername(username);
            if (existingUser) {
                return res.status(409).json({ 
                    success: false, 
                    error: 'Username already exists' 
                });
            }
        }

        // Hash password if provided
        let hashedPassword = null;
        if (password) {
            hashedPassword = await hashPassword(password);
        }

        // Update user
        const updatedUser = await updateUser(accountID, {
            firstName: firstName.trim(),
            middleName: middleName ? middleName.trim() : null,
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            username: username.trim(),
            role: role.trim(),
            password: hashedPassword
        });

        res.json({ 
            success: true, 
            data: updatedUser,
            message: 'User updated successfully' 
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// DELETE /api/users/:accountID - Soft delete (deactivate) user
router.delete('/:accountID', async (req, res) => {
    try {
        const { accountID } = req.params;

        // Verify account exists
        const user = await getUser(accountID);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Deactivate user
        await deactivateUser(accountID);

        res.json({ 
            success: true, 
            message: 'User deactivated successfully' 
        });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ success: false, error: 'Failed to deactivate user' });
    }
});

export default router;
