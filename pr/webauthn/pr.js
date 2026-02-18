const windowLocalStorageIdentifier = "Credential #1"

document.getElementById('createButton').addEventListener('click', async () => {
  publicKeyCredential = await createCredential(/*setPaymentExtension=*/false);
  console.log(publicKeyCredential);
  info('enrolled: ' + objectToString(publicKeyCredential));

  window.localStorage.setItem(windowLocalStorageIdentifier,
    arrayBufferToBase64(publicKeyCredential.rawId));
  window.parent.postMessage({
    type: 'enrollment',
    credential": publicKeyCredential.id,
  }, '*');

  document.getElementById('triggerSpcButton').disabled = false;
});

document.getElementById('triggerSpcButton').addEventListener('click', async () => {
  const request = await createSPCPaymentRequest({
    credentialIds: [base64ToArray(window.localStorage.getItem(windowLocalStorageIdentifier))],
  });
  const instrumentResponse = await request.show();
  await instrumentResponse.complete('success')
  console.log(instrumentResponse);
  info(windowLocalStorageIdentifier + ' payment response: ' +
    objectToString(instrumentResponse));
});
