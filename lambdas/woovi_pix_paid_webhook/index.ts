import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";
import {
  fetchCarPlateFromDB,
  sendConfirmationMessage,
  sendPdfFile,
  sendPostPdfMessage,
} from "./services/botconversa";
import { generatePdf } from "./services/pdf";

interface WebhookPayload {
  charge: {
    additionalInfo: Array<{ key: string; value: string }>;
    customer: {
      correlationID: string;
    };
  };
}

async function processWebhook(payload: WebhookPayload): Promise<void> {
  const token = process.env.BOTCONVERSA_TOKEN;
  if (!token) {
    throw new Error("BOTCONVERSA_TOKEN is not set");
  }

  console.log("Processing webhook payload:", JSON.stringify(payload));
  const plate = payload.charge.additionalInfo.find(
    (info) => info.key === "plate"
  )?.value;

  if (!plate) {
    throw new Error("Plate not found in webhook payload");
  }

  const subscriberId = payload.charge.customer.correlationID;

  await sendConfirmationMessage(subscriberId, token);
  console.info("Confirmation message sent to subscriber:", subscriberId);

  const carPlateData = await fetchCarPlateFromDB(plate.toUpperCase());
  if (!carPlateData) {
    throw new Error(`Car plate data not found for plate: ${plate}`);
  }

  const pdfUrl = await generatePdf(carPlateData);
  await sendPdfFile(subscriberId, pdfUrl, token);
  console.info("PDF file sent to subscriber:", subscriberId);

  await sendPostPdfMessage(subscriberId, plate, token);
  console.info("Post PDF message sent to subscriber:", subscriberId);
}

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      const payload: WebhookPayload = JSON.parse(record.body);
      await processWebhook(payload);
    } catch (error) {
      console.error("Error processing webhook:", error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  console.info("Batch processing completed.", { batchItemFailures });
  return { batchItemFailures };
};
