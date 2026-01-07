/// <reference types="../shared_layer_types" />

declare module "@utils/mongodb" {
  import mongoose from "mongoose";
  export function connectToMongoDB(): Promise<void>;
  export function disconnectFromMongoDB(): Promise<void>;
  export function getCarPlateModel(): mongoose.Model<any>;
}

declare module "@utils/response" {
  import { APIGatewayProxyResult } from "aws-lambda";
  export function createSuccessResponse(data: any): APIGatewayProxyResult;
  export function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult;
}

declare module "@utils/validators" {
  export function validateCarPlate(plate: string): boolean;
  export function isValidPlate(plate: string): boolean;
  export function normalizePlate(plate: string): string;
}

declare module "@utils/env" {
  export function getRequiredEnv(key: string): string;
  export function defaultString(str: string | undefined | null | number): string;
  export function formatStr(str: string | undefined | null): string;
}

declare module "@utils/s3" {
  export function uploadPdfToS3(
    fileBuffer: ArrayBuffer,
    placa: string,
    modelo: string,
    marca: string
  ): Promise<string>;
}

declare module "@shared/car-plate" {
  export interface FipeData {
    ano_modelo: string;
    codigo_fipe: string;
    codigo_marca: number;
    codigo_modelo: string;
    combustivel: string;
    id_valor: number;
    mes_referencia: string;
    referencia_fipe: number;
    score: number;
    sigla_combustivel: string;
    texto_marca: string;
    texto_modelo: string;
    texto_valor: string;
    tipo_modelo: number;
  }

  export interface CarPlateExtra {
    ano_fabricacao: string;
    ano_modelo: string;
    caixa_cambio: string;
    cap_maxima_tracao: string;
    carroceria: string;
    chassi: string;
    cilindradas: string;
    combustivel: string;
    di: string;
    eixo_traseiro_dif: string;
    eixos: string;
    especie: string;
    faturado: string;
    grupo: string;
    limite_restricao_trib: string;
    linha: string;
    media_preco: any;
    modelo: string;
    motor: string;
    municipio: string;
    nacionalidade: string;
    peso_bruto_total: string;
    placa: string;
    placa_modelo_antigo: string;
    placa_modelo_novo: string;
    quantidade_passageiro: string;
    registro_di: string;
    restricao_1: string;
    restricao_2: string;
    restricao_3: string;
    restricao_4: string;
    s_especie: string;
    sub_tipo: string;
    tipo: string;
    tipo_carroceria: string;
    tipo_doc_faturado: string;
    tipo_doc_prop: string;
    tipo_doc_importadora: string;
    tipo_montagem: string;
    uf: string;
    uf_faturado: string;
    renavam: string;
    situacao_chassi: string;
    [key: string]: any;
  }

  export interface CarPlateData {
    placa: string;
    marca: string;
    modelo: string;
    versao: string;
    ano: string;
    anoModelo: string;
    cor: string;
    chassi: string;
    combustivel: string;
    procedencia: string;
    uf: string;
    municipio: string;
    situacao: string;
    extra: CarPlateExtra;
    fipe: {
      sucesso: boolean;
      mensagem: string;
      dados: FipeData[];
    };
    baseEstadual: {
      anoExercicio: string;
      chassi: string;
      codigoFinanceiro: number;
      renavam: string;
      placa: string;
      anoFabricacao: string;
      anoModelo: string;
      codigoMunicipio: number;
      municipio: string;
      uf: string;
      cor: string;
      marca: string;
      modelo: string;
      categoria: string;
      especie: string;
      capacidadePassageiros: string;
      cilindrada: string;
      combustivel: string;
      procedencia: string;
      numeroMotor: string;
      situacaoVeiculo: string;
      tipoDocumentoProprietario: string;
      dataEmissaoCRV: string;
      dataLimiteRestricaoTributaria: string;
      potencia: string;
      restricao1: string;
      restricao2: string;
      restricao3: string;
      restricao4: string;
    };
    [key: string]: any;
  }
}

declare module "@models/payment-status" {
  import mongoose from "mongoose";
  
  export interface PaymentStatusDocument {
    brCode: string;
    plate: string;
    pdfUrl: string;
    createdAt: Date;
  }
  
  export function getPaymentStatusModel(): mongoose.Model<PaymentStatusDocument>;
}
