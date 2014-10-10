var expenseReports = require("./reports.json");
var ExpenseReport = require('./models.js').ExpenseReport;
var User = require('./models.js').User;

exports.createTestExpenseReports = function(orgId, callback) {
  console.log(orgId);
  ExpenseReport.find({ 'organization_id': orgId }).populate('owner').exec(function(err, reports) {
    if (err) {
      console.log('Error querying Expense Reports');
    } else {
      if (reports.length == 0) {
        User.find({'organization_id': orgId}, function(err, users) {
          if (err) {
            console.log('err');
            callback(err, null);
          } else {
            var userIdMap = {};
            if (users.length > 0) {
              for (user in users) {
                userIdMap[users[user].user_id] = users[user];
                if (users.length == Object.keys(userIdMap).length) {
                  createReportsWithOwners(userIdMap, orgId, callback);
                }
              }
            } else {
              createReportsWithOwners(userIdMap, orgId, callback);
            }
          }
        });
      } else {
        callback(null, 'Did not need to create default expense reports');
      }
    }
  });
}

function createReportsWithOwners(userIdMap, orgId, callback) {
  var count = 0;
  var expectedNumToCreate = Object.keys(expenseReports).length;
  for (report in expenseReports) {
    var r = expenseReports[report];
    if (null != userIdMap[r.owner.user_id]) {
      createExpenseReport(userIdMap[r.owner.user_id], r, orgId, function(err, message) {
        if (err) {
          callback(err, null);
        } else {
          count++;
          if (count == expenseReports.length) {
            callback(null, message);
          }
        }
      });
    } else {
      findOrCreateUser(r, orgId, function(err, message) {
        count++;
        if (err) {
          callback(err, null);
        } else if (count == expectedNumToCreate) {
          callback(null, message);
        }
      });
    }
  }
}

function findOrCreateUser(r, orgId, callback) {
  var usersCreated = {};
  User.findOne({ 'organization_id': orgId, 'user_id': r.owner.user_id }, function (err, foundUser) {
    if (null == foundUser && null == usersCreated[r.owner.user_id]) {
      var newUser = new User({ user_id: r.owner.user_id, organization_id: orgId, display_name: r.owner.display_name, email: r.owner.email });
      newUser.save(function(err, newUser) {
        if (err) {
          callback(err, null);
        } else {
          usersCreated[r.owner.user_id] = newUser;
          createExpenseReport(newUser, r, orgId, function(err, message) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, message);
            }
          });
        }
      });
    } else {
      createExpenseReport(foundUser.user_id, r, orgId, function(err, message) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, message);
        }
      });    
    }
  });
}

function createExpenseReport(user, report, orgId, callback) {
  var er = new ExpenseReport({ description: report.description, amount: report.amount, owner: user._id, status: report.status, organization_id: orgId });
  er.save(function(err, report) {
    if (err) {
      callback('Error saving: ' + err, null);
    } else {
      callback(null, 'Successfully created expense reports');
    }
  });
}