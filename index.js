var app, admin_modules, module_html,
    scouting_modules,
    scoutingSocket = require("./lib/sockets.js"),
    scoutingData = require("./lib/data.js"),
    fs = require("fs");
app = {};

app.name = "2015-Scouting :)";
app.reserve = ["","scout"];

function openBody(cb) {
    fs.readFile("content/apps/2015-Scouting/lib/modules.html", "utf8", function (err, data) {
        if (err) {
            console.log(err);
        } else {
            if (data.indexOf("_____") >= 0) {
                module_html = data.split("_____");
                for (var i = 0; i < module_html.length; i++) {
                    if (module_html[i].indexOf("=====") >= 0) {
                        module_html[i] = module_html[i].split("=====");
                    }
                }
            } else {
                module_html = [[],[]];
            }
        }
        cb();
    });
}

function loadModules(modules,num) {
    var new_modules = [];
    for (var x = 0; x < modules.length; x++) {
        if (modules[x].html) {
            if (module_html[num][modules[x].ord]) {
                modules[x].content.body = module_html[num][modules[x].ord];
            } else {
                modules[x].content.body = "";
            }
        }
        new_modules.push(modules[x]);
    }
    return new_modules;
}

function openScript() {
    fs.readFile('content/apps/2015-Scouting/scripts.js', function (err, data) {
        if (!err) {
            var module_list = [
                {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Match #<span class=\"match-number\">--</span>",
                    "content": {},
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
                    "content": {},
                    "ord": 3
                }, {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Bins",
                    "content": {},
                    "ord": 4
                }, {
                    "type": "html",
                    "html": true,
                    "class": "module half",
                    "title": "Coopertition",
                    "content": {},
                    "ord": 5
                },
                {
                    "type": "script",
                    "script": true,
                    "content": data.toString()
                }];
            scouting_modules = loadModules(module_list,0);
            module_list = [
            {
                "type": "html",
                "html": true,
                "class": "module half",
                "title": "Dashboard",
                "content": {
                    "body": "<div class=\"panel\">Test.</div>"
                }
            }
            ];
            admin_modules = loadModules(module_list,1);
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
    }, function(err,row) {
        self.data.createTable({ "name":"match_scouting",
            "columns": [
                "event CHAR(6) DEFAULT NULL", "round SMALLINT(3) DEFAULT NULL", "team SMALLINT(4) DEFAULT NULL", "scouter CHAR", "tt1 SMALLINT(2) DEFAULT 0", "tt2 SMALLINT(2) DEFAULT 0", "tt3 SMALLINT(2) DEFAULT 0", "tt4 SMALLINT(2) DEFAULT 0", "tt5 SMALLINT(2) DEFAULT 0", "tt6 SMALLINT(2) DEFAULT 0", "tb1 SMALLINT(2) DEFAULT 0", "tb2 SMALLINT(2) DEFAULT 0", "tb3 SMALLINT(2) DEFAULT 0", "tb4 SMALLINT(2) DEFAULT 0", "tb5 SMALLINT(2) DEFAULT 0", "tb6 SMALLINT(2) DEFAULT 0"
            ]
        }, function(err,row) {
            self.data = scoutingData(self.data);
            scoutingSocket.init(self.data);
            openBody(openScript);
            var sock = self.sockets.of("/scout");
            sock.on("connection",scoutingSocket.start);
        });
    });
}

app.module = function(req,res,next) {
    if (req.root === "") {
        for (var x in scouting_modules){
            req.post_info.modules.push(scouting_modules[x]);
        }
    } else {
        for (var x in admin_modules) {
            req.post_info.modules.push(admin_modules[x]);
        }
    }
    next();
};

module.exports = app;