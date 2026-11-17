import mongoose, { Document } from "mongoose";

export enum PropertyListingType {
  SALE = "SALE",
  RENT = "RENT",
}

export enum PropertyListingStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export interface IPropertyListing extends Document {
  flat: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  listingType: PropertyListingType;
  amount: number;
  showContact: boolean;
  status: PropertyListingStatus;
  closedAt: Date | null;
}

const propertyListingSchema = new mongoose.Schema<IPropertyListing>(
  {
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    listingType: {
      type: String,
      enum: Object.values(PropertyListingType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    showContact: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(PropertyListingStatus),
      default: PropertyListingStatus.ACTIVE,
    },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

propertyListingSchema.index(
  { flat: 1 },
  {
    unique: true,
    partialFilterExpression: { status: PropertyListingStatus.ACTIVE },
  },
);
propertyListingSchema.index({
  society: 1,
  status: 1,
  listingType: 1,
  createdAt: -1,
});

export const PropertyListing = mongoose.model<IPropertyListing>(
  "PropertyListing",
  propertyListingSchema,
);
