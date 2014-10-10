curcon-custom-permission-demo
=============================

Demo showing how Salesforce custom permissions can be used in a 3rd party application

<strong>Install instructions</strong><br/>
1) download app `git clone https://github.com/john-brock/curcon.git`<br/>
2) install node (nodejs.org)<br/>
3) add metadata to Salesforce org (connected app, custom perms, permission sets) <a href='https://github.com/john-brock/curcon-metadata'>curcon-metadata</a><br/>
4) update consumerKey and consumerSecret -- change: config.json (get values once connected app is installed)<br/>
5) run app `node app.js` or `foreman start`<br/>

<strong>Use app</strong><br/>
1) log in to salesforce using oauth: http://localhost:5000<br/>
2) change user access by assigning permission sets with custom permissions to your user<br/>
3) view default Expense Reports: http://localhost:5000/expenseReports<br/>
4) view all permissions associated with connected app: http://localhost:5000/perms<br/>
5) view raw json response from identity service: http://localhost:5000/id<br/>
