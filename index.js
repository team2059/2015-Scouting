"use strict";
var app,
    scoutingSocket = require("./lib/sockets.js"),
    scoutingData = require("./lib/data.js"),
    fs = require("fs");
app = {};

app.name = "2015-Scouting :)";

// TODO: Replace this with the package declaration.
app.reserve = ["", "monitor","results"];

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


// TODO: Get this working.
app.module = function (req, res, next) {
    if (req.originalUrl.split("/")[1] === "results") {
        app.data.getAllAverages(function(result) {
            req.post_info.modules.push({
                "type": "table",
                "table": true,
                "class": "module",
                "title": "Results",
                "content": result
            });
            next();
        });
    } else {
        return next();
    }
};

module.exports = app;