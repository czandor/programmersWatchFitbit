import * as C from "../settings/const";
export * from "../common/utils";
import * as util from "./utils";


export function settingsToSelect(settingsStorage){
  let s=null;
  let LOG=C.COMPANION_LOG;
  if(LOG) console.log("sutils  ---- starting settings convert "+ settingsStorage.getItem('settings'));
  //if(settingsStorage.getItem('settings')) s=JSON.parse(settingsStorage.getItem('settings'));
  //if(s) {for(let a = 0 ; a < C.SettingsDefaults.length ; a++) if(typeof s[a] === 'undefined') s[a]=C.SettingsDefaults[a];}
  //else s=C.SettingsDefaults;
  
  s=getSettingsArray(settingsStorage);
  //console.log(s[C.SettingsBgOption]);
  
  //settingsStorage.setItem("bgOption", createSelectValue(C.bgOptions,[s[C.SettingsBgOption]]));
  
  settingsStorage.setItem("barType", createSelectValue(C.barOptions,[s[C.SettingsBarType]]));
  settingsStorage.setItem("units24h", createSelectValue(C.units24hOptions,[s[C.SettingsUnits24h]]));
  settingsStorage.setItem("unitsDistance", createSelectValue(C.unitsDistanceOptions,[s[C.SettingsUnitsDistance]]));
  settingsStorage.setItem("unitsSpeed", createSelectValue(C.unitsSpeedOptions,[s[C.SettingsUnitsSpeed]]));
  settingsStorage.setItem("unitsTemp", createSelectValue(C.unitsTempOptions,[s[C.SettingsUnitsTemp]]));
  settingsStorage.setItem("tapVibrate", createSelectValue(C.vibrateOptions,[s[C.SettingsTapVibe]]));
  
  settingsStorage.setItem("weatherPeriod", createSelectValue(C.weatherPeriodOptions,[s[C.SettingsWeatherPeriod]]));
  settingsStorage.setItem("infoPeriod", createSelectValue(C.infoPeriodOptions,[s[C.SettingsInfoPeriod]]));
  
  
  settingsStorage.setItem("infoScriptEnabled", JSON.stringify(s[C.SettingsInfoEnabled]==1));
  settingsStorage.setItem("showAmPm", JSON.stringify(s[C.SettingsShowAmPm]==1));
  
  if(LOG) console.log("sutils  ---- settings converted to select tags");
}


let selectToSettingsTimer=null;
export function selectToSettings(settingsStorage,delay){
  if(!delay){
    if(selectToSettingsTimer) clearTimeout(selectToSettingsTimer);
    selectToSettingsTimer=setTimeout(function(){selectToSettings(settingsStorage,1)},1000);
    return;
  }
  selectToSettingsTimer=null;
  let s=getSettingsArray(settingsStorage);//JSON.parse(JSON.stringify(C.SettingsDefaults));
  let json=null;
  let LOG=C.SETTINGS_LOG;
  if(LOG) console.log("sutils  ---- starting convert select to settings");
  
  if(settingsStorage.getItem("barType") && (json=JSON.parse(settingsStorage.getItem("barType"))) ) s[C.SettingsBarType]=json.values[0].value.id*1;
  if(settingsStorage.getItem("units24h") && (json=JSON.parse(settingsStorage.getItem("units24h"))) ) s[C.SettingsUnits24h]=json.values[0].value.id*1;
  if(settingsStorage.getItem("unitsDistance") && (json=JSON.parse(settingsStorage.getItem("unitsDistance"))) ) s[C.SettingsUnitsDistance]=json.values[0].value.id*1;
  if(settingsStorage.getItem("unitsSpeed") && (json=JSON.parse(settingsStorage.getItem("unitsSpeed"))) ) s[C.SettingsUnitsSpeed]=json.values[0].value.id*1;
  if(settingsStorage.getItem("unitsTemp") && (json=JSON.parse(settingsStorage.getItem("unitsTemp"))) ) s[C.SettingsUnitsTemp]=json.values[0].value.id*1;
  if(settingsStorage.getItem("tapVibrate") && (json=JSON.parse(settingsStorage.getItem("tapVibrate"))) ) s[C.SettingsTapVibe]=json.values[0].value.id*1;

  if(settingsStorage.getItem("weatherPeriod") && (json=JSON.parse(settingsStorage.getItem("weatherPeriod"))) ) s[C.SettingsWeatherPeriod]=json.values[0].value.id*1;
  if(settingsStorage.getItem("infoPeriod") && (json=JSON.parse(settingsStorage.getItem("infoPeriod"))) ) s[C.SettingsInfoPeriod]=json.values[0].value.id*1;

  
  if(settingsStorage.getItem("infoScriptEnabled")) s[C.SettingsInfoEnabled]=(settingsStorage.getItem("infoScriptEnabled")=='true')?1:0;
  if(settingsStorage.getItem("showAmPm")) s[C.SettingsShowAmPm]=(settingsStorage.getItem("showAmPm")=='true')?1:0;
  
  if(LOG) console.log("sutils  ---- settings Select tags converted to settings settings: "+JSON.stringify(s));
  settingsStorage.setItem('settings',JSON.stringify(s));
  return s;
}


export function cleanSettings(json){
  if(!json) json=JSON.parse(JSON.stringify(C.SettingsDefaults));
  for(let i=0 ; i < C.SettingsDefaults.length ; i++){
    if(!(i in json)) json[i]=C.SettingsDefaults[i];
  }
  return json;
}
export function getSettingsArray(settingsStorage){
  let json=null;
  if(settingsStorage.getItem('settings')) json=JSON.parse(settingsStorage.getItem('settings'));
  return cleanSettings(json);
} 

function createSelectValue(where,values){
  let json={"selected":[],"values":[]};
  //console.log(where,values);
  for(let i=0 ; i < values.length ; i++){
    let id=searchIdInList(where,values[i]);
    //console.log(id);
    json.selected[i]=id;
    json.values[i]=where[id];
  }
  return JSON.stringify(json);
}
function searchIdInList(where,value){
  //console.log(where,value);
  for(let a = 0 ; a < where.length ; a++){
    if((""+where[a].value.id) == (""+value)) return a;
  }
  return 0;
}

/*
export function colorOptions(){
  let colors=[];
  for(let i=0 ; i < C.BGColors.length ; i++){
    colors[i]={color: '#'+C.BGColors[i]};
  }
  return colors;
}
*/
export function timeZoneOptions(){
  
  let zones=[];
  let date = new Date;
  /*let i=0;
  zones.push({name:"Default ("+getTimezoneName()+")",   value:''+(i)});
  C.aryIannaTimeZones.forEach((timeZone) => {
    i++;
    let strTime = date.toLocaleString("en-US", {
      timeZone: `${timeZone}`
    });
    zones.push({name:timeZone+' ('+getTimezoneName(timeZone)+')',   value:''+(i)});
    //console.log(timeZone, strTime);
  });*/
  
  zones.push({name:"Default ("+getTimezoneName()+")",   value:'0'});
  
  C.minimalTimezoneSet.forEach((timeZone) => {
    zones.push({name:timeZone.tzCode+' '+timeZone.label+'',   value:''+(1+C.aryIannaTimeZones.indexOf(timeZone.tzCode))});
  });
  
  return zones;
}
export function getTimezoneName(timeZone) {
  const today = new Date();
  //date.toLocaleString('de-DE', {hour: '2-digit',   hour12: false, timeZone: 'Asia/Shanghai' })
  let short = today.toLocaleDateString("en-US");
  let full = today.toLocaleDateString("en-US", {timeZoneName: 'short' });
  if(timeZone){
    short = today.toLocaleDateString("en-US",{timeZone: timeZone});
    full = today.toLocaleDateString("en-US", {timeZone: timeZone, timeZoneName: 'short' });
  }
  // Trying to remove date from the string in a locale-agnostic way
  const shortIndex = full.indexOf(short);
  if (shortIndex >= 0) {
    const trimmed = full.substring(0, shortIndex) + full.substring(shortIndex + short.length);
    
    // by this time `trimmed` should be the timezone's name with some punctuation -
    // trim it from both sides
    return trimmed.replace(/^[\s,.\-:;]+|[\s,.\-:;]+$/g, '');

  } else {
    // in some magic case when short representation of date is not present in the long one, just return the long one as a fallback, since it should contain the timezone's name
    return full;
  }
}
export function getTimezoneUtcOffset(timeZone) {
  //let today = new Date((new Date()).toLocaleString("en-US",{timeZone: 'UTC'}));
  let today = new Date();
  //date.toLocaleString('de-DE', {hour: '2-digit',   hour12: false, timeZone: 'Asia/Shanghai' })
  let short = today.toLocaleString("en-US");
  if(timeZone){
    short = today.toLocaleString("en-US",{timeZone: timeZone});
  }
  console.log(short);
  let today2 = new Date(short);
  return Math.round((today2.getTime()-today.getTime())/(1000*60));
}
export function timeOptions(settingsStorage){
  let h12=false;
  let json=null;
  if(settingsStorage && settingsStorage.getItem("units24h") && (json=JSON.parse(settingsStorage.getItem("units24h"))) && (json.values[0].value*1) == C.UnitsUS) h12=true;
  //if(settingsStorage && settingsStorage.getItem("showAmPm") && settingsStorage.getItem("showAmPm") == 'true') h12=true;
  
  let times=[];
  for(let hour=0 ; hour < 24 ; hour++) for(let minute=0 ; minute < 60 ; minute+=5){
    let ampm="";
    let hour2=hour;
    if(h12){
      ampm=(hour < 12)?" AM":" PM";
      hour2 = hour2 % 12 || 12;
    }
    times.push({name:((ampm)?hour2:util.zeroPad(hour2))+':'+util.zeroPad(minute)+ampm,   value:''+(hour*100+minute)});
  }
  return times;
}
export function weatherEnabled(settingsStorage){
  return true;
  /*let s=(settingsStorage.getItem('statusIds'))?JSON.parse(settingsStorage.getItem('statusIds')):null;
  if(!s) s=JSON.parse(JSON.stringify(C.STATUSIDS_DEFAULT));
  for(let i=0 ; i<4 ; i++){
    if(i == 0 && statusWeather(s[i])) return true;
    if(i != 0 && statusWeather(s[i][0])) return true;
    if(i != 0) for(let j = 0 ; j < s[i][1].length ; j++){
      if(statusWeather(s[i][1][j])) return true;
    }
  }
  if(getTextProvider(settingsStorage) == "weather") return true;
  return false;*/
}
export function getLanguageCode(settingsStorage){
  //let id=getLanguageId(settingsStorage);
  //if(lang.languages[id]) return lang.languages[id][0];
  return "en";
}