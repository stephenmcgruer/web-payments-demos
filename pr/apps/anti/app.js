self.addEventListener('install', (evt) => {
    console.log('Installed');
});

self.addEventListener('canmakepayment', function(c)  {
  c.respondWith(!1);
  console.log('Can Make Payment Event');
});

self.addEventListener('paymentrequest', (evt) => {
    console.log('Payment requested');
    evt.respondWith({
        methodName: 'https://stephenmcgruer.github.io/web-payments-demos',
        details: {
            token: '0987654321',
        },
    });
});
