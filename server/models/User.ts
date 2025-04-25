import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Define the User interface
export interface IUser extends Document {
  id: number;
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create the User Schema
const userSchema = new Schema<IUser>(
  {
    id: { type: Number, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    // Remove the Mongoose version key and convert _id to id in JSON transformations
    toJSON: { 
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

// Add method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
userSchema.pre<IUser>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Set updatedAt on update
userSchema.pre<IUser>('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create the model
export const User = mongoose.model<IUser>('User', userSchema);