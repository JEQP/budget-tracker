let transactions = [];
var db;
let myChart;



const request = indexedDB.open("budgetdatabase", 2);

request.onerror = function (event) {
  console.log("Error opening database: " + event);
};

request.onsuccess = event => {
  db = event.target.result;
  console.log("onsuccess: " + event.target.result);
};


// Create schema -- links db to the appropriate instance of the database
request.onupgradeneeded = event => {
  db = event.target.result;

  // Creates an object store with a date keypath that can be used to query on. Date is unique. The keypath must be a key in the object
  const budgetStore = db.createObjectStore("budget", {
    keyPath: "date"
  });
  // Creates a dateIndex that we can query on. Date is the most likely unique identifier
  budgetStore.createIndex("dateIndex", "date", { unique: false });
};


// if no online connection this get run.
function saveRecord(data) {
  // start transaction
  const transaction = db.transaction(["budget"], "readwrite");

  // access your pending object store
  const store = transaction.objectStore("budget");
// Data is sent as an object that matches the indexedDB store
  store.add(data);

}

// when online connection detected, this is run.
function checkDatabase() {
// start transaction
  const transaction = db.transaction(["budget"], "readwrite");

  var objectStore = transaction.objectStore("budget");
  // get all records from object store
  var objectStoreRequest = objectStore.getAll();


  objectStoreRequest.onsuccess = function (event) {
// loop over the array of objects
    event.target.result.forEach(transferMongo);
//transfer each item to an array, then the array to mongo DB
    function transferMongo(item) {
      console.log("transferMongo run", item);
      transactions.unshift(item);
    }

    fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(transactions),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        if (data.errors) {
          errorEl.textContent = "Missing Information";
        }
        else {
          // if no errors, clear the indexedDB
          clearIndexedDB();

          function clearIndexedDB() {
            //start transaction
            const transaction = db.transaction(["budget"], "readwrite");

            // access your pending object store
            const store = transaction.objectStore("budget");
            var clearObjectStore = store.clear();
            clearObjectStore.onsuccess = function (event) {
              console.log("IndexedDB store cleared");
            }
          }
        }
      })
      .catch(err => {
        // fetch failed
        console.log("err: ", err);

        // clear form

      });
  }
}
/////


fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        fill: true,
        backgroundColor: "#6666ff",
        data
      }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      }
      else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      saveRecord(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};

if (navigator.onLine) {
  request.onsuccess = event => {
    db = event.target.result;
    console.log("onsuccess in onLine: " + event.target.result);
    checkDatabase();
  };

}
