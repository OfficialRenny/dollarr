var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Transaction Model
 * ==========
 */
var Transaction = new keystone.List('Transaction');

Transaction.add({
	fromName: { type: Types.Name, required: true, index: true },
	fromAddress: { type: Types.Text, initial: true, required: true, index: true},
	amount: { type: Types.Money, initial: true, required: true},
	toName: { type: Types.Name, required: true, index: true },
	toAddress: { type: Types.Text, initial: true, required: true, index: true},
	message: { type: Types.Text, initial: true },
	creationDate: { type: Types.Number, initial: true},
});

/**
 * Registration
 */
Transaction.defaultColumns = 'fromName, fromAddress, toName, toAddress, amount';
Transaction.register();
