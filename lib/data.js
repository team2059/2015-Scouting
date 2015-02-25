var fs = require('fs'),
    path = require('path'),
    prompt = require('prompt'),
    theBlueAlliance = require("tba")({id:"team2059", description:"2015-Scouting", version:"0.0.0"});

module.exports = function(data) {
    data.get_teams = function(match,cb){
        data.db.get("SELECT r1,r2,r3,b1,b2,b3 FROM matches WHERE round = $round", {$round: match}, function(err,row){
            if (!err) {
                cb(err,row);
            } else {
                cb(err);
            }
        });
    };
    data.update_team = function(key,value,current_match,update_team) {
        if (typeof value === 'number') {
            data.db.run("UPDATE match_scouting SET " + key + "=" + key + " + " + parseInt(value) + " WHERE round=" + current_match + " AND team=" + update_team);
        } else {
            data.db.run("UPDATE match_scouting SET " + key + '="' + value + '" WHERE round=' + current_match + " AND team=" + update_team);
        }
    };

    data.getTeamFromPosition = function(round, position, callback) {
        data.db.get("SELECT " + position + " from matches where round = ?", round, function(err, data) {
            if (err) {
                return callback(err);
            }
            callback(null, data[position]);
        });
    };

    data.getTeamAverages = function(team, callback) {
        data.db.get("SELECT AVG(4 * (b6 * 6 + b5 * 5 + b4 * 4 + b3 * 3 + b2 * 2 + b1)) as binscore, AVG(2 * (t6 + t5 + t4 + t3 + t2 + t1)) as totescore, AVG(2 * (c1 + c2 + c3 + c4)) as coopscore, AVG(4 * a4 + 6 * a3 + 8 * a2 + 20 * a1) as autoscore, AVG(4 * (b6 * 6 + b5 * 5 + b4 * 4 + b3 * 3 + b2 * 2 + b1) + 2 * (t6 + t5 + t4 + t3 + t2 + t1) + 2 * (c1 + c2 + c3 + c4) + 4 * a4 + 6 * a3 + 8 * a2 + 20 * a1) as totalscore from match_scouting WHERE team = ? AND scouter IS NOT NULL", team, callback);
    };

    data.getAllAverages = function(callback) {
        'use strict';
        if (!callback) {
            return;
        }
        data.db.all("SELECT DISTINCT team FROM match_scouting", function(err, row) {
        var teams = [],
            i,
            team_data = [];
            for (i in row) {
                if (!row.hasOwnProperty(i)) {
                    continue;
                }
                teams.push(row[i].team);
            }
            function getNext() {
                var x = teams.splice(0, 1)[0];
                data.getTeamAverages(x, function(err, team_row) {
                    team_data.push(team_row);
                    console.log(teams.slice(0).length);
                    if (teams.slice(0).length == 0) {
                        console.log(team_data);
                        callback(team_data);
                    } else {
                        getNext();
                    }
                });
            }
            getNext();
        });
    };

    // Get rankings.
    data.getAllAverages(function(d) {
        console.log(d);
    });

    /* USE THE BLUE ALLIANCE API TO POPULATE MATCH DATABASE */
    function get_match_data(event) { // Pull complete schedule from an event
        var teams_list = [],
            cells = ["b1","b2","b3","r1","r2","r3"];
        theBlueAlliance.getEventMatches(event, function(err,match_data){
            if (!err) {
                for (var x = 0; x < match_data.length; x++) {
                    if (match_data[x]["comp_level"] !== "qm") {
                        continue;
                    }
                    teams_list = [];
                    for (z in match_data[x]["alliances"]) {
                        for (var y = 0; y < match_data[x]["alliances"][z]["teams"].length; y++) {
                            teams_list.push(match_data[x]["alliances"][z]["teams"][y].replace(/\D/g,''));
                            data.db.run("INSERT INTO match_scouting (event,round,team) VALUES (?,?,?)",[event,match_data[x]["match_number"],match_data[x]["alliances"][z]["teams"][y].replace(/\D/g,'')]);
                        }
                    }
                    teams_list.unshift(match_data[x]["match_number"]);
                    teams_list.unshift(event);
                    data.db.run("INSERT INTO matches (event,round,r1,r2,r3,b1,b2,b3) VALUES (?,?,?,?,?,?,?,?)",teams_list);
                }
            }
        });
    }

    data.db.get("SELECT COUNT(*) as num FROM matches", function(err,row) {
        if (!err) {
            if (row["num"] < 5) {
                console.log("No match data found.")
                prompt.start();
                prompt.get( {
                    properties: {
                        name: {
                            message: "Add new event"
                        }
                    }
                }, function(err, result) {
                    console.log("Fetching informtaion from "+result.name);
                    get_match_data(result.name);
                    console.log("Database population complete");
                });
            }
        } else {
            console.log(err);
        }
    });
    return data;
}