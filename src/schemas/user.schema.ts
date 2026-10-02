import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    /* ---------------------------------------------
       PASSWORD RESET (Forgot Password OTP)
       resetOtp: bcrypt-hashed 6-digit OTP
       resetOtpExpiresAt: OTP 10 min me expire ho jata hai
    --------------------------------------------- */

    resetOtp: {
      type: String,
      default: null,
      select: false,
    },

    resetOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type UserModel = Model<UserDocument>;

export const User = model<UserDocument>('User', userSchema);
