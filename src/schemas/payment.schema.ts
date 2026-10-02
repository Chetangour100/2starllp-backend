import {
  Schema,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from 'mongoose';

const paymentSchema = new Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    employeeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed'],
      required: true,
      default: 'Pending',
    },

    method: {
      type: String,
      enum: ['NEFT', 'IMPS', 'RTGS', 'UPI'],
      required: true,
    },

    bankReference: {
      type: String,
      trim: true,
      default: null,
    },

    utrNumber: {
      type: String,
      trim: true,
      default: null,
    },

    accountNumber: {
      type: String,
      trim: true,
      default: null,
    },

    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    payrollId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    payrollMonth: {
      type: String,
      required: true,
      trim: true,
    },

    initiatedAt: {
      type: String,
      default: null,
    },

    completedAt: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      trim: true,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

export type PaymentDocument =
  InferSchemaType<typeof paymentSchema> & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

export type PaymentModel = Model<PaymentDocument>;

export const Payment = model<PaymentDocument>(
  'Payment',
  paymentSchema
);