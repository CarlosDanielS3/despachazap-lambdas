import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_KEY);

export const handler = async (event, context) => {
  const { plate, name, phone } = JSON.parse(event.body);

  let customer_id = null;

  let customerQuery = null;
  try {
    customerQuery = await stripe.customers.search({
      query: `phone:${phone}`,
    });
  } catch (error) {
    console.log("customer not found");
  }

  if (customerQuery?.data?.length) {
    customer_id = customerQuery.data[0].id;
  } else {
    console.info("creating new customer");
    const customer = await stripe.customers.create({
      name,
      phone,
      preferred_locales: ["pt-BR"],
      metadata: {
        plate: plate,
      },
    });

    customer_id = customer.id;

    console.log("customer created", customer_id);
  }

  const invoice_data = await stripe.invoices.create({
    auto_advance: true,
    currency: "BRL",
    collection_method: "charge_automatically",
    payment_settings: {
      payment_method_types: ["card"],
    },
    customer: customer_id,
    description: `Pagamento de Consulta de placa ${plate}`,
  });

  await stripe.invoiceItems.create({
    amount: 300,
    invoice: invoice_data.id,
    currency: "BRL",
    customer: customer_id,
    description: `Pagamento de Consulta de placa ${plate}`,
  });

  const invoice_finalization = await stripe.invoices.finalizeInvoice(
    invoice_data.id,
    {}
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ url: invoice_finalization.hosted_invoice_url }),
  };
};
