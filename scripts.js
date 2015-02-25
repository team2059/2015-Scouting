/* global io */
/* global newAlert */

var current_match = 0,
    name_input = document.getElementById('input-name'),
    team_id_select = document.getElementById('robot-id'),
    dragged_element,
    user_name,
    socket,
    sendScoreChange;

/* Drag and drop functionality. */

/**
 * Check to see if one object can be dropped into another.
 * @param {HTMLElement} dragged
 * @param {HTMLElement} target
 * @returns {boolean}
 */
function isDroppable(target, dragged) {
    'use strict';

    // If any of the arguments are not a valid HTMLElement, stop the function.
    if (!target || !dragged || !target.classList || !dragged.classList) {
        return false;
    }

    // Prevents a stack being dropped on a stack or a tote being dropped on a tote.
    if ((target.classList.contains('stack') && dragged.classList.contains('tote')) || (target.classList.contains('tote') && dragged.classList.contains('stack'))) {
        return true;
    }
    return false;
}

sendScoreChange = function(obj) {
    'use strict';
    socket.emit('update score', obj);
};

function updateStacks(type) {
    'use strict';
    var new_names,
        stacks = document.getElementsByClassName('stack'),
        i;
    switch(type) {
    case "Auto":
        new_names = [null, null, "Robot", "Tote", "Container", "Stacked"];
        break;
    case "Coop":
        new_names = [null, null, "4", "3", "2", "1"];
        break;
    default:
        new_names = ["6", "5", "4", "3", "2", "1"];
    }

    // This iterator was created very late at night.
    for (i = stacks.length - 1; i >= 0; i--) {
        if (!new_names[i]) {
            stacks[i].style.visibility = "hidden";
            continue;
        }
        stacks[i].style.visibility = "visible";
        stacks[i].textContent = new_names[i];
    }
}


/**
 * Find the object over which the mouse is currently being dragging.
 * @param e - A MouseEvent
 * @returns {HTMLElement} - The object over which the mouse is currently hovering.
 */
function draggedOver(e) {
    'use strict';
    return document.elementFromPoint(e.clientX, e.clientY);
}

/**
 * Process and handle a drop event.
 * @param {string} data - The type of object that was just dropped.
 * @param {HTMLElement} dropper - The object where the data was dropped.
 */
function moveEnd(data, dropper) {
    'use strict';
    var target = dropper.textContent,
        alert_text = data + ' scored at level ' + target,
        undo_button,
        user_info = {
            "position": team_id_select.value,
            "name": name_input.value,
            "type": data,
            "amount": parseInt(target, 10)
        };

    // Makes sure a team has been selected.
    if (!team_id_select.value) {
        return newAlert("Please select a team");
    }
    // Check if this is a positive score.
    if (!dropper.classList.contains('stack')) {
        user_info.amount = - parseInt(data, 10);
        user_info.type = target;
        alert_text = target + ' dropped at level ' + data;
    }
    undo_button = document.createElement('button');
    undo_button.textContent = 'Undo';
    undo_button.addEventListener('click', function(event) {
        user_info.amount *= -1;
        sendScoreChange(user_info);
        event.target.parentElement.parentElement.removeChild(event.target.parentElement);
    });
    sendScoreChange(user_info);
    newAlert([alert_text, undo_button]);
}

// Element now being hovered over.
function moveEnter(kind, target) {
    'use strict';
    if (!target) {
        return;
    }
    if (!target.classList) {
        return;
    }
    if (target.classList.contains('droppable') && isDroppable(kind, target)) {
        target.style.backgroundColor = window.getComputedStyle(kind).getPropertyValue("background-color");
        if (!target.classList.contains('stack')) {
            updateStacks(target.textContent);
        }
    }
}

// Element no longer being hovered over.
function moveLeave(target) {
    'use strict';
    if (!target) {
        return;
    }
    if (!target.classList) {
        return;
    }
    if (target.classList.contains('droppable')) {
        target.style.backgroundColor = null;
    }
}

// Memory for touch events.
var last_dragged = null;

document.addEventListener('click', function(event) {
    'use strict';
    if (!event.target.draggable) {
        return;
    }
    if (!event.target.classList.contains('stack')) {
        updateStacks(event.target.textContent);
    }
});

// Something is being dragged over an element.
document.addEventListener('dragover', function (event) {
    'use strict';

    // This allows the cursor to change.
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (isDroppable(draggedOver(event), dragged_element)) {
        event.dataTransfer.dropEffect = "move";
        return;
    }
    event.dataTransfer.dropEffect = "none";
}, false);

// A draggable element is being dragged.
document.addEventListener('dragstart', function (event) {
    'use strict';
    event.dataTransfer.effectAllowed = 'move';

    // Needed to make Firefox happy.
    event.dataTransfer.setData('text/plain', '');

    // Remember what is being dragged.
    dragged_element = event.target;

    if (!event.target.classList.contains('stack')) {
        updateStacks(event.target.textContent);
    }
}, false);

// The dragged object has moved to a new element.
document.addEventListener('dragenter', function (event) {
    'use strict';

    // Change the cursor if the target is valid.
    if (isDroppable(draggedOver(event), dragged_element)) {
        event.dataTransfer.dropEffect = "move";
    }
    moveEnter(dragged_element, event.target);
}, false);

// The dragged object has moved from an element.
document.addEventListener('dragleave', function (event) {
    'use strict';
    moveLeave(event.target);
}, false);

document.addEventListener('dragend', function() {
    'use strict';
    updateStacks();
});

// The dragged object has been dropped.
document.addEventListener('drop', function (event) {
    'use strict';

    // Do not redirect the page.
    if (event.preventDefault) {
        event.preventDefault();
    }

    // Reset the color.
    moveLeave(event.target);
    if (isDroppable(event.target, dragged_element)) {
        updateStacks();
        moveEnd(dragged_element.textContent, event.target);
    }
}, false);

// New touch event.
document.addEventListener('touchstart', function (event) {
    'use strict';
    var dropped = draggedOver(event.targetTouches[0]);

    // Prevents scrolling in unwanted places.
    if (dropped && dropped.classList) {
        if (dropped.classList.contains('noscroll')) {
            event.preventDefault();
        }
    }
    if (event.target.draggable && !event.target.classList.contains('stack')) {
        updateStacks(event.target.textContent);
    }
});

// The touch event has moved.
document.addEventListener('touchmove', function (event) {
    'use strict';
    if (!event.target.draggable) {
        return;
    }

    // Since there is no multitouch, only the first touch object is important.
    var dropped = draggedOver(event.targetTouches[0]);
    if (dropped && dropped.classList) {
        if (dropped.classList.contains('noscroll')) {
            event.preventDefault();
        }
    }

    // Replicates dragenter and dragleave events.
    if (last_dragged !== dropped) {
        moveLeave(last_dragged);
        last_dragged = dropped;
        moveEnter(event.target, last_dragged);
    }

}, false);

// The touch event has ended.
document.addEventListener('touchend', function (event) {
    'use strict';
    if (!event.target.draggable) {
        return;
    }
    moveLeave(last_dragged);
    last_dragged = null;
    if (isDroppable(event.target, draggedOver(event.changedTouches[0]))) {
        updateStacks();
        moveEnd(event.target.textContent, draggedOver(event.changedTouches[0]));
    }
}, false);

/* *
 * Handle communication with the server.
 * */

// Update or populate match number.
function update_match_number(num) {
    'use strict';
    if (document.getElementById('match-number')) {
        document.getElementById('match-number').textContent = num.toString();
    }
}

// Update or populate team list.
function add_teams(obj) {
    'use strict';
    var team_list = [],
        new_option,
        x;
    console.log(obj);
    if (team_id_select.options.length > 1) {
        for (x in obj.team) {
            if (obj.team.hasOwnProperty(x)) {
                team_list.push(obj.team[x]);
            }
        }
        for (x = 0; x < team_id_select.options.length - 1; x++) {
            if (team_id_select.options.hasOwnProperty(x)) {
                if (team_id_select.options[x + 1]) {
                    team_id_select.options[x + 1].text = team_list[x];
                }
            }
        }
    } else {
        for (x in obj.team) {
            if (!obj.team.hasOwnProperty(x)) {
                continue;
            }
            new_option = document.createElement('option');
            new_option.value = x;
            new_option.textContent = obj.team[x].toString();
            document.getElementById('robot-id').appendChild(new_option);
        }
    }
    for (x = 0; x < obj.open.length; x++) {
        if (obj.open[x]) {
            team_id_select.options[x + 1].disabled = false;
        } else {
            team_id_select.options[x + 1].disabled = true;
        }
    }
}

(function connect_sockets() {
    'use strict';
    function connect() {

        socket = io.connect(location.origin + '/scout');

        // Using document instead of an element to patch a bug with iOS.
        document.addEventListener('input', function (event) {
            var x;

            // Again, this fixes some issue with iOS.
            if (event.target.id === name_input.id) {
                if (event.target.value.length > 0) {
                    if (!user_name) {
                        user_name = event.target.value;
                        for (x = 0; x < document.getElementsByClassName('name-required').length; x++) {
                            document.getElementsByClassName('name-required')[x].style.visibility = 'visible';
                        }
                    }
                } else {
                    if (user_name) {
                        for (x = 0; x < document.getElementsByClassName('name-required').length; x++) {
                            document.getElementsByClassName('name-required')[x].style.visibility = 'hidden';
                        }
                        user_name = null;
                    }
                }
            }
            if (event.target.id === team_id_select.id) {
                socket.emit('new team', {'team': event.target.value, 'name': name_input.value, 'open': false});
                if (team_id_select.getAttribute('previousValue') !== '') { // Change old team slot to be
                    socket.emit('new team', {'team': team_id_select.getAttribute('previousValue'), 'name': null, 'open':true});
                }
                team_id_select.setAttribute('previousValue', event.target.value); // Update previous value in case of change.
            }
            if (event.target.id === 'comment') {
                console.log(event.target.value);
                sendScoreChange({
                    "position": team_id_select.value,
                    "name": name_input.value,
                    "type": "comment",
                    "amount": event.target.value
                });
            }
        });

        team_id_select.setAttribute('previousValue', '');

        socket.on('connect', function () {
            console.log('Connected!');
        });
        socket.on('new teams', add_teams);
        socket.on('new match', update_match_number);
        socket.on('new error', function(data) {
            newAlert(data.message);
        });
        socket.emit('get match');
        socket.emit('get teams');
    }

    var socket_script = document.createElement('script');
    socket_script.src = '/socket.io/socket.io.js';
    document.body.appendChild(socket_script);
    socket_script.onload = connect;
})();