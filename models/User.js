import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  avatarUrl: { type: String, default: null },
}, { timestamps: true });

// Hash password before save when modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // `this.password` may be undefined if password not selected; ensure it exists
  const hashed = this.password;
  if (!hashed) {
    // if password not selected, re-fetch it
    const user = await this.constructor.findById(this._id).select("+password");
    return bcrypt.compare(candidatePassword, user.password);
  }
  return bcrypt.compare(candidatePassword, hashed);
};

export default mongoose.model("User", userSchema);
