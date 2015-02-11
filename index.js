var app = {};

app.name = "2015-Scouting :)";
app.reserve = [""];

app.start = function(THUMS) {
    this.data = THUMS.data;
    this.sockets = THUMS.sockets;
};

app.module = function(req,res,next) {
    console.log("I tried my very best :)");
    console.log(req.url.split("/")[1])
    next();
}

module.exports = app;