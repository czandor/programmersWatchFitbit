import * as fs from "fs";
import {APP_LOG as LOG} from "../common/const";
import * as C from "../common/const";
import * as util from '../common/utils';

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";


//to save
export let holder = null;

//temporary variables
let loaded=false;
let saved=false;

export function getSettings(id){
  if(!loaded) load();
  if(typeof id !== 'undefined') return holder.settings[id];
  return holder.settings;
}
export function setSettings(s){
  //if(holder.settings[C.SettingsBgColorId] != s[C.SettingsBgColorId]) holder.bgColor=s[C.SettingsBgColorId];
  holder.settings=s;
  saved=false;
}

export function load() {
  if(LOG) console.log("Loading settings");
  let loadedFromFile=true;
  let h=null;
  try {
    h=fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    // Defaults
    if(LOG) console.log("no settings file, defaults loaded");
    h= {}
    loadedFromFile=false;
  }
  //if(!('lastPingSuccess' in s) ) s.lastPingSuccess=0;
  if(!('settings' in h) ) h.settings=C.SettingsDefaults;
  for(let a = 0 ; a < C.SettingsDefaults.length ; a++) if(typeof h.settings[a] === 'undefined') h.settings[a]=C.SettingsDefaults[a];
  if(!('weatherCity' in h) ) h.weatherCity='City';
  if(!('weatherTemp' in h) ) h.weatherTemp=-99;
  if(!('weatherText' in h) ) h.weatherText='Weather text';
  if(!('weatherHum' in h) ) h.weatherHum=0;
  if(!('weatherIcon' in h) ) h.weatherIcon=0;
  if(!('forecastMin' in h) ) h.forecastMin=-99;
  if(!('forecastMax' in h) ) h.forecastMax=99;
  if(!('forecastText' in h) ) h.forecastText='Tomorrow';
  if(!('forecastText' in h) ) h.forecastIcon=0;
  if(!('windChill' in h) ) h.windChill=0;
  if(!('windDir' in h) ) h.windDir=350;
  if(!('windSpeed' in h) ) h.windSpeed=0;
  if(!('sunrise' in h) ) h.sunrise='--:--';
  if(!('sunset' in h) ) h.sunset='--:--';
  if(!('timeZone' in h) ) h.timeZone='---';
  if(!('timeZone2' in h) ) h.timeZone2='---';
  if(!('timeZone2Offset' in h) ) h.timeZone2Offset=0;
  if(!('lastWeather' in h) ) h.lastWeather=0;
  if(!('lastPong' in h) ) h.lastPong=0;
  if(!('lastInfo' in h) ) h.lastInfo=0;
  if(!('infoText' in h) ) h.infoText='<\nINFO SCRIPT TESTING\n/>';
  
  holder=h;
  loaded=true;
  return loadedFromFile;
}

export function save(){
  if(LOG) console.log("Saving settings");
  try {
    fs.unlinkSync(SETTINGS_FILE);
  } catch (ex) {
  }
  fs.writeFileSync(SETTINGS_FILE, holder, SETTINGS_TYPE);
  if(LOG) console.log("settings file saved");
  saved=true;
}
export function clear(){
  if(LOG) console.log("Clearing settings");
  fs.unlinkSync(SETTINGS_FILE);
  load();
}
export function getTimezoneName(i){
  if(i==2) return holder.timeZone2;
  return holder.timeZone;
}
export function getWeatherIcon(){
  if(isWeatherError()) return 'images/weather/weather_error.png';
  if(holder.weatherIcon > 0 && holder.weatherIcon < 12) return 'images/weather/weather_'+util.zeroPad(holder.weatherIcon)+'.png';
  return '';
}
export function getWeatherLine(line,units,device){
  switch(line){
    case 1:
      return holder.weatherCity+((device.ionic)?'      HUM '+holder.weatherHum+'%':'');
    case 2:
      return toTemp(holder.weatherTemp,units)+getTempUnit(units)+' '+holder.weatherText+((device.ionic)?'   WIND '+toSpeed(holder.windSpeed,units)+speedUnit(units)+'   '+getDirection(holder.windDir):'');
    case 3:
      if(device.ionic) return '';
      return 'WIND '+toSpeed(holder.windSpeed,units)+speedUnit(units)+'   '+getDirection(holder.windDir)+'   HUM '+holder.weatherHum+'%';
    case 4:
      if(device.ionic) return '';
      //holder.forecastText='Scuttered Rain';
      return ((holder.forecastText.length<20)?'FORECAST':'FCST')+' '+toTemp(holder.forecastMin,units)+'/'+toTemp(holder.forecastMax,units)+getTempUnit(units)+' '+holder.forecastText;
  }
  return '';
}
function toSpeed(speed,units){
  if(isSpeedMetric(units)) speed = speed * 1.609344;
  return Math.round(speed); 
}
function speedUnit(units){
  return (isSpeedMetric(units))?'kmh':'mph';
}
function getDirection(deg){
  let dirs=['N','NE','E','SE','S','SW','W','NW','N'];
  let osztas=360/(dirs.length-1);
  let index=Math.round(deg/osztas);
  return dirs[index];
}
export function getSunrise(preferences){
  if(is12h(preferences)) return to12h(holder.sunrise);
  return holder.sunrise;
}
export function getSunset(preferences){
  if(is12h(preferences)) return to12h(holder.sunset);
  return holder.sunset;
}
function toTemp(temp,units){
  if(isTempMetric(units)) temp = (temp - 32) * 5/9;
  return Math.round(temp);
}
function getTempUnit(units){
  return isTempMetric(units)?'C':'F';
}
export function showAmPm(){
  return getSettings(C.SettingsShowAmPm)==1;
}
function to12h(timestring){
  if(timestring.indexOf(':')!==-1){
    let t=timestring.split(':');
    t[0]=t[0]*1;
    let ampmtext="";
    if(showAmPm()) ampmtext=(t[0]<12)?'am':'pm';
    t[0] = t[0] % 12 || 12;
    timestring=''+t[0]+':'+t[1]+ampmtext;
  }
  return timestring;
}
export function is12h(preferences){
  let h24=getSettings(C.SettingsUnits24h);
  if(h24==C.UnitsDefault) return (preferences.clockDisplay === "12h");
  return (h24==C.UnitsUS);
}
export function isSpeedMetric(units){
  //return false;
  let metric=getSettings(C.SettingsUnitsSpeed);
  if(metric==C.UnitsDefault) return (units.speed=="metric");
  return (metric==C.UnitsMetric);
}
export function isTempMetric(units){
  //return false;
  let metric=getSettings(C.SettingsUnitsTemp);
  if(metric==C.UnitsDefault) return (units.temperature=="C");
  return (metric==C.UnitsMetric);
}
export function isDistanceMetric(units){
  //return false;
  let metric=getSettings(C.SettingsUnitsDistance);
  if(metric==C.UnitsDefault) return (units.distance=="metric");
  return (metric==C.UnitsMetric);
}
export function getBarImage(primaryGoal){
  //return "battery";
  let barType=getSettings(C.SettingsBarType);
  if(barType==C.SETTINGS_SYSTEMDEFAULT) return (primaryGoal || 'steps');
  switch(barType){
    case C.HEALTH_steps:
      return "steps";
    case C.HEALTH_distance:
      return "distance";
    case C.HEALTH_calories:
      return "calories";
    case C.HEALTH_elevationGain:
      return "elevationGain";
    case C.HEALTH_activeZoneMinutes:
      return "activeZoneMinutes";
    case C.HEALTH_battery:
      return "battery";
  }
  return "";
} 
export function isPeerOpen(messaging){
  //if(!messageInited) return settings.lastDisconnected;
  return (messaging.peerSocket.readyState === messaging.peerSocket.OPEN);
}
export function isDisconnected(messaging){
  if(!isPeerOpen(messaging)) return true;
  let today=new Date();
  return ((holder.lastPong + C.PING_PERIOD*C.MILLISECONDS_PER_MINUTE*2) < today.getTime() ) ;
}
export function isInfoEnabled(){
  //return true;
  return (holder.settings[C.SettingsInfoEnabled] == 1);
}

export function isInfoError(){
  //if(!needDownload(false,true)) return false;
  //if(LOG) console.log("needInfo true");
  //if(LOG) console.log("isInfoError, INFO_PERIOD:"+INFO_PERIOD+", lastInfo: "+settings.lastInfo);
  if(!isInfoEnabled()) return false;
  let INFO_PERIOD=holder.settings[C.SettingsInfoPeriod];
  let today=new Date();
  return ((holder.lastInfo + INFO_PERIOD*C.MILLISECONDS_PER_MINUTE*2) < today.getTime() ) ;
}
export function isWeatherError(){
  //if(!needDownload(true,false)) return false;
  //if(LOG) console.log("needWeather true");
  let WEATHER_PERIOD=holder.settings[C.SettingsWeatherPeriod];
  //if(LOG) console.log("isWeatherError, WEATHER_PERIOD:"+WEATHER_PERIOD+", lastWeather: "+settings.lastWeather);
  let today=new Date();
  return ((holder.lastWeather + WEATHER_PERIOD*C.MILLISECONDS_PER_MINUTE*2) < today.getTime() ) ;
}
