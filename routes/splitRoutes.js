const express = require('express');
const router = express.Router();
const Split = require('../models/Split');

// Calculate split
router.post('/calculate', async (req, res) => {
    try {
        const { groupName, expenses } = req.body;

        // Validate input
        if (!groupName || !expenses || expenses.length < 2) {
            return res.status(400).json({
                error: 'Please provide group name and at least 2 expenses'
            });
        }

        // Calculate total amount spent
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Identify unique users
        const uniqueUsers = [...new Set(expenses.map(e => e.userName))];
        const numUsers = uniqueUsers.length;

        // Calculate the per-person share based on the number of unique users
        const perPersonShare = totalAmount / numUsers;

        // Calculate user-wise total expenses
        const userTotalExpenses = expenses.reduce((acc, expense) => {
            acc[expense.userName] = (acc[expense.userName] || 0) + expense.amount;
            return acc;
        }, {});

        // Calculate each user's balance (positive means overpaid, negative means underpaid)
        const balances = uniqueUsers.map(userName => ({
            userName,
            totalPaid: userTotalExpenses[userName],
            balance: userTotalExpenses[userName] - perPersonShare
        }));

        // Calculate settlements
        const settlements = [];
        const sortedBalances = balances.sort((a, b) => a.balance - b.balance);

        let i = 0, j = sortedBalances.length - 1;
        while (i < j) {
            const payer = sortedBalances[i];
            const receiver = sortedBalances[j];
            const amount = Math.min(Math.abs(payer.balance), Math.abs(receiver.balance));

            if (amount > 0.01) {  // Avoid very small floating-point differences
                settlements.push({
                    from: payer.userName,
                    to: receiver.userName,
                    amount: Number(amount.toFixed(2))
                });

                // Adjust balances after the settlement
                payer.balance += amount;
                receiver.balance -= amount;
            }

            // Move to the next payer or receiver if their balance is settled
            if (Math.abs(payer.balance) < 0.01) i++;
            if (Math.abs(receiver.balance) < 0.01) j--;
        }

        // Save the split data to the database
        const split = new Split({
            groupName,
            expenses,
            totalAmount,
            perPersonShare,
            settlements
        });

        await split.save();

        // Respond with the calculated data
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
