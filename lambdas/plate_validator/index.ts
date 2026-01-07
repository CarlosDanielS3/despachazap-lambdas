import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { isValidPlate, normalizePlate } from "@utils/validators";
import { createSuccessResponse } from "@utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { plate } = JSON.parse(event.body || "{}");
  const normalizedPlate = normalizePlate(plate);
  const isValid = isValidPlate(normalizedPlate);

  return createSuccessResponse({ isValidPlate: String(isValid) });
};
