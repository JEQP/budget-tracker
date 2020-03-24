let transactions = [];
let myChart;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then((reg) => {
        console.log("Service worker registered.", reg);
      })
  });
}

const request = indexedDB.open("budgetdatabase", 2);

request.onerror = function (event) {
  console.log("Error opening database");
};

request.onsuccess = event => {
  console.log(request.result);
};


// Create schema -- links db to the appropriate instance of the database
request.onupgradeneeded = event => {
  const db = event.target.result;

  // Creates an object store with a date keypath that can be used to query on. Date is unique. The keypath must be a key in the object
  const budgetStore = db.createObjectStore("budget", {
    keyPath: "date"
  });
  // Creates a dateIndex that we can query on. Date is the most likely unique identifier
  budgetStore.createIndex("dateIndex", "date", { unique: false });
};

// Opens a transaction, accesses the budget objectStore and statusIndex.
request.onsuccess = () => {
  const db = request.result;
  console.log("ln 39 index.js: " + JSON.stringify(request.result));
  // transaction is how to access the data stores. The first arguement is an array of the objectstores you wish to access, and the second is readwrite or readonly
  const transaction = db.transaction(["budget"], "readwrite");
  const budgetStore = transaction.objectStore("budget");
  const dateIndex = budgetStore.index("dateIndex");

  // Adds data to our objectStore
  budgetStore.add({ name: "Lunch", value: -20, date: new Date().setDate(new Date().getDate() - 5)});
  budgetStore.add({ name: "Dinner", value: -40, date: new Date().setDate(new Date().getDate() - 4)});
  budgetStore.add({ name: "Party Time", value: 300, date: new Date().setDate(new Date().getDate() - 3)});
  budgetStore.add({ name: "Breakfast", value: 15, date: new Date().setDate(new Date().getDate() - 2)});

  // Opens a Cursor request and iterates over the documents.
  const getCursorRequest = budgetStore.openCursor();
  getCursorRequest.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      if (cursor.value.status === "in-progress") {
        const todo = cursor.value;
        todo.status = "complete";
        cursor.update(todo);
      }
      cursor.continue();
    }
  };
};

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
