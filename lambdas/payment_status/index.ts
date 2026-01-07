import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  connectToMongoDB,
  disconnectFromMongoDB,
  getCarPlateModel,
} from "@utils/mongodb";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@utils/response";
import { CarPlateData } from "@shared/car-plate";
import mongoose from "mongoose";

// Import PDF generation from woovi_pix_paid_webhook
import { generatePdf } from "../woovi_pix_paid_webhook/services/pdf";

interface PaymentStatusDocument {
  paymentId: string;
  createdAt: Date;
}

const paymentStatusSchema = new mongoose.Schema<PaymentStatusDocument>({
  paymentId: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

let PaymentStatusModel: mongoose.Model<PaymentStatusDocument>;

function getPaymentStatusModel(): mongoose.Model<PaymentStatusDocument> {
  if (!PaymentStatusModel) {
    PaymentStatusModel = mongoose.model<PaymentStatusDocument>(
      "PaymentStatus",
      paymentStatusSchema
    );
  }
  return PaymentStatusModel;
}

async function checkPaymentExists(paymentId: string): Promise<boolean> {
  const PaymentStatus = getPaymentStatusModel();
  const exists = await PaymentStatus.exists({ paymentId });
  return exists !== null;
}

async function markPaymentAsPaid(paymentId: string): Promise<void> {
  const PaymentStatus = getPaymentStatusModel();
  await PaymentStatus.create({ paymentId });
}

async function fetchCarPlateFromDB(plate: string): Promise<CarPlateData | null> {
  const CarPlateModel = getCarPlateModel();
  const result = await CarPlateModel.findOne({ placa: plate.toUpperCase() });
  return result;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();

    const httpMethod = event.httpMethod;

    if (httpMethod === "GET") {
      // Check if payment exists
      const paymentId = event.queryStringParameters?.id;
      
      if (!paymentId) {
        return createErrorResponse(400, "Payment ID is required");
      }

      const isPaid = await checkPaymentExists(paymentId);
      return createSuccessResponse({ 
        paymentId,
        paid: isPaid 
      });

    } else if (httpMethod === "POST") {
      // Mark payment as paid and generate PDF
      const { id, plate } = JSON.parse(event.body || "{}");
      
      if (!id) {
        return createErrorResponse(400, "Payment ID is required");
      }

      if (!plate) {
        return createErrorResponse(400, "Plate is required");
      }

      // Check if already exists
      const exists = await checkPaymentExists(id);
      if (exists) {
        return createSuccessResponse({ 
          paymentId: id,
          paid: true,
          message: "Payment already marked as paid" 
        });
      }

      // Fetch car plate data from DB
      const carPlateData = await fetchCarPlateFromDB(plate);
      if (!carPlateData) {
        return createErrorResponse(404, `Car plate data not found for plate: ${plate}`);
      }

      // Mark payment as paid
      await markPaymentAsPaid(id);

      // Generate PDF and upload to S3
      const pdfUrl = await generatePdf(carPlateData);
      
      return createSuccessResponse({ 
        paymentId: id,
        paid: true,
        plate: plate.toUpperCase(),
        pdfUrl,
        message: "Payment marked as paid and PDF generated successfully" 
      });

    } else {
      return createErrorResponse(405, "Method not allowed");
    }

  } catch (error) {
    console.error("Error processing payment status:", error);
    return createErrorResponse(500, "Failed to process payment status");
  } finally {
    await disconnectFromMongoDB();
  }
};
