
export const APP_LOG = 0;
export const COMPANION_LOG = 0;
export const SETTINGS_LOG = 0;

export const AppVersion=210625;
export const AppName="prog";
export const AppName2="beta";


export const MONTHNAMES_DEFAULT= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS_DEFAULT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHNAMES_LONG_DEFAULT = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const WEEKDAYS_LONG_DEFAULT = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const MILLISECONDS_PER_MINUTE=60000;

export const WEATHER_PERIOD_DEFAULT=30;
export const WEATHER_FORECAST_PERIOD = 239; //minutes //4 óra

export const INFO_PERIOD_DEFAULT=15;
export const PING_PERIOD=5;
export const PING_TIMEOUT = 5000; //msecs

export const PING_STATUS_SUCCESS     =0;
export const PING_STATUS_STARTED     =1;
export const PING_STATUS_NOCONNECTION=2;
export const PING_STATUS_TIMEOUT     =3;
export const PING_STATUS_NONEED      =4;
export const PING_STATUS_ALREADY     =5;

export const MessageTypePing = 0;
export const MessageTypePong = 1;
export const MessageTypeSettings = 2;
export const MESSAGE_TYPE_WEATHER = 3;
export const MessageTypeInfo = 4;

export const SETTINGS_RANDOM  = -1;
export const SETTINGS_SYSTEMDEFAULT = -2;
export const SETTINGS_NOTHING = -3;

export const SettingsInfoPeriod     = 0;
export const SettingsUnitsDistance  = 1;
export const SettingsUnits24h       = 2;
export const SettingsShowAmPm       = 3;
export const SettingsUnitsTemp      = 4;
export const SettingsBarType        = 5;
export const SettingsUnitsSpeed     = 6;
export const SettingsWeatherPeriod  = 7;
export const SettingsInfoEnabled    = 8;
export const SettingsTapVibe        = 9;

export const UnitsDefault    =0;
export const UnitsMetric     =1;
export const UnitsUS         =2;

export const SettingsDefaults=[
  INFO_PERIOD_DEFAULT, //0
  UnitsDefault, //1
  UnitsDefault, //2
  1, //3
  UnitsDefault, //4
  SETTINGS_SYSTEMDEFAULT, //5
  UnitsDefault, //6
  WEATHER_PERIOD_DEFAULT, //7
  0, //8
  1 //9
];


export const HEALTH_steps             =0;
export const HEALTH_distance          =1;
export const HEALTH_calories          =2;
export const HEALTH_elevationGain     =3;
export const HEALTH_activeZoneMinutes =4;
export const HEALTH_battery           =5;

export const BottomNumberTypes=8;

export const BottomNumberNothing=0;
export const BottomNumberSec=1;
export const BottomNumberCals=2;
export const BottomNumberSteps=3;
export const BottomNumberMins=4;
export const BottomNumberFloors=5;
export const BottomNumberBatt=6;
export const BottomNumberDist=7;
export const BottomNumberHR=8;

export const VIBRATE_PATTERNS=["","bump","nudge","nudge-max","ping","confirmation","confirmation-max","special","special-max"];

