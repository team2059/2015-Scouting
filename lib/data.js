var fs = require('fs'),
    path = require('path'),
    prompt = require('prompt'),
    theBlueAlliance = require("tba")({id:"team2059", description:"2015-Scouting", version:"0.0.0"});

module.exports = function(data) {
    data.get_teams = function(event,match,cb){
        data.db.get("SELECT r1,r2,r3,b1,b2,b3 FROM matches WHERE event = $event AND round = $round", {$event: event, $round: match}, function(err,row){
            if (!err) {
                cb(err,row);
            } else {
                cb(err);
            }
        });
    };
    data.update_team = function(key,value,current_event,current_match,update_team) {
        data.db.run("UPDATE match_scouting SET " + key + "=" + parseInt(value) + " WHERE event='" + current_event + "' AND round=" + current_match + " AND team=" + update_team);
    };


    /* USE THE BLUE ALLIANCE API TO POPULATE MATCH DATABASE */
    function get_match_data(event) { // Pull complete schedule from an event
        var request = require('request'),
            teams_list = [],
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
            console.log(err)
        }
    })
    return data;
}