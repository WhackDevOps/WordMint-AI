import mongoose, { Schema, Document } from 'mongoose';

// Interface for settings document
export interface ISettings extends Document {
  section: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Settings Schema
const settingsSchema = new Schema<ISettings>(
  {
    section: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    // Remove the Mongoose version key
    toJSON: { 
      versionKey: false,
      transform: function (doc, ret) {
        delete ret._id;
      }
    }
  }
);

// Set updatedAt on update
settingsSchema.pre<ISettings>('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create and export the model
export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);