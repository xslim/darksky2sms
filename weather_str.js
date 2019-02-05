"use strict";

class WeatherStr {
  

  dayName(day) {
    var weekday = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return weekday[day];
  }
  
  degToCompass(num) {
      var val = Math.floor((num / 22.5) + 0.5);
      var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
      return arr[(val % 16)];
  }

  windMs2Kn(v) {
    return Math.round(v/(0.51+4/900));
  }

  windMs2Bft(v) {
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
  
  sMinMaxX(min, max, sep, end) {
    var s = null;
    if (min && max) {
      s = min + sep + max
    } else if (min) {
      s = min
    } else if (max) {
      s = max
    }
    if (s) {
      s += end
    }
    return s || "";
  }
  
  sWind(min, max, bearing) {
    var s = "";
    
    // if (!min && !max) {
    //   return "";
    // }
    
    if (min && max) {
      s = min + "G" + max
    } else if (min) {
      s = min
    } else if (max) {
      s = "G" + max
    }
    if (bearing) {
      s += "@" + this.degToCompass(bearing)
    }
    
    return s;
  }
  
  sPrecip(intensity, probability, type) {
    var s = "";
    if (intensity && probability) {
      s += (type) ? type + " " : "r"
      s += intensity + "%" + probability
    }
    return s;
  }
  
  sTemp(point) {
    if (point.tempMin && point.tempMax) {
      return point.tempMin + "-" + point.tempMax + "C";
    } else if (point.temp) {
      return point.temp + "C";
    }
    
    return "";
  }
  
  sPressure(pressure) {
    var s = null;
    if (pressure) {
      s = pressure  + "mb"
    }
    return s || "";
  }
  
  sDateDayHour(point) {
    var date = point.time;
    
    if (point.skip_day) {
      return this.sDayHour(null, date.getHours());
    }
    
    return this.sDayHour(this.dayName(date.getDay()));
  }
  
  sDayHour(day, hours) {
    var s = "";
    if (day) s += day + " "
    if (hours >= 0) s += hours + "h"
    return s || "";
  }
  
  getLine(point) {
    
    if (!point) {
      return null;
    }
    
    if (!point.time) {
      return null;
    }
    
    var line = "";
    
    line += this.sDateDayHour(point) + " "
    line += this.sTemp(point) + " "
    line += this.sWind(point.windSpeed, point.windGust, point.windBearing) + " "
    line += this.sPrecip(point.precip, point.precipPerc, point.precipType) + " "
    line += this.sPressure(point.pressure) + " "
    
    // remove duplicate space
    return line.replace(/\s+/g,' ').trim();
  }
  
  getLines(data) {
    var lines = [];
    for (var i = 0; i < data.length; i++) {
      var point = data[i];
      var line = this.getLine(point);
      if (line) lines.push(line);
    }
    return lines;
  }
  
};

module.exports = new WeatherStr();