var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  display_name: { type: String, required: true},
  email: { type: String },
  organization_id: { type: String, required: true},
  expense_reports: [ { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseReport'} ]
});

var User = mongoose.model('User', userSchema);

var expenseStatusEnum = 'Pending Approved Rejected'.split(' ');

var expenseReportSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  amount: { type: Number, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: expenseStatusEnum, required: true, default: 'Pending'},
  organization_id: { type: String, required: true }
});

expenseReportSchema.methods.setStatus = function(status) {
  this.status = status;
  this.save(function(err, report) {
    if (err) {
      console.log('Error setting status of report. ' + err);
    }
  })
}

var ExpenseReport = mongoose.model('ExpenseReport', expenseReportSchema);

module.exports = {
  ExpenseReport: ExpenseReport,
  User: User
}