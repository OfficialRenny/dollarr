var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Deposit/Withdrawal Model
 * ==========
 */
var Cashflow = new keystone.List('Cashflow');

Cashflow.add({
	address: {type: Types.Text, initial: true, required: true, index: true},
	amount: {type: Types.Money, initial: true, required: true},
	amountTaxed: {type: Types.Money, initial: true, required: true},
	transactionID: {type: Types.Number, initial: true},
	proof: {type: Types.Text, initial: true},
	creationDate: { type: Types.Number, initial: true},
	forumName: { type: Types.Text, initial: true, required: true, index: true},
}, 'Settings', {
	isAccepted: { type: Boolean, label: 'Deposit/Withdrawal Accepted', index: true },
});

Cashflow.schema.pre('save', async function(next) {
	if (this.isModified('isAccepted')) {
		if (this.isAccepted) {
			var user = await keystone.list('User').model.findOne({ address: this.address }).exec();
			user.balance += this.amountTaxed;
			user.save();
		} else {
			var user = await keystone.list('User').model.findOne({ address: this.address }).exec();
			user.balance -= this.amountTaxed;
			user.save();
		}
	}
	next();
});

// Provide access to Keystone
/**
 * Registration
 */
Cashflow.defaultColumns = 'address, transactionID, amount, isAccepted';
Cashflow.register();
