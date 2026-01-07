export interface WooviWebhookPayload {
  event: string;
  charge: {
    customer: {
      name: string;
      phone: string;
      correlationID: string;
    };
    value: string;
    identifier: string;
    correlationID: string;
    transactionID: string;
    status: string;
    additionalInfo: Array<{
      key: string;
      value: string;
    }>;
    fee: number;
    discount: number;
    valueWithDiscount: string;
    expiresDate: string;
    type: string;
    paymentLinkID: string;
    createdAt: string;
    updatedAt: string;
    paidAt: string;
    payer: {
      name: string;
      taxID: {
        taxID: string;
        type: string;
      };
      correlationID: string;
    };
    ensureSameTaxID: boolean;
    brCode: string;
    expiresIn: number;
    pixKey: string;
    paymentLinkUrl: string;
    qrCodeImage: string;
    globalID: string;
    paymentMethods?: {
      pix?: {
        method: string;
        status: string;
        value: string;
        txId: string;
        fee: number;
        brCode: string;
        transactionID: string;
        identifier: string;
        qrCodeImage: string;
      };
    };
  };
  pix: {
    debitParty: {
      account: {
        branch: string;
        account: string;
        accountType: string;
      };
      psp: {
        id: string;
        name: string;
      };
      holder: {
        taxID: {
          taxID: string;
          type: string;
        };
        name: string;
      };
    };
    creditParty: {
      pixKey: {
        pixKey: string;
        type: string;
      };
      account: {
        branch: string;
        account: string;
        accountType: string;
      };
      psp: {
        id: string;
        name: string;
      };
      holder: {
        taxID: {
          taxID: string;
          type: string;
        };
      };
    };
    customer: {
      name: string;
      phone: string;
      correlationID: string;
    };
    payer: {
      name: string;
      taxID: {
        taxID: string;
        type: string;
      };
      correlationID: string;
    };
    charge: typeof WooviWebhookPayload.prototype.charge;
    value: number;
    time: string;
    endToEndId: string;
    transactionID: string;
    status: string;
    type: string;
    fee: number;
    createdAt: string;
    globalID: string;
  };
  company: {
    id: string;
    name: string;
    taxID: string;
  };
  account: Record<string, unknown>;
}
