/* DEPENDENCIES */
var app = require('express')(), // Express framework for web applications http://expressjs.com/
    hbs = require('hbs'), // Express wrapper for Handlebars https://github.com/donpark/hbs
    server = require('http').Server(app), // Start server with Express and http
    io = require('socket.io')(server), // Socket.io real-time engine http://socket.io/
    sqlite3 = require('sqlite3').verbose(), // SQLite3 database https://github.com/mapbox/node-sqlite3
    db = new sqlite3.Database('2015_scouting_data.db'); // Create or connect to the database

/* GLOBAL VARIABLES */
var current_match = 1, // Defaults to 1
    current_event = "2012nc", // TODO: Create config.json file for setting up defaults
    current_teams = {},
    current = {
        "r1": { "open": true, "user": null},
        "r2": { "open": true, "user": null},
        "r3": { "open": true, "user": null},
        "b1": { "open": true, "user": null},
        "b2": { "open": true, "user": null},
        "b3": { "open": true, "user": null},
    };

/* INITIALIZE DATABASE ON STARTUP */
db.run("CREATE table if not exists matches (event CHAR(6), round SMALLINT(3), r1 SMALLINT(4), r2 SMALLINT(4), r3 SMALLINT(4), b1 SMALLINT(4), b2 SMALLINT(4), b3 SMALLINT(4), rscore SMALLINT(3), bscore SMALLINT(3))"); // Create matches table
db.run("CREATE table if not exists match_scouting (event CHAR(6) DEFAULT NULL, round SMALLINT(3) DEFAULT NULL, team SMALLINT(4) DEFAULT NULL, scouter CHAR, tt1 SMALLINT(2) DEFAULT 0, tt2 SMALLINT(2) DEFAULT 0, tt3 SMALLINT(2) DEFAULT 0, tt4 SMALLINT(2) DEFAULT 0, tt5 SMALLINT(2) DEFAULT 0, tt6 SMALLINT(2) DEFAULT 0, tb1 SMALLINT(2) DEFAULT 0, tb2 SMALLINT(2) DEFAULT 0, tb3 SMALLINT(2) DEFAULT 0, tb4 SMALLINT(2) DEFAULT 0, tb5 SMALLINT(2) DEFAULT 0, tb6 SMALLINT(2) DEFAULT 0)"); // Create match_scouting table

/* SOCKETS */

var allClients = [],
    client_post = [];
io.on('connection', function (socket) {
    
    /* GLOBALS */
    
    allClients.push(socket);

    /* SQL QUERIES */

    function get_teams(event,match,toAll){
        db.get("SELECT r1,r2,r3,b1,b2,b3 FROM matches WHERE event = $event AND round = $round", {$event: event, $round: match}, function(err,row){
            current_teams = row;
            var is_open = [];
            for (x in current) {
                is_open.push(current[x]["open"]);
            }
            if (toAll) {
                socket.broadcast.emit('new teams', {"team":row, "open":is_open});
            } else {
                socket.emit('new teams', {"team":row, "open":is_open});
            }
        });
    }

    /* SEND */

    function next_round() { // Update all clients to the next round
        current_match += 1;
        socket.emit('new match', current_match);
        get_teams(current_event,current_match);
    }
    
    function new_teams(data) { // Recieved when a new client is connected
        console.log(data);
        if (current[data["team"]]) {
            current[data["team"]]["open"] = data["open"];
            current[data["team"]]["user"] = data["name"];
        }
        get_teams(current_event,current_match,true);
    }

    socket.on('get teams', function (data) { // Send back list of current teams in the current match
        get_teams(current_event,current_match,false);
    });

    socket.on('get match', function (data) { // Send back the current match number
        socket.emit('new match', current_match);
    });

    /* RECIEVE */

    socket.on('new team', function (data) {
        var i = allClients.indexOf(socket);
        client_post[i] = data["team"]; // Update client position
        new_teams(data)
    });

    socket.on('update value', function(data) { // Command to update new value
        console.log(data);
        var update_team = current_teams[data["position"]];
        if (update_team) {
            try {
                console.log(update_team);
                db.run("UPDATE match_scouting SET "+data["key"]+"="+parseInt(data["value"])+" WHERE event='"+current_event+"' AND round="+current_match+" AND team="+update_team);
            } catch(e) {
                socket.emit('new error', {"message": "Error."})
            }
        } else {
            socket.emit('new error', {"message": "Please indicate which team you are scouting."})
        }
    });
    
    socket.on('disconnect', function(){
        var i = allClients.indexOf(socket);
        delete allClients[i];
        new_teams({'team':client_post[i], 'name':null, 'open':true});
        delete client_post[i];
    });

});

server.listen(80);

/* USE THE BLUE ALLIANCE API TO POPULATE MATCH DATABASE */
function get_match_data(event) { // Pull complete schedule from an event
    var request = require('request'),
        teams_list = [],
        cells = ["b1","b2","b3","r1","r2","r3"];
    request('http://thebluealliance.com/api/v2/event/'+event+'/matches?X-TBA-App-Id=frc2059:2015-Scouting:v0-0-0', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var match_data = JSON.parse(body);
            for (var x = 0; x < match_data.length; x++) {
                if (match_data[x]["comp_level"] !== "qm") {
                    continue;
                }
                teams_list = [];
                for (z in match_data[x]["alliances"]) {
                    for (var y = 0; y < match_data[x]["alliances"][z]["teams"].length; y++) {
                        teams_list.push(match_data[x]["alliances"][z]["teams"][y].replace(/\D/g,''));
                        db.run("INSERT INTO match_scouting (event,round,team) VALUES (?,?,?)",[event,match_data[x]["match_number"],match_data[x]["alliances"][z]["teams"][y].replace(/\D/g,'')]);
                    }
                }
                teams_list.unshift(match_data[x]["match_number"]);
                teams_list.unshift(event);
                db.run("INSERT INTO matches (event,round,r1,r2,r3,b1,b2,b3) VALUES (?,?,?,?,?,?,?,?)",teams_list);
            }
        }
    })
}



app.set('view engine', 'hbs'); // Connect handlebars to Express
hbs.registerPartials(__dirname+'/views/partials'); // Designate partials folder for handlebars

app.get('/', function (req, res) { // Index - used for client input
    res.render('index');
});

app.get('/admin', function (req, res) { // Admin - used to edit entries and view current clients. 
    res.render('admin');
});

module.exports = app;