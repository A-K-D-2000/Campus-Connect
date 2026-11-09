const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Filter } = require("bad-words");
const DeletedEmail = require("../models/DeletedEmail");
const Notification = require("../models/Notification");
const { sendEmail } = require('../utils/sendEmail');
const { CLIENT_URL } = require('../config/clientUrl');

const filter = new Filter();

const signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 1. Validate college email domain
    if (!email.endsWith("@medicaps.ac.in")) {
      return res
        .status(400)
        .json({ message: "Only college email addresses are allowed" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Recently deleted accounts must wait out the 24-hour cooldown
    const recentlyDeleted = await DeletedEmail.findOne({
      email: email.toLowerCase().trim(),
    });
    if (recentlyDeleted) {
      return res.status(400).json({
        message:
          "This email was recently removed. Please try again after 24 hours.",
      });
    }

    // 2. Check username for profanity
    if (filter.isProfane(username)) {
      return res
        .status(400)
        .json({ message: "Username contains inappropriate language" });
    }

    // 3. Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already in use" });
    }

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Generate a verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 6. Create the user
    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      verificationToken,
    });
    await newUser.save();

    // 7. Send verification email
    const verificationLink = `${CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify your Campus Connect account",
      html: `<p>Click the link below to verify your account:</p>
             <a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.status(201).json({
      message:
        "Signup successful. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Find the user by email from the token, and matching token in DB
    const user = await User.findOne({
      email: decoded.email,
      verificationToken: token,
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification link" });
    }

    // 3. Mark as verified, clear the token
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired verification link" });
  }
};

// Send a fresh verification link to an unverified account (public)
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const address = email.toLowerCase().trim();
    const user = await User.findOne({ email: address });

    // Only unverified accounts, and not more than once a minute
    const recentlyUpdated =
      user && Date.now() - user.updatedAt.getTime() < 60 * 1000;

    if (user && !user.isVerified && !recentlyUpdated) {
      const verificationToken = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );
      user.verificationToken = verificationToken;
      await user.save();

      const verificationLink = `${CLIENT_URL}/verify-email/${verificationToken}`;
      await sendEmail({
        to: user.email,
        subject: "Verify your Campus Connect account",
        html: `<p>Click the link below to verify your account:</p>
               <a href="${verificationLink}">${verificationLink}</a>`,
      });
    }

    // Same reply in every case
    res.status(200).json({
      message:
        "If an unverified account exists for that email, a new verification link has been sent.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error while resending verification email" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await User.findOne({ $or: [{ email }, { backupEmail: email }] });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2. Check if verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Issue a JWT for the session
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Save or change the backup email (logged-in users)
const setBackupEmail = async (req, res) => {
  try {
    const { backupEmail } = req.body;
    if (!backupEmail) {
      return res.status(400).json({ message: "backupEmail is required" });
    }

    const value = backupEmail.toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const taken = await User.findOne({
      $or: [{ email: value }, { backupEmail: value }],
      _id: { $ne: req.user.userId },
    });
    if (taken) {
      return res.status(400).json({ message: "That email is already in use" });
    }

    // Held as "pending" until the user clicks the link sent to that address
    await User.findByIdAndUpdate(req.user.userId, {
      pendingBackupEmail: value,
    });

    const token = jwt.sign(
      { userId: req.user.userId, backupEmail: value },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const verifyLink = `${CLIENT_URL}/verify-backup/${token}`;
    await sendEmail({
      to: value,
      subject: "Verify your Campus Connect backup email",
      html: `<p>Click the link below to confirm this address as your backup email:</p>
             <a href="${verifyLink}">${verifyLink}</a>`,
    });

    res.status(200).json({
      message:
        "Verification link sent. Check that inbox to confirm your backup email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while saving backup email" });
  }
};

// Confirm the backup email from the emailed link (public)
const verifyBackupEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.userId,
      pendingBackupEmail: decoded.backupEmail,
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification link" });
    }

    // Make sure nobody else claimed this address while it was pending
    const taken = await User.findOne({
      $or: [
        { email: decoded.backupEmail },
        { backupEmail: decoded.backupEmail },
      ],
      _id: { $ne: user._id },
    });
    if (taken) {
      return res.status(400).json({ message: "That email is already in use" });
    }

    user.backupEmail = user.pendingBackupEmail;
    user.pendingBackupEmail = undefined;
    await user.save();

    res.status(200).json({ message: "Backup email verified successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired verification link" });
  }
};

// Start a password reset: email a reset link (public)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const address = email.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: address }, { backupEmail: address }],
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      const resetLink = `${CLIENT_URL}/reset-password/${rawToken}`;

      await sendEmail({
        to: address,
        subject: "Reset your Campus Connect password",
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
               <a href="${resetLink}">${resetLink}</a>`,
      });
    }

    // Same reply whether or not the account exists
    res.status(200).json({
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
};

// Finish a password reset: set the new password (public)
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while resetting password" });
  }
};

// Delete my own account (logged-in users)
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to delete your account" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (user.role === "admin") {
      return res
        .status(403)
        .json({ message: "Admin accounts cannot be deleted here" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Start the 24-hour cooldown on this college email
    await DeletedEmail.findOneAndUpdate(
      { email: user.email },
      { email: user.email, deletedAt: new Date() },
      { upsert: true },
    );

    // Notifications addressed to this user are personal, so they go with the account
    await Notification.deleteMany({ recipient: user._id });

    // Posts and comments stay; they will show as "Deleted user"
    await user.deleteOne();

    res.status(200).json({ message: "Your account has been deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting account" });
  }
};

// Get my own profile (logged-in)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('email username role backupEmail pendingBackupEmail createdAt');
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      backupEmail: user.backupEmail || null,
      pendingBackupEmail: user.pendingBackupEmail || null,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching your profile' });
  }
};

// Change my password while logged in (logged-in)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current one' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while changing password' });
  }
};

module.exports = {
  signup,
  verifyEmail,
  resendVerification,
  login,
  setBackupEmail,
  verifyBackupEmail,
  forgotPassword,
  resetPassword,
  deleteAccount,
  getMe,
  changePassword
};