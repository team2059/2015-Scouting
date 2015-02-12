var app, scouting_modules,
    scoutingSocket = require("./lib/sockets.js"),
    scoutingData = require("./lib/data.js"),
    fs = require("fs");
app = {};

app.name = "2015-Scouting :)";
app.reserve = ["","scout"];

function openScript() {
    fs.readFile('content/apps/2015-Scouting/scripts.js', function (err, data) {
        if (!err) {
            scouting_modules = [
                {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Match #<span class=\"match-number\">--</span>",
                    "content": {
                        "body": "<div class=\"panel\"><input id=\"input-name\"><select name=\"position\" id=\"robot-id\"><option value=null></option></select></div>"
                    },
                    "ord": 1
                },
                {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Auto",
                    "content": "",
                    "ord": 2
                }, {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Totes",
                    "content": {
                        "body": "<div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-6\" /><input type=\"number\" value=\"0\" name=\"tt6\" id=\"tt6\" class=\"number tote\"></input><input type=\"button\" class=\"increase\" value=\"+6\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-5\" /><input type=\"number\" value=\"0\" name=\"tt5\" id=\"tt5\" class=\"number tote\"></input><input type=\"button\" class=\"increase\" value=\"+5\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-4\" /><input type=\"number\" value=\"0\" name=\"tt4\" id=\"tt4\" class=\"number tote\"></input><input type=\"button\" class=\"increase\" value=\"+4\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-3\" /><input type=\"number\" value=\"0\" name=\"tt3\" id=\"tt3\" class=\"number tote\"></input><input type=\"button\" class=\"increase\" value=\"+3\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-2\" /><input type=\"number\" value=\"0\" name=\"tt2\" id=\"tt2\" class=\"number tote\"></input><input type=\"button\" class=\"increase\" value=\"+2\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-1\" /><input type=\"number\" value=\"0\" name=\"tt1\" id=\"tt1\" class=\"number tote\"></input><input type=\"button\" class=\"increase\" value=\"+1\" /></div>"
                    },
                    "ord": 3
                }, {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Bins",
                    "content": {
                        "body": "<div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-6\" /><input type=\"number\" value=\"0\" name=\"tb6\" id=\"tb6\" class=\"number bin\"></input><input type=\"button\" class=\"increase\" value=\"+6\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-5\" /><input type=\"number\" value=\"0\" name=\"tb5\" id=\"tb5\" class=\"number bin\"></input><input type=\"button\" class=\"increase\" value=\"+5\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-4\" /><input type=\"number\" value=\"0\" name=\"tb4\" id=\"tb4\" class=\"number bin\"></input><input type=\"button\" class=\"increase\" value=\"+4\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-3\" /><input type=\"number\" value=\"0\" name=\"tb3\" id=\"tb3\" class=\"number bin\"></input><input type=\"button\" class=\"increase\" value=\"+3\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-2\" /><input type=\"number\" value=\"0\" name=\"tb2\" id=\"tb2\" class=\"number bin\"></input><input type=\"button\" class=\"increase\" value=\"+2\" /></div><div class=\"panel\"><input type=\"button\" class=\"decrease\" value=\"-1\" /><input type=\"number\" value=\"0\" name=\"tb1\" id=\"tb1\" class=\"number bin\"></input><input type=\"button\" class=\"increase\" value=\"+1\" /></div>"
                    },
                    "ord": 4
                }, {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Coopertition",
                    "content": {
                        "body": ""
                    },
                    "ord": 5
                },
                {
                    "type": "script",
                    "script": true,
                    "content": data
                }];
        } else {
            console.error(err);
        }
    });
}

app.start = function(THUMS) {
    var self = this;
    self.data = THUMS.data;
    self.sockets = THUMS.sockets;
    self.data.createTable({ "name":"matches",
        "columns": [
            "event CHAR(6)", "round SMALLINT(3)", "r1 SMALLINT(4)", "r2 SMALLINT(4)", "r3 SMALLINT(4)", "b1 SMALLINT(4)", "b2 SMALLINT(4)", "b3 SMALLINT(4)", "rscore SMALLINT(3)", "bscore SMALLINT(3)"
        ]
    });
    self.data = scoutingData(self.data);
    scoutingSocket.init(self.data);
    openScript();
    var sock = self.sockets.of("/scout");
    sock.on("connection",scoutingSocket.start);
};

app.module = function(req,res,next) {
    for (var x in scouting_modules){
        req.post_info.modules.push(scouting_modules[x]);
    }
    next();
};

module.exports = app;