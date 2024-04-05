var socket = io();

socket.on("trades", function (data) {
  updateTrades(data);
});

function updateTrades(data) {
  var table = document.getElementById("tradesTable");

  var time = data["time"];
  var count = data["count"];
  var price = parseFloat(data["price"]);
  var amount = parseFloat(data["amount"]);

  var row = table.insertRow(1);
  row.insertCell(0).innerHTML = convertToKSTAndFormatTime(time);
  row.insertCell(1).innerHTML = count;
  row.insertCell(2).innerHTML = price.toFixed(1);
  row.insertCell(3).innerHTML = Math.round(amount).toLocaleString("en-US");
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
