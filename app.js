var express = require('express');
var app = express();
const PORT = 8080;
const HOST = '0.0.0.0'

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

