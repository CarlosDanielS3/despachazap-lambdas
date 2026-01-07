import { connect, disconnect, model, Model, Schema } from "mongoose";
import { CarPlateData } from "../types/car-plate";

const carPlateDataSchema = new Schema<CarPlateData>({
  MARCA: String,
  MODELO: String,
  SUBMODELO: String,
  VERSAO: String,
  ano: String,
  anoModelo: String,
  chassi: String,
  codigoSituacao: String,
  cor: String,
  data: String,
  extra: {
    ano_fabricacao: String,
    ano_modelo: String,
    caixa_cambio: String,
    cap_maxima_tracao: String,
    carroceria: String,
    chassi: String,
    cilindradas: String,
    combustivel: String,
    di: String,
    eixo_traseiro_dif: String,
    eixos: String,
    especie: String,
    faturado: String,
    grupo: String,
    limite_restricao_trib: String,
    linha: String,
    media_preco: Schema.Types.Mixed,
    modelo: String,
    motor: String,
    municipio: String,
    nacionalidade: String,
    peso_bruto_total: String,
    placa: String,
    placa_modelo_antigo: String,
    placa_modelo_novo: String,
    quantidade_passageiro: String,
    registro_di: String,
    restricao_1: String,
    restricao_2: String,
    restricao_3: String,
    restricao_4: String,
    s_especie: String,
    segmento: String,
    situacao_chassi: String,
    situacao_veiculo: String,
    sub_segmento: String,
    terceiro_eixo: String,
    tipo_carroceria: String,
    tipo_doc_faturado: String,
    tipo_doc_importadora: String,
    tipo_doc_prop: String,
    tipo_montagem: String,
    tipo_veiculo: String,
    uf: String,
    uf_faturado: String,
    uf_placa: String,
    unidade_local_srf: String,
  },
  fipe: {
    dados: [
      {
        ano_modelo: String,
        codigo_fipe: String,
        codigo_marca: Number,
        codigo_modelo: String,
        combustivel: String,
        id_valor: Number,
        mes_referencia: String,
        referencia_fipe: Number,
        score: Number,
        sigla_combustivel: String,
        texto_marca: String,
        texto_modelo: String,
        texto_valor: String,
        tipo_modelo: Number,
      },
    ],
  },
  listamodelo: [String],
  logo: String,
  marca: String,
  marcaModelo: String,
  mensagemRetorno: String,
  modelo: String,
  municipio: String,
  origem: String,
  placa: String,
  placa_alternativa: String,
  situacao: String,
  token: String,
  uf: String,
});

let cachedModel: Model<CarPlateData> | null = null;

export function getCarPlateModel(): Model<CarPlateData> {
  if (cachedModel) {
    return cachedModel;
  }
  cachedModel = model<CarPlateData>("CarPlateData", carPlateDataSchema);
  return cachedModel;
}

export async function connectToMongoDB(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error("MONGO_URL environment variable is not set");
  }
  await connect(mongoUrl);
}

export async function disconnectFromMongoDB(): Promise<void> {
  await disconnect();
}
