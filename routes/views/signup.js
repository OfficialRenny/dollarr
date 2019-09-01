var keystone = require('keystone'),
	async = require('async');
var utils = keystone.utils;

exports = module.exports = function(req, res) {
	
	if (req.user) {
		return res.redirect(req.cookies.target || '/');
	}
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'session';
	locals.form = req.body;
	
	view.on('post', { action: 'signup' }, function(next) {
		
		async.series([
			
			function(cb) {
				
				if (!req.body.firstname || !req.body.lastname || !req.body.email || !req.body.forumName || !req.body.mtaSerial || !req.body.password) {
					req.flash('error', 'Please fill in all of the fields.');
					return cb(true);
				}
				
				return cb();
				
			},
			
			function(cb) {
				
				keystone.list('User').model.findOne({ email: req.body.email }, function(err, user) {
					
					if (err || user) {
						req.flash('error', 'A user with that username already exists.');
						return cb(true);
					}
					
					return cb();
					
				});
				
			},
			
			function(cb) {
				var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
				var userData = {
					name: {
						first: req.body.firstname,
						last: req.body.lastname
						},
					email: req.body.email,
					forumName: req.body.forumName,
					password: req.body.password,
					address: utils.randomString(32, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-#!='),
					createdDate: Date.now(),
					usersIPs: [],
					mtaSerial: req.body.mtaSerial
				};
				userData.usersIPs.push(ip);
				var User = keystone.list('User').model,
					newUser = new User(userData);
				
				newUser.save(function(err) {
					return cb(err);
				});
			
			}
			
		], function(err){
			
			if (err) return next();
			
			var onSuccess = function() {
				if (req.body.target && !/signup|signin/.test(req.body.target)) {
					console.log('[Signup] - Set target as [' + req.body.target + '].');
					res.redirect(req.body.target);
				} else {
					res.redirect('/');
				}
			}
			
			var onFail = function(e) {
				console.log(e);
				req.flash('error', 'There was a problem signing you in, please try again.');
				return next();
			}
			
			keystone.session.signin({ email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail);
			
		});
		
	});
	
	view.render('signup');
	
}

function newAddress (length) {
	const availableChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-#!=';
	let add = '';
	for (i = 0; i < length; i++) add += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
	return add;
}
