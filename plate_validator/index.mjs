import dotenv from "dotenv";

dotenv.config();

export const handler = async (event) => {
  const { plate } = JSON.parse(event.body);

  const isValidPlate = /^[a-zA-Z]{3}[0-9][A-Za-z0-9][0-9]{2}$/.test(
    plate.toUpperCase()
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ isValidPlate: String(isValidPlate) }),
  };
};
