// routes/index.js
const express = require('express');
const router = express.Router();
const Split = require('../models/Split');

// Home page route
router.get('/', function(req, res) {
    res.render('index', { title: 'Expense Split Calculator' });
});

// API endpoint to calculate split
router.post('/split-expense', async (req, res) => {
    try {
        const { groupName, expenses } = req.body;

        // Validate input
        if (!groupName || !expenses || !Array.isArray(expenses) || expenses.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please provide group name and at least 2 expenses'
            });
        }

        // Validate expense format
        const validExpenses = expenses.every(expense => 
            expense.userName && 
            typeof expense.amount === 'number' && 
            expense.amount >= 0
        );

        if (!validExpenses) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense format. Each expense must have userName and amount'
            });
        }

        // Calculate total and per person share
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const perPersonShare = totalAmount / expenses.length;

        // Calculate balances
        const balances = expenses.map(expense => ({
            userName: expense.userName,
            balance: expense.amount - perPersonShare
        }));

        // Calculate settlements
        const settlements = [];
        const positiveBalances = balances.filter(b => b.balance > 0);
        const negativeBalances = balances.filter(b => b.balance < 0);

        while (positiveBalances.length > 0 && negativeBalances.length > 0) {
            const payer = negativeBalances[0];
            const receiver = positiveBalances[0];
            const amount = Math.min(Math.abs(payer.balance), receiver.balance);

            if (amount > 0) {
                settlements.push({
                    from: payer.userName,
                    to: receiver.userName,
                    amount: Number(amount.toFixed(2))
                });
            }

            payer.balance += amount;
            receiver.balance -= amount;

            if (Math.abs(payer.balance) < 0.01) negativeBalances.shift();
            if (Math.abs(receiver.balance) < 0.01) positiveBalances.shift();
        }

        // Save to database
        const splitRecord = new Split({
            groupName,
            expenses,
            totalAmount,
            perPersonShare,
            settlements
        });

        await splitRecord.save();

        res.json({
            success: true,
            data: {
                groupName,
                totalAmount: Number(totalAmount.toFixed(2)),
                perPersonShare: Number(perPersonShare.toFixed(2)),
                expenses,
                settlements
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all splits for a group
router.get('/splits/:groupName', async (req, res) => {
    try {
        const splits = await Split.find({ 
            groupName: req.params.groupName 
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: splits
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get recent splits
router.get('/recent-splits', async (req, res) => {
    try {
        const splits = await Split.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: splits
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete a split record
router.delete('/split/:id', async (req, res) => {
    try {
        const split = await Split.findByIdAndDelete(req.params.id);
        
        if (!split) {
            return res.status(404).json({
                success: false,
                message: 'Split record not found'
            });
        }

        res.json({
            success: true,
            message: 'Split record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Simple chatbot interface for split calculation
router.post('/chatbot/split', async (req, res) => {
    try {
        const { message } = req.body;

        // Simple message parsing (you can enhance this based on your needs)
        if (message.toLowerCase().includes('split')) {
            // Extract expense information from message
            // This is a simple example - you'll need more sophisticated parsing
            const response = {
                type: 'split_request',
                message: 'Please provide the following information:',
                template: {
                    groupName: 'Group name',
                    expenses: [
                        {
                            userName: 'Person name',
                            amount: 'Amount paid'
                        }
                    ]
                }
            };

            return res.json(response);
        }

        res.json({
            type: 'text',
            message: "I'm here to help you split expenses. Just say 'split' to get started!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
