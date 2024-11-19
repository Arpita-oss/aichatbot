const express = require('express');
const router = express.Router();
const Split = require('../models/Split');

// Calculate split
router.post('/calculate', async (req, res) => {
    try {
        const { groupName, expenses } = req.body;

        if (!groupName || !expenses || expenses.length < 2) {
            return res.status(400).json({ 
                error: 'Please provide group name and at least 2 expenses' 
            });
        }

        // Calculate total amount
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const perPersonShare = totalAmount / expenses.length;

        // Calculate settlements
        const settlements = [];
        const balances = expenses.map(expense => ({
            userName: expense.userName,
            balance: expense.amount - perPersonShare
        }));

        const positiveBalances = balances.filter(b => b.balance > 0);
        const negativeBalances = balances.filter(b => b.balance < 0);

        while (positiveBalances.length > 0 && negativeBalances.length > 0) {
            const payer = negativeBalances[0];
            const receiver = positiveBalances[0];
            const amount = Math.min(Math.abs(payer.balance), receiver.balance);

            settlements.push({
                from: payer.userName,
                to: receiver.userName,
                amount: Number(amount.toFixed(2))
            });

            payer.balance += amount;
            receiver.balance -= amount;

            if (Math.abs(payer.balance) < 0.01) negativeBalances.shift();
            if (Math.abs(receiver.balance) < 0.01) positiveBalances.shift();
        }

        // Save to database
        const split = new Split({
            groupName,
            expenses,
            totalAmount,
            perPersonShare,
            settlements
        });

        await split.save();

        res.json({
            groupName,
            totalAmount,
            perPersonShare,
            expenses,
            settlements
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get split history
router.get('/history', async (req, res) => {
    try {
        const splits = await Split.find().sort({ createdAt: -1 }).limit(10);
        res.json(splits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get split by group name
router.get('/group/:groupName', async (req, res) => {
    try {
        const splits = await Split.find({ 
            groupName: req.params.groupName 
        }).sort({ createdAt: -1 });
        res.json(splits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;