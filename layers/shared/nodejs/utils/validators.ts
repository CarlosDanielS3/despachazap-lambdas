const PLATE_REGEX = /^[a-zA-Z]{3}[0-9][A-Za-z0-9][0-9]{2}$/;

export function isValidPlate(plate: string): boolean {
  return PLATE_REGEX.test(plate.toUpperCase());
}

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().trim();
}
