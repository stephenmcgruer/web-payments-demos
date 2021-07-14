const textEncoder = new TextEncoder();

/**
 * Creates a credential for SPC, and stores the credential ID in localStorage
 * for later use when authenticating.
 */
async function createPaymentCredential(windowLocalStorageIdentifier) {
  const rp = {
    id: 'stephenmcgruer.github.io',
    name: 'Stephen McGruer',
  };
  const instrument = {
    displayName: 'Troy ····',
    icon: 'https://stephenmcgruer.github.io/web-payments-demos/pr/spc/troy.png',
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
    const credential = await navigator.credentials.create({payment});
    window.localStorage.setItem(
        windowLocalStorageIdentifier,
        btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
    info(windowLocalStorageIdentifier + ': Credential ' +
         window.localStorage.getItem(windowLocalStorageIdentifier) +
         ' enrolled.');
  } catch (err) {
    error(err);
  }
}

async function onBuyClicked(windowLocalStorageIdentifier) {
  if (!window.PaymentRequest) {
    error('PaymentRequest API is not supported.');
    return;
  }

  const request = await buildPaymentRequest(window.localStorage.getItem(windowLocalStorageIdentifier));
  if (!request)
    return;

  try {
    const instrumentResponse = await request.show();
    await instrumentResponse.complete('success')
    info(windowLocalStorageIdentifier + ': ' + JSON.stringify(instrumentResponse, undefined, 2));

    await validate(instrumentResponse.details);
  } catch (err) {
    error(err);
  }
}

/**
 * Builds a PaymentRequest object for SPC authentication and returns it.
 */
async function buildPaymentRequest(credentialId) {
  if (!window.PaymentRequest) {
    return null;
  }

  const instrument = {
    displayName: 'Troy ····',
    icon: 'https://stephenmcgruer.github.io/web-payments-demos/pr/spc/troy.png',
  };

  let request = null;

  try {
    const challengeData = textEncoder.encode('network_data');
    const supportedInstruments = [{
      supportedMethods: 'secure-payment-confirmation',
      data: {
        action: 'authenticate',
        instrument: instrument,   // For Chrome >= M93
        credentialIds: [Uint8Array.from(atob(credentialId), c => c.charCodeAt(0))],
        challenge: challengeData,
        networkData: challengeData,  // Handle Chrome < M93
        timeout: 60000,
        fallbackUrl: ''
      },
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
    throw err;
  }

  return request;
}

/**
 * Example code for validating the payments parts of the response returned by SPC.
 *
 * This is an EXAMPLE ONLY and should not be used in production code! For a
 * start, general WebAuthn validation should also be done; see
 * https://w3c.github.io/webauthn/#sctn-verifying-assertion
 */
async function validate(details) {
  let authenticatorData, clientDataJSON, signature, challenge;

  if (details.constructor === PublicKeyCredential) {
    // WebAuthn-style response (>= M93).
    info("Detected new WebAuthn-style response");

    authenticatorData = details.response.authenticatorData;  // ArrayBuffer
    clientDataJSON = details.response.clientDataJSON;  // ArrayBuffer
    signature = details.response.signature;  // ArrayBuffer

    const clientData = JSON.parse(arrayBufferToString(clientDataJSON));
    challenge = clientData.challenge

    // assert(challenge == base64url encoding of input challenge to SPC).

    const paymentInfo = clientData.payment;

    // TODO: Fix this.
    // assert(paymentInfo.??? is ???)
    // assert(paymentInfo.total.currency is as expected)
    // assert(paymentInfo.total.amount is as expected)
  } else {
    // Legacy SPC response (<M93).
    info("Detected Legacy SPC response");

    authenticatorData = details.info.authenticator_data;  // base64url-encoded
    clientDataJSON = details.info.client_data_json;  // base64url-encoded
    signature = details.signature;  // base64url-encoded

    // TODO: Assumes base64, not base64url. May break on some inputs.
    const clientData = JSON.parse(atob(clientDataJSON));
    challenge = clientData.challenge;

    const spcChallenge = JSON.parse(details.challenge);
    // assert(spcChallenge.networkData == arrayBufferToString(input challenge to SPC))

    const paymentInfo = spcChallenge.merchantData;

    // assert(paymentInfo.merchantOrigin is as expected)
    // assert(paymentInfo.total.currency is as expected)
    // assert(paymentInfo.total.amount is as expected)

    // Checking the signature requires that authenticatorData and
    // clientDataJSON are ArrayBuffers.
    authenticatorData = base64ToArray(clientDataJSON);
    clientDataJSON = base64ToArray(clientDataJSON);
  }

  // Let hash be the result of computing a hash over the cData using SHA-256.
  let hash = await crypto.subtle.digest("SHA-256", clientDataJSON)

  // Using credentialPublicKey, verify that sig is a valid signature over the binary concatenation of authData and hash.
  let concated = concatBuffers(authenticatorData, hash)
  // TODO: Validate signature.
}

function arrayBufferToString(buffer) {
  return String.fromCharCode(...new Uint8Array(input));
}

function base64ToArray(input) {
  // TODO: Assumes base64, not base64url. May break on some inputs.
  return Uint8Array.from(atob(input), c => c.charCodeAt(0))
}

function concatBuffers(buf1, buf2) {
  let tmp = new Uint8Array(buf1.byteLength + buf2.byteLength);
  tmp.set(new Uint8Array(buf1), 0);
  tmp.set(new Uint8Array(buf2), buf1.byteLength);
  return tmp.buffer;
}
