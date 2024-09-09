var socket = io();

var filterOptions = {
  count: 0,
  amount: 0,
};

const eventHandlers = {
  trades_data: updateTrades,
  orderbook_data: updateOrderbook,
};

// 소켓 처리
socket.onAny((event, data) => {
  if (eventHandlers[event]) {
    eventHandlers[event](data.payload);
  } else {
    console.log("Unhandled event: ", event);
  }
});

function updateTrades(data) {
  var table = document.getElementById("tradesTable");
  var rowCount = table.rows.length;

  var time = data["time"];
  var count = data["count"];
  var price = parseFloat(data["price"]);
  var amount = parseFloat(data["amount"]);
  var net = parseFloat(data["net"]);

  if (amount > filterOptions.amount && count > filterOptions.count) {
    var row = table.insertRow(1);
    row.insertCell(0).innerHTML = convertToKSTAndFormatTime(time);
    row.insertCell(1).innerHTML = count;
    row.insertCell(2).innerHTML = price.toFixed(1);
    row.insertCell(3).innerHTML = Math.round(amount).toLocaleString("en-US");
    row.insertCell(4).innerHTML = Math.round(net).toLocaleString("en-US");

    if (net > 0) {
      row.classList.add("positive");
    } else {
      row.classList.add("negative");
    }

    if (amount > 100000) {
      row.classList.add("large-amount");
      playNotificationSound(net);
    }

    if (amount > 1000000) {
      row.classList.add("huge-amount");
    }

    if (rowCount > 20) {
      table.deleteRow(-1);
    }
  }
}

function validateFilterInput(value) {
  if (!value || value < 0) {
    return 0;
  } else {
    return value;
  }
}

function updateFilterOptions() {
  count = parseInt(document.getElementById("filterCount").value);
  amount = parseInt(document.getElementById("filterAmount").value);

  filterOptions.count = validateFilterInput(count);
  filterOptions.amount = validateFilterInput(amount);
}

function playNotificationSound(net) {
  var soundFile;
  if (net > 0) {
    soundFile = "static/sound/sound9.wav";
  } else {
    soundFile = "static/sound/sound10.wav";
  }
  var audio = new Audio(soundFile);
  audio.volume = 0.3;
  audio.play();
}

function convertToKSTAndFormatTime(timeString) {
  var time = new Date(timeString);
  var kstOffset = 9 * 60 * 60 * 1000; // 한국 표준시(KST)의 밀리초 단위 시차 (UTC+9)

  // UTC 시간에 시차를 더하고 KST로 변환
  var kstTime = new Date(time.getTime() + kstOffset);

  // 시, 분, 초, 밀리초 추출
  var hours = kstTime.getUTCHours().toString().padStart(2, "0");
  var minutes = kstTime.getUTCMinutes().toString().padStart(2, "0");
  var seconds = kstTime.getUTCSeconds().toString().padStart(2, "0");
  var milliseconds = kstTime.getUTCMilliseconds().toString().padStart(3, "0");

  // "HH:mm:ss.SSS" 형식으로 시간을 반환
  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function updateOrderbook(data) {
  var tbody = document.querySelector("#orderbookTable tbody");

  tbody.innerHTML = "";

  var asks = data["asks"].slice(0, 10).reverse();
  var bids = data["bids"].slice(0, 10);

  asks.forEach(function (row) {
    var tr = document.createElement("tr");
    tr.classList.add("asks");

    tr.appendChild(document.createElement("td"));
    tr.appendChild(document.createElement("td"));
    tr.appendChild(document.createElement("td"));

    row.forEach(function (cellData) {
      var td = document.createElement("td");
      td.textContent = Math.round(cellData).toLocaleString("en-US");
      tr.appendChild(td);
    });

    tr.appendChild(document.createElement("td"));
    tr.appendChild(document.createElement("td"));
    tbody.appendChild(tr);
  });

  bids.forEach(function (row) {
    var cancelOrder = document.createElement("td");
    var buyOrder = document.createElement("td");
    var sellOrder = document.createElement("td");

    // tr
    var tr = document.createElement("tr");
    tr.classList.add("bids");

    tr.appendChild(cancelOrder);
    tr.appendChild(buyOrder);

    row.reverse().forEach(function (cellData) {
      var td = document.createElement("td");
      td.textContent = Math.round(cellData).toLocaleString("en-US");
      tr.appendChild(td);
    });

    tr.appendChild(document.createElement("td"));
    tr.appendChild(sellOrder);
    tr.appendChild(document.createElement("td"));

    tbody.appendChild(tr);
    cancelOrder.addEventListener("click", handleOrder("cancel"));
    buyOrder.addEventListener("click", handleOrder("limit", "buy", row[1]));
    sellOrder.addEventListener("click", handleOrder("limit", "sell", row[1]));
  });
}

function handleOrder(type, side, price) {
  if (type === "cancel") {
    return function () {
      console.log(`cancel`);
    };
  } else {
    if (side === "buy") {
      return function () {
        console.log(`buy ${price}`);
      };
    }
    if (side === "sell") {
      return function () {
        console.log(`sell ${price}`);
      };
    }
  }
}
