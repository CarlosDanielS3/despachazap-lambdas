export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} environment variable is not set`);
  }
  return value;
}

export function defaultString(str: string | undefined | null | number): string {
  if (typeof str === "number") {
    return str.toString();
  }
  if (str === undefined || str === null) {
    return "Não informado";
  }
  if (typeof str !== "string") {
    return "Não informado";
  }
  return str?.length ? str : "Não informado";
}

export function formatStr(str: string | undefined | null): string {
  if (typeof str !== "string") {
    return "desconhecido";
  }
  return str.toLowerCase();
}
