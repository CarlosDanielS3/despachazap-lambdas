import { CarPlateData } from "@shared/car-plate";
import {
  connectToMongoDB,
  disconnectFromMongoDB,
  getCarPlateModel,
} from "@utils/mongodb";
import { SQSEvent } from "aws-lambda";
import { getPaymentStatusModel, PaymentStatusDocument } from "@models/payment-status";

// Import PDF generation from local services
import { generatePdf } from "./services/pdf";
import { WooviWebhookPayload } from "./webhook-types";

async function checkPaymentExists(brCode: string): Promise<boolean> {
  const PaymentStatus = getPaymentStatusModel();
  const exists = await PaymentStatus.exists({ brCode });
  return exists !== null;
}

async function markPaymentAsPaid(
  brCode: string,
  plate: string,
  pdfUrl: string
): Promise<void> {
  const PaymentStatus = getPaymentStatusModel();
  await PaymentStatus.create({ brCode, plate: plate.toUpperCase(), pdfUrl });
}

async function fetchCarPlateFromDB(
  plate: string
): Promise<CarPlateData | null> {
  const CarPlateModel = getCarPlateModel();
  const result = await CarPlateModel.findOne({ placa: plate.toUpperCase() });
  return result;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("Processing SQS event:", JSON.stringify(event, null, 2));

  try {
    await connectToMongoDB();

    // Process each SQS message
    for (const record of event.Records) {
      try {
        console.log("Processing record:", record.messageId);

        // Parse the webhook payload from SQS message body
        const payload: WooviWebhookPayload = JSON.parse(record.body);
        console.log("Webhook payload:", JSON.stringify(payload, null, 2));

        // Extract brCode from webhook payload
        const brCode = payload.charge?.brCode;
        if (!brCode) {
          console.error("No brCode found in payload");
          continue;
        }

        // Extract plate from additionalInfo array
        const plateInfo = payload.charge?.additionalInfo?.find(
          (info) => info.key === "plate"
        );
        const plate = plateInfo?.value;
        if (!plate) {
          console.error("No plate found in additionalInfo");
          continue;
        }

        console.log(
          `Processing payment with brCode ${brCode} for plate ${plate}`
        );

        // Check if already exists
        const exists = await checkPaymentExists(brCode);
        if (exists) {
          console.log(`Payment with brCode ${brCode} already marked as paid`);
          continue;
        }

        // Fetch car plate data from DB
        const carPlateData = await fetchCarPlateFromDB(plate);
        if (!carPlateData) {
          console.error(`Car plate data not found for plate: ${plate}`);
          continue;
        }

        // Generate PDF and upload to S3
        const pdfUrl = await generatePdf(carPlateData);
        console.log(`PDF generated and uploaded: ${pdfUrl}`);

        // Mark payment as paid with PDF URL
        await markPaymentAsPaid(brCode, plate, pdfUrl);
        console.log(
          `Payment with brCode ${brCode} for plate ${plate} marked as paid`
        );
      } catch (recordError) {
        console.error(
          "Error processing record:",
          record.messageId,
          recordError
        );
        // Don't throw - let this record fail and potentially go to DLQ
        // while other records in the batch can still be processed
      }
    }
  } catch (error) {
    console.error("Error processing SQS batch:", error);
    throw error; // Throw to trigger retry/DLQ
  } finally {
    await disconnectFromMongoDB();
  }
};
