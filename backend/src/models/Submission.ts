import { Schema, model } from 'mongoose';

const submissionSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    postUrl: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 },
    highestViews: { type: Number, default: 0, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
    flagged: { type: Boolean, default: false },
    lastViewsUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
submissionSchema.index({ campaign: 1, postUrl: 1 }, { unique: true });
export const Submission = model('Submission', submissionSchema);
