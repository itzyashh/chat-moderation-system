
import { User } from '../models/User';

export const signUp = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email or username already exists' 
            });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Generate token
        const token = await user.generateAuthToken();

        // Send response without password
        const userResponse = user.toObject();
        delete userResponse.password;
        userResponse.accessToken = token;

        res.status(201).json({ user: userResponse });
    } catch (error) {
        res.status(400).json({ error: 'Error creating user' });
    }
};

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid login credentials' });
        }

        // Generate token
        const token = await user.generateAuthToken();

        // Send response without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ user: userResponse, token });
    } catch (error) {
        res.status(400).json({ error: 'Error signing in' });
    }
};

export const getProfile = async (req, res) => {
    try {
        // User is already attached to request by auth middleware
        const user = req.user;
        
        // Send response without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ user: userResponse });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
}; 