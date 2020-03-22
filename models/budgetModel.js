const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const budgetSchema = new Schema({
description: {
    type: String,
    trim: true,
    required: "Description is required"
},
amount: {
    type: Number,
    required: "Amount is required"
},
transaction: {
    type: String,
    required: "Transaction is required"
},
total: {
    type: Number,
    required: "Total is required"
}
},
{ timestamps: { createdAt: 'created_at' } 
});

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;