/* DEPENDENCIES */
var express = require('express'),
hbs = require('hbs'),
app = require('express')(),
server = require('http').Server(app),
io = require('socket.io')(server),
sqlite3 = require('sqlite3').verbose(),
db = new sqlite3.Database('2015_scouting_data.db');

/* GLOBAL VARIABLES */
var current_match = 1,
current_event = "2012nc";

/* INITIALIZE DATABASE ON STARTUP */
db.run("CREATE table if not exists matches (event CHAR(6), round SMALLINT(3), r1 SMALLINT(4), r2 SMALLINT(4), r3 SMALLINT(4), b1 SMALLINT(4), b2 SMALLINT(4), b3 SMALLINT(4), rscore SMALLINT(3), bscore SMALLINT(3))");
db.run("CREATE table if not exists match_scouting (event CHAR(6), round SMALLINT(3), team SMALLINT(4), scouter CHAR, tt1 SMALLINT(2), tt2 SMALLINT(2), tt3 SMALLINT(2), tt4 SMALLINT(2), tt5 SMALLINT(2), tt6 SMALLINT(2), tb1 SMALLINT(2), tb2 SMALLINT(2), tb3 SMALLINT(2), tb4 SMALLINT(2), tb5 SMALLINT(2), tb6 SMALLINT(2))");

/* SOCKETS */

io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    /* SQL QUERIES */
    function get_teams(event,match){
        db.get("SELECT r1,r2,r3,b1,b2,b3 FROM matches WHERE event = $event AND round = $round", {$event: event, $round: match}, function(err,row){
            socket.emit('new teams', row );
        });
    }
    
    /* SEND */
    
    function next_round(){
        current_match += 1;
        socket.emit('new match', current_match);
        get_teams(current_event,current_match);
    }
    
    socket.on('get teams', function (data) {
         get_teams(current_event,current_match);
    });
    
    socket.on('get match', function (data) {
         socket.emit('new match', current_match);
    });
    
    /* RECIEVE */
    socket.on('new team', function(data) {
        console.log(data);
    });
});

server.listen(80);

/* USE THE BLUE ALLIANCE API TO POPULATE MATCH DATABASE */
function get_match_data(event) {
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
                    }
                }
                teams_list.unshift(match_data[x]["match_number"]);
                teams_list.unshift(event);
                db.run("INSERT INTO matches (event,round,r1,r2,r3,b1,b2,b3) VALUES (?,?,?,?,?,?,?,?)",teams_list);
                console.log(teams_list);
            }
        }
    })
}



app.set('view engine', 'hbs');
hbs.registerPartials(__dirname+'/views/partials');

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/admin', function (req, res) {
    res.render('admin');
});
//    get_teams("2012nc",1);
