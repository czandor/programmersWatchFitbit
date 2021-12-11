import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import * as C from "../common/const";
import { units} from "user-settings";
import { user } from "user-profile";
import { today as todayActivity } from "user-activity";
import { primaryGoal } from "user-activity";
import { goals } from "user-activity";

import * as messaging from "messaging";

import { me } from "appbit";
import { display } from "display";

import { vibration } from "haptics";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { battery } from "power";
import { charger } from "power";
import { me as device } from "device";
if (!device.screen) device.screen = { width: 348, height: 250 };
device.ionic=(device.screen.width==348);
device.versa=(device.screen.width==300);
device.sense=(device.screen.width==336);
device.noBarometer=(device.modelName=='Versa Lite');

import * as ping from "./ping";
import * as settings from "./settings";
// Update the clock every minute
clock.granularity = "minutes";

settings.load();

// Get a handle on the <text> element



let bodyPresent=false;
let hrbpm=0;
let hrm=null;
let body=null;

let bottomNumberType=0;
let btActive=-1;

setInterval(function(){ping.ping(0);},C.PING_PERIOD*C.MILLISECONDS_PER_MINUTE);
let bottomNumberResetTimer=null;
document.getElementById("buttonLow").onclick=function(){
  if(settings.getSettings(C.SettingsTapVibe)) util.vibe(C.VIBRATE_PATTERNS[settings.getSettings(C.SettingsTapVibe)],vibration);
  bottomNumberType++;
  if(bottomNumberType > C.BottomNumberTypes) bottomNumberType=C.BottomNumberNothing;
  //if(bottomNumberType>=C.BottomNumberCals && bottomNumberType <= C.BottomNumberHR) needHealthRefresh=true;
  //if(bottomNumberType=C.BottomNumberSec) needWeatherRefresh=true;
  //updateHealthBlock();
  /*if(bottomNumberResetTimer) clearTimeout(bottomNumberResetTimer);
  bottomNumberResetTimer=setTimeout(function(){
    resetBottomNumber();
  },2000);*/
  tick();
}
if (me.permissions.granted("access_heart_rate")) {
  if (HeartRateSensor) {
    hrm = new HeartRateSensor({ frequency: 1 });
    hrm.addEventListener("reading", () => {
      //if(LOG) console.log("Current heart rate: " + hrm.heartRate);
      hrbpm = hrm.heartRate;
      updateHR();
      //drawDelayed();
    });
    hrm.start();
  }
  if (BodyPresenceSensor) {
    body = new BodyPresenceSensor();
    body.addEventListener("reading", () => {
      bodyPresent=body.present;
      updateHR();
      if (!bodyPresent) {
        hrm.stop();
      } else {
        hrm.start();
      }
      //drawDelayed();
    });
    body.start();
  }
  
  
  //if(LOG) console.log("Started heart rate: " + JSON.stringify(hrm));
}
else{
  //if(LOG) console.log("Heart rate not started, no permission");
}
me.onunload=function(evt){settings.save();};
display.onchange = function() {
  //let today = new Date();
  if (!display.on) { //képernyő KIKAPCSOLVA 
    onDisplayOff();
  }
  else{ //képernyő BEKAPCSOLVA
    onDisplayOn();
   }
}

function onDisplayOn(){
    //console.log("képernyő bekapcs, actualPet: "+actualPet);
    //if(util.getRandomInt(0,50) == 0) bgdeath.animate("enable");
    //refreshScreen(new Date());
    if(hrm) hrm.start();
    if(body) body.start();
}
function onDisplayOff(){
    //console.log("képernyő kikapcs");
    if(hrm) hrm.stop();
    if(body) body.stop();
    stopSeconds();
    resetBottomNumber();
}
function resetBottomNumber(){
  if(bottomNumberResetTimer){
    clearTimeout(bottomNumberResetTimer);
    bottomNumberResetTimer=null;
  }
  bottomNumberType=C.BottomNumberNothing;
  tick();
}
let secondsTimer=null;
function startSeconds(){
  stopSeconds();
  //return;
  let today=new Date();
  setTimeout(function(){
    updateSeconds();
    secondsTimer = setInterval(function(){
      updateSeconds();
    },1000);
  },1000-today.getMilliseconds());
}
function stopSeconds(){
  if(secondsTimer) clearInterval(secondsTimer);
  secondsTimer=null;
}
function tick(){
  let today = new Date();
  
  
  //console.log('tick '+today.getTime()+' '+today.getMilliseconds());
  //if(!secondsTimer) updateSeconds(today);
  //else stopSeconds();
  stopSeconds();
  updateSeconds();
  startSeconds();
  
  let hours = today.getHours();
  let mins = today.getMinutes();
  
  //return;
  //updateSeconds(today);
  
  
  if (settings.is12h(preferences)) {
    // 12h format
    document.getElementById("ampm").text=(hours<12)?'AM':'PM';
    hours = hours % 12 || 12;
    document.getElementById("hourStyle").text='12 hours';
  } else {
    // 24h format
    //hours = util.zeroPad(hours);
    document.getElementById("hourStyle").text='24 hours';
    document.getElementById("ampm").text=='';
  }
  let hoursText=util.monoDigits(hours);
  let minsText = util.monoDigits(util.zeroPad(mins));
  document.getElementById("time").text=`${hoursText}:${minsText}`;
  let today2=new Date(today.getTime()+settings.holder.timeZone2Offset*1000*60);
  document.getElementById("hourHand").groupTransform.rotate.angle = (360 / 12) * today2.getHours() + (360 / 12 / 60) * today2.getMinutes();
  document.getElementById("minuteHand").groupTransform.rotate.angle = (360 / 60) * today2.getMinutes();// + (360 / 60 / 60) * seconds;

  //return;
  //return;
  //document.getElementById("secondsAnim").to=(360 / 60) * seconds+(2);
  //document.getElementById("secondsAnim2").to=(360 / 60) * seconds;
  //document.getElementById("secondsHand").animate("enable");
  //return;
  //date.text=`${C.WEEKDAYS_LONG_DEFAULT[today.getDay()]}, ${C.MONTHNAMES_DEFAULT[today.getMonth()]} 
  
 
  drawDelayed();
}
// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
  tick();
}
function drawDelayed(delay){
  if(!delay) {
    setTimeout(function(){drawDelayed(true);return;},150);
    return;
  }
  //return;
  let today = new Date();
  let day = today.getDate();
  let month = today.getMonth()+1;
  let year = today.getYear()+1900;
  
  document.getElementById("date1").text='DATE     '+C.WEEKDAYS_DEFAULT[today.getDay()]+'   '+util.zeroPad(day)+'   '+util.zeroPad(month)+''+C.MONTHNAMES_DEFAULT[month-1];
  document.getElementById("date2").text=util.zeroPad(year-2000);

  if(bottomNumberType==C.BottomNumberNothing) {
    setBottomNumbers(0);
    if(device.versa){
      document.getElementById("secondsBlock").style.opacity=1;
      document.getElementById("ampmBlock").style.opacity=0;
    }
  }
  else if(device.versa){
    document.getElementById("secondsBlock").style.opacity=0;
    document.getElementById("ampmBlock").style.opacity=1;
  }
  //return;
  refreshScreen();
  ping.ping(0,tick);

  if(settings.isDisconnected(messaging)){
    if(btActive!=0){
      btActive=0;
      document.getElementById("btImage").href='images/btoff.png';
      document.getElementById("btImage").style.opacity=0.7;
    }
  }
  else{
    if(btActive!=1){
      btActive=1;
      document.getElementById("btImage").href='images/bton.png';
      document.getElementById("btImage").style.opacity=1;
    }
  }
 
}  

function updateSeconds(){
  //return;
  let today=new Date();
  let seconds = today.getSeconds();
  document.getElementById("seconds").text = util.monoDigits(util.zeroPad(seconds));
  //return;
  document.getElementById("secondsBar1").width=Math.ceil((45/60)*seconds);
  document.getElementById("secondsBar2").width=Math.floor((45/60)*seconds);
  document.getElementById("secondsHand").groupTransform.rotate.angle = (360 / 60) * seconds;
  updateUnixTime(today,0);
  
}
function refreshScreen(){
  let today=new Date();
  //return;
  document.getElementById("timeZone").text=settings.getTimezoneName(1);
  document.getElementById("timeZone2").text=settings.getTimezoneName(2);
  document.getElementById("additionalTimes1").text=settings.getSunrise(preferences);
  document.getElementById("additionalTimes2").text=settings.getSunset(preferences)+'      UTC '+util.zeroPad(today.getUTCHours())+':'+util.zeroPad(today.getUTCMinutes());
  //return;
  updateHealthBlock();
  updateGeekField();
  updateWeather();
  //return true;
}
function updateWeather(){
  //return;
  document.getElementById("weatherIcon").href=settings.getWeatherIcon();
  document.getElementById("weather1").text=settings.getWeatherLine(1,units,device);
  document.getElementById("weather2").text=settings.getWeatherLine(2,units,device);
  document.getElementById("weather3").text=settings.getWeatherLine(3,units,device);
  document.getElementById("weather4").text=settings.getWeatherLine(4,units,device);
}
function updateUnixTime(today,counter){
  //let msec=today.getTime()+counter;
  let msec=Math.floor(today.getTime()/1000);
  document.getElementById("unixTime").text="UNIX  TIMESTAMP  "+((bottomNumberType==C.BottomNumberSec)?'*':'')+(msec);
  if(bottomNumberType==C.BottomNumberSec) setBottomNumbers(msec);
  //if(counter < 1000) setTimeout(function(){updateUnixTime(today,(counter+1));},1);
}
let bottomNumber=-1;
function setBottomNumbers(num){
  if(bottomNumber == num) return;
  bottomNumber = num;
  /*let binDarab=15;
  //let base = (number).toString(2);
  for(let i= 0 ; i <= (binDarab*2) ; i++){
    if(i <= binDarab) document.getElementById("bottomText"+Math.pow(2,i)).style.textDecoration=((number >> i) & 1)?'underline':'none';
    else document.getElementById("bottomText"+Math.pow(2,i-(binDarab+1))).style.fill=((number >> i) & 1)?'white':'#3de4ea';
  }
  */
  let binDarab=32;
  let calcNum=0;
  for(let i= 0 ; i < (binDarab) ; i++){
    //console.log(calcNum +'-'+ num);
    //document.getElementById("bottomText"+Math.pow(2,i)).style.textDecoration=((num >> i) & 1)?'underline':'none';
    //document.getElementById("bottomText"+Math.pow(2,i)).style.fill=((num >> i) & 1)?'white':'#3de4ea';
    if(i < 14) document.getElementById("bottomText"+(i+1)).style.textDecoration=((num >> i) & 1)?'underline':'none';
    //else document.getElementById("bottomText"+(i+1)).text=((num >> i) & 1)?'-':'_';
    //document.getElementById("bottomText"+(i+1)).style.fill=((num >> i) & 1)?'white':'#3de4ea';
    else if (calcNum <= num) document.getElementById("bottomText"+(i+1)).style.opacity=((num >> i) & 1)?1:0.4;
    else document.getElementById("bottomText"+(i+1)).style.opacity=0;
    calcNum+=Math.pow(2,i);
    
  }
  //document.getElementById("bottomTextEnd").text='+'+Math.floor(num/2048)+'*2048';
}
let prevHR="";
function updateHR(){
  let hrText=((bottomNumberType==C.BottomNumberHR)?'*':'')+((hrbpm==0 || bodyPresent==false)?"--":hrbpm);
  if(prevHR == hrText) return;
  prevHR == hrText;
  
  let hrOpacity=0.5;
  let hrZone=user.heartRateZone(hrbpm);
  if(bodyPresent) switch(hrZone){
    case "fat-burn":
    case "custom":
      hrOpacity=0.8;
      break;
    case "cardio":
    case "above-custom":
      hrOpacity=0.9;
      break;
    case "peak":
      hrOpacity=1;
      break;
    case "out-of-range":
    case "below-custom":
    default:
      hrOpacity=0.7;
      break;
  }
  document.getElementById("hrImage").style.opacity=hrOpacity;
  document.getElementById("hrText").text=hrText;
}
function updateHealthBlock(){
  
  updateHR();
  
  let steps=(todayActivity.adjusted.steps || todayActivity.local.steps || 0);
  let distance=(todayActivity.adjusted.distance || todayActivity.local.distance || 0);
  let minutes=((todayActivity.adjusted.activeZoneMinutes || todayActivity.local.activeZoneMinutes || {total:0}).total);//(todayActivity.adjusted.activeMinutes || todayActivity.local.activeMinutes || 0);
  let calories=(todayActivity.adjusted.calories || todayActivity.local.calories || 0);
  let elevation=(todayActivity.adjusted.elevationGain || todayActivity.local.elevationGain || 0); 
  let batteryLevel=Math.floor(battery.chargeLevel);  
  let spacer="      ";
  if(device.ionic) spacer="  ";
  let distIsMetric=settings.isDistanceMetric(units);
  document.getElementById("health1").text=((device.ionic)?"BATT "+((bottomNumberType==C.BottomNumberBatt)?"*":"")+batteryLevel+spacer:'')+"KCALS "+((bottomNumberType==C.BottomNumberCals)?"*":"")+calories+spacer+"STEPS "+((bottomNumberType==C.BottomNumberSteps)?"*":"")+steps;
  document.getElementById("health2").text=((device.ionic)?((distIsMetric)?"METERS":"MILES")+" "+((bottomNumberType==C.BottomNumberDist)?((distIsMetric)?"*":"**"):"")+(distance*((distIsMetric)?1:0.000621371192)).toFixed((distIsMetric)?0:2)+spacer:"")+"A.Z.MINS "+((bottomNumberType==C.BottomNumberMins)?"*":"")+minutes+spacer+"FLOORS "+((bottomNumberType==C.BottomNumberFloors)?"*":"")+((device.noBarometer)?'N/A':elevation);
  if(!device.ionic) document.getElementById("health3").text="BATT "+((bottomNumberType==C.BottomNumberBatt)?"*":"")+batteryLevel+spacer+((distIsMetric)?"METERS":"MILES")+" "+((bottomNumberType==C.BottomNumberDist)?((distIsMetric)?"*":"**"):"")+(distance*((distIsMetric)?1:0.000621371192)).toFixed((distIsMetric)?0:2);
  
  //document.getElementById("hrText").style.textDecoration=(bottomNumberType==C.BottomNumberHR)?'underline':'none';
  let goalImage=settings.getBarImage(primaryGoal);
  
  let goalMax=1;
  let goal=1;
  let bottomNumber=-1;
  switch(goalImage){
    case "steps":
      goalMax=(goals.steps || 10000);
      goal=steps;
      break;
    case "distance":
      goalMax=(goals.distance || 8000);
      goal=distance;
      break;
    case "calories":
      goalMax=(goals.calories || 2400);
      goal=calories;
      break;
    case "elevationGain":
      goalMax=(goals.elevationGain || 5);
      goal=elevation;
      break;
    case "activeZoneMinutes":
      goalMax=(goals.activeZoneMinutes || {total:22}).total;
      goal=minutes;
      break;
    case "battery":
      goalMax=100;
      goal=batteryLevel;
      break;
  }
  switch (bottomNumberType){
    case C.BottomNumberSteps:
      bottomNumber=steps;
      break;
    case C.BottomNumberDist:
      bottomNumber=(distance*((distIsMetric)?1:1.0936)); //yards for us
      break;
    case C.BottomNumberCals:
      bottomNumber=calories;
      break;
    case C.BottomNumberFloors:
      bottomNumber=elevation;
      break;
    case C.BottomNumberMins:
      bottomNumber=minutes;
      break;
    case C.BottomNumberBatt:
      bottomNumber=batteryLevel;
      break;
    case C.BottomNumberSteps:
      bottomNumber=steps;
      break;
    case C.BottomNumberHR:
      bottomNumber=hrbpm;
      break;
  }
  //goalMax=1000;
  //goal=2000;
  if(bottomNumber >= 0) setBottomNumbers(bottomNumber);
  if(goalImage != ""){
    let barActiveMax=360;
    let barActiveValue=(barActiveMax/goalMax)*goal;
    document.getElementById("healthArc").sweepAngle=(Math.max(Math.min(barActiveValue,barActiveMax),0));
    document.getElementById("healthImage").href='images/'+goalImage+'.png';
  }
  else{
    document.getElementById("healthArc").sweepAngle=0;
    document.getElementById("healthImage").href='';
  }
  
}
function updateGeekField(){
  let needGeekAlert=false;
  if(settings.isInfoEnabled()){
    let infos=settings.holder.infoText.replace('\r','').split('\n');
    document.getElementById("geekNumbers1").text=(0 in infos)?infos[0]:'';
    document.getElementById("geekNumbers2").text=(1 in infos)?infos[1]:'';
    document.getElementById("geekNumbers3").text=(2 in infos)?infos[2]:'';
    needGeekAlert=settings.isInfoError();
  }
  else {
    document.getElementById("geekNumbers1").text='RND '+util.getRandomInt(0, 999);
    document.getElementById("geekNumbers2").text='PI '+Math.PI.toFixed(5);
    document.getElementById("geekNumbers3").text='e '+Math.E.toFixed(5);
  }
  document.getElementById("geekNumbers0").style.opacity=(needGeekAlert)?1:0;
  document.getElementById("geekNumbers4").style.opacity=(needGeekAlert)?1:0;
}
