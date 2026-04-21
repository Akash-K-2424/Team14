const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/resuai')
  .then(() => {
    console.log('Connected!');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
