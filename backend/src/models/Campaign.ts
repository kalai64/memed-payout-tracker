import { Schema, model } from 'mongoose';

const milestoneSchema = new Schema(
  {
    views: { type: Number, required: true, min: 1 },
    payout: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);
const campaignSchema = new Schema(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    platform: { type: String, enum: ['Instagram', 'YouTube'], required: true },
    // Money is stored in paise so arithmetic never depends on floating-point rupees.
    budget: { type: Number, required: true, min: 1 },
    spent: { type: Number, default: 0, min: 0 },
    milestones: { type: [milestoneSchema], required: true },
  },
  { timestamps: true },
);
export const Campaign = model('Campaign', campaignSchema);
