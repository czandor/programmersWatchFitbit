import {COMPANION_LOG as LOG} from "../common/const";
import * as weatherEnv from "./weatherEnv";


import { localStorage } from "local-storage";
import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { geolocation } from "geolocation";


import * as C from "../common/sconst"
//import * as util from "../common/utils"
import * as util from "../common/sutils";

let debug=null;
let device=null;
let sendMessage=null;
let uniqueid='';


let weatherIsRunning=false;

export function init(debugFunction,deviceObject,sendMessageFunction,uniqueID){
  debug=debugFunction;
  device=deviceObject;
  sendMessage=sendMessageFunction;
  uniqueid=uniqueID;
  if(!localStorage.getItem('lastWeather')) localStorage.setItem('lastWeather',0);
  if(!localStorage.getItem('lastForecast')) localStorage.setItem('lastForecast',0);
  if(!localStorage.getItem('lastOWMForecast')) localStorage.setItem('lastOWMForecast',"");
}

export function getWeatherProvider(){
  let json=null;
  if(LOG) console.log("getWeatherProvider, weatherprovider: "+settingsStorage.getItem('weatherprovider'));
  if(settingsStorage.getItem('weatherprovider') && (json=JSON.parse(settingsStorage.getItem('weatherprovider')))){
    if(LOG) console.log("getWeatherProvider, json: "+JSON.stringify(json));
    if(json.values && json.values[0]) return json.values[0].value;
  }
  return "owm";
}

function needWeatherDownload(force){
  let today=new Date();
  let need=util.weatherEnabled(settingsStorage);
  if(!need){
    if(LOG) console.log("Weather not enabled in statusIds, no need to download");
  }
  else{
    let WEATHER_PERIOD=util.WEATHER_PERIOD();
    need = (force || ((localStorage.getItem('lastWeather')*1 + WEATHER_PERIOD*C.MILLISECONDS_PER_MINUTE) < today.getTime()));
    if(!need) if(LOG) console.log("Weather not start, downloaded at: "+localStorage.getItem('lastWeather')+", " + ((today.getTime()-localStorage.getItem('lastWeather'))/C.MILLISECONDS_PER_MINUTE)+" minutes ago (WEATHER_PERIOD:"+WEATHER_PERIOD+")");
  }
  return need;
}
export function getWeather(force){
  if(LOG)  console.log('getWeather...');
  setTimeout(function(){
    settingsStorage.setItem("weatherDownloadNow","false");
  },5000);
  if(!force) force=false;
  else localStorage.setItem('lastOWMForecast','') ;
  if(needWeatherDownload(force)) {
    if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN){
      //localStorage.setItem('lastDownloadStart',today.getTime());
      if(weatherIsRunning) {
        if(LOG) console.log("Weather not start, already running");
        return;
      }
      debug("Weather provider: "+getWeatherProvider());
      weatherIsRunning=true;
      setTimeout(function(){weatherIsRunning=false;},5000);
      if (getWeatherProvider() == "owm") getOWM();
      else getMeta();
    }
    else{
      if(LOG) console.log("Weather not start, messaging.peerSocket.readyState = "+messaging.peerSocket.readyState);
      debug("No connection to watch, try restart settings/app");
    }
  }
}


//////////////////////////////// OWM ////////////////////////////////


function decodeAPIresult(result){
  let jsonAPI=null;
  try {
    jsonAPI = JSON.parse(result);
    if(LOG) console.log("Successfully parsed API json"); 
  } catch(e) {
    if(LOG) console.log("Error while decoding API json: "+result); 
  }
  if(jsonAPI && ('key' in jsonAPI) && ('use_allowed' in jsonAPI) && ('status' in jsonAPI) && jsonAPI.status=='ok'){
    if(jsonAPI.use_allowed > 0){
        if(jsonAPI.key !=''){
          return jsonAPI.key;
        }
        else{
          if(LOG) console.log("No key received: "+result); 
          debug("No key received. try later.");
        }
    }
    else{
      if(LOG) console.log("API usage not allowed: "+result); 
      debug("API usage not allowed yet. try later.");
    }
  }
  else{
    if(LOG) console.log("Error API json: "+result); 
    debug("Error response from API server");
  }
  return '';
}
function getOWM(){
  if(LOG) console.log("Start weather downloading OWM");
  debug("Start weather downloading OWM");
  var options = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: Infinity
  };
  geolocation.getCurrentPosition(function(position) {
    if(LOG) console.log("Got position: "+position.coords.latitude + ", " + position.coords.longitude);
    debug("Success getCurrentPosition");
    localStorage.setItem('lastPosition',JSON.stringify(locationdatafix(position)));
    getOWMWeather(position);
  },function(err) {
    if(LOG) console.log(`getCurrentPosition ERROR(${err.code}): ${err.message}`);
    debug("Error getCurrentPosition");
    if(localStorage.getItem('lastPosition')) getOWMWeather(JSON.parse(localStorage.getItem('lastPosition')));
  },options);
}
function getOWMWeather(position,apiKey){
  let url='';
  if(!apiKey){
    if(weatheEnv.OWMApiKey){
      apiKey=weatherEnv.OWMApiKey;
      getOWMWeather(position,apiKey);
    }
    else{
      url=weatherEnv.OWMApiKeyProviderUrl+'?uniqueid='+uniqueid+'&v='+C.AppVersion+'&m='+device.modelId+"-"+device.modelName+'&use='+((needOWMForecast())?2:1);
      if(LOG) console.log("Getting api key for OWM "+url); 
      debug("Getting api key for OWM");
      fetch(url).then(function(response) {
        return response.text();
        }).then(function(text) {
          apiKey=decodeAPIresult(text);
          //outbox.enqueue("wallpaper.jpg", buffer);
          if(apiKey) getOWMWeather(position,apiKey);
        }).catch(function (error) {
          if(LOG) console.log("Got ERROR response api key server: " + error); 
          debug("Error response from API server");
      });
    }
    return;
  }
  
  url = 'https://api.openweathermap.org/data/2.5/weather?lang='+util.getLanguageCode(settingsStorage)+'&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&units=imperial&appid='+apiKey;
  //url = 'https://api.openweathermap.org/data/2.5/weather?lang='+util.getLanguageCode(settingsStorage)+'&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&units=imperial&appid=czandorapikey';
  //url='https://czandor.hu/pebble/weather_owm.php?uniqueid='+uniqueid+'&v='+C.AppVersion+'&m='+device.modelId+"-"+device.modelName+'&url='+encodeURIComponent(url);

  if(LOG) console.log("OWM, url: "+url);

  fetch(url).then(function(response) {
      return response.text();
    }).then(function(text) {
      if(LOG) console.log("Got weather from OWM, try to download forecast"); 
      debug("Weather downloaded, getting forecast...");
      //outbox.enqueue("wallpaper.jpg", buffer);
      getOWMForecast(text,position,apiKey);
    }).catch(function (error) {
      if(LOG) console.log("Got ERROR response from OWM: " + error); 
      debug("Error response from server");
  });
}
function needOWMForecast(){
  let today=new Date();
  return (!localStorage.getItem('lastOWMForecast') || (localStorage.getItem('lastForecast')*1 + C.WEATHER_FORECAST_PERIOD*C.MILLISECONDS_PER_MINUTE) < today.getTime());
}
function getOWMForecast(currentWeather,position,apiKey){
  if(LOG) console.log("Start forecast downloading OWM");
  let today=new Date();
  if(needOWMForecast()) {
    //let position=JSON.parse(localStorage.getItem('lastPosition'));
    //geolocation.getCurrentPosition(function(position) {
      //if(LOG) console.log("Got position: "+position.coords.latitude + ", " + position.coords.longitude);
      let url='';
      url='https://api.openweathermap.org/data/2.5/forecast?lang='+util.getLanguageCode(settingsStorage)+'&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&cnt=8&units=imperial&appid='+apiKey;
      //url='https://api.openweathermap.org/data/2.5/forecast?lang='+util.getLanguageCode(settingsStorage)+'&lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&cnt=8&units=imperial&appid=czandorapikey';
      //url='https://czandor.hu/pebble/weather_owm.php?url='+encodeURIComponent(url);

      if(LOG) console.log("OWM forecast, url: "+url);

      fetch(url).then(function(response) {
          return response.text();
        }).then(function(text) {
          if(LOG) console.log("Got forecast from OWM, try to decode("+currentWeather+"\n"+text+")"); 
          debug("Forecast downloaded");
          //outbox.enqueue("wallpaper.jpg", buffer);
          localStorage.setItem('lastOWMForecast',text);
          localStorage.setItem('lastForecast',today.getTime());
          decodeOWM(currentWeather,text,apiKey);
        }).catch(function (error) {
          if(LOG) console.log("Got ERROR response from OWM forecast: " + error); 
          debug("Forecast error from server");
      });

    //});
  }
  else{
    if(LOG) console.log("NOT start forecast downloading OWM, already have and fresh");
    debug("Forecast already have and fresh");
    decodeOWM(currentWeather,localStorage.getItem('lastOWMForecast'),apiKey);
  }
}

function decodeOWM(currentWeather,forecastWeather,apiKey){
  let jsonC=null;
  let jsonF=null;
  try {
    jsonC = JSON.parse(currentWeather);
    if(LOG) console.log("Successfully parsed OWM current json"); 
  } catch(e) {
    if(LOG) console.log("Error while decoding OWM current json"); 
  }
  try {
    jsonF = JSON.parse(forecastWeather);
    if(LOG) console.log("Successfully parsed OWM forecast json"); 
  } catch(e) {
    if(LOG) console.log("Error while decoding OWM forecast json"); 
  }
  if(jsonC.cod && jsonC.cod == "200" && jsonF.cod && jsonF.cod == "200") {
    let json=jsonC;
    let temperature = Math.round(json.main.temp);
    let hum = Math.round(json.main.humidity);
    let wind=-1;
    let windDir=-1;
    if(json.wind) {
        wind = Math.round(json.wind.speed);
        windDir = Math.round(json.wind.deg);
    }
    let city = "";
    if(json.name) city=json.name;
    else if(json.main.name) city=json.main.name;

    // Conditions
    let conditionCode = json.weather[0].icon;//json.weather[0].id;
    let condition = json.weather[0].description;
    if(condition) condition=condition.charAt(0).toUpperCase() + condition.slice(1);

    // night state
    let isNight = (json.weather[0].icon.slice(-1) == 'n') ? 1 : 0;

    let iconToLoad = 0;//getIconForConditionCodeOWM(conditionCode, isNight);
    if(conditionCode in owmWeatherCodes){
        if(owmWeatherCodes[conditionCode] in weatherCodesToId) iconToLoad=weatherCodesToId[owmWeatherCodes[conditionCode]];
    }
    
    let sunrise=(new Date(json.sys.sunrise*1000)).getHours()+':'+(new Date(json.sys.sunrise*1000)).getMinutes();
    let sunset=(new Date(json.sys.sunset*1000)).getHours()+':'+(new Date(json.sys.sunset*1000)).getMinutes();
    
    if(LOG) console.log('Current weather downloaded successfully temp:' + temperature + ', Wind:'+wind + ', Humidity:'+hum + ', City:'+city+', isNight:' + isNight + ', conditionCode:'+conditionCode+', Icon:' + iconToLoad);
    json=jsonF;
    let forecast = extractFakeDailyForecastOWM(json);


    // Conditions
    conditionCode = forecast.condition;
    let fCondition= forecast.description;
    if(fCondition) fCondition=fCondition.charAt(0).toUpperCase() + fCondition.slice(1);
    
    let fIconToLoad = 0;//getIconForConditionCodeOWM(conditionCode, false);
    let lowTemp=Math.round(forecast.lowTemp);
    let highTemp=Math.round(forecast.highTemp);

    if(LOG) console.log('Forecast downloaded successfully ' + highTemp + '/' + lowTemp + ', conditionCode:'+conditionCode+', Icon:' + iconToLoad+', fCondition:' + fCondition);
    
    
    sendWeatherToWatch(condition,temperature,hum,wind,windDir,city,iconToLoad,lowTemp,highTemp,fIconToLoad,fCondition,sunrise,sunset);
    
    //sendWeatherToWatch(condition,temperature,hum,wind,windDir,city,iconToLoad,lowTemp,highTemp,fIconToLoad,fCondition);
    
  }
  else{
    if(jsonC.cod && jsonC.cod == "401"){
      if(LOG) console.log("OWM invalid api key "+apiKey); 
      debug("Invalid OWM API key");
    }
    else{
      if(LOG) console.log("OWM unknown error: "+currentWeather); 
      debug("Unknown error while decoding OWM result");
    }
    let url='https://czandor.hu/pebble/getapikey_owm.php?uniqueid='+uniqueid+'&v='+C.AppVersion+'&m='+device.modelId+"-"+device.modelName+'&use=0&error='+encodeURIComponent('apiKey:'+apiKey+', result:'+currentWeather);
    fetch(url).then(function(response) {
      return response.text();
      }).then(function(text) {
      }).catch(function (error) {
    });

  }
}
function extractFakeDailyForecastOWM(json) {
  let todaysForecast = {};

  // find the max and min of those temperatures
  todaysForecast.highTemp = -Number.MAX_SAFE_INTEGER;
  todaysForecast.lowTemp  = Number.MAX_SAFE_INTEGER;

  for(let i = 0; i < json.list.length; i++) {
    if(todaysForecast.highTemp < json.list[i].main.temp_max) {
      todaysForecast.highTemp = json.list[i].main.temp_max;
    }

    if(todaysForecast.lowTemp > json.list[i].main.temp_min) {
      todaysForecast.lowTemp = json.list[i].main.temp_min;
    }
  }

  // we can't really "average" conditions, so we'll just cheat and use...one of them :-O
  todaysForecast.condition = json.list[3].weather[0].id;
  todaysForecast.description = json.list[3].weather[0].description;
  return todaysForecast;
} 


//////////////////////////////////////////// 


//////////////////////////////////////////// META (by czandor) ////////////////////////

function getMeta(){
  if(LOG) console.log("Start weather downloading Meta");
  debug("Start weather downloading Meta");
  var options = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: Infinity
  };
  geolocation.getCurrentPosition(function(position) {
    if(LOG) console.log("Got position: "+position.coords.latitude + ", " + position.coords.longitude);
    debug("Success getCurrentPosition");
    localStorage.setItem('lastPosition',JSON.stringify(locationdatafix(position)));
    getMetaWeather(position);
    
  },function(err) {
    if(LOG) console.log(`getCurrentPosition ERROR(${err.code}): ${err.message}`);
    debug("Error getCurrentPosition");
    if(localStorage.getItem('lastPosition')) getMetaWeather(JSON.parse(localStorage.getItem('lastPosition')));
  },options);
}
function getMetaWeather(position){
  /*let url = 'https://query.yahooapis.com/v1/public/yql?q=' +
    encodeURIComponent('select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="('+position.coords.latitude+','+position.coords.longitude+')") and u="'+
    'f'+'"') + '&format=json';*/
  //let url='https://weather-ydn-yql.media.yahoo.com/forecastrss?lat='+position.coords.latitude+'&lon='+position.coords.longitude+'&u=f'+'&format=json';
  let url=weatherEnv.MetaUrl+'?uniqueid='+uniqueid+'&v='+C.AppVersion+'&m='+device.modelId+"-"+device.modelName+'&lat='+position.coords.latitude+'&lon='+position.coords.longitude+'&source=fitbit&device='+((device.ionic)?'ionic':'versa')+'&app='+C.AppName+'&IMAGEPROVIDER_DEFAULT='+C.AppName2;
  
  
  if(LOG) {
    console.log("Meta, url: "+url);
  }
  fetch(url).then(function(response) {
      return response.text();
    }).then(function(text) {
      if(LOG) console.log("Got weather from Meta, try to decode("+text+")"); 
      debug("Got weather and forecast");
      //outbox.enqueue("wallpaper.jpg", buffer);
      decodeMeta(text);
    }).catch(function (error) {
      if(LOG) console.log("Got ERROR response from Meta: " + error); 
      debug("Error response from server");
  });

}
function decodeMeta(text){
  let json=null;
  try {
    json = JSON.parse(text);
    if(LOG) console.log("Successfully parsed Meta json"); 
  } catch(e) {
    if(LOG) console.log("Error while decoding Meta json"); 
  }
  if(json && json.location && json.current_observation){
    
    
    
    
    
    
    
    
      let temperature = Math.round(json.current_observation.condition.temperature);
      let hum = Math.round(json.current_observation.atmosphere.humidity);
      let wind=-1;
      let windDir=-1;
      if(json.current_observation.wind) {
        wind = Math.round(json.current_observation.wind.speed);
        windDir = Math.round(json.current_observation.wind.direction);
      }

      let city = json.location.city;

      // Conditions
      let conditionCode = json.current_observation.condition.code*1;
      let condition = json.current_observation.condition.text;

      let iconToLoad = 0;//getIconForConditionCodeYahoo(conditionCode);
      if(conditionCode in yahooWeatherCodes){
        if(yahooWeatherCodes[conditionCode] in weatherCodesToId) iconToLoad=weatherCodesToId[yahooWeatherCodes[conditionCode]];
      }
    
      if(LOG) console.log('Current weather downloaded successfully condition: '+condition+', temp:' + temperature + ', Wind:'+wind + ', Humidity:'+hum + ', City:'+city + ', conditionCode:'+conditionCode+', Icon:' + iconToLoad);

      //getForecastWeather();
      let todaysForecast = json.forecasts[0]; 
      let tomorrowForecast = json.forecasts[1]; 
      if(!tomorrowForecast) tomorrowForecast=todaysForecast;

      // Conditions
      //var d = new Date();
      let fCondition=todaysForecast.text;
      conditionCode = todaysForecast.code;
      let d=new Date();
      if(d.getHours() > 20) {
        conditionCode = tomorrowForecast.code;
        fCondition = tomorrowForecast.text;
      }
      let fIconToLoad = 0;//getIconForConditionCodeYahoo(conditionCode);
      let lowTemp;
      let lowTemp2;
      let highTemp;
      let highTemp2;
      lowTemp=Math.round(parseInt(todaysForecast.low, 10));
      highTemp=Math.round(parseInt(todaysForecast.high, 10));
      lowTemp2=Math.round(parseInt(tomorrowForecast.low, 10));
      highTemp2=Math.round(parseInt(tomorrowForecast.high, 10));
      if(lowTemp > lowTemp2) lowTemp=lowTemp2;
      if(highTemp < highTemp2) highTemp=highTemp2;


      if(LOG) console.log('Forecast downloaded successfully ' + highTemp + '/' + lowTemp + ', conditionCode:'+conditionCode+', Icon:' + iconToLoad+', fCondition:'+fCondition );

      //let text=""+temperature+"° "+condition;//+localStorage.getItem('tempUnits');

      const convertTime12to24 = (time12h) => {
        const [time, modifier] = time12h.toUpperCase().split(' ');

        let [hours, minutes] = time.split(':');

        if (hours === '12') {
          hours = '00';
        }

        if (modifier === 'PM') {
          hours = parseInt(hours, 10) + 12;
        }

        return `${hours}:${minutes}`;
      }
      let sunrise='--:--';
      let sunset='--:--';
      if(json.current_observation.astronomy) {
        sunrise = convertTime12to24(json.current_observation.astronomy.sunrise);
        sunset = convertTime12to24(json.current_observation.astronomy.sunset);
      }
      if(LOG) console.log('Sun downloaded successfully ' + sunrise + '/' + sunset + '' );
      sendWeatherToWatch(condition,temperature,hum,wind,windDir,city,iconToLoad,lowTemp,highTemp,fIconToLoad,fCondition,sunrise,sunset);
      

  }
  else{
    debug("Something wrong with Meta json"); 
    console.log(text);
  }
}
  
/////////////////////////////////////////////////////////////////////////////////////

export function locationdatafix(position){
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

function sendWeatherToWatch(condition,temperature,hum,wind,windDir,city,iconToLoad,lowTemp,highTemp,fIconToLoad,fCondition,sunrise,sunset){
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      let today=new Date();
      localStorage.setItem('lastWeather',today.getTime());  
      sendMessage(C.MESSAGE_TYPE_WEATHER,JSON.stringify([condition,temperature,hum,wind,windDir,city,iconToLoad,lowTemp,highTemp,fIconToLoad,fCondition,sunrise,sunset,localStorage.getItem('lastWeather')*1]));
      debug("Sending weather to watch");
    }
    else {
      if(LOG) console.log("NOT sending message to watch: "+text+", messaging.peerSocket.readyState="+messaging.peerSocket.readyState); 
      debug("No connection to watch, try restart settings/clockface");
    }
}                                
    
const owmWeatherCodes={
  "01d":"Sunny",
  "01n":"ClearNight",
  "02d":"PartlyCloudyDay",
  "02n":"PartlyCloudyNight",
  "03n":"PartlyCloudy",
  "03d":"PartlyCloudy",
  "04d":"MostlyCloudyDay",
  "04n":"PartlyCloudyNight",
  "09d":"ShowersDay",
  "09n":"ShowersNight",
  "10d":"ShowersDay",
  "10n":"ShowersNight",
  "11d":"Thundershowers",
  "11n":"Thundershowers",
  "13d":"Snow",
  "13n":"Snow",
  "50d":"Foggy",
  "50n":"Foggy"
};           

const yahooWeatherCodes=[
    "Tornado",
    "TropicalStorm",
    "Hurricane",
    "SevereThunderstorms",
    "Thunderstorms",
    "MixedRainSnow",
    "MixedRainSleet",
    "MixedSnowSleet",
    "FreezingDrizzle",
    "Drizzle",
    "FreezingRain",
    "ShowersNight",
    "ShowersDay",
    "SnowFlurries",
    "LightSnowShowers",
    "BlowingSnow",
    "Snow",
    "Hail",
    "Sleet",
    "Dust",
    "Foggy",
    "Haze",
    "Smoky",
    "Blustery",
    "Windy",
    "Cold",
    "Cloudy",
    "MostlyCloudyNight",
    "MostlyCloudyDay",
    "PartlyCloudyNight",
    "PartlyCloudyDay",
    "ClearNight",
    "Sunny",
    "FairNight",
    "FairDay",
    "MixedRainAndHail",
    "Hot",
    "IsolatedThunderstorms",
    "ScatteredThunderstormsNight",
    "ScatteredThunderstormsDay",
    "ScatteredShowers",
    "HeavySnowNight",
    "ScatteredSnowShowers",
    "HeavySnowDay",
    "PartlyCloudy",
    "Thundershowers",
    "SnowShowers",
    "IsolatedThundershowers"
];
const weatherCodesToId={
    'Tornado':4,
    'TropicalStorm':4,
    'Hurricane':4,
    'SevereThunderstorms':4,
    'Thunderstorms':4,
    'MixedRainSnow':8,
    'MixedRainSleet':8,
    'MixedSnowSleet':9,
    'FreezingDrizzle':9,
    'Drizzle':9,
    'FreezingRain':9,
    'ShowersNight':2,
    'ShowersDay':7,
    'SnowFlurries':9,
    'LightSnowShowers':8,
    'BlowingSnow':9,
    'Snow':9,
    'Hail':8,
    'Sleet':8,
    'Dust':3,
    'Foggy':3,
    'Haze':3,
    'Smoky':3,
    'Blustery':3,
    'Windy':11,
    'Cold':9,
    'Cloudy':3,
    'MostlyCloudyNight':6,
    'MostlyCloudyDay':5,
    'PartlyCloudyNight':6,
    'PartlyCloudyDay':5,
    'ClearNight':1,
    'Sunny':10,
    'FairNight':1,
    'FairDay':10,
    'MixedRainAndHail':8,
    'Hot':10,
    'IsolatedThunderstorms':4,
    'ScatteredThunderstormsNight':2,
    'ScatteredThunderstormsDay':7,
    'ScatteredShowers':8,
    'HeavySnowNight':9,
    'ScatteredSnowShowers':9,
    'HeavySnowDay':9,
    'PartlyCloudy':3,
    'Thundershowers':4,
    'SnowShowers':9,
    'IsolatedThundershowers':4
};
