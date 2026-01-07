import { CarPlateData } from "@types/car-plate";

export async function sendConfirmationMessage(
  subscriberId: string,
  token: string
): Promise<void> {
  const headers = {
    "API-KEY": token,
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `https://backend.botconversa.com.br/api/v1/webhook/subscriber/${subscriberId}/send_message/`,
    {
      method: "POST",
      body: JSON.stringify({
        type: "text",
        value:
          "Seu pagamento foi confirmado com sucesso! ✅\n\nEstamos gerando o relatório do veículo. Por favor, aguarde alguns instantes...",
      }),
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send confirmation: ${response.status} ${response.statusText}`
    );
  }
}

export async function sendPdfFile(
  subscriberId: string,
  fileUrl: string,
  token: string
): Promise<void> {
  const headers = {
    "API-KEY": token,
    "Content-Type": "application/json",
  };

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const response = await fetch(
    `https://backend.botconversa.com.br/api/v1/webhook/subscriber/${subscriberId}/send_message/`,
    {
      method: "POST",
      body: JSON.stringify({
        type: "file",
        value: fileUrl,
      }),
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send PDF: ${response.status} ${response.statusText}`
    );
  }
}

export async function sendPostPdfMessage(
  subscriberId: string,
  plate: string,
  token: string
): Promise<void> {
  const headers = {
    "API-KEY": token,
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `https://backend.botconversa.com.br/api/v1/webhook/subscriber/${subscriberId}/send_message/`,
    {
      method: "POST",
      body: JSON.stringify({
        type: "text",
        value: `📄 Relatório da placa *${plate}* enviado com sucesso!\n\nSe precisar de mais alguma informação, estou à disposição! 🚗`,
      }),
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to send post-PDF message: ${response.status} ${response.statusText}`
    );
  }
}

export async function fetchCarPlateFromDB(
  plate: string
): Promise<CarPlateData | null> {
  const mongoose = await import("mongoose");
  
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error("MONGO_URL environment variable is not set");
  }
  
  await mongoose.connect(mongoUrl);
  
  const CarPlateModel = mongoose.models.CarPlateData || 
    mongoose.model<CarPlateData>("CarPlateData", new mongoose.Schema({}));
  
  const result = await CarPlateModel.findOne({ placa: plate });
  await mongoose.disconnect();

  return result;
}
