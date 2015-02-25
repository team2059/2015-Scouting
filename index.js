"use strict";
var app,
    scoutingSocket = require("./lib/sockets.js"),
    scoutingData = require("./lib/data.js"),
    fs = require("fs");
app = {};

app.name = "2015-Scouting :)";
app.reserve = ["", "scout"];

app.start = function (THUMS) {
    var self = this,
        sock;
    self.data = THUMS.data;
    self.sockets = THUMS.sockets;
    self.data = scoutingData(self.data);
    scoutingSocket.init(self.data);
    sock = self.sockets.of("/scout");
    sock.on("connection", scoutingSocket.start);
};

app.module = function (req, res, next) {
    next();
};

module.exports = app;