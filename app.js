// app.js
var express = require('express');
var nforce = require('nforce');
var app = module.exports = express();
var http = require('http');
var mongoose = require('mongoose');
var config = require("./config.json");
var fs = require("fs");

var utils = require('./utils.js');

var models = require('./models.js');
var ExpenseReport = models.ExpenseReport;
var User = models.User;

var app = module.exports = express();
var port = Number(process.env.PORT || 5000);

var clientId = process.env.CONSUMER_KEY || config['consumer_key'];
var clientSecret = process.env.CONSUMER_SECRET || config['consumer_secret'];
var callbackUrl = process.env.CALLBACK_URL || config['callback_url'];
var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: callbackUrl
});

// App Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'CustomPermDemo' }));
  app.use(org.expressOAuth({onSuccess: '/expenseReports', onError: '/oauth/error'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// DB Configuration
var dbUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/curcon';
mongoose.connect(dbUri, function(err, res) {
  if (err) {
    console.log('ERROR: could not connect to MongoDB. ' + err);
  } else {
    console.log('Connected to MongoDB');
  }
});

// Routes
app.get('/oauth/authorize', function(req, res){
  res.redirect(org.getAuthUri());
});

app.get('/', function(req, res) {
  checkOauth(req, res, function(req, res) {
    res.render('index', {
      title: 'Curcon - Custom Perm Demo',
      description: 'Log in to retrieve custom permissions and see Expense Reports'
    });
  });
});

// route to approve / reject expense reports
app.get('/expenseReports/:id/:status', function(req, res) {
  var reportId = req.params.id;
  var status = req.params.status;
  getIdentity(req, res, function(resp) {
    var canApprove = resp.custom_permissions.Curcon_Approve_Expense_Reports == true;
    if (canApprove) {
      ExpenseReport.findOne({ _id: reportId }).populate('owner').exec(function(err, report) {
        if (err) {
          res.send(500);
        } else if (null == report) {
          res.send(404);
        } else if (resp.user_id == report.owner.user_id) {
          res.send(403);  // cannot approve your own expense report
        } else {
          report.status = status;
          report.save(function(err, updatedReport) {
            res.redirect('/expenseReports');
          });
        }
      });      
    } else {
      res.send(403);  // user does not have access to approve / reject
    }
  });  
});

// route to list and display expense reports
app.get('/expenseReports', function(req, res) {
  getIdentity(req, res, function(resp) {
    ExpenseReport.find({'organization_id': resp.organization_id}).populate('owner').exec(function(err, reports) {
      if (err) {
        res.send(500);
      } else if (reports.length == 0) {
        console.log('no reports');
        addSampleReportsIfNeeded(resp.organization_id, function(err, message) {
          if (err) {
            res.send(500);
          } else {
            res.redirect('/expenseReports');
          }
        });
      } else {
        renderExpenseReportPage(reports, res, resp);
      }
    });
  });
});

function renderExpenseReportPage(reports, res, identity) {
  res.render('expenseReports', {
    title: 'Curcon - Expense Reports',
    description: 'Access is controlled by Curcon custom permissions in Salesforce',
    expense_reports: JSON.stringify(reports),
    identity: JSON.stringify(identity)
  });  
}

// route to create new expense report (requires a description and amount)
app.post('/expenseReports', function(req, res) {
  var description = req.body.description;
  var amount = req.body.amount;
  getIdentity(req, res, function(resp) {
    var canCreate = resp.custom_permissions.Curcon_Create_Expense_Reports == true;
    if (canCreate) {
      User.findOne({ user_id: resp.user_id }, function(err, user) {
        if (null != user) {
            createNewExpenseReport(description, amount, user, res);
        } else {
          var owner = new User({ user_id: resp.user_id, organization_id: resp.organization_id, display_name: resp.display_name, email: resp.display_name});
          owner.save(function(err, newUser) {
            createNewExpenseReport(description, amount, newUser, res);
          });
        }
      });
    } else {
      // user does not have access to create new expense reports
      res.send(403);
    }
  });   
});

// route to display the permission associated with the connected app
app.get('/perms', function(req, res) {  
  getIdentity(req, res, function(resp) {
    var id = JSON.parse(JSON.stringify(resp));
    var perms = id['custom_permissions'];
    res.render('showperms', {
      title: 'Curcon - Custom Permissions',
      description: 'Permissions associated with this connected app returned by identity service',
      custom_permissions: perms
    });
  });
});

// route to display the raw identity response returned by Salesforce
app.get('/id', function(req, res) {
  getIdentity(req, res, function(resp) {
    res.render('id', {
      title: 'Curcon - Identity Response',
      description: 'Raw response returned by identity service', 
      body: JSON.stringify(resp, null, 2)
    });
  });
});

function createNewExpenseReport(description, amount, owner, res) {
  var report = new ExpenseReport({ description: description, amount: amount, owner: owner, organization_id: owner.organization_id});
  report.save(function(err, report) {
    if (err) {
      res.send(500);
    } else {
      res.redirect('/expenseReports');
    }
  });
}

// ensure the request has oauth information (ie: session information)
function checkOauth(req, res, callback) {
  if (null == req.session.oauth || null == req.session.oauth.id) {
    res.redirect(org.getAuthUri());
  } else {
    callback(req, res);
  }  
}

function getIdentity(req, res, callback) {
  checkOauth(req, res, function(req, res) {
    org.getIdentity({ oauth: req.session.oauth }, function(err, resp) {
      if (!err) {
        callback(resp);
      } else {
        res.send(err.message);
      }
    });
  });
}

function addSampleReportsIfNeeded(orgId, callback) {
  utils.createTestExpenseReports(orgId, function(err, message) {
    console.log('Check expense reports');
    if (err) {
      console.log(err);
    } else {
      console.log(message);
      callback(null, message);
    }
  });
}

http.createServer(app).listen(port);
console.log('Listening on port: ' + port);
