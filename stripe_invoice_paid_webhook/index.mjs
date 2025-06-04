import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import axios from "axios";
import fs from "fs";
import { jsPDF } from "jspdf";
import mongoose from "mongoose";

export const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const requestPayload = JSON.parse(event.body);

    const { data } = await axios.get(
      "https://backend.botconversa.com.br/api/v1/webhook/subscriber/get_by_phone/" +
        encodeURIComponent(requestPayload.data.object.customer_phone),
      {
        headers: {
          "API-KEY": process.env.BOTCONVERSA_TOKEN,
        },
      }
    );

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

    const [dbCarPlate] = await CarPlateData.find({
      placa: data.variables.placa_veiculo.toUpperCase(),
    });

    const fileUrl = await createPDF(dbCarPlate);

    if (data) {
      await axios.post(
        `https://backend.botconversa.com.br/api/v1/webhook/subscriber/${data.id}/send_message/`,
        {
          type: "text",
          value:
            "✅ Pagamento confirmado!\n\nAgora, vamos gerar o PDF com as informações completas do seu veículo. Aguarde um momento.",
        },
        {
          headers: {
            "API-KEY": process.env.BOTCONVERSA_TOKEN,
          },
        }
      );

      //await 1 sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await axios.post(
        `https://backend.botconversa.com.br/api/v1/webhook/subscriber/${data.id}/send_message/`,
        {
          type: "file",
          value: fileUrl,
        },
        {
          headers: {
            "API-KEY": process.env.BOTCONVERSA_TOKEN,
          },
        }
      );
    }

    await mongoose.disconnect();
    return {
      headers: {
        "Content-Type": "application/json",
      },
      statusCode: 200,
      body: JSON.stringify({ sucess: true }),
    };
  } catch (error) {
    console.error(error);
  }
};

async function getFileUrl(fileStream, modelo, marca) {
  const client = new S3Client();

  const fileName = `${modelo} ${marca}.pdf`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    expires: 60,
    Body: Buffer.from(fileStream),
    ContentType: "application/pdf",
  });

  await client.send(command);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  return `https://despachazap.s3.us-east-1.amazonaws.com/${fileName}`;
}

async function createPDF(dbCarPlate) {
  const marca = formatStr(dbCarPlate?.MARCA) || "Desconhecido";
  const modelo = formatStr(dbCarPlate?.MODELO) || "Desconhecido";

  const doc = new jsPDF({
    orientation: "portrait",
    format: [1080, 2900],
    putOnlyUsedFonts: true,
    unit: "px",
  });

  doc.setFont("Times", "Bold");
  const logo_image = fs.readFileSync("./sources/DespachaZap_logo_top.png");
  doc.addImage(logo_image, "PNG", 702, 95, 302, 61.81);

  const result_image = fs.readFileSync("./sources/resultado_topo.png");
  doc.addImage(result_image, "PNG", 75, 71, 320, 86);

  const vw_logo = fs.readFileSync("./sources/vw_logo.png");
  doc.addImage(vw_logo, "PNG", 95, 222, 75, 75);

  const extras_image = fs.readFileSync("./sources/extras.png");
  doc.addImage(extras_image, "PNG", 75, 595, 929, 46);

  const green_image = fs.readFileSync("./sources/green_image.png");
  doc.addImage(green_image, "PNG", 75, 668, 454, 1532);
  doc.addImage(green_image, "PNG", 559, 668, 445, 1532);

  const blue_image = fs.readFileSync("./sources/blue_image.png");
  doc.addImage(blue_image, "PNG", 75, 2300, 445, 461);
  doc.addImage(blue_image, "PNG", 559, 2300, 445, 461);

  const fipe_image = fs.readFileSync("./sources/fipe.png");
  doc.addImage(fipe_image, "PNG", 75, 2227, 929, 46);
  //texts

  addExtras(doc, dbCarPlate);
  addExtrasSection1(doc, dbCarPlate);
  addExtrasSection2(doc, dbCarPlate);
  addFipeSection1(doc, dbCarPlate);
  addFipeSection2(doc, dbCarPlate);

  return getFileUrl(doc.output("arraybuffer"), modelo, marca);
}
function defaultString(str) {
  return str?.length ? str : "Não informado";
}

function addFipeSection1(doc, dbCarPlate) {
  doc.text(
    `Marca:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.texto_marca)}`,
    95,
    2350,
    {}
  );
  doc.text(
    `Código Fipe:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.codigo_fipe)}`,
    95,
    2413,
    {}
  );
  doc.text(
    `Código Marca:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.codigo_marca)}`,
    95,
    2476,
    {}
  );
  doc.text(
    `Código Modelo:  ${defaultString(
      dbCarPlate?.fipe?.dados[0]?.codigo_modelo
    )}`,
    95,
    2539,
    {}
  );
  doc.text(
    `Combustível:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.combustivel)}`,
    95,
    2602,
    {}
  );
  doc.text(
    `ID Valor:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.id_valor)}`,
    95,
    2665,
    {}
  );
  doc.text(
    `Mês Referência:  ${defaultString(
      dbCarPlate?.fipe?.dados[0]?.mes_referencia
    )}`,
    95,
    2728,
    {}
  );
}

function addFipeSection2(doc, dbCarPlate) {
  doc.text(
    `Referência Fipe:  ${defaultString(
      dbCarPlate?.fipe?.dados[0]?.referencia_fipe
    )}`,
    579,
    2350,
    {}
  );
  doc.text(
    `Score:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.score)}`,
    579,
    2413,
    {}
  );
  doc.text(
    `Sigla Combustível:  ${defaultString(
      dbCarPlate?.fipe?.dados[0]?.sigla_combustivel
    )}`,
    579,
    2476,
    {}
  );

  doc.text(
    `Texto Marca:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.texto_marca)}`,
    579,
    2539,
    {}
  );
  doc.text(
    `Texto Modelo:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.texto_modelo)}`,
    579,
    2602,
    {}
  );
  doc.text(
    `Texto Valor:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.texto_valor)}`,
    579,
    2665,
    {}
  );
  doc.text(
    `Tipo Modelo:  ${defaultString(dbCarPlate?.fipe?.dados[0]?.tipo_modelo)}`,
    579,
    2728,
    {}
  );
}

function addExtras(doc, dbCarPlate) {
  doc.setFontSize(30);
  doc.setTextColor(5, 80, 162);

  doc.text(`Modelo:  ${defaultString(dbCarPlate?.MODELO)}`, 95, 337, {});

  doc.text(`SubModelo:  ${defaultString(dbCarPlate?.SUBMODELO)}`, 95, 400, {});

  doc.text(`Versão:  ${defaultString(dbCarPlate?.VERSAO)}`, 95, 463, {});

  doc.text(`Ano:  ${defaultString(dbCarPlate?.ano)}`, 95, 526, {});

  doc.text(
    `Ano Modelo:  ${defaultString(dbCarPlate?.anoModelo)}`,
    579,
    284,
    {}
  );

  doc.text(`Chassi:  ${defaultString(dbCarPlate?.chassi)}`, 579, 347, {});

  doc.text(
    `Código Situação:  ${defaultString(dbCarPlate?.codigoSituacao)}`,
    579,
    410,
    {}
  );

  doc.text(`Cor:  ${defaultString(dbCarPlate?.cor)}`, 579, 473, {});

  doc.text(`Data:  ${defaultString(dbCarPlate?.data)}`, 579, 536, {});
}
function addExtrasSection1(doc, dbCarPlate) {
  //extras section 1

  doc.setTextColor(255, 255, 255);
  doc.text(
    `Ano Fabricação:  ${defaultString(dbCarPlate?.extra?.ano_fabricacao)}`,
    95,
    716,
    {}
  );

  doc.text(
    `Ano Modelo:  ${defaultString(dbCarPlate?.extra?.ano_modelo)}`,
    95,
    764,
    {}
  );
  doc.text(
    `Cambio:  ${defaultString(dbCarPlate?.extra?.caixa_cambio)}`,
    95,
    814,
    {}
  );
  doc.text(`Chassi:  ${defaultString(dbCarPlate?.extra?.chassi)}`, 95, 864, {});
  doc.text(
    `Código Situação:  ${defaultString(dbCarPlate?.extra?.situacao_veiculo)}`,
    95,
    927,
    {}
  );

  doc.text(
    `Capacidade máxima tração:  ${defaultString(
      dbCarPlate?.extra?.cap_maxima_tracao
    )}`,
    95,
    990,
    {}
  );

  doc.text(
    `Carroceria:  ${defaultString(dbCarPlate?.extra?.carroceria)}`,
    95,
    1053,
    {}
  );

  doc.text(
    `Cilindradas:  ${defaultString(dbCarPlate?.extra?.cilindradas)}`,
    95,
    1116,
    {}
  );

  doc.text(
    `Combustível:  ${defaultString(dbCarPlate?.extra?.combustivel)}`,
    95,
    1179,
    {}
  );

  doc.text(`DI:  ${defaultString(dbCarPlate?.extra?.di)}`, 95, 1242, {});

  doc.text(
    `Eixo traseiro dif:  ${defaultString(
      dbCarPlate?.extra?.eixo_traseiro_dif
    )}`,
    95,
    1305,
    {}
  );

  doc.text(`Eixos:  ${defaultString(dbCarPlate?.extra?.eixos)}`, 95, 1368, {});

  doc.text(
    `Espécie:  ${defaultString(dbCarPlate?.extra?.especie)}`,
    95,
    1431,
    {}
  );

  doc.text(
    `Faturado:  ${defaultString(dbCarPlate?.extra?.faturado)}`,
    95,
    1494,
    {}
  );

  doc.text(`Grupo:  ${defaultString(dbCarPlate?.extra?.grupo)}`, 95, 1557, {});

  doc.text(
    `Limite Restrição Trib:  ${defaultString(
      dbCarPlate?.extra?.limite_restricao_trib
    )}`,
    95,
    1620,
    {}
  );

  doc.text(`Linha:  ${defaultString(dbCarPlate?.extra?.linha)}`, 95, 1683, {});

  doc.text(
    `Média Preço:  ${defaultString(dbCarPlate?.extra?.media_preco)}`,
    95,
    1746,
    {}
  );

  doc.text(
    `Modelo:  ${defaultString(dbCarPlate?.extra?.modelo)}`,
    95,
    1809,
    {}
  );
  doc.text(`Motor:  ${defaultString(dbCarPlate?.extra?.motor)}`, 95, 1872, {});

  doc.text(
    `Município:  ${defaultString(dbCarPlate?.extra?.municipio)}`,
    95,
    1935,
    {}
  );

  doc.text(
    `Nacionalidade:  ${defaultString(dbCarPlate?.extra?.nacionalidade)}`,
    95,
    1998,
    {}
  );

  doc.text(
    `Peso Bruto Total:  ${defaultString(dbCarPlate?.extra?.peso_bruto_total)}`,
    95,
    2061,
    {}
  );

  doc.text(`Placa:  ${defaultString(dbCarPlate?.extra?.placa)}`, 95, 2124, {});
}

function formatStr(str) {
  str.tolowerCase;

  return str;
}

function addExtrasSection2(doc, dbCarPlate) {
  doc.text(
    `Placa Antigo:  ${defaultString(dbCarPlate?.extra?.placa_modelo_antigo)}`,
    579,
    716,
    {}
  );

  doc.text(
    `Placa Novo:  ${defaultString(dbCarPlate?.extra?.placa_modelo_novo)}`,
    579,
    764,
    {}
  );

  doc.text(
    `Quantidade Passageiro:  ${defaultString(
      dbCarPlate?.extra?.quantidade_passageiro
    )}`,
    579,
    814,
    {}
  );

  doc.text(
    `Registro DI:  ${defaultString(dbCarPlate?.extra?.registro_di)}`,
    579,
    866,
    {}
  );

  doc.text(
    `Restrição 1:  ${defaultString(dbCarPlate?.extra?.restricao_1)}`,
    579,
    929,
    {}
  );

  doc.text(
    `Restrição 2:  ${defaultString(dbCarPlate?.extra?.restricao_2)}`,
    579,
    992,
    {}
  );
  doc.text(
    `Restrição 3:  ${defaultString(dbCarPlate?.extra?.restricao_3)}`,
    579,
    1055,
    {}
  );

  doc.text(
    `Restrição 4:  ${defaultString(dbCarPlate?.extra?.restricao_4)}`,
    579,
    1118,
    {}
  );

  doc.text(
    `S. Espécie:  ${defaultString(dbCarPlate?.extra?.["s.especie"])}`,
    579,
    1181,
    {}
  );

  doc.text(
    `Segmento:  ${defaultString(dbCarPlate?.extra?.segmento)}`,
    579,
    1244,
    {}
  );

  doc.text(
    `Situação Chassi:  ${defaultString(dbCarPlate?.extra?.situacao_chassi)}`,
    579,
    1307,
    {}
  );

  doc.text(
    `Situação Veículo:  ${defaultString(dbCarPlate?.extra?.situacao_veiculo)}`,
    579,
    1370,
    {}
  );

  doc.text(
    `Sub Segmento:  ${defaultString(dbCarPlate?.extra?.sub_segmento)}`,
    579,
    1433,
    {}
  );

  doc.text(
    `Terceiro Eixo:  ${defaultString(dbCarPlate?.extra?.terceiro_eixo)}`,
    579,
    1496,
    {}
  );

  doc.text(
    `Tipo Carroceria:  ${defaultString(dbCarPlate?.extra?.tipo_carroceria)}`,
    579,
    1559,
    {}
  );

  doc.text(
    `Tipo Doc Faturado:  ${defaultString(
      dbCarPlate?.extra?.tipo_doc_faturado
    )}`,
    579,
    1622,
    {}
  );

  doc.text(
    `Tipo Doc Importadora:  ${defaultString(
      dbCarPlate?.extra?.tipo_doc_importadora
    )}`,
    579,
    1685,
    {}
  );

  doc.text(
    `Tipo Doc Prop:  ${defaultString(dbCarPlate?.extra?.tipo_doc_prop)}`,
    579,
    1748,
    {}
  );

  doc.text(
    `Tipo Montagem:  ${defaultString(dbCarPlate?.extra?.tipo_montagem)}`,
    579,
    1811,
    {}
  );

  doc.text(
    `Tipo Veículo:  ${defaultString(dbCarPlate?.extra?.tipo_veiculo)}`,
    579,
    1874,
    {}
  );

  doc.text(`UF:  ${defaultString(dbCarPlate?.extra?.uf)}`, 579, 1937, {});

  doc.text(
    `UF Faturado:  ${defaultString(dbCarPlate?.extra?.uf_faturado)}`,
    579,
    2000,
    {}
  );

  doc.text(
    `UF Placa:  ${defaultString(dbCarPlate?.extra?.uf_placa)}`,
    579,
    2063,
    {}
  );

  doc.text(
    `Unidade Local SRF:  ${defaultString(
      dbCarPlate?.extra?.unidade_local_srf
    )}`,
    579,
    2126,
    {}
  );
}
