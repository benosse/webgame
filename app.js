var express = require('express');
var path = require("path");
var app = express();

app.use(express.static( path.join(__dirname, 'static')));

app.get('/:location', function (req, res) {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});

app.listen(5000);
console.log("serving on port 5000")
