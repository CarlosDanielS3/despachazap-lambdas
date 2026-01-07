import { connectToMongoDB, disconnectFromMongoDB } from "@utils/mongodb";
import { createErrorResponse, createSuccessResponse } from "@utils/response";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPaymentStatusModel, PaymentStatusDocument } from "@models/payment-status";

async function checkPaymentExists(
  brCode: string
): Promise<{ paid: boolean; pdfUrl?: string }> {
  const PaymentStatus = getPaymentStatusModel();
  const payment = await PaymentStatus.findOne({ brCode });
  return {
    paid: payment !== null,
    pdfUrl: payment?.pdfUrl,
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();

    // Check if payment exists
    const brCode = event.queryStringParameters?.brCode;

    if (!brCode) {
      return createErrorResponse(400, "brCode is required");
    }

    const result = await checkPaymentExists(brCode);
    return createSuccessResponse({
      brCode,
      paid: result.paid,
      ...(result.pdfUrl && { pdfUrl: result.pdfUrl }),
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return createErrorResponse(500, "Failed to check payment status");
  } finally {
    await disconnectFromMongoDB();
  }
};
