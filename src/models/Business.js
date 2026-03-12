import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    email: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    place_id: { type: String, unique: true, sparse: true },
    city: { type: String, default: '' },
    keyword: { type: String, default: '' },
    leadScore: { type: Number, default: 0 },
    category: { type: String, default: '' },
    country: { type: String, default: '' },
    emailValid: { type: Boolean, default: false },
    crawled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

businessSchema.index({ website: 1 });
businessSchema.index({ name: 1, address: 1 });
businessSchema.index({ email: 1 });
businessSchema.index({ keyword: 1, city: 1 });

const Business = mongoose.model('Business', businessSchema);

export default Business;
