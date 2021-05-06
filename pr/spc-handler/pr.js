/* exported createPaymentCredential */
/* exported onBuyClicked */

const textEncoder = new TextEncoder();

/**
 * Creates a payment credential.
 */
async function createPaymentCredential(windowLocalStorageIdentifier) {
  const rp = {
    id: 'stephenmcgruer.github.io',
    name: 'Stephen McGruer',
  };
  const instrument = {
    displayName: 'Troy ····',
    icon: 'https://stephenmcgruer.github.io/web-payments-demos/pr/spc-handler/troy.png',
  };
  const pubKeyCredParams = [{
    type: 'public-key',
    alg: -7,  // ECDSA, not supported on Windows.
  }, {
    type: 'public-key',
    alg: -257,  // RSA, supported on Windows.
  }];
  const authenticatorSelection = {
    userVerification: 'required',
  };
  const payment = {
    rp,
    instrument,
    challenge: textEncoder.encode('Transaction approval challenge'),
    pubKeyCredParams,
    authenticatorSelection,
  };
  try {
    const publicKeyCredential = await navigator.credentials.create({payment});
    window.localStorage.setItem(
        windowLocalStorageIdentifier,
        btoa(String.fromCharCode(...new Uint8Array(
            publicKeyCredential.rawId))));
    info(windowLocalStorageIdentifier + ': Credential ' +
         window.localStorage.getItem(windowLocalStorageIdentifier) +
         ' enrolled.');
  } catch (err) {
    error(err);
  }
}

/**
 * Initializes the payment request object.
 * @return {PaymentRequest} The payment request object.
 */
async function buildPaymentRequest() {
  if (!window.PaymentRequest) {
    return null;
  }

  let request = null;

  try {
    // Documentation:
    // https://github.com/rsolomakhin/secure-payment-confirmation
    const supportedInstruments = [{
      supportedMethods: ["https://hilarious-historical-spectrum.glitch.me/method-manifest"]
    }];

    const details = {
      total: {
        label: 'Total',
        amount: {
          currency: 'USD',
          value: '0.01',
        },
      },
    };

    request = new PaymentRequest(supportedInstruments, details);
  } catch (err) {
    error(err);
  }

  return request;
}

async function onBuyClicked() {
  if (!window.PaymentRequest) {
    error('PaymentRequest API is not supported.');
    return;
  }

  const request = await buildPaymentRequest();
  if (!request)
    return;

  try {
    const instrumentResponse = await request.show();
    await instrumentResponse.complete('success')
    info(JSON.stringify(instrumentResponse, undefined, 2));
  } catch (err) {
    error(err);
  }
}

async function checkCanMakePayment() {
  if (!window.PaymentRequest) {
    error('PaymentRequest API is not supported.');
    return;
  }
  try {
    const request = await buildPaymentRequest();
    if (!request)
      return;
    const result = await request.canMakePayment();
    if (result) {
      info("Can make payment.");
    } else {
      error("Cannot make payment.");
    }
  } catch (err) {
    error(err);
  }
}

checkCanMakePayment();
