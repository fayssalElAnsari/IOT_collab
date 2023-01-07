var openWeatherMapApiKey = "22eebd6f7916b6f7dcb4f72cbc9aa8b9";

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a></br>© RandomCitizenS dev project ©'
})

var map = L.map('map', {
    center: [43.616, 7.0646],
    zoom: 10,
    layers: [osm]
});

var markers = []
var poiMarkers = []

var markersLayerGroup = L.layerGroup(markers);
var poiMarkersLayerGroupe = L.layerGroup(poiMarkers);
var layerControl = L.control.layers(null, null).addTo(map);
layerControl.addOverlay(markersLayerGroup, "ESP_Markers");
layerControl.addOverlay(poiMarkersLayerGroupe, "POI_Markers");

var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

createMarkerMsg = function (iotObject) {
    let msg = "";

    msg += "<b>INFO: </b></br>";
    if (iotObject.info.ident != null){
        msg += "&nbsp;&nbsp;<b>id:</b> ";
        msg += iotObject.info.ident;
        msg += "</br>";
    }
    if (iotObject.info.user != null) {
        msg += "&nbsp;&nbsp;<b>user:</b> ";
        msg += iotObject.info.user;
        msg += "</br>";
    }
    if (iotObject.info.ip != null){
        msg += "&nbsp;&nbsp;<b>IP:</b> ";
        msg += iotObject.info.ip;
        msg += "</br>";
    }

    msg += "</br>";

    msg += "<b>STATUS:</b></br>";
    if (iotObject.status.temperature != null) {
        msg += "&nbsp;&nbsp;<b>temperature:</b>";
        msg += iotObject.status.temperature + " °C";
        msg += "</br>";
    }   
    if (iotObject.status.light != null) {
        msg += "&nbsp;&nbsp;<b>light:</b>";
        msg += iotObject.status.light;
        msg += "</br>";
    }
    if (iotObject.status.led1 != null ) {
        msg += "&nbsp;&nbsp;<b>led1:</b>";
        msg += iotObject.status.led1;
        msg += "</br>";
    }
    if (iotObject.status.led2 != null) {
        msg += "&nbsp;&nbsp;<b>led2:</b>";
        msg += iotObject.status.led2;
        msg += "</br>";
    } 

    return msg;
}

parseAndShowIotObject = function (iotObject) {
    if (iotObject.info.loc.lat != undefined && iotObject.info.loc.lgn != undefined){
        let lat = iotObject.info.loc.lat;
        let lon = iotObject.info.loc.lgn;
        var marker = L.marker([lat, lon]);
        marker.bindPopup(createMarkerMsg(iotObject)).openPopup();
        markers.push(marker);
    }
}

buildPoiMarkers = function (lat, lon, addMarkersFnc) {
    if (lat != undefined && lon != undefined) {
        var marker = L.marker([lat+0.001, lon+0.001], {icon: greenIcon});
        let URL = "https://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid="+openWeatherMapApiKey
        $.get(URL,function(data, status){
            marker.bindPopup("<b>OWM temp: </b>"+ String(data.main.temp) + " °C").openPopup();
            poiMarkers.push(marker);
            if (addMarkers){
                addMarkers();
            }
        }); 
        
    }
}


// this function will clear the old markers layer 
// and add a new one
addMarkers = function () {
    layerControl.remove();

    markersLayerGroup = L.layerGroup(markers);
    poiMarkersLayerGroupe = L.layerGroup(poiMarkers);
    layerControl = L.control.layers(null, null).addTo(map);
    layerControl.addOverlay(markersLayerGroup, "ESP_Markers");
    layerControl.addOverlay(poiMarkersLayerGroupe, "POI_Markers");

    var group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds());
}

