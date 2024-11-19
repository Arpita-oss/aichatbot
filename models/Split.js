const mongoose = require('mongoose');

const SplitSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        trim: true
    },
    expenses: [{
        userName: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    perPersonShare: {
        type: Number,
        default: 0
    },
    settlements: [{
        from: String,
        to: String,
        amount: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Split', SplitSchema);


