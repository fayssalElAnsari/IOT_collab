/*=====================================================================
 * Auteur : G.Menez
 =====================================================================*/
// SPIFFS
#include <SPIFFS.h>
// OTA
#include <ArduinoOTA.h>
#include "ota.h"
// Capteurs
#include "OneWire.h"
#include "DallasTemperature.h"
// Wifi (TLS) https://github.com/espressif/arduino-esp32/tree/master/libraries/WiFiClientSecure
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "classic_setup.h"
// MQTT https://pubsubclient.knolleary.net/
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "uptime_formatter.h"
#include "uptime.h"

#define USE_SERIAL Serial

/*===== ESP GPIO configuration ==============*/
/* ---- LED         ----*/
const int LEDpin = 19; // LED will use GPIO pin 19
/* ---- Light       ----*/
const int LightPin = A5; // Read analog input on ADC1_CHANNEL_5 (GPIO 33)
/* ---- Temperature ----*/
OneWire oneWire(23); // Pour utiliser une entite oneWire sur le port 23
DallasTemperature TempSensor(&oneWire) ; // Cette entite est utilisee par le capteur de temperature

String whoami; // Identification de CET ESP au sein de la flotte

/*===== JSON =================================*/
//StaticJsonBuffer<200> jsonBuffer;

/*===== WIFI =================================*/
#undef TLS_USE
#ifdef TLS_USE
WiFiClientSecure secureClient;     // Avec TLS !!!
#else
WiFiClient espClient;              // Use Wifi as link layer
#endif

/*===== MQTT broker/server and TOPICS ========*/
//String MQTT_SERVER = "192.168.1.101";
String MQTT_SERVER = "test.mosquitto.org";
#ifdef TLS_USE
int MQTT_PORT =  8883; // for TLS cf https://test.mosquitto.org/
#else
int MQTT_PORT = 1883;
#endif

//==== MQTT Credentials =========
/*#define MQTT_CRED*/
#ifdef MQTT_CRED
char *mqtt_id     = "RANDOM_CITIZEN_MQTT";
char *mqtt_login  = "darkvador";
char *mqtt_passwd = "6poD2R2";
#else
char *mqtt_id     = "RANDOM_CITIZEN_MQTT";
char *mqtt_login  = NULL;
char *mqtt_passwd = NULL;
#endif

//==== MQTT TOPICS ==============
#define TOPIC_TEMP  "uca/M1/iot/temp"
#define TOPIC_LED   "uca/M1/iot/led"
#define TOPIC_LIGHT "uca/M1/iot/light"
#define TOPIC_ESPS "uca/M1/iot"
#ifdef TLS_USE
PubSubClient client(secureClient); // MQTT client
#else
PubSubClient client(espClient);      // The ESP is a MQTT Client
#endif

void mqtt_pubcallback(char* topic, byte* message, unsigned int length) {
  /**  MQTT Callback ... if a message is published on this topic.   */
  
  // Byte list to String ... plus facile a traiter ensuite !
  // Mais sans doute pas optimal en performance => heap ?
  String messageTemp ;
  for(int i = 0 ; i < length ; i++) {
    messageTemp += (char) message[i];
  }
  
  USE_SERIAL.printf("Message : %s => arrived on topic : %s\n", messageTemp, topic);
  // Analyse du message et Action 
  if(String (topic) == TOPIC_LED) { // Par exemple : Message sur topic LED => Changes the LED output state according to the message
    USE_SERIAL.printf("Action : Changing output to %s", messageTemp);
    if(messageTemp == "on") {
      set_pin(LEDpin,HIGH);
      
    } else if (messageTemp == "off") {
      set_pin(LEDpin,LOW);
    }
  }
}

void setup_mqtt_client() {
  /**  Setup the MQTT client  */

  // set server
  client.setServer(MQTT_SERVER.c_str(), MQTT_PORT);
  // set callback when publishes arrive for the subscribed topic
  client.setCallback(mqtt_pubcallback);
}

void mqtt_connect() {
  /** Connection to a MQTT broker  */
  
#ifdef TLS_USE
  // For TLS
  const char* cacrt = readFileFromSPIFFS("/ca.crt").c_str();
  secureClient.setCACert(cacrt);
  const char* clcrt = readFileFromSPIFFS("/client.crt").c_str();
  secureClient.setCertificate(clcrt);
  const char* clkey = readFileFromSPIFFS("/client.key").c_str();
  secureClient.setPrivateKey(clkey);
#endif
  
  while (!client.connected()) { // Loop until we're reconnected
    USE_SERIAL.print("Attempting MQTT connection...");
    
    // Attempt to connect => https://pubsubclient.knolleary.net/api
    if (client.connect(mqtt_id,      /* Client Id when connecting to the server */
                       mqtt_login,   /* With credential */
                       mqtt_passwd)) {
      USE_SERIAL.println("connected");
    }
    else {
      USE_SERIAL.print("failed, rc=");
      USE_SERIAL.print(client.state());
      
      USE_SERIAL.println(" try again in 5 seconds");
      delay(5000); // Wait 5 seconds before retrying
    }
  }
}

void mqtt_subscribe(char *topic) {
  /**  Subscribe to a topic  */
  if (!client.connected())
    mqtt_connect();
  
  client.subscribe(topic);
}

/*============= ACCESSEURS ====================*/

float get_temperature() {
  float temperature;
  TempSensor.requestTemperaturesByIndex(0);
  delay (750);
  temperature = TempSensor.getTempCByIndex(0);
  return temperature;
}
float get_light(){
  return analogRead(LightPin);
}
void set_pin(int pin, int val){
 digitalWrite(pin, val) ;
}
int get_pin(int pin){
  return digitalRead(pin);
}

/** define constants **/
const char* led01 = "ON";
const char* led02 = "OFF";

const float LAT = 43.616; 
const float LGN = 7.0646;

const char* IDENTIFIER = "RandomCitizens";

String getUptime() {
  uptime::calculateUptime();
  return String(uptime::getMinutes()) +"m :  " + String(uptime::getSeconds()) + "s ";
}

String getMac() {
  return WiFi.macAddress().c_str();
}

String getIp() {
  return WiFi.localIP().toString().c_str();
}

String getJSONString_fromstatus(float temp, int light){
  /*
   * put all relevant data from esp in a "json formatted" String
   */
  StaticJsonDocument<1000> jsondoc;
  jsondoc["status"]["temperature"] = temp;
  jsondoc["status"]["light"] = light;
  jsondoc["status"]["led1"] = led01;
  jsondoc["status"]["led2"] = led02;

  jsondoc["info"]["loc"]["lat"] = LAT; // constante
  jsondoc["info"]["loc"]["lgn"] = LGN;  // constante
    
  jsondoc["info"]["user"] = IDENTIFIER;
  jsondoc["info"]["uptime"] = getUptime();
  jsondoc["info"]["ident"] = getMac();
  jsondoc["info"]["ip"] = getIp();

  
  String data = "";
  serializeJson(jsondoc, data);
  return data;
}

/*=============== SETUP =====================*/

void setup () {

  USE_SERIAL.begin(9600);
  while (!USE_SERIAL); // wait for a serial connection. Needed for native USB port only

  // Connexion Wifi
  connect_wifi();
  print_network_status();
  // Choix d'une identification pour cet ESP
  whoami =  String(WiFi.macAddress());

  // Initialize the LED
  setup_led(LEDpin, OUTPUT, LOW);
  // Init temperature sensor
  TempSensor.begin();

  // Initialize SPIFFS
  SPIFFS.begin(true);
  // MQTT broker connection
  setup_mqtt_client();

  /* On se connecte avant le subscribe */
  mqtt_connect();

  /*------ Subscribe to TOPIC_LED  ---------*/
  mqtt_subscribe((char *)(TOPIC_LED));
}

/*================= LOOP ======================*/

void loop () {
  static uint32_t lasttick = 0;
  char data[250];
  String payload; // Payload : "JSON ready" 
  String payload2;
  int32_t period = 6 * 1000l; // Publication period
  
  if ( millis() - lasttick < period) {
    goto END;
  }
  USE_SERIAL.println("End of stand by period => new sample !");
  lasttick = millis();

  // Si la connexion avec le broker tombe on se reconnecte
  mqtt_connect();

  
  
  /*------ Publish Temperature periodically ---*/
  payload = "{\"who\": \"";
  payload += whoami;   
  payload += "\", \"value\": " ;
  payload += get_temperature(); 
  payload += "}";
  payload.toCharArray(data, (payload.length() + 1)); // Convert String payload to a char array
  // https://pubsubclient.knolleary.net/api#publish
  if (client.publish(TOPIC_TEMP, data)== true) // publish it
     USE_SERIAL.printf("published %s on topic %s\n", data, TOPIC_TEMP);   

  /*------ Publish Light periodically ---------*/
  payload = "{\"who\": \"" + whoami + "\", \"value\": " + get_light() + "}";
  payload.toCharArray(data, (payload.length() + 1));
  
  if (client.publish(TOPIC_LIGHT, data)==true) // publish it 
      USE_SERIAL.printf("published %s on topic %s\n", data, TOPIC_LED);; 

  /*----- Publish to TOPIC_ESPS periodically --*/
  payload2 = getJSONString_fromstatus(get_temperature(), get_light());
  payload2.toCharArray(data, (payload2.length() + 1)); // Convert String payload to a char array
  // https://pubsubclient.knolleary.net/api#publish
  if (client.publish(TOPIC_ESPS, data)== true) // publish it
     USE_SERIAL.printf("published %s on topic %s\n", data, TOPIC_ESPS);
  
END :  
  // Process MQTT ... obligatoire une fois par loop()
  client.loop(); 
}
