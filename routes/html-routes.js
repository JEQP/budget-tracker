var path = require("path")

module.exports = function (app) {

    app.get("/budget", function (req, res) {
        res.sendFile(path.join(__dirname, "../public/index.html"));
    });
};