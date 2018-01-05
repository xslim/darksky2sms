
require('dotenv').config();
var request = require('request')

//var location = msg.match[1] || process.env.DARK_SKY_DEFAULT_LAT_LON;
var location = process.env.DARK_SKY_DEFAULT_LAT_LON;

if (!location) {
  return;
}

console.log('Location: ' + location);

darksky(location, function(msg){
  console.log(msg);
})


function timestamp2date(timestamp) {
  var date = new Date(timestamp * 1000);
  return date;
}

function s_date(date, ret_hours) {
  var s = "";
  var weekday = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  s += weekday[date.getDay()];
  
  if (ret_hours == true) {
    var hours = date.getHours();
    s += " " + hours;
  }
  
  return s;
}

function s_temperature(low, high) {
  low = Math.round(low);
  
  var ret = low;
  
  if (high) {
    high = Math.round(high);
    if (low != high) {
      ret += "-" + high;
    }
  }
  
  return ret + "C";
}

function degToCompass(num) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}

function windMs2Bft(v) {
  var knot = v/(0.51+4/900);
  
  if(knot==0) return 0;
  if(knot>1 && knot<3.5) return 1;
  if(knot>=3.5 && knot<6.5) return 2;
  if(knot>=6.5 && knot<10.5) return 3;
  if(knot>=10.5 && knot<16.5) return 4;
  if(knot>=16.5 && knot<21.5) return 5;
  if(knot>=21.5 && knot<27.5) return 6;
  if(knot>=27.5 && knot<33.5) return 7;
  if(knot>=33.5 && knot<40.5) return 8;
  if(knot>=40.5 && knot<47.5) return 9;
  if(knot>=47.5 && knot<55.5) return 10;
  if(knot>=55.5 && knot<63.5) return 11;
  if(knot>=63.5 && knot<74.5) return 12;
  if(knot>=74.5 && knot<80.5) return 13;
  if(knot>=80.5 && knot<89.5) return 14;
  if(knot>=89.5) return 15;
  
  return "?";
}

function s_wind(speed, gust, bearing) {
  speed = windMs2Bft(speed);
  gust = windMs2Bft(gust);
  
  var ret = "F" + speed;
  if (speed != gust) {
    ret += "/"+gust;
  }
  if (speed > 0) {
    ret += " " + degToCompass(bearing); //+ "(" +bearing+ ")";
  }
  return ret;
}

function s_precipitation(intensity, probability) {
  if (probability < 0.2) {
    return "";
  }
  
  var ret = "R"  
  ret += intensity + "/" + probability;
  return ret;
}

function s_DataPoint(dp, hourly) {
  var s = "";
  var date = timestamp2date(dp.time) 
  s += s_date(date, hourly)
  + " " + s_temperature(dp.temperatureLow || dp.temperature, dp.temperatureHigh || null)
  + " " + s_wind(dp.windSpeed, dp.windGust, dp.windBearing)
  + ", " + s_precipitation(dp.precipIntensity, dp.precipProbability)
  + ", " + dp.summary;
  return s;
}

function parseDsData(data, hourly) {
  for (var i = 0; i < data.length; i++) {
    var s = s_DataPoint(data[i], hourly);
    console.log(s);
  }
}

function darksky(lat_lon, cb) {
  //var url = "https://api.darksky.net/forecast/" + process.env.DARK_SKY_API_KEY + "/" + lat_lon + "/?units=si";
  var url = "https://api.darksky.net/forecast/" + process.env.DARK_SKY_API_KEY + "/" + lat_lon + "/";
  var options = {
    url: url,
    qs: {
      units: 'si',
      exclude: 'currently,minutely,flags'
    },
    json: true,
    gzip: true
  }
  request(options, function(err, res, result) {
    //var response, result;
    //result = JSON.parse(body);
    // if (result.error) {
    //   cb("" + result.error);
    //   return;
    // }
    
    console.log(err);
    // console.log(result.hourly.data);
    //console.log(result.daily.data);
    //console.log(result.daily.summary);
    
    if (result.alerts) {
      console.log(result.alerts);
    }
    
    console.log("Hourly:");
    if (result.hourly.data) {
      parseDsData(result.hourly.data, true);
    }
    
    console.log("Daily:");
    if (result.daily.data) {
      parseDsData(result.daily.data);
    }
    
    
    
    return cb();
  });
};
