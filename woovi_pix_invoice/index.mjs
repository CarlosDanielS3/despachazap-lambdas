import axios from "axios";
import { configDotenv } from "dotenv";
export const handler = async (event, context) => {
  configDotenv();
  const { plate, name, phone } = JSON.parse(event.body);

  const woovi_charge_url = `${process.env.WOOVI_API_URL}/api/v1/charge`;

  const { data } = await axios.post(
    woovi_charge_url,
    {
      value: process.env.PLATE_RESEARCH_VALUE,
      customer: {
        name,
        phone,
      },
      correlationID: context.awsRequestId,
      additionalInfo: [{ key: "plate", value: plate }],
    },
    {
      headers: {
        Authorization: process.env.WOOVI_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
