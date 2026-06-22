const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

app.put('/test', upload.single('image'), (req, res) => {
  res.json({ body: req.body });
});

const server = app.listen(3444, async () => {
  try {
    const res = await axios.put('http://localhost:3444/test', { status: 'under_maintenance' });
    console.log('Result:', res.data);
  } catch (err) {
    console.error(err.message);
  } finally {
    server.close();
  }
});
