
// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var ConnectMemcached = require('connect-memcached');
// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'Dollarr',
	'brand': 'Dollarr',

	'sass': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'pug',

	'auto update': true,
	'session store': 'connect-redis',
	'session store options': {
		"host": "127.0.0.1",
		"port": "6379",
		"TTL": 60 * 60 * 24 * 14,
		"db": 0,
	},
	'auth': true,
	'user model': 'User',
	'trust proxy': true,
	'ssl': true,
	'letsencrypt': {
		email: 'renaldas.sorys@gmail.com',
		domains: ['dollarr.renny.gq'],
		register: true,
		tos: true,
	},
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
	moment: require('moment'),
	numeral: require('numeral'),
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	enquiries: 'enquiries',
	users: 'users',
	cashflows: 'cashflows',
	transactions: 'transactions',
});

//setting image
keystone.set('signin logo', '../images/banner.png');

// Start Keystone to connect to your database and initialise the web server



keystone.start();
