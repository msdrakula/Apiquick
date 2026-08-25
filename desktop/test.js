const { app } = require('electron');
console.log('app type:', typeof app);
if (app) {
  console.log('app is ready:', app.isReady);
} else {
  console.log('app is undefined');
}
