import axios from "axios";
import { configDotenv } from "dotenv";

import mongoose from "mongoose";

export const handler = async (event, context) => {
  configDotenv();
  try {
    await mongoose.connect(process.env.MONGO_URL);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database connection failed" }),
    };
  }

  const { plate } = JSON.parse(event.body);

  const carPlateDataSchema = new mongoose.Schema({
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
      media_preco: mongoose.Schema.Types.Mixed,
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

  const CarPlateData =
    mongoose.models.CarPlateData ||
    mongoose.model("CarPlateData", carPlateDataSchema);

  const [dbCarPlate] = await CarPlateData.find({ placa: plate.toUpperCase() });

  if (dbCarPlate) {
    return {
      headers: { "content-type": "application/json" },
      statusCode: 200,
      body: JSON.stringify(dbCarPlate),
    };
  }

  const { data } = await axios.get(
    `https://wdapi2.com.br/consulta/${plate}/${process.env.API_PLACAS_TOKEN}`
  );

  const carPlateData = new CarPlateData(data);
  await carPlateData.save();

  await mongoose.disconnect();

  return {
    headers: { "content-type": "application/json" },
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
