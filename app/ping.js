import * as messaging from "messaging";
import * as C from "../common/const";
import * as util from "../common/utils";
import { battery } from "power";
import { display } from "display";
import { me } from "appbit";
import {APP_LOG as LOG} from "../common/const";
import * as settings from "./settings";
import { vibration } from "haptics";

let lastPingStart=0;
let lastAppStarted=(new Date()).getTime();
const appRestartTimeout=30*C.MILLISECONDS_PER_MINUTE; //ha nincs kapcsolat 
let callback=null;

export function ping(source,func){
  let today=new Date();
  if(func) callback=func;
  //console.log('ping');
  if(!source) source=0;
  if(source == 0 && lastPingStart < 3) {
    if(LOG) console.log("Initing Ping... "+lastPingStart);
    lastPingStart++;
    return;
  }
  if(source >=1) lastPingStart=1000; //ezzel kikényszerítem a pinget akármi is van (csak akkor ha már rég volt success)
  if(source >=2) settings.holder.lastPong=1000; //ezzel a successt is kinyírom
  if((settings.holder.lastPong + C.PING_PERIOD*C.MILLISECONDS_PER_MINUTE) < today.getTime() ){
    if((lastPingStart + C.PING_TIMEOUT) < today.getTime() ){
      lastPingStart=today.getTime();
      if (settings.isPeerOpen(messaging)) {
        if(LOG) console.log("Pinging companion to starts periodic task, ping success at: "+settings.holder.lastPong+", " + ((today.getTime()-settings.holder.lastPong)/1000)+" seconds ago");
        messaging.peerSocket.send([C.MessageTypePing,battery.chargeLevel+1]);//,todayActivity.adjusted || todayActivity.local,dayHistory.query()]);
        onPing(C.PING_STATUS_STARTED);
        setTimeout(function(){onPing(C.PING_STATUS_TIMEOUT);},C.PING_TIMEOUT);
      }
      else {
        if(LOG) console.log("Pinging not starts, peersocket not open");
        onPing(C.PING_STATUS_NOCONNECTION);
      }
    } 
    else {
      if(LOG) console.log("Pinging not start, already running at: "+lastPingStart+", " + ((today.getTime()-lastPingStart)/1000)+" seconds ago");
      onPing(C.PING_STATUS_ALREADY);
    }
  }
  else {
    if(LOG) console.log("Pinging not start, ping success at: "+settings.holder.lastPong+", " + ((today.getTime()-settings.holder.lastPong)/1000)+" seconds ago");
    onPing(C.PING_STATUS_NONEED);
  }
}
function onPing(status){
  let today=new Date();
  if(status == C.PING_STATUS_TIMEOUT && (settings.holder.lastPong + C.PING_TIMEOUT) >= today.getTime()) return;
  if(status == C.PING_STATUS_ALREADY) return;
  if(status == C.PING_STATUS_STARTED) return;
  if(status == C.PING_STATUS_SUCCESS) {
    settings.holder.lastPong=today.getTime();
    //settings.save();
  }
  
  let disconnected=settings.isDisconnected(messaging);
  //console.log(settings.lastDisconnected , disconnected);
  //if(PINGFAILEDRESTARTCOUNT > 0){
  //  if(disconnected) pingFailedCount++;
  //  else pingFailedCount=0;
  //  if(pingFailedCount > PINGFAILEDRESTARTCOUNT && !display.on) me.exit();
  //}
  let forceRestart=(disconnected && display.on && (lastAppStarted < (today.getTime()-appRestartTimeout)));
  if(forceRestart) try{
    console.log("!!!!!! long time disconnected !!!!! trying to exit in 5sec...");
    setTimeout(function(){
      if(!settings.isDisconnected(messaging)) console.log("!!!!!! cancelling restarting, now everything good again...");
      else me.exit();
    },5000);
  }
  catch(e){
    console.log("!!!!!! exit not success long time !!!!! argh....");
  }
  /*
  if(settings.lastDisconnected != disconnected){
    //if(settings.settings[C.SETTINGS_DISCONNECT]){
      console.log("!!!!! lastDisconnected: "+settings.lastDisconnected+", disconnected: "+disconnected+", lastAppStarted: "+((today.getTime()-lastAppStarted)/1000)+" seconds ago");
      drawIcons();
      if(!disconnected){ // most kapcsolódott
        console.log("!!!!!! now connected !!!!! suuupeeerr");
        settings.lastDisconnected = false;
        if(settings.settings[C.SETTINGS_DISCONNECT] && settings.settings[C.SETTINGS_RECONNECTVIBRATE] && C.VIBRATE_PATTERNS[settings.settings[C.SETTINGS_RECONNECTVIBRATE]]){
          if (vibe(C.VIBRATE_PATTERNS[settings.settings[C.SETTINGS_RECONNECTVIBRATE]])) display.poke();
        }
      }
      else{ //most szakadt
        // újraindítjuk, hátha azzal megjavul, és akkor nem kell lefuttatni a szakadáskori procedúrát
        //saveSettings();
        let normalDisconnectedProcedure=false;
        if (lastAppStarted < (today.getTime()-appRestartDelay)) { //már régebb óta fut az app , vagyis nem most indult el
          try{
            console.log("!!!!!! now disconnected !!!!! trying to exit...");
            me.exit();
          }
          catch(e){
            // nem sikerült az újraindítás normál szakadáskori procedúra futtatása...
            console.log("!!!!!! exit not success !!!!! argh....");
            normalDisconnectedProcedure=true;
          }
        }
        else normalDisconnectedProcedure=true;
        
        if(normalDisconnectedProcedure){ //ez a normál szakadáskori procedúra, csak az első pingpróbálkozáskor futtatjuk, mivel mindig újraindítjuk szakadáskor. Kivéve mikor nem sikerül, akkor a catch bekamuzza hogy most van először a ping
          settings.lastDisconnected = true;
          console.log("!!!!!! still no connection !!!!! argh....");
          if(settings.settings[C.SETTINGS_DISCONNECT] && settings.settings[C.SETTINGS_DISCONNECTVIBRATE] && C.VIBRATE_PATTERNS[settings.settings[C.SETTINGS_DISCONNECTVIBRATE]]){
            if(vibe(C.VIBRATE_PATTERNS[settings.settings[C.SETTINGS_DISCONNECTVIBRATE]])) display.poke();
          } 
        }
      }
    //}
    //saveSettings();
  }
  */
  
}

messaging.peerSocket.onclose = function(evt) {
  if(LOG){
    if(evt.code == evt.CONNECTION_LOST) console.log('!!!!!!!!!!!!!!!!!!!!!messaging.peerSocket.onclose: CONNECTION_LOST '+evt.reason+' wasClean: '+evt.wasClean);
    if(evt.code == evt.PEER_INITIATED) console.log('!!!!!!!!!!!!!!!!!!!!!messaging.peerSocket.onclose: PEER_INITIATED '+evt.reason+' wasClean: '+evt.wasClean);
    if(evt.code == evt.SOCKET_ERROR) console.log('!!!!!!!!!!!!!!!!!!!!!messaging.peerSocket.onclose: SOCKET_ERROR '+evt.reason+' wasClean: '+evt.wasClean);
  }
  //ping();
}
messaging.peerSocket.onopen = function(evt) {
  ping(1);
}
// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  if(LOG) console.log("Got message from COMPANION: "+evt.data[0]+", "+JSON.stringify(evt.data[1]));
  let today=new Date();
  onPing(C.PING_STATUS_SUCCESS);
  if(evt.data[1] !== null && evt.data[1][0] !== null) switch(evt.data[0]){
    case C.MESSAGE_TYPE_WEATHER:
      settings.holder.weatherText=evt.data[1][0];
      if(evt.data[1][1] !== null) settings.holder.weatherTemp=evt.data[1][1];
      if(evt.data[1][2] !== null) settings.holder.weatherHum=evt.data[1][2];
      if(evt.data[1][3] !== null) settings.holder.windSpeed=evt.data[1][3];
      if(evt.data[1][4] !== null) settings.holder.windDir=evt.data[1][4];
      if(evt.data[1][5] !== null) settings.holder.weatherCity=evt.data[1][5];
      if(evt.data[1][6] !== null) settings.holder.weatherIcon=evt.data[1][6];
      if(evt.data[1][7] !== null) settings.holder.forecastMin=evt.data[1][7];
      if(evt.data[1][8] !== null) settings.holder.forecastMax=evt.data[1][8];
      if(evt.data[1][9] !== null) settings.holder.forecastIcon=evt.data[1][9];
      if(evt.data[1][10] !== null) settings.holder.forecastText=evt.data[1][10];
      if(evt.data[1][11] !== null) settings.holder.sunrise=evt.data[1][11];
      if(evt.data[1][12] !== null) settings.holder.sunset=evt.data[1][12];
      settings.holder.lastWeather=today.getTime();
      break;
    case C.MessageTypeInfo:
      settings.holder.infoText=evt.data[1][0];
      if(evt.data[1][1]) util.vibe(C.VIBRATE_PATTERNS[evt.data[1][1]],vibration);
      settings.holder.lastInfo=today.getTime();
      break;
    case C.MessageTypePong:
      settings.holder.timeZone=evt.data[1][0];
      settings.holder.timeZone2=evt.data[1][1];
      settings.holder.timeZone2Offset=evt.data[1][2]*1;
      break;
    case C.MessageTypeSettings:
      //if(evt.data[1] !== null) {
        /*if(evt.data[1][C.SETTINGS_VIBRATE_TAP] 
           && settings.settings[C.SETTINGS_VIBRATE_TAP] != evt.data[1][C.SETTINGS_VIBRATE_TAP]) {
          vibe(C.VIBRATE_PATTERNS[evt.data[1][C.SETTINGS_VIBRATE_TAP]],1);
        }*/
        settings.holder.settings=evt.data[1];
      //}
      display.poke();
      if(settings.getSettings(C.SettingsTapVibe)) util.vibe(C.VIBRATE_PATTERNS[settings.getSettings(C.SettingsTapVibe)],vibration);
      break;
    /*case C.MESSAGE_TYPE_COLORS:
      for (let i=0 ; i < evt.data[1].length ; i++) settings.colors[i]=evt.data[1][i];
      display.poke();
      break;
    */
  }
  onPing(C.PING_STATUS_SUCCESS);
  settings.save();
  if(callback) callback();
  //ui.updateUI("loaded", evt.data);
}