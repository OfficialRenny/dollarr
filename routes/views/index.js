var keystone = require('keystone');

exports = module.exports = async function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';
	if (req.user) {
		var receivedTransfers = await keystone.list('Transaction').model.find({ toAddress: req.user.address }).exec();
		var sentTransfers = await keystone.list('Transaction').model.find({ fromAddress: req.user.address }).exec();
		var withdrawals = await keystone.list('Cashflow').model.find({ address: req.user.address, amount: { $lt: 0 }, isAccepted: true }).exec();
		var deposits = await keystone.list('Cashflow').model.find({ address: req.user.address, amountTaxed: { $gt: 0 }, isAccepted: true }).exec();
		var pendingWithdrawals = await keystone.list('Cashflow').model.find({ address: req.user.address, amount: { $lt: 0 }, isAccepted: false }).exec();
		locals.pndWithdrawals = 0;
		for (withdrawal of pendingWithdrawals) locals.pndWithdrawals += withdrawal.amount;
		locals.deposits = 0;
		for (deposit of deposits) locals.deposits += deposit.amount;
		locals.withdrawals = 0;
		for (withdrawal of withdrawals) locals.withdrawals -= withdrawal.amount;
		locals.sentTransfers = 0;
		for (transfer of sentTransfers) locals.sentTransfers += transfer.amount;
		locals.receivedTransfers = 0;
		for (transfer of receivedTransfers) locals.receivedTransfers += transfer.amount;
	}
	// Render the view
	view.render('index');
};
