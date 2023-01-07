var openWeatherMapApiKey = "22eebd6f7916b6f7dcb4f72cbc9aa8b9";

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>\n© RandomCitizenS dev project ©'
})

var map = L.map('map', {
    center: [39.73, -104.99],
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

    msg += "INFO: \n";
    if (iotObject.info.ident != null){
        msg += "    id: ";
        msg += iotObject.info.ident;
        msg += "\n";
    }
    if (iotObject.info.user != null) {
        msg += "    user: ";
        msg += iotObject.info.user;
        msg += "\n";
    }
    if (iotObject.info.ip != null){
        msg += "    IP: ";
        msg += iotObject.info.ip;
        msg += "\n";
    }

    msg += "\n";

    msg += "STATUS:\n";
    if (iotObject.status.temperature != null) {
        msg += "    temperature:";
        msg += iotObject.status.temperature;
        msg += "\n";
    }   
    if (iotObject.status.light != null) {
        msg += "    light:";
        msg += iotObject.status.light;
        msg += "\n";
    }
    if (iotObject.status.led1 != null ) {
        msg += "    led1:";
        msg += iotObject.status.led1;
        msg += "\n";
    }
    if (iotObject.status.led2 != null) {
        msg += "    led2:";
        msg += iotObject.status.led2;
        msg += "\n";
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
            marker.bindPopup(String(data.main.temp) + " °C").openPopup();
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
    layerControl.remove(layerControl);

    markersLayerGroup = L.layerGroup(markers);
    poiMarkersLayerGroupe = L.layerGroup(poiMarkers);
    layerControl = L.control.layers(null, null).addTo(map);
    layerControl.addOverlay(markersLayerGroup, "ESP_Markers");
    layerControl.addOverlay(poiMarkersLayerGroupe, "POI_Markers");
}

