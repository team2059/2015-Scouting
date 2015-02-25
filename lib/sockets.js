var current_match = 1, // Defaults to 1
    current_event = "2015ncre", // TODO: Create config.json file for setting up defaults
    current_teams = {},
    current = {
        "r1": { "open": true, "user": null},
        "r2": { "open": true, "user": null},
        "r3": { "open": true, "user": null},
        "b1": { "open": true, "user": null},
        "b2": { "open": true, "user": null},
        "b3": { "open": true, "user": null}
    },
    allClients = [],
    client_post = [],
    init,
    data,
    start;

init = function(THUMSdata) {
    'use strict';
    data = THUMSdata;
};

start = function(socket) {
    'use strict';
    /* GLOBALS */

    allClients.push(socket);

    /* SQL QUERIES */
    function get_teams(match,toAll){
        data.get_teams(match,function(err,row){
            current_teams = row;
            var is_open = [],
                x;
            for (x in current) {
                if (!current.hasOwnProperty(x)) {
                    continue;
                }
                is_open.push(current[x].open);
            }
            if (toAll) {
                socket.broadcast.emit('new teams', {"team":row, "open":is_open});
            } else {
                socket.emit('new teams', {"team":row, "open":is_open});
            }
        });
    }

    /* SEND */

    function next_round(num) { // Update all clients to the next round
        current_match = num;
        socket.broadcast.emit('new match', current_match);
        get_teams(current_match,true);
    }

    function new_teams(data) { // Recieved when a new client is connected
        if (current[data.team]) {
            current[data.team].open = data.open;
            current[data.team].user = data.name;
        }
        get_teams(current_match,true);
    }

    socket.on('get teams', function (data) { // Send back list of current teams in the current match
        get_teams(current_match,false);
    });

    socket.on('get match', function (data) { // Send back the current match number
        socket.emit('new match', current_match);
    });

    socket.on('next match', function(num) {
        console.log(num);
        next_round(num);
    });

    /* RECIEVE */

    socket.on('new team', function (data) {
        var i = allClients.indexOf(socket);
        client_post[i] = data["team"]; // Update client position
        new_teams(data);
    });

    function sendUpdate(round, position, row, value, name) {
        data.getTeamFromPosition(round, position, function (err, team) {
            data.update_team(row, value, round, team);
            data.update_team("scouter", name, round, team);
        });
    }

    socket.on('update score', function(data) {
        if (!(data.position && data.name && data.type)) {
            return;
        }
        var cell,
            change;
        switch(data.type) {
        case "Auto":
            cell = 'a';
            break;
        case 'Coop':
            cell = 'c';
            break;
        case 'Tele':
            cell = 't';
            break;
        case 'Bin':
            cell = 'b';
            break;
        case 'Stack':
            break;
        default:
            return sendUpdate(current_match, data.position, data.type, data.amount, data.name);
        }
        change = (data.amount > 0) ? 1 : -1;

        // Handle stacks.
        if (data.type === 'Stack') {
            var i;

            // Does not need to start at 0
            for (i = 1; i < Math.abs(data.amount) + 1; i++) {
                if (!i) {
                    continue;
                }
                cell = 't' + i.toString();
                sendUpdate(current_match, data.position, cell, change, data.name);
            }
            return;
        }
        cell += Math.abs(data.amount);
        sendUpdate(current_match, data.position, cell, change, data.name);
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
