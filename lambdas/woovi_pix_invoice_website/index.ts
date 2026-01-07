import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@utils/response";
import { createWooviCharge, createWooviChargeRequest } from "./services/woovi";
import { getRequiredEnv } from "@utils/env";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { plate, name, phone } = JSON.parse(event.body || "{}");
    const value = parseInt(getRequiredEnv("PLATE_RESEARCH_VALUE"), 10);

    const chargeRequest = createWooviChargeRequest(
      plate,
      name,
      phone,
      context.awsRequestId,
      value
    );
    const chargeResponse = await createWooviCharge(chargeRequest);

    return createSuccessResponse(chargeResponse);
  } catch (error) {
    console.error("Error creating Woovi charge:", error);
    return createErrorResponse(500, "Failed to create PIX invoice");
  }
};
