import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profilePicture: {
        type: String,
        default: "https://example.com/default-profile-picture.png",
    },
    bio: {
        type: String,
        maxlength: 500,
        default: "",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    roles: {
        type: [String],
        default: ["user"],
        enum: ["user", "admin", "moderator"],
    },
    preferences: {
        type: Object,
        default: {},
    },
}, {
    timestamps: true,
    versionKey: false,
});

const User = mongoose.model("User", userSchema);
export default User;