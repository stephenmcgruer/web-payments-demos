let credentialId;

document.getElementById('createButton').addEventListener('click', async () => {
  const publicKeyCredential = await createCredential(/*setPaymentExtension=*/false);
  console.log(publicKeyCredential);
  info('enrolled: ' + objectToString(publicKeyCredential));
  document.getElementById('triggerSpcButton').disabled = false;
});

document.getElementById('triggerSpcButton').addEventListener('click', async () => {
});
