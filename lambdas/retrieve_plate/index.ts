import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios from "axios";
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
import { CarPlateData } from "@types/car-plate";

async function fetchFromDatabase(
  plate: string
): Promise<CarPlateData | null> {
  const CarPlateModel = getCarPlateModel();
  const result = await CarPlateModel.findOne({ placa: plate });
  return result;
}

async function fetchFromAPI(plate: string): Promise<CarPlateData> {
  const apiToken = process.env.API_PLACAS_TOKEN;
  if (!apiToken) {
    throw new Error("API_PLACAS_TOKEN environment variable is not set");
  }

  const { data } = await axios.get<CarPlateData>(
    `https://wdapi2.com.br/consulta/${plate}/${apiToken}`
  );
  return data;
}

async function savePlateData(data: CarPlateData): Promise<void> {
  const CarPlateModel = getCarPlateModel();
  const carPlateData = new CarPlateModel(data);
  await carPlateData.save();
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await connectToMongoDB();

    const { plate } = JSON.parse(event.body || "{}");
    const normalizedPlate = normalizePlate(plate);

    const cachedData = await fetchFromDatabase(normalizedPlate);
    if (cachedData) {
      return createSuccessResponse(cachedData);
    }

    const apiData = await fetchFromAPI(normalizedPlate);
    await savePlateData(apiData);

    return createSuccessResponse(apiData);
  } catch (error) {
    console.error("Error retrieving plate data:", error);
    return createErrorResponse(500, "Failed to retrieve plate data");
  } finally {
    await disconnectFromMongoDB();
  }
};
