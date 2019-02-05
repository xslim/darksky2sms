
var weatherStr = require('./weather_str')

function weatherDataPoint() {
  return {
    time: null,
    code: null,
    desc: null,
    // day: null,
    // hours: null,
    temp: null,
    tempMin: null,
    tempMax: null,
    windSpeed: null, 
    windGust: null, 
    windBearing: null,
    precip: null, 
    precipPerc: null,
    precipType: null,
    pressure: null,
    humidity: null
    // summary: dp.summary
    
  }
}

class DarkSkyParser {
  
  parseTime(timestamp) {
    if (!timestamp) return null;
    var date = new Date(timestamp * 1000);
    return date;
  }
  
  roundInt(n){
    if (n == null) return null;
    return Math.round(n);
  }
  
  windMs2Kn(v) {
    return this.roundInt(v/(0.51+4/900));
  }
  
  parse(data) {
    var points = []    

    if (data && data.hourly && data.hourly.data) {
      var hourly_data = data.hourly.data
      for (var i = 0; i < hourly_data.length; i++) {
        points.push(this.parsePoint(hourly_data[i]));
      }
    }
    
    return points;
  }

  parseIconCode(str) {
    str = str.replace('-day', '');
    str = str.replace('-night', '');
    return str;
  }
  
  parsePoint(dp){
    var p = weatherDataPoint();
    if (!dp) return p;
    
    p.time = this.parseTime(dp.time)
    p.temp = this.roundInt(dp.temperature)
    p.windSpeed = this.windMs2Kn(dp.windSpeed), 
    p.windGust = this.windMs2Kn(dp.windGust), 
    p.windBearing = this.roundInt(dp.windBearing) % 360
    p.precip = dp.precipIntensity
    p.precipPerc = this.roundInt(dp.precipProbability * 100)
    p.precipType = dp.precipType
    p.pressure = this.roundInt(dp.pressure)
    
    p.humidity = undefined
    p.desc = undefined
    p.code = undefined
    // p.humidity = this.roundInt(dp.humidity * 100)
    // p.desc = dp.summary
    // p.code = this.parseIconCode(dp.icon)
    
    return p;
  }

}


class WeatherFilter {
  
  constructor() {
    
    this.windToBft = true
    
    this.deltas = {
      windSpeed: (this.windToBft) ? 0 : 3,
      windGust: (this.windToBft) ? 0 : 3,
      windBearing: 3,
      temp: 3,
      pressure: 2
    };
    
  }
  
  update_object(obj1, obj2) {
      for (var attrname in obj2) { 
        if (obj1.hasOwnProperty(attrname) && obj1[attrname] == null) {
          obj1[attrname] = obj2[attrname];
        } else {
          obj1[attrname] = obj2[attrname];
        }
      }
      // return obj1;
  }
  
  v_newOrNull(v_old, v_new, delta) {
    if (v_new == v_old) {
      return null;
    }
    
    // don't continue if we compare strings
    if (typeof v_new === 'string' || v_new instanceof String) {
      return v_new;
    }
    
    if (v_new > (v_old + delta)) {
      return v_new;
    }
    if (v_new < (v_old - delta)) {
      return v_new;
    }
    
    return null;
  }

  obj_v_newOrNull(obj1, obj2, attr, delta) {
    
    var didChange = false;
    var v2 = obj2[attr]; // new var
    var v1 = obj1[attr]; // state var
    
    // console.log("?:", attr, v1, v2);
    
    if (v2 == v1) {
      obj2[attr] = null;
    }
    
    // is it's a string, we can stop here
    if (typeof v2 === 'string' || v2 instanceof String) {
      obj1[attr] = v2;
      return;
    }
    
    if (v2 > (v1 + delta)) {
      obj1[attr] = v2;
    } else if (v2 < (v1 - delta)) {
      obj1[attr] = v2;
    } else {
      obj2[attr] = null;
    }
    
  }
  
  obj_hasValues(obj, attrs_to_skip) {
    for (var attrname in obj) {
      if (!attrs_to_skip.includes(attrname) && obj[attrname] != null) {
        // console.log("has", attrname, obj[attrname]);
        return true;
      }
    }
    return false;
  }
  
  wind2Bft(knot) {
    // var knot = v/(0.51+4/900);
    if (knot == null) return null;
    
    if(knot==0) return 0;
    if(knot>=1 && knot<3.5) return 1;
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
    
    // console.log(knot);
    return "?";
  }

  f_day(data) {
    var prev_day = null;
    for (var i = 0; i < data.length; i++) {
      var point = data[i];
      
      var day = point.time.getDay();
      
      if (prev_day != day) {
        prev_day = day;
      } else {
        point.skip_day = true;
      }
      
      data[i] = point;
    }
  }
  
  // find_dayMinMax(data, attr) {
  //   for (var i = 0; i < data.length; i++) {
  //   }
  // }
  
  f_dayMinMax(data, attr, nullify) {
    var this_day = null;
    var attrMin = attr + "Min"
    var attrMax = attr + "Max"
    var this_day_i = -1;
    var min = null;
    var max = null;
    
    var count = data.length
    
    for (var i = 0; i < count; i++) {
      var point = data[i];
      var day = point.time.getDay();
      var cur_value = point[attr];
      
      if (this_day_i < 0) {
        this_day_i = i
      }
      
      if (!min && !max) {
        min = cur_value
        max = cur_value
      } else if (cur_value < min) {
        min = cur_value
      } else if (cur_value > max) {
        max = cur_value
      }
      
      if (nullify) {
        point[attr] = null;
      }
      
      // is next point different day ?
      var k = i+1
      if (k < count && data[k].time.getDay() == day) {
        // same day, do nothing
      } else {
        // different day or end of story
        
        // set data on beginning
        data[this_day_i][attrMin] = min
        data[this_day_i][attrMax] = max
        
        // reset values
        this_day_i = -1;
        min = null;
        max = null;
      }
  
    }
  }
  
  f_insideItem(data) {
    for (var i = 0; i < data.length; i++) {
      var point = data[i];
      if (!point) { continue }
      
      //logDay("<: ", point);
      
      if (this.windToBft) {
        point.windSpeed = this.wind2Bft(point.windSpeed)
        point.windGust = this.wind2Bft(point.windGust)
      }
      
      // point.temperatureHigh = v_newOrNull(point.temperatureLow, point.temperatureHigh, 2);
      point.windGust = this.v_newOrNull(point.windSpeed, point.windGust, this.deltas['windSpeed']);
      
      if (!point.windSpeed && !point.windGust) {
        point.windBearing = null
      }
      
      if (point.precipPerc < 1) {
        point.precip = null
        point.precipPerc = null
      }
      
      //logDay("=: ", point);
      data[i] = point;
    }
  }
  
  f_running(data, attrs) {
    var running_item = weatherDataPoint()
    this.update_object(running_item, data[0]);
    

    // first (0) element will not change, so start with index 1!
    for (var i = 1; i < data.length; i++) {
      var point = data[i];
      if (!point) { continue }
      //logDay("<: ", point);
      
      var self = this
      attrs.forEach(function(attr){
        self.obj_v_newOrNull(running_item, point, attr, self.deltas[attr]);
      })
      
      //logDay("ri", running_item);
      // logDay("=: ", point);
      data[i] = point;
    }
  }
  
  f_removeEmpty(data) {
    // first (0) element will not change, so start with index 1!
    var attr_to_skip = ["time", "skip_day", 'pressure'];
    
    for (var i = 1; i < data.length; i++) {
      var point = data[i];
      if (!point) { continue }
      
      var remove_point = false;
      
      if (!this.obj_hasValues(point, attr_to_skip)) {
        remove_point = true;
      }
      
      if (remove_point) {
        point = null;
        data[i] = point;
      }
      
    }
  }

  f_nulls(data) {
    data = data.filter(function (el) {
      return el != null;
    });
  }

  filter(data) {
    this.f_day(data)
    this.f_insideItem(data)
    this.f_dayMinMax(data, 'temp', true)
    
    this.f_running(data, ['temp', 'windSpeed', 'windGust', 'windBearing'])
    this.f_insideItem(data)
    this.f_removeEmpty(data)
    
    this.f_nulls(data)
    
    this.f_running(data, ['temp', 'windSpeed', 'windGust', 'windBearing', 'pressure'])
    this.f_insideItem(data)
    this.f_removeEmpty(data)
    
    return data;
  }
}




function logDay(str, point) {
  console.log(str, weatherStr.getLine(point));
}









function find_prev_point_with_value(data, k, attr) {
  for (var i = k-1; i >=0; i--) {
    if (data[i] && data[i][attr] != null) {
      return i;
    }
  }
  return -1;
}

function update_prev_and_nullify_current(data, point, attr, i, sep) {
  if (point[attr] == null) {
    return;
  }
  if (!sep) sep = "-"
  var k = find_prev_point_with_value(data, i, attr);
  
  // reached beginning, so apply to first
  if (k < 0) { k = 0 }

  if (!data[k][attr]) { 
    data[k][attr] = point[attr];
  } else {
    data[k][attr] = data[k][attr] + sep + point[attr];
  }

  point[attr] = null;
}

function fr_update_prev(data) {
  // first (0) element will not change, so start with index 1!
  for (var i = 1; i < data.length; i++) {
    var point = data[i];
    if (!point) { continue }
    
    // if the new wind speed in null, but bearing changed, let's add it to previous item
    if (point.windSpeed == null && point.windGust == null) {
        update_prev_and_nullify_current(data, point, "windBearing", i, "-");
    }
    
    // if the bearing and speed is same, but gust changed, let's add it to previous item
    if (point.windSpeed == null && point.windBearing == null) {
      update_prev_and_nullify_current(data, point, "windGust", i, ">");
    }
    
    // if the bearing and gust is same, but wind changed, let's add it to previous item
    if (point.windGust == null && point.windBearing == null) {
      update_prev_and_nullify_current(data, point, "windSpeed", i, "-");
    }
    
    // if only temp is here
    if (object_hasValues()) {
      
    }
    
  }
  return data;
}



function filterResults(data) {
  fr_insideItem(data);
  fr_day(data);
  fr_running(data);
  //fr_update_prev(data);
  fr_removeEmpty(data);
  // fr_update_prev(data);
  
  var lines = weatherStr.getLines(data);
  prettyJSON(lines);
  
  return [];
  
  var points = [];
  var prev_point = ds_weatherPoin(null);
  var day_point = ds_weatherPoin(null);
  


  
  for (var i = 0; i < data.length; i++) {
    var point = data[i];
    var newPoint = point;
    
    logDay("<: ", point);
    

    // prev_point.temperatureHigh = v_newOrNull(prev_point.temperatureLow, prev_point.temperatureHigh, 2);
    // prev_point.windGust = v_newOrNull(prev_point.windSpeed, prev_point.windGust, 2);
    
    newPoint.temperatureLow = v_newOrNull(prev_point.temperatureLow, newPoint.temperatureLow, 2);
    newPoint.temperatureHigh = v_newOrNull(prev_point.temperatureHigh, newPoint.temperatureHigh, 2);
    newPoint.windSpeed = v_newOrNull(prev_point.windSpeed, newPoint.windSpeed, 2);
    newPoint.windGust = v_newOrNull(prev_point.windGust, newPoint.windGust, 2);
    newPoint.pressure = v_newOrNull(prev_point.pressure, newPoint.pressure, 2);
    
    prev_point = point;
    
    logDay("=: ", newPoint);
    
    points.push(newPoint);
  }
  return points;
}



if (require.main === module) {
  var file = process.argv[2]

  function prettyJSON(obj) {
      console.log(JSON.stringify(obj, null, 2));
  }

  if (file) {
    var fs = require('fs');
    var result = JSON.parse(fs.readFileSync(file, 'utf8'));
    //prettyJSON(obj)
    
    var parser = new DarkSkyParser()
    var data = parser.parse(result);
    prettyJSON(data)
    
    // var lines = weatherStr.getLines(data);
    // var s = lines.join("\n")
    // console.log(s);
    
    var filter = new WeatherFilter()
    var data = filter.filter(data);
    
     lines = weatherStr.getLines(data);
     s = lines.join("\n")
    console.log(s);
    console.log(s.length);
    
    
    //weatherStr
    
    
    
    // if (result && result.hourly && result.hourly.data) {
    //   console.log("Hourly:");
    //   var weatherData = parseDsData(result.hourly.data, true);
    // }
  }
  
  

}



