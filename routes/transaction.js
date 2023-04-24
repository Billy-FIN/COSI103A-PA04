/*
  transaction.js -- Router for the transaction
*/

const express = require('express');
const router = express.Router();
const TransactionItem = require('../models/TransactionItem')
const User = require('../models/User')

/*
this is a very simple server which maintains a key/value
store using an object where the keys and values are lists of strings

*/

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

router.get('/transaction/',
    isLoggedIn,
    async (req, res, next) => {
        const sortBy = req.query.sortBy
        let items = []
        if(sortBy=='amount'){
            items =
                await TransactionItem.find({ userId: req.user._id }).sort({ amount: -1 })
        } else if(sortBy=='category'){
            items =
                await TransactionItem.find({ userId: req.user._id }).sort({ category: 1 })
        } else if(sortBy=="description"){
            items =
                await TransactionItem.find({ userId: req.user._id }).sort({ description: 1 })
        } else if(sortBy=="date"){
            items =
                await TransactionItem.find({ userId: req.user._id }).sort({ date: -1 })
        } else {
            items =
                await TransactionItem.find({ userId: req.user._id })
        }

        res.render('transactionList', { items });
    }
)

router.post('/transaction/',
    isLoggedIn,
    async (req, res, next) => {
        newDate = new Date(req.body.date.split("/")[2], req.body.date.split("/")[0] - 1, req.body.date.split("/")[1])
        const transaction = new TransactionItem(
            {
                description: req.body.description,
                amount: parseInt(req.body.amount),
                category: req.body.category,
                date: req.body.date,
                userId: req.user._id,
                username: req.user.username
            })
        await transaction.save();
        res.redirect('/transaction')
    }
)

router.get('/transaction/remove/:itemId',
    isLoggedIn,
    async (req, res, next) => {
        await TransactionItem.deleteOne({ _id: req.params.itemId })
        res.redirect('/transaction')
    }
)

router.get('/transaction/edit/:itemId',
    isLoggedIn,
    async (req, res, next) => {
        const item =
            await TransactionItem.findById(req.params.itemId);
        res.locals.item = item
        res.render('edit')
    }
)

router.post('/transaction/updateTransactionItem',
    isLoggedIn,
    async (req, res, next) => {
        const { itemId, description, amount, category} = req.body;
        const date = new Date(JSON.stringify(req.body.date))
        await TransactionItem.findOneAndUpdate(
            { _id: itemId },
            { $set: { description, amount, category, date } });
        res.redirect('/transaction')
    }
)

router.get('/transaction/groupByCategory',
    isLoggedIn,
    async (req, res, next) => {
        let results =
            await TransactionItem.aggregate(
                [
                    {
                        $match: { username: req.user.username }
                    },
                    {
                        $group: {
                            _id: '$category',
                            total: { $sum: '$amount' },
                        }
                    },
                    {
                        $sort: { total: -1 }
                    }
                ]
            )
        res.render('summarizeModel', { results })
    }
)

module.exports = router;