# Budget Tracker

This is a web app which allows people to track their income and expenditures. The app accepts transactions and displays a graph of the state of the budget over time. Transactions are stored in a Mongo DB database. If there is no connection, transactions are stored in an IndexedDB database, and upon connection being restored are transfered to the Mongo DB database. The main public-facing files are cached to allow the app to run offline.

The site uses IndexedDB, Mongo, Mongoose, Service Workers.

### Main responsibilities:
The creation of the service worker and caching abilities, and managing the offline database capabilities.  

Deployed URL: [http://agile-thicket-87690.herokuapp.com/](http://agile-thicket-87690.herokuapp.com/)

### The Graph and Table
![BudgetGraph](https://github.com/JEQP/budget-tracker/blob/master/graph.jpg)
