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
            expense.description && 
            typeof expense.amount === 'number' && 
            expense.amount >= 0
        );

        if (!validExpenses) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense format'
            });
        }

        // Calculation logic
        const splitResult = calculateSplit(groupName, expenses);

        // Save to database
        const splitRecord = new Split({
            groupName,
            expenses,
            totalAmount: splitResult.totalGroupExpense,
            perPersonShare: splitResult.perPersonShare,
            settlements: splitResult.settlements
        });

        await splitRecord.save();

        res.json({
            success: true,
            data: splitResult
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

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


module.exports = router;