import axios from "axios";
import { getRequiredEnv } from "@utils/env";

export interface WooviChargeRequest {
  value: number;
  customer: {
    name: string;
    phone: string;
  };
  correlationID: string;
  additionalInfo: Array<{ key: string; value: string }>;
}

export interface WooviChargeResponse {
  charge: {
    correlationID: string;
    value: number;
    status: string;
  };
  brCode: string;
  qrCodeImage: string;
}

export async function createWooviCharge(
  request: WooviChargeRequest
): Promise<WooviChargeResponse> {
  const apiUrl = getRequiredEnv("WOOVI_API_URL");
  const apiKey = getRequiredEnv("WOOVI_API_KEY");

  const { data } = await axios.post<WooviChargeResponse>(
    `${apiUrl}/api/v1/charge`,
    request,
    {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  return data;
}

export function createWooviChargeRequest(
  plate: string,
  name: string,
  phone: string,
  correlationID: string,
  value: number
): WooviChargeRequest {
  return {
    value,
    customer: { name, phone },
    correlationID,
    additionalInfo: [{ key: "plate", value: plate }],
  };
}
