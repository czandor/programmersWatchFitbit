import {COMPANION_LOG as LOG} from "../settings/const"

import * as C from "../settings/const"
import * as sutil from "../common/sutils";
import { me } from "companion";

import * as messaging from "messaging";
import { localStorage } from "local-storage";
import { settingsStorage } from "settings";
import * as weather from "./weather";


import { device } from "peer";
if (!device.screen) device.screen = { width: 300, height: 300 };
if(!device.modelId) device.modelId = "0";
if(!device.modelName) device.modelName = "unknown";
device.ionic=(device.screen.width==348);
device.versa=(device.screen.width==300);
device.sense=(device.screen.width==336);
settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);
if(!localStorage.getItem('uniqueid')) localStorage.setItem('uniqueid',C.AppName+'_'+C.AppName2+'_'+((device.ionic)?'i':((device.sense)?'s':'v'))+me.host.os.name.substring(0,1)+'_'+Math.random().toString(36).substring(2)+(new Date()).getTime().toString(36));

let uniqueid = localStorage.getItem('uniqueid');
let infoIsRunning=false;

import { me as companion } from "companion";
me.onunload=function(){debug('Companion unloaded')};
import { geolocation } from "geolocation";
const WAKEUP_PERIOD = 0; //minutes (0=disabled) nem kell, mivel mindent az óra indít
if(WAKEUP_PERIOD >=5) me.wakeInterval = WAKEUP_PERIOD * C.MILLISECONDS_PER_MINUTE;
if(LOG) console.log("companion launched, starting sendAnswer in 7 secs...");
setTimeout(sendAnswer,7000);

function initStorage(clear){
  if(LOG) console.log('initStorage started...');
  if(!localStorage.getItem('storageInited',0)) clear=true;
  
  if(!clear) clear=false;
  else if(LOG) console.log('Clearing local and settings storages');
  if(clear) settingsStorage.clear();
  sutil.settingsToSelect(settingsStorage);
  
  if(!settingsStorage.getItem('weatherprovider') || settingsStorage.getItem('weatherprovider').includes('yahoo')) settingsStorage.setItem('weatherprovider','{"selected":[0],"values":[{"name":"OpenWeatherMap","value":"owm"}]}');
  
  if(!settingsStorage.getItem('screenWidth') && 'screen' in device && 'width' in device.screen) {
    if(LOG) console.log("device.screen.width Available, setting up in settingsStorage screenWidth and screenHeight...");
    settingsStorage.setItem("screenWidth", device.screen.width);
    settingsStorage.setItem("screenHeight", device.screen.height);
  }
  if(!settingsStorage.getItem('infoUrlInput')) {
    settingsStorage.setItem("infoUrl", C.DefaultInfoURL);
    settingsStorage.setItem("infoUrlInput", '{"name":"'+C.DefaultInfoURL+'"}');
    settingsStorage.setItem("infoNeedPosition", 'true');
  }
  
  
  if(clear) localStorage.clear();
  
  if(clear && LOG) console.log('Success clearing local and settings storages');
  
  localStorage.setItem('storageInited',1);
  
  
  if(!localStorage.getItem('lastInfo')) localStorage.setItem('lastInfo',0);
  if(!clear) {
    //info és weather period beállításához kell
    processSettingsMessage('settings',JSON.stringify(sutil.selectToSettings(settingsStorage,1)));
  }
  setTimeout(function(){
    settingsStorage.setItem('isLCD',(device.modelName&&(device.modelName=='Ionic'||device.modelName=='Versa'||device.modelName=='Versa Lite'))?'true':'false');
    settingsStorage.setItem('isSense',(device.modelName&&(device.modelName=='Sense'||device.modelName=='Versa 3'))?'true':'false');
    settingsStorage.setItem('access_internet',(companion.permissions.granted("access_internet"))?'true':'false');
  },1000); 
}

if(LOG==2) initStorage(true);
else initStorage();


settingsStorage.onchange = function(evt) {
  if(LOG) console.log("Got message from settings, key: "+evt.key+", processing...");
  //if(evt.key == 'settingsRunning'){
  //    settingsStorage.setItem('connectionInfo',JSON.stringify((messaging.peerSocket.readyState === messaging.peerSocket.OPEN)));
  //}
  //else 
    if(!processSettingsMessage(evt.key,evt.newValue,true)){
      settingsStorage.setItem(evt.key,evt.oldValue);
      initStorage();
      settingsStorage.setItem('connectionInfo','false');
    };
}

if (me.launchReasons.settingsChanged) {
  if(LOG) console.log("launchReasons.settingsChanged, sendAllSettings in 3 secs...");
  setTimeout(function(){sendAllSettings();},3000);
}
if (me.launchReasons.peerAppLaunched) {
  if(LOG) console.log("launchReasons.peerAppLaunched, sendAllSettings in 3 secs...");
  setTimeout(function(){sendAllSettings();},3000);
}
function sendAllSettings(){
  for (let i = 0; i < settingsStorage.length; i++){
    //setTimeout(function(){processSettingsMessage(settingsStorage.key(i),(settingsStorage.getItem(settingsStorage.key(i))));},i*50);
    if(processSettingsMessage(settingsStorage.key(i),(settingsStorage.getItem(settingsStorage.key(i))),false)) return;
  }
}
function processSettingsMessage(key,newValue,defaultReturnValue){
  if(LOG){
    // Which setting changed
    //console.log("message ---- Processing settings message, key: " + key+");
    //  What was the old value
    //console.log("old value: " + evt.oldValue)
    //  What is the new value
    console.log("message ---- new value: " + newValue);
  }
  let messageType=null;
  let message=null;
  let json=null;
  switch(key){
    case "infoUrlTryTime":
      let settings=sutil.getSettingsArray(settingsStorage);
      let need=(settings[C.SettingsInfoEnabled]==1);
      if(need) downloadInfo(true);
      break;
    case "weatherDownloadNow":
      if(newValue == "true"){
        setTimeout(function(){weather.getWeather(true)},3500);
        debug("Weather starting...");
      }
      break;
    case "settings":
      messageType=C.MessageTypeSettings;
      if(json=JSON.parse(newValue)) {
        message=JSON.stringify(json);
      }
      debug("Submit settings changes...");
      break;
    case "timeZone":
      getTimeZone();
      break;
    /*case "settingsRunning":
      messageType=C.MessageTypePing;
      if(json=JSON.parse(newValue)) {
        message=JSON.stringify([json]);
      }
      break;*/
  }
  
  if(messageType===null || message===null) {
    if(LOG) console.log("message ---- No message to send to watch, messageType: "+messageType+", message: "+message);
    return defaultReturnValue;
  }
  return sendMessage(messageType,message,0,defaultReturnValue);
}

function sendMessage(type,data,counter,defaultReturnValue){
  if(!counter) counter=0;
  if(localStorage.getItem('sentMessage-'+type) != data){
    if(LOG) console.log("message ---- Sending message to watch: type: "+type+", data: "+(data));
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      if(LOG) console.log("message ---- peerSocket is OK, sending...");
      localStorage.setItem('sentMessage-'+type,(data));
      messaging.peerSocket.send([type,JSON.parse(data)]);
      return true;
    }
    else{
      if(LOG) console.log("message ---- NOT sending message to watch messaging.peerSocket.readyState="+messaging.peerSocket.readyState); 
      /*if(counter < 2){
        if(LOG) console.log("Delaying message, count #"+counter); 
        counter++;
        setTimeout(function(){sendMessage(type,data,counter);},3000);
      }
      else{
        if(LOG) console.log("Message not sent, giving up..."); 
      }*/
      return false;
    }
  }
  else{
    if(LOG) console.log("message ---- Not sending message to watch, same message already sent"); 
  }
  return defaultReturnValue;
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  // Output the message to the console
  if(LOG) console.log("Got message from device: "+JSON.stringify(evt.data));
  setTimeout(function(){gotMessage(evt);},500);
}
let lastMessageGot=[1];
function gotMessage(evt){
  let today=new Date();

  if(!(0 in evt.data)) return;
  let type=evt.data[0];
  settingsStorage.setItem('connectionInfo','true'); 
  initStorage();
  if(!lastMessageGot[type]) return;
  lastMessageGot[type]++;
  
  if(LOG) console.log("gotMessage... type: "+type+", lastMessageGot="+lastMessageGot[type]);
  if((lastMessageGot[type] + C.PING_TIMEOUT) >= today.getTime() ) {
    console.log("gotMessage at "+lastMessageGot[type]+" ("+((today.getTime()-lastMessageGot[type])/1000)+" secs ago) , not sending answer");
    return;
  }
  lastMessageGot[type]=today.getTime();
  
  if(type == C.MessageTypePing) {
    sendAnswer();
    if(evt.data[1]) localStorage.setItem('lastBattery',evt.data[1]*1-1);
    //console.log(JSON.stringify(evt.data));
  }
}
function sendAnswer(){
  getTimeZone();
  setTimeout(function(){getInfo();},1000);
  setTimeout(function(){weather.getWeather();},2000);
  //setTimeout(function(){download();},4000);
}
function getTimeZone(){
  if(LOG) console.log("Sending Timezone");
  //console.log(tzAbbr()) ;
  //let tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  //var moment = require('companion/moment-timezone.js');
  let today = new Date();
  let json=null;
  let analogTimezone="";
  if(settingsStorage.getItem('timeZone') && (json=JSON.parse(settingsStorage.getItem('timeZone')))){
    if(LOG) console.log("timeZone, json: "+JSON.stringify(json));
    let id=-1;
    if(json.values && json.values[0]) id = json.values[0].value*1-1;
    if(id in C.aryIannaTimeZones) analogTimezone=C.aryIannaTimeZones[id];
  }
  
  sendMessage(C.MessageTypePong,JSON.stringify([sutil.getTimezoneName(),sutil.getTimezoneName(analogTimezone),sutil.getTimezoneUtcOffset(analogTimezone),today.getTime()]),0,true);
}





function sendInfoToWatch(info,vibe){
  localStorage.setItem('lastInfoText',info);    
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      let today=new Date();
      localStorage.setItem('lastInfo',today.getTime());  
      sendMessage(C.MessageTypeInfo,JSON.stringify([info,vibe,localStorage.getItem('lastInfo')*1]));
      debug("Sending info to watch");
    }
    else {
      if(LOG) console.log("NOT sending message to watch: "+info+", messaging.peerSocket.readyState="+messaging.peerSocket.readyState); 
      debug("No connection to watch, try restart settings/clockface");
    }
}                                
function downloadInfo(test,position){
  if(!test) test=false;
  if(!settingsStorage.getItem('infoUrlTry') && settingsStorage.getItem('infoUrl')) test=false;
  let url=test?settingsStorage.getItem('infoUrlTry'):settingsStorage.getItem('infoUrl');
  //console.log(settingsStorage.getItem('infoUrlTryTime'));
  let needPosition=(settingsStorage.getItem('infoNeedPosition') && settingsStorage.getItem('infoNeedPosition')=="true");
  if(typeof position === 'undefined' && needPosition){
    var options = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: Infinity
    };
    geolocation.getCurrentPosition(function(position) {
      if(LOG) console.log("Got position: "+position.coords.latitude + ", " + position.coords.longitude);
      debug("Success getCurrentPosition");
      settingsStorage.setItem('infoResult',"Success getCurrentPosition, downloading "+url+"");
      localStorage.setItem('lastPosition',JSON.stringify(locationdatafix(position)));
      downloadInfo(test,position);
    },function(err) {
      if(LOG) console.log(`getCurrentPosition ERROR(${err.code}): ${err.message}`);
      if(localStorage.getItem('lastPosition')) {
        debug("ERROR getCurrentPosition, using last location");
        settingsStorage.setItem('infoResult',"Error getCurrentPosition, last location is available, downloading "+url+" with last location...");
        downloadInfo(test,JSON.parse(localStorage.getItem('lastPosition')));
      }
      else {
        debug("ERROR getCurrentPosition, NO last location");
        settingsStorage.setItem('infoResult',"Error getCurrentPosition, NO last location available, downloading "+url+" without location...");
        downloadInfo(test,null);
      }
    },options);
    return;
  }
  else settingsStorage.setItem('infoResult',"Downloading info script without location, downloading "+url);
  if(!position) position=null;
  else position=locationdatafix(position);
  let dataValue=(settingsStorage.getItem('infoData'))?JSON.parse(settingsStorage.getItem('infoData')):{name:''};
  let settings=sutil.getSettingsArray(settingsStorage);
  let data={pos: position,
            uniqueid: uniqueid,
            modelId: device.modelId*1,
            modelName: device.modelName,
            screenWidth: device.screen.width*1,
            screenHeight: device.screen.height*1,
            battery: (localStorage.getItem('lastBattery'))?localStorage.getItem('lastBattery')*1:0,
            data: ('name' in dataValue)?dataValue.name:'',
            test: test
           };
  //console.log(data);
  let urlOption={
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  }
  
  fetch(url,urlOption).then(function(response) {
      return response.text();
    }).then(function(text) {
      if(LOG) console.log("Got result from info script, try to decode: "+text.substring(0,1000)+""); 
      settingsStorage.setItem('infoResult',"Got result from info script, try to decode: "+text.substring(0,500)+((text.length>500)?"...":""));
      //outbox.enqueue("wallpaper.jpg", buffer);
      processInfoResult(text,test);
    }).catch(function (error) {
      if(LOG) console.log("Got ERROR response info script: " + error); 
      setTimeout(function(){settingsStorage.setItem('infoResult',"Got ERROR response info script: " + error);},3000);
  });
}
function processInfoResult(text,test){
  //settingsStorage.setItem('infoResult','SUCCESS, result: '+text);
  let json=JSON.parse(text);
  let info='Decode error';
  let vibe=0;
  let status='';
  if(json && ('status' in json)) status=json.status;
  if(json && ('info' in json)) info=(json.info)?json.info.replace("\r",""):"";
  if(json && ('vibe' in json)) vibe=json.vibe*1;
  if(!C.VIBRATE_PATTERNS[vibe]) vibe=0;
  if(status == 'error') info='Script Error';
  else if(json && test) settingsStorage.setItem('infoUrl',settingsStorage.getItem('infoUrlTry'));
  sendInfoToWatch(info,vibe);
}


function getInfo(force){
  if(LOG)  console.log('getInfo...');
  //force=true;
  if(!force) force=false;
  else localStorage.setItem('lastInfo',0) ;
  if(needInfoDownload(force)) {
    if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN){
      //localStorage.setItem('lastDownloadStart',today.getTime());
      if(infoIsRunning) {
        if(LOG) console.log("Info download not start, already running");
        return;
      }
      infoIsRunning=true;
      setTimeout(function(){infoIsRunning=false;},5000);
      downloadInfo();
    }
    else{
      if(LOG) console.log("Info download not start, messaging.peerSocket.readyState = "+messaging.peerSocket.readyState);
      debug("No connection to watch, try restart settings/app");
    }
  }
}
function needInfoDownload(force){
  let today=new Date();
  let settings=sutil.getSettingsArray(settingsStorage);
  let need=(settings[C.SettingsInfoEnabled]==1);
  if(!need){
    if(LOG) console.log("Info not enabled, no need to download");
  }
  else{
    //let settings=(settingsStorage.getItem('settings'))?JSON.parse(settingsStorage.getItem('settings')):null;
    //if(!settings) settings=C.SETTINGS_DEFAULTS;
    
    let INFO_PERIOD=settings[C.SettingsInfoPeriod];
    need = (force || ((localStorage.getItem('lastInfo')*1 + INFO_PERIOD*C.MILLISECONDS_PER_MINUTE) < today.getTime()));
    if(!need) if(LOG) console.log("Info download not start, downloaded at: "+localStorage.getItem('lastInfo')+", " + ((today.getTime()-localStorage.getItem('lastInfo'))/C.MILLISECONDS_PER_MINUTE)+" minutes ago");
  }
  return need;
}











function locationdatafix(position){
  let positionObject = {};

  if ('coords' in position) {
    positionObject.coords = {};

    if ('latitude' in position.coords) {
      positionObject.coords.latitude = position.coords.latitude;
    }
    if ('longitude' in position.coords) {
      positionObject.coords.longitude = position.coords.longitude;
    }
    if ('accuracy' in position.coords) {
      positionObject.coords.accuracy = position.coords.accuracy;
    }
    if ('altitude' in position.coords) {
      positionObject.coords.altitude = position.coords.altitude;
    }
    if ('altitudeAccuracy' in position.coords) {
      positionObject.coords.altitudeAccuracy = position.coords.altitudeAccuracy;
    }
    if ('heading' in position.coords) {
      positionObject.coords.heading = position.coords.heading;
    }
    if ('speed' in position.coords) {
      positionObject.coords.speed = position.coords.speed;
    }
  }

  if ('timestamp' in position) {
    positionObject.timestamp = position.timestamp;
  }
  return positionObject;
}


function debug(text){
  settingsStorage.setItem('debugText',text);
  console.log("debugText: "+text);
}

weather.init(debug,device,sendMessage,uniqueid);
