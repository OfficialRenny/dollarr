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
	
	function getTransfersForAddress(address) {
		return new Promise(function (resolve, reject) {
			keystone.list('Transaction').model.find({ $or: [ { 'fromAddress': address }, { 'toAddress': address } ]}, null, { sort: { creationDate: -1 } }, function (err, docs) {
				if (err) return reject(err);
				return resolve(docs);
			});
		});
	}

	locals.transfers = await getTransfersForAddress(req.user.address);
	
	view.on('post', async function(next) {
		var addressee = await keystone.list('User').model.findOne({ address: req.body.target_address }).exec();
		var user = await keystone.list('User').model.findOne({ address: req.user.address }).exec();
		var pendingWithdrawals = await keystone.list('Cashflow').model.find({ address: req.user.address, amount: { $lt: 0 }, $or: [{ 'isAccepted': false}, {'isAccepted': null}] });
		var pendingWithdrawalAmount = 0;
		for (withdrawal of pendingWithdrawals) pendingWithdrawalAmount += withdrawal.amount;
		async.series([
			
			function(cb) {
				if (req.user.isLocked) {
					req.flash('error', req.user.lockedMsg);
					return cb(true);
				}
				
				if (!req.body.target_address || !req.body.amount) {
					req.flash('error', 'Please fill in target address and amount fields.');
					return cb(true);
				}
				
				if (req.body.message) {
					if (req.body.message.length > 250) {
						req.flash('error', 'Your message exceeded 250 characters.');
						return cb(true);
					}
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
					req.flash('error', 'You cannot transfer less than $1.');
					return cb(true);
				}
				
				if (amount > req.user.balance) {
					req.flash('error', 'You cannot transfer more than you currently have in your balance!');
					return cb(true);
				}
				
				if (amount + pendingWithdrawalAmount <= 0) {
					req.flash('error', 'Due to your pending withdrawals, you do not have enough usable balance to make this transfer.');
					return cb(true);
				}
				
				if (!addressee) {
					req.flash('error', 'The address you have entered does not currently exist, please double check and try again.');
					return cb(true);
				}
				
				if ((user.usersIPs.some(i => addressee.usersIPs.includes(i))) || user.mtaSerial == addressee.mtaSerial) {
					var options = {
						uri: 'http://127.0.0.1:1070/',
						method: 'POST',
						json: { type: req.body.reqtype,
								user: req.user.name.full,
								amount: req.body.amount,
								fromAddress: req.user.address,
								toAddress: req.body.target_address,
								message: "ALT-ALT??"
							}
					};
					try {
						request(options, function (err, res, body) {
							console.log("Sent a transfer ping to the discord bot.");
						});
					} catch (e) {
						console.log(e);
					}
					req.flash('error', '(( Suspected Alt-Alting, transaction attempt has been logged. ))');
					return cb(true);
				}
				
				return cb();
				
			},
			
			function (cb) {
				let amount = Math.round(utils.number(req.body.amount));
				let message = ((req.body.message) ? req.body.message : 'None');
				let curDate = Date.now();
				var transactionData = {
					fromName: req.user.name,
					fromAddress: req.user.address,
					amount: amount,
					toName: addressee.name,
					toAddress: req.body.target_address,
					creationDate: curDate,
					message: message,
				};
				var Transaction = keystone.list('Transaction').model;
				var newTransaction = new Transaction(transactionData);
				newTransaction.save(function (err) {
					if (err)
					{
						req.flash('error', 'There was an error with creating the transaction, please try again later.');
						return cb(err);
					}
					return cb();
				});
			},
			
			function (cb) {
				let amount = Math.round(utils.number(req.body.amount));
				user.balance -= amount;
				user.save(function (err) {
					if (err)
					{
						req.flash('error', 'There was an error with subtracting the amount from your account, if this happens please make a support ticket.');
						return cb(err);
					}
					return cb();
				});
			},
			
			function (cb) {
				let amount = Math.round(utils.number(req.body.amount));
				addressee.balance += amount;
				addressee.save(function (err) {
					if (err)
					{
						req.flash('error', 'There was an error with sending the amount to the target account, if this happens please make a support ticket.');
						return cb(err);
					}
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
						amount: req.body.amount,
						fromAddress: req.user.address,
						toAddress: req.body.target_address,
					}
			};
			try {
				request(options, function (err, res, body) {
					console.log("Sent a transfer ping to the discord bot.");
				});
			} catch (e) {
				console.log(e);
			}
			req.flash('success', 'Transfer Sent!');
			return next();
			

		});
		
	});

	// Render the view
	view.render('transfer');
};
