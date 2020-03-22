var db = require("../models");


module.exports = function (app) {
    // add transaction document
    app.post("/budget", ({ body }, res) => {
        db.Budget.create(body)
            .then(dbBudget => {
                res.json(dbBudget);
            })
            .catch(err => {
                res.json(err);
            });
    });

};