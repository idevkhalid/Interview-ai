const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isUserAlreadyExist = await userModel.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (isUserAlreadyExist) {
            return res.status(400).json({ message: "User already exists" });
        }
       
        const hash = await bcrypt.hash(password, 10);

        // ✅ FIX 1: Used `await` instead of `new`
        const newUser = await userModel.create({
            username,
            email,
            password: hash
        });

        // ✅ FIX 2 & 3: Fixed variable names and typos
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1d" }
        );

        res.cookie("token", token);

        return res.status(201).json({ 
            message: "User registered successfully", 
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body; 

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1d" }
        );

        res.cookie("token", token);

        return res.status(200).json({ 
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { 
    registerUserController,
    loginUserController
};