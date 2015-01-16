function connect_sockets() {

    function connect(){

        var socket = io.connect(location.origin);

        /* GLOBAL VARIABLES */

        var current_match = 0,
            //current_team = null,
            //current_name = null,
            name_input = document.getElementById('input-name'),
            team_id_select = document.getElementById('robot-id');

        /* UPDATE HANDLERS */

        /* Update or populate match number. */

        function update_match_number(num) {
            for (var x = 0; x < document.getElementsByClassName('match-number').length; x++) {
                current_match = num;
                document.getElementsByClassName('match-number')[0].textContent = num.toString();
            }
        }

        /* Update or populate team list. */

        function add_teams(obj) {
            if (team_id_select.options.length > 1) {
                var team_list = [];
                for (i in obj["team"]){
                    team_list.push(obj["team"][i]);
                }
                for (var x = 0; x < team_id_select.options.length - 1; x++) {
                    team_id_select.options[x + 1].text = team_list[x];
                }
            } else {
                for (x in obj["team"]) {
                    var new_option = document.createElement('option');
                    new_option.value = x;
                    new_option.textContent = obj["team"][x];
                    team_id_select.appendChild(new_option);
                }
            }
            for (var x = 0; x < obj["open"].length; x++) {
                if (obj["open"][x]) {
                    team_id_select.options[x + 1].disabled = false;
                } else {
                    team_id_select.options[x + 1].disabled = true;
                }
            }
        }

        /* On team selection change */

        team_id_select.addEventListener('change', function(e) {
            console.log(e.target.value);
            if (name_input.value.length < 1) { // Prevents selecting a team without having a name.
                alert("Please input a name.");
                e.target.value = null;
            } else {
                socket.emit('new team', {'team':e.target.value, 'name':name_input.value, 'open':false})
                if (team_id_select.getAttribute("previousValue") !== "null") { // Change old team slot to be
                    socket.emit('new team', {'team':team_id_select.getAttribute("previousValue"),"name":null, "open":true})
                }
                team_id_select.setAttribute("previousValue",e.target.value); // Update previous value in case of change.
            }

        });
        team_id_select.setAttribute("previousValue",null);

        socket.on('new teams', function (data) {
            console.log(data);
            add_teams(data);
        });
        socket.on('new match', function(data) {
            console.log(data);
            update_match_number(data);
        });
        socket.on('new error', function(data) {
            console.log(data);
            alert(data["message"]);
        });
        socket.emit('get match');
        socket.emit('get teams');
        var buttons = document.getElementsByClassName('increase');
        for (var x = 0; x < buttons.length; x++) {
            buttons[x].addEventListener('click', function(e) {
                e.target.parentElement.getElementsByClassName('number')[0].value = parseInt(e.target.parentElement.getElementsByClassName('number')[0].value) + 1;
                socket.emit('update value', {"position": team_id_select.value, "key": e.target.parentElement.getElementsByClassName('number')[0].name, "value":e.target.parentElement.getElementsByClassName('number')[0].value});
            });
        }
        buttons = document.getElementsByClassName('decrease');
        for (var x = 0; x < buttons.length; x++) {
            buttons[x].addEventListener('click', function(e) {
                e.target.parentElement.getElementsByClassName('number')[0].value = parseInt(e.target.parentElement.getElementsByClassName('number')[0].value) - 1;
                socket.emit('update value', {"position": team_id_select.value, "key": e.target.parentElement.getElementsByClassName('number')[0].name, "value":e.target.parentElement.getElementsByClassName('number')[0].value});
            });
        }
    }
    
    var socket_script = document.createElement('script');
    socket_script.src = "/socket.io/socket.io.js";
    document.body.appendChild(socket_script);
    socket_script.onload = connect;
}
appendToFunction('on_reload', connect_sockets,"Sockets");
console.log("TESTING THE OTHER SCRIPT");
