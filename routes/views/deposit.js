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
	
	function getDepositsForAddress(address) {
		return new Promise(function (resolve, reject) {
			keystone.list('Cashflow').model.find({ address: address, amount: { $gt: 0 } }, null, { sort: { creationDate: -1 } }, function (err, docs) {
				if (err) return reject(err);
				return resolve(docs);
			});
		});
	}

	locals.deposits = await getDepositsForAddress(req.user.address);
	
	view.on('post', async function(next) {
		
		async.series([
			
			function(cb) {
				if (req.user.isLocked) {
					req.flash('error', req.user.lockedMsg);
					return cb(true);
				}
				
				if (!req.user.address || !req.body.amount || !req.body.transactionID || !req.body.proof) {
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
					req.flash('error', 'You cannot deposit less than $1.');
					return cb(true);
				}
				return cb();
				
			},
			
			function (cb) {
				let amount = Math.round(utils.number(req.body.amount));
				var fees = 1 - (req.user.fees / 100)
				let curDate = Date.now();
				var cashflowData = {
					address: req.user.address,
					amount: amount,
					amountTaxed: Math.round(amount * fees),
					transactionID: req.body.transactionID,
					proof: req.body.proof,
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
					console.log("Sent a deposit ping to the discord bot.");
				});
			} catch (e) {
				console.log(e);
			}
			req.flash('info', 'Deposit complete, however it will need to be manually verified before you are able to transfer it.');
			return next();
			

		});
		
	});

	// Render the view
	view.render('deposit');
};
