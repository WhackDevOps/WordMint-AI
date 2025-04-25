import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus } from '../../shared/schema';

// Define the Order interface
export interface IOrder extends Document {
  id: number;
  topic: string;
  wordCount: number;
  status: string;
  content: string | null;
  price: number;
  apiCost: number | null;
  customerEmail: string;
  stripePaymentIntentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Order Schema
const orderSchema = new Schema<IOrder>(
  {
    id: { type: Number, required: true, unique: true }, // Legacy sequential ID for compatibility
    topic: { type: String, required: true },
    wordCount: { type: Number, required: true, min: 100, max: 5000 },
    status: {
      type: String, 
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING
    },
    content: { type: String, default: null },
    price: { type: Number, required: true }, // Price in cents
    apiCost: { type: Number, default: null }, // API cost in cents
    customerEmail: { type: String, required: true },
    stripePaymentIntentId: { type: String, default: null },
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

// Set updatedAt on update
orderSchema.pre<IOrder>('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create and export the model
export const Order = mongoose.model<IOrder>('Order', orderSchema);