import { CarPlateData } from "@shared/car-plate";
import {
  connectToMongoDB,
  disconnectFromMongoDB,
  getCarPlateModel,
} from "@utils/mongodb";
import { createErrorResponse, createSuccessResponse } from "@utils/response";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Import the same services from woovi_pix_paid_webhook
import { generatePdf } from "../woovi_pix_paid_webhook/services/pdf";

async function fetchCarPlateFromDB(
  plate: string
): Promise<CarPlateData | null> {
  const CarPlateModel = getCarPlateModel();
  const result = await CarPlateModel.findOne({ placa: plate.toUpperCase() });
  return result;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();

    const { plate } = JSON.parse(event.body || "{}");

    if (!plate) {
      return createErrorResponse(400, "Plate is required");
    }

    const carPlateData = await fetchCarPlateFromDB(plate);
    if (!carPlateData) {
      return createErrorResponse(
        404,
        `Car plate data not found for plate: ${plate}`
      );
    }

    // Generate PDF and upload to S3
    const pdfUrl = await generatePdf(carPlateData);

    return createSuccessResponse({
      plate: plate.toUpperCase(),
      pdfUrl,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return createErrorResponse(500, "Failed to generate PDF");
  } finally {
    await disconnectFromMongoDB();
  }
};
