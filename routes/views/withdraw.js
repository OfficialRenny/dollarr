var keystone = require('keystone');
var utils = keystone.utils;
var async = require('async');
var request = require('request');

exports = module.exports = async function (req, res) {

	if (!req.user) {
		return res.redirect(req.cookies.target || '/signup');
	}

	var view = new keystone.View(req, res);
	var locals = res.locals;
	
	function getCashflowsForAddress(address) {
		return new Promise(function (resolve, reject) {
			keystone.list('Cashflow').model.find({ address: address, amount: { $lt: 0 } }, null, { sort: { creationDate: -1 } }, function (err, docs) {
				if (err) return reject(err);
				return resolve(docs);
			});
		});
	}

	locals.withdrawals = await getCashflowsForAddress(req.user.address);
	var pendingWithdrawals = await keystone.list('Cashflow').model.find({ address: req.user.address, amount: { $lt: 0 }, isAccepted: false });
	var pendingWithdrawalAmount = 0;
	for (withdrawal of pendingWithdrawals) pendingWithdrawalAmount += withdrawal.amount;
	locals.pndWithdrawals = pendingWithdrawalAmount;
	view.on('post', async function(next) {
		async.series([
			
			function(cb) {
				if (req.user.isLocked) {
					req.flash('error', req.user.lockedMsg);
					return cb(true);
				}
				
				if (!req.user.address || !req.body.amount) {
					req.flash('error', 'Please fill in all of the fields.');
					return cb(true);
				}
				return cb();
				
			},
			
			function(cb) {
				let amount = Math.round(utils.number(req.body.amount));
				if (!utils.isNumber(amount)) {
					req.flash('error', 'The amount you have entered does not seem like a number.');
					return cb(true);
				}
				if (amount < 1) {
					req.flash('error', 'You cannot withdraw less than $1.');
					return cb(true);
				}
				
				if (amount > req.user.balance) {
					req.flash('error', 'You cannot withdraw more than you currently have in your balance!');
					return cb(true);
				}
				if (amount > (req.user.balance + pendingWithdrawalAmount)) {
					req.flash('error', 'Due to your pending withdrawals, you cannot withdraw this much!');
					return cb(true);
				}
				return cb();
				
			},
			
			function (cb) {
				let amount = Math.round(utils.number(req.body.amount));
				let curDate = Date.now();
				var cashflowData = {
					address: req.user.address,
					amount: -(amount),
					amountTaxed: -(amount),
					creationDate: curDate,
					forumName: req.user.forumName,

				};
				var Cashflow = keystone.list('Cashflow').model;
				var newCashflow = new Cashflow(cashflowData);
				newCashflow.save(function (err) {
					return cb(err);
				});
			}
			
		], function(err){
			if (err) return next();
			var options = {
				uri: 'http://127.0.0.1:1070/',
				method: 'POST',
				json: { type: req.body.reqtype,
						user: req.user.name.full,
						amount: req.body.amount
					}
			};
			try {
				request(options, function (err, res, body) {
					console.log("Sent a withdrawal ping to the discord bot.");
				});
			} catch (e) {
				console.log(e);
			}
			return res.redirect('/withdraw?success=true');
			//return next();
			

		});
	});
	if (req.query) {
		if (req.query.success) req.flash('info', 'Withdrawal sent, however due to the withdrawal process, it may take a couple business days for your withdrawal to complete..');
	}
	// Render the view
	view.render('withdraw');
};
