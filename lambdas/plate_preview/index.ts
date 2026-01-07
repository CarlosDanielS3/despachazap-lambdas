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
import { normalizePlate } from "@utils/validators";
import { CarPlateData } from "@shared/car-plate";

interface PreviewData {
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  placa: string;
}

async function fetchFromDatabase(
  plate: string
): Promise<CarPlateData | null> {
  const CarPlateModel = getCarPlateModel();
  const result = await CarPlateModel.findOne({ placa: plate });
  return result;
}

function filterPreviewData(data: CarPlateData): PreviewData {
  return {
    marca: data.marca,
    modelo: data.modelo,
    ano: data.ano,
    cor: data.cor,
    placa: data.placa,
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();

    const { plate } = JSON.parse(event.body || "{}");
    const normalizedPlate = normalizePlate(plate);

    const cachedData = await fetchFromDatabase(normalizedPlate);
    if (!cachedData) {
      return createErrorResponse(404, "Plate data not found. Please use the full retrieve endpoint first.");
    }

    const previewData = filterPreviewData(cachedData);
    return createSuccessResponse(previewData);
  } catch (error) {
    console.error("Error retrieving plate preview:", error);
    return createErrorResponse(500, "Failed to retrieve plate preview");
  } finally {
    await disconnectFromMongoDB();
  }
};
