export interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
};

export function createSuccessResponse<T>(data: T): LambdaResponse {
  return {
    statusCode: 200,
    headers: { 
      "content-type": "application/json",
      ...CORS_HEADERS
    },
    body: JSON.stringify(data),
  };
}

export function createErrorResponse(
  statusCode: number,
  message: string
): LambdaResponse {
  return {
    statusCode,
    headers: { 
      "content-type": "application/json",
      ...CORS_HEADERS
    },
    body: JSON.stringify({ error: message }),
  };
}
