import {SETTINGS_LOG as LOG} from "./const"
import * as C from "./const";
import * as sutil from "../common/sutils";


let settingsStorage=null;
let started=false;

function infoResult(result){
  if(typeof result !== 'undefined'){
    settingsStorage.setItem('infoResult',result);
  }
  //if(!settingsStorage.getItem('infoResult')) settingsStorage.setItem('infoResult','');
  return settingsStorage.getItem('infoResult') || '';
}
function checkInfoUrl(value){
  let json=null;
  if(typeof value === 'undefined' && settingsStorage.getItem('infoUrlInput') && (json=JSON.parse(settingsStorage.getItem('infoUrlInput'))) && ('name' in json) ) value=json;
  //console.log(json.name);
  if(!value) return;
  let url = value.name;
  settingsStorage.setItem('infoUrlTry',url);
  settingsStorage.setItem('infoUrlTryTime',""+(new Date().getTime()));
  //console.log("info script, url: "+settingsStorage.getItem('infoUrlTry'));
  if(url) infoResult('Testing url: '+url);
  else infoResult('Downloading...');
}

function selectUpdate(runNow){
  if(!runNow){
    setTimeout(function(){ 
      selectUpdate(settingsStorage,true);
    }, 500);
    return;
  }
  sutil.selectToSettings(settingsStorage);
}

function connectionOK(){
  if(!settingsStorage.getItem('connectionInfo')) return true;
  return JSON.parse(settingsStorage.getItem('connectionInfo'));
  /*let today = new Date();
  let seconds=Math.floor(today.getTime()/1000);
  return JSON.parse(settingsStorage.getItem('connectionInfo') > (seconds - 10));*/
}

function getWeatherProviderRow(){
  let icon="https://www.metaweather.com/static/img/weather/lc.svg";
 
  if(settingsStorage.getItem('weatherprovider') && settingsStorage.getItem('weatherprovider').includes('owm')) icon="https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/logo_60x60.png";
  return <TextImageRow
      label="Provider"
      sublabel="click to change"
      icon={icon}
  />
  
}

function mySettings(props) {
  settingsStorage=props.settingsStorage;
  if(!started){
    started=true;
    //let today = new Date();
    //let seconds=Math.floor(today.getTime()/1000);
    //settingsStorage.setItem('connectionInfo',JSON.stringify(seconds-8));
    settingsStorage.setItem('connectionInfo','true');
    settingsStorage.setItem("weatherDownloadNow","false");
  }
  return (
    <Page>
      {!(JSON.parse(settingsStorage.getItem('access_internet') || 'false')) && <Text bold align="left">🌐 - Internet Permission is required to fully use these settings. You can enable it in the 'Permissions' settings of the clock face</Text>}
      
      { !connectionOK() && <Section
        title={<Text bold align="left">❌ - NO CONNECTION TO WATCH!</Text>}>
          <Text bold align="left">There is no connection between your watch and your phone.</Text>
          <Text align="center">You need a connection to use the settings.</Text>
          <Button
            label={<Text bold align="center">TRY AGAIN</Text>}
            onClick={() => settingsStorage.setItem('connectionInfo','true')}
          />
          <Text bold align="left">Possible solutions:</Text>
          <Text align="left">- Turn off and on the Bluetooth on your phone.</Text>
          {!(JSON.parse(settingsStorage.getItem('isSense') || 'false')) && <Text align="left">- Launch the 'Today' screen (swipe up) on your watch, and after 3 seconds return to time with the back button.</Text>}
          {(JSON.parse(settingsStorage.getItem('isSense') || 'false')) && <Text align="left">- Launch the 'Today' program (swipe left) on your watch, and after 3 seconds return to time with the back button.</Text>}
          <Text align="left">- Go back to the Fitbit home screen on your phone, make sure your watch syncs properly, and then come back here.</Text>
          <Text align="left">- Ultimately, restart your watch and / or your phone. You can turn off your watch by going to Settings-&gt;About-&gt;Shut down.</Text>
      </Section>}
      { true && <Section
        title={<Text align="left">🆓 - SUPPORT MY WORK.</Text>}>
        <Text align="left">This clockface is completely free. Please support my work if you can.</Text>
        <Link source="https://czandor.hu/paypal/prog">☕ Buy me a coffee</Link>      
      </Section> }

      
      {connectionOK() && <Section
        title={<Text bold align="left">☁️ - WEATHER</Text>}>
        
        <Select
          label={getWeatherProviderRow()}
          settingsKey="weatherprovider"
          options={[
            {name:"OpenWeatherMap",   value:"owm"},
            {name:"MetaWeather",   value:"meta"}
          ]}
          renderItem={
            (option) =>{
              if(option.value == "meta")
              return <TextImageRow
                label={option.name}
                sublabel="Beta!"
                icon="https://www.metaweather.com/static/img/weather/lc.svg"
              />
              if(option.value == "owm")
              return <TextImageRow
                label={option.name}
                sublabel="Best in class"
                icon="https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/logo_60x60.png"
              />
            }
          }

        />
        { false && <Select
          label={`Download period`}
          selectViewTitle="Download period"
          settingsKey="weatherPeriod"
          options={C.weatherPeriodOptions}
          onSelection={selection => selectUpdate()}
        />}
        <Text>Weather update is adaptive to save resources. Less frequent at night, more frequent in the morning and evening</Text>
        
        {((settingsStorage.getItem('weatherDownloadNow') || 'false') == 'false') && <Button
          label="Download weather now"
          onClick={() => settingsStorage.setItem('weatherDownloadNow','true')}
        />}
        {((settingsStorage.getItem('weatherDownloadNow') || 'false') == 'true') && <Text bold align="center">Working... Please wait...</Text>}
        { connectionOK() && JSON.parse(props.settingsStorage.getItem('debugEnabled') || 'false') && <Text italic>{props.settingsStorage.getItem('debugText')}</Text>}  
      </Section>}
      
      
      
      { connectionOK() && <Section
        title={<Text bold align="left">🕒 - TIME SETTINGS</Text>}>
        <Select
          label={`Analog-clock Time Zone`}
          selectViewTitle="Time Zone for the Analog clock"
          settingsKey="timeZone"
          options={sutil.timeZoneOptions()}
        />
        <Select
          label={`Digital 12/24-hour clock`}
          selectViewTitle="24h or 12h time format"
          settingsKey="units24h"
          options={C.units24hOptions}
          onSelection={selection => selectUpdate()}
        />
        {true && <Toggle settingsKey="showAmPm" label={`Sunset,Sunrise AM/PM`} onChange={state => selectUpdate()} />}
      </Section>}
      { connectionOK() && <Section
        title={<Text bold align="left">⚙️ - OTHER SETTINGS</Text>}>
       <Select
          label={`Touch feedback 📳`}
          selectViewTitle="Pattern"
          settingsKey="tapVibrate"
          options={C.vibrateOptions}
          onSelection={selection => selectUpdate()}
        />
        <Select
          label={`Ring progress type`}
          selectViewTitle="What should the ring show?"
          settingsKey="barType"
          options={C.barOptions}
          onSelection={selection => selectUpdate()}
        />
        <Select
          label={`Speed unit`}
          selectViewTitle="Unit family to use for speeds"
          settingsKey="unitsSpeed"
          options={C.unitsSpeedOptions}
          onSelection={selection => selectUpdate()}
        />
        <Select
          label={`Distance unit`}
          selectViewTitle="Unit family to use for distances"
          settingsKey="unitsDistance"
          options={C.unitsDistanceOptions}
          onSelection={selection => selectUpdate()}
        />
        <Select
          label={`Temperature unit`}
          selectViewTitle="Unit family to use for temperature"
          settingsKey="unitsTemp"
          options={C.unitsTempOptions}
          onSelection={selection => selectUpdate()}
        />
      </Section>}
      
      {connectionOK() && <Section
        title={<Text bold align="left">🤓 - INFO SCRIPT</Text>}>
        <Text>You can make your own info script, when you have some code skill.
          <Text italic>The watchface can send a request to your script with some data in json format with raw POST, and it will display your script result under the second line.</Text>
          <Link source="https://czandor.hu/fitbit/prog/info-help.php">More info &amp; examples</Link>
        </Text>
        <Toggle settingsKey="infoScriptEnabled" label={`Enable Info Script`} onChange={state => selectUpdate()} />
        {((settingsStorage.getItem('infoScriptEnabled') || 'false') == 'true') && <Section>
          <TextInput
          title="URL"
          label="Info Script URL"
          placeholder="Your scipt's URL"
          action="Test and Save"
          settingsKey="infoUrlInput"
          type="url"
          onChange={(value) => checkInfoUrl(value)}
        />
        <Button
          label="Test now"
          onClick={() => checkInfoUrl()}
        />
        <Select
          label={`Download period`}
          selectViewTitle="Download period"
          settingsKey="infoPeriod"
          options={C.infoPeriodOptions}
          onSelection={selection => selectUpdate()}
        />
        <Toggle
          settingsKey="infoNeedPosition"
          label={`Send actual position`}
        />
         <TextInput
          title="Data"
          label="data Value"
          placeholder="Send data to script"
          action="Save"
          settingsKey="infoData"
          type="text"
        />
        {infoResult() != '' && <Text>Info script result:</Text>}
        {infoResult() != '' && <Text italic>{infoResult()}</Text>}
        <Text>Currently used URL:</Text>
        <Text italic>{settingsStorage.getItem('infoUrl')}</Text>
        <Button
          label="Download now"
          onClick={() => checkInfoUrl({name:''})}
        />
        {(settingsStorage.getItem('infoUrl') && (settingsStorage.getItem('infoUrl') != C.DefaultInfoURL)) && <Button
          label="Set to default"
          onClick={() => checkInfoUrl({name:C.DefaultInfoURL})}
        />}
        {(settingsStorage.getItem('infoUrl') && (settingsStorage.getItem('infoUrl') == C.DefaultInfoURL)) && <Text>By default, my script is set to show the actual BTC rate, and server's UTC date and time </Text>}
        </Section>}
        </Section>}
      <Toggle
          settingsKey="debugEnabled"
          label={`Enable debug texts`}
        />
       { JSON.parse(props.settingsStorage.getItem('debugEnabled') || 'false') && <Text italic>{props.settingsStorage.getItem('debugText')}</Text>}
    </Page>
  );
}

registerSettingsPage(mySettings);
