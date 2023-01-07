var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var markers = []

parseAndShowIotObject = function (iotObject) {
    let lat = iotObject.info.lat;
    let lon = iotObject.info.lgn;
    var marker = L.marker([lat, lon]).addTo(map);
    markers.push(markers);
}


