import mongoose from "mongoose";

export interface PaymentStatusDocument {
  brCode: string;
  plate: string;
  pdfUrl: string;
  createdAt: Date;
}

const paymentStatusSchema = new mongoose.Schema<PaymentStatusDocument>(
  {
    brCode: { type: String, required: true, index: true },
    plate: { type: String, required: true, index: true },
    pdfUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "paymentstatuses",
  }
);

// Create compound unique index for brCode and plate combination
paymentStatusSchema.index({ brCode: 1, plate: 1 }, { unique: true });

let PaymentStatusModel: mongoose.Model<PaymentStatusDocument>;

export function getPaymentStatusModel(): mongoose.Model<PaymentStatusDocument> {
  if (!PaymentStatusModel) {
    try {
      PaymentStatusModel = mongoose.model<PaymentStatusDocument>("PaymentStatus");
    } catch {
      PaymentStatusModel = mongoose.model<PaymentStatusDocument>(
        "PaymentStatus",
        paymentStatusSchema
      );
    }
  }
  return PaymentStatusModel;
}
