var current_match = 1, // Defaults to 1
    current_event = "2014ncre", // TODO: Create config.json file for setting up defaults
    current_teams = {},
    current = {
        "r1": { "open": true, "user": null},
        "r2": { "open": true, "user": null},
        "r3": { "open": true, "user": null},
        "b1": { "open": true, "user": null},
        "b2": { "open": true, "user": null},
        "b3": { "open": true, "user": null},
    },
    allClients = [],
    client_post = [],
    init,
    data,
    start;

init = function(THUMSdata) {
    data = THUMSdata;
};

start = function(socket) {

    /* GLOBALS */

    allClients.push(socket);

    /* SQL QUERIES */
    function get_teams(cur_event,match,toAll){
        data.get_teams(cur_event,match,function(err,row){
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
        get_teams(current_event,current_match,true);
    }

    function new_teams(data) { // Recieved when a new client is connected
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
        var update_team = current_teams[data["position"]];
        if (update_team) {
            try {
                data.update_team(data.key,data.value,current_event,current_match,update_team);
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
}

module.exports = {
    init: init,
    start: start
}
