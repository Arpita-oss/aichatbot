const express = require('express');
const router = express.Router();
const Split = require('../models/Split');

// Calculate split
function calculateSplit(groupName, expenses) {
    // Ensure total expense is correctly calculated
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Count unique users and ensure per-person share calculation is correct
    const uniqueUsers = [...new Set(expenses.map(e => e.userName))];
    const numUsers = uniqueUsers.length;
    const perPersonShare = totalExpense / numUsers;

    // Detailed user expenses breakdown
    const userExpenses = expenses.reduce((acc, expense) => {
        if (!acc[expense.userName]) {
            acc[expense.userName] = { 
                expenses: [], 
                totalAmount: 0 
            };
        }
        acc[expense.userName].expenses.push(expense);
        acc[expense.userName].totalAmount += expense.amount;
        return acc;
    }, {});

    // Calculate balances
    const balances = uniqueUsers.map(userName => ({
        userName,
        totalPaid: userExpenses[userName].totalAmount,
        balance: userExpenses[userName].totalAmount - perPersonShare
    }));

    // Settlement calculations
    const settlements = [];
    const sortedBalances = balances.sort((a, b) => a.balance - b.balance);
    
    let i = 0, j = sortedBalances.length - 1;
    while (i < j) {
        const from = sortedBalances[i];
        const to = sortedBalances[j];
        
        const settleAmount = Math.min(Math.abs(from.balance), to.balance);
        
        if (settleAmount > 0) {
            settlements.push({
                from: from.userName,
                to: to.userName,
                amount: settleAmount
            });
            
            from.balance += settleAmount;
            to.balance -= settleAmount;
        }
        
        if (from.balance === 0) i++;
        if (to.balance === 0) j--;
    }

    return {
        groupName,
        totalGroupExpense: totalExpense,
        perPersonShare,
        userExpenses,
        balances,
        settlements
    };
}

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