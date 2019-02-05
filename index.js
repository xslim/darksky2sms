
require('dotenv').config();
var request = require('request')
// var weatherStr = require('.weather_str')()

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



function s_wind(speed, gust, bearing) {
  speed = Math.round(windMs2Kn(speed));
  gust = Math.round(windMs2Kn(gust));
  
  var ret = ""
  if (speed > 0) {
    ret += degToCompass(bearing) + "" + speed;
    if (speed != gust) {
      ret += "G"+gust;
    }
  }
  
  return ret;
}

function s_windBft(speed, gust, bearing) {
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


function j_DataPoint(dp) {

  var date = timestamp2date(dp.time) 
  
  return {
    day: date.getDay(),
    hours: date.getHours(),
    temperature: s_temperature(dp.temperatureLow || dp.temperature, dp.temperatureHigh || null),
    wind: s_wind(dp.windSpeed, dp.windGust, dp.windBearing),
    precipitation: s_precipitation(dp.precipIntensity, dp.precipProbability),
    pressure: Math.round(dp.pressure),
    summary: dp.summary
  };

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

function parseDsData(data) {
  var points = [];
  for (var i = 0; i < data.length; i++) {
    points.push(j_DataPoint(data[i]));
  }
  var s = "";
  var day = -1;
  var pressureDelta = 2;
  var pressureUp = 0;
  var pressureDown = 0;
  for (var i = 0; i < points.length; i++) {
    var point = points[i];
    if (day != point.day) {
      day = point.day;
      s += dayName(point.day) + " ";
    }
    s += point.hours + " " + point.temperature;
    if (point.wind) s += " " + point.wind
    if (point.precipitation) s += " " + point.precipitation
    if (point.pressure) {
      if (point.pressure > pressureUp || point.pressure < pressureDown) {
        pressureUp = point.pressure + pressureDelta;
        pressureDown = point.pressure - pressureDelta;
        s += " " + point.pressure
      }
    }
    //s += ", " + point.summary
    
    s += "\n"
  }
  console.log(s);
  // console.log("length: %i", s.length);
  //prettyJSON(points);
}

function prettyJSON(obj) {
    console.log(JSON.stringify(obj, null, 2));
}

function darksky(lat_lon, cb) {
  // var url = "https://api.darksky.net/forecast/" + process.env.DARK_SKY_API_KEY + "/" + lat_lon + "/?units=si";
  var url = "https://api.darksky.net/forecast/" + process.env.DARK_SKY_API_KEY + "/" + lat_lon + "/";
  var options = {
    url: url,
    qs: {
      units: 'si',
      exclude: 'currently,minutely,flags,daily'
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
    prettyJSON(result);
    // console.log(result.hourly.data);
    // console.log(result.daily.data);
    // console.log(result.daily.summary);
    
    if (result.alerts) {
      console.log(result.alerts);
    }
    
    // if (result.hourly && result.hourly.data) {
    //   console.log("Hourly:");
    //   parseDsData(result.hourly.data, true);
    // }
    // 
    // 
    // if (result.daily && result.daily.data) {
    //   console.log("Daily:");
    //   parseDsData(result.daily.data);
    // }
    
    
    
    return cb();
  });
};
