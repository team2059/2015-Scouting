var app = {};

app.name = "2015-Scouting";
app.reserve = [""];

app.start = function(THUMS) {
    this.data = THUMS.data;
    this.sockets = THUMS.sockets;
};

module.exports = app;