var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var User = new keystone.List('User');

User.add({
	name: { type: Types.Name, required: true, index: true },
	email: { type: Types.Text, initial: true, required: true, unique: true, index: true },
	forumName: { type: Types.Text, initial: true, required: true, index: true },
	password: { type: Types.Password, initial: true, required: true },
	address: { type: Types.Text, initial: true, required: true, unique: true, index: true},
	balance: { type: Types.Money, initial: true, required: true, default: '0.00'},
	fees: { type: Types.Number, initial: true, required: true, default: 7.5 },
	creationDate: { type: Types.Number, initial: true },
	usersIPs: { type: Types.TextArray, initial: true, required: true, default: [] },
	lockedMsg: { type: Types.Text, required: true, default: "" },
	mtaSerial: { type: Types.Text, required: true, default: "yeet" },
}, 'Settings', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: false },
	isVerified: { type: Boolean, label: 'Account Verified', index: false },
	isLocked: { type: Boolean, label: 'Account Locked', index: false, required: true, default: false },
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});

/**
 * Registration
 */
User.defaultColumns = 'name, email, address, balance, isAdmin';
User.register();
