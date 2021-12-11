// Add zero in front of numbers < 10
export function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
export function spacePad(i) {
  if (i < 10) {
    i = " " + i;
  }
  return i;
}
export function monoDigits(digits) {
  var ret = "";
  var str = digits.toString();
  for (var index = 0; index < str.length; index++) {
    var num = str.charAt(index);
    if(''+num === ''+(num*1)) ret = ret.concat(hex2a("0x1" + num));
    else ret = ret.concat(num);
  }
  return ret;
}
export function hex2a(hex) {
  var str = '';
  for (var index = 0; index < hex.length; index += 2) {
    var val = parseInt(hex.substr(index, 2), 16);
    if (val) str += String.fromCharCode(val);
  }
  return str.toString();
}

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function vibe(pattern,vibration){
  vibration.stop();
  if(pattern == "special" || pattern == "special-max"){
    pattern=pattern.replace("special","confirmation");
    vibe(pattern,vibration);
    setTimeout(function(){vibe(pattern,vibration)},400);
    setTimeout(function(){vibe(pattern,vibration)},500);
    //setTimeout(function(){vibe(pattern,force)},660);
  }
  else vibration.start(pattern);
  return true;
}
export function WEATHER_PERIOD(forError){
  if(!forError) forError=false;
  let today=new Date();
  if(forError) today.setTime( today.getTime() - 1000 * (60 * 20) )
  /*
    régi: 48 darab //félóránként
    új (adaptív):
    0-6: 1 //4 óránként
    6-8: 6 //20 percenként
    8-11: 3 //1 óránként
    11-16: 3 //2 óránként
    16-18: 4 //30 percenként
    18-22: 4 // 1 óránként
    22-24: 1 // 2 óránként
    üsszesen: 22
    új (adaptív):
    0-6: 1 //4 óránként
    6-9: 9 //20 percenként
    9-16: 7 //1 óránként
    16-18: 4 //30 percenként
    18-24: 6 // 1 óránként
    üsszesen: 27
  */
  let hour=today.getHours();
  /*if (hour < 6) return 239;
  if (hour >= 6 && hour < 8) return 19;
  if (hour >= 8 && hour < 11) return 59;
  if (hour >= 11 && hour < 16) return 119;
  if (hour >= 16 && hour < 18) return 29;
  if (hour >= 18 && hour < 22) return 59;
  if (hour >= 22) return 119;*/
  
  if (hour < 6) return 239;
  if (hour >= 6 && hour < 9) return 19;
  if (hour >= 9 && hour < 16) return 59;
  if (hour >= 16 && hour < 18) return 29;
  if (hour >= 18) return 59;
  
  
  return 79;

}
