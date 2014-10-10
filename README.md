curcon-custom-permission-demo
=============================

Demo showing how Salesforce custom permissions can be used in a 3rd party application

<strong>Install instructions</strong><br/>
1) install package into dev org `https://login.salesforce.com/packaging/installPackage.apexp?p0=04to0000000NUsf`<br/>
2) assign permission sets to user(s)<br/>
3) explore app <a href='https://curcon-expense.herokuapp.com'>https://curcon-expense.herokuapp.com</a><br/><br/>

<strong>Local Install instructions</strong><br/>
1) download app `git clone https://github.com/john-brock/curcon.git`<br/>
2) install node (nodejs.org)<br/>
3) add metadata to Salesforce org (connected app, custom perms, permission sets) <a href='https://github.com/john-brock/curcon-metadata'>curcon-metadata</a><br/>
4) update consumerKey and consumerSecret -- change: config.json (get values once connected app is installed)<br/>
5) run app `node app.js` or `foreman start`<br/>

<strong>Use app</strong><br/>
1) log in to salesforce using oauth: <a href='http://localhost:5000'>http://localhost:5000</a><br/>
2) change user access by assigning permission sets with custom permissions to your user<br/>
3) view default Expense Reports: <a href='http://localhost:5000/expenseReports'>http://localhost:5000/expenseReports</a><br/>
4) view all permissions associated with connected app: <a href='http://localhost:5000/perms'>http://localhost:5000/perms</a><br/>
5) view raw json response from identity service: <a href='http://localhost:5000/id'>http://localhost:5000/id</a><br/>
