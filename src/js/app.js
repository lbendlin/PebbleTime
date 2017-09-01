var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');

var version = 'v1.13 20170831';
var baseURL = 'http://lbendlin.dyndns.info:8081/t/';
var garageURL = 'http://lbendlin.dyndns.info:8082/doors.json';
var weatherURL = 'http://api.wunderground.com/api/404d7aebd67c26ec/hourly/q/02421.json';
var resultsMenu ;
var menuItems = [];
var forecastItems = [];
var doorItems = [];
var sensorItems = [];
var statData = [];
var doors = [];
var selected = 0;
var statusLine;
var req;
var timeOut;
var firstTime = true;
var hasForecast = false;

// Create a splashscreen with title and subtitle
var splashCard = new UI.Card({
    title: 'Home Smart Home',
    //titleColor: 'Blue',
    subtitle: 'Fetching status...'
});

var doorCard = new UI.Card({
    action: {
        up: 'IMAGES_CONFIRM_PNG',
        //select: 'IMAGES_CONFIRM_PNG'//,
        down: 'IMAGES_CONFIRM_PNG'
    }
});

doorCard.on('show', function() {
  //clearTimeout(timeOut);
  statusLine = doors[0].name +' Door is ';
  statusLine += doors[0].status + '.\n\n';
  statusLine += doors[1].name +' Door is ';
  statusLine += doors[1].status + '.';
  doorCard.title(statusLine);
  timeOut = setTimeout(function () { doorCard.hide(); },60000);
});

doorCard.on('click', 'up', function() {
  clearTimeout(timeOut);
  doorCard.title(doors[0].status=='closed'?'Opening ' + doors[0].name + ' door...':'Closing ' + doors[0].name + ' door...');  
  req = 'setdooractionpebble.aspx?d=' + doors[0].port;
     ajax({url: baseURL + req, type: 'json' },
        function(data) {
          doors=data.doors;
          Vibe.vibrate('short');
          doorCard.hide();
        },
        function(error) {
            doorCard.title('Failed to operate ' + doors[0].name + ' door');
        }
    ); 
});

doorCard.on('click', 'down', function() {
  clearTimeout(timeOut);
  doorCard.title(doors[1].status=='closed'?'Opening ' + doors[1].name + ' door...':'Closing ' + doors[1].name + ' door...');  
  req = 'setdooractionpebble.aspx?d=' + doors[1].port;
     ajax({url: baseURL + req, type: 'json' },
        function(data) {
          doors=data.doors;
          Vibe.vibrate('short');
          doorCard.hide();
        },
        function(error) {
            doorCard.title('Failed to operate ' + doors[1].name + ' door');
        }
    ); 
});

var detailCard = new UI.Card({
    action: {
        up: 'IMAGES_PLUS_PNG',
        select: 'IMAGES_CONFIRM_PNG',
        down: 'IMAGES_MINUS_PNG'
    }
});

detailCard.on('show', function() {
  //clearTimeout(timeOut);
    statusLine = statData.thermostats[selected].tstate>0 ? 'On ' : '';
    statusLine += statData.thermostats[selected].override ? 'Over ' : '';
    statusLine += statData.thermostats[selected].hold ? 'Hold' : '';
    detailCard.title(statData.thermostats[selected].name + ' ' + statData.thermostats[selected].temp);
    detailCard.subtitle('Target ' + statData.thermostats[selected].t_heat);
    if (statData.thermostats[selected].tstate==2)
       detailCard.subtitle('Target ' + statData.thermostats[selected].t_cool);
    detailCard.body(statusLine + '\nOutside:' + statData.outside);
    timeOut = setTimeout(function () { detailCard.hide(); },60000);
});

detailCard.on('click', 'up', function() {
    // Up click detected!
  //clearTimeout(timeOut);
  if (statData.thermostats[selected].tmode == 1) {
    statData.thermostats[selected].t_heat++;
    detailCard.subtitle('New target ' + statData.thermostats[selected].t_heat);
  }
  if (statData.thermostats[selected].tmode == 2) {
    statData.thermostats[selected].t_cool++;
    detailCard.subtitle('New target ' + statData.thermostats[selected].t_cool);
  }
  timeOut = setTimeout(function () { detailCard.hide(); },60000);
});

detailCard.on('click', 'down', function() {
    // Down click detected!
  //clearTimeout(timeOut);
  if (statData.thermostats[selected].tmode == 1) {
    statData.thermostats[selected].t_heat--;
    detailCard.subtitle('New target ' + statData.thermostats[selected].t_heat);
  }
  if (statData.thermostats[selected].tmode == 2) {
    statData.thermostats[selected].t_cool--;
    detailCard.subtitle('New target ' + statData.thermostats[selected].t_cool);
  }
  timeOut = setTimeout(function () { detailCard.hide(); },60000);
});

detailCard.on('click', 'select', function() {
  setTherm(selected) ; 
});

// toggle hold
detailCard.on('longClick', 'select', function() {
  Vibe.vibrate('short');
  statData.thermostats[selected].hold = 1 - statData.thermostats[selected].hold;
  setTherm(selected) ;   
});

function getStatus(i) {
    //console.log('Getting status for '+statData.thermostats[k].name);
    req = 'getjson.aspx?URL=http://' + statData.thermostats[i].ip + '/tstat&r=' + Math.random();
    ajax({url: baseURL + req, type: 'json'},
        function(data) {
            statData.thermostats[i].temp = data.temp;
            statData.thermostats[i].tmode = data.tmode;
            statData.thermostats[i].t_heat = data.t_heat;
            statData.thermostats[i].t_cool = data.t_cool;
            statData.thermostats[i].tstate = data.tstate;
            statData.thermostats[i].hold = data.hold;
            statData.thermostats[i].override = data.override;
            resultsMenu.item(1, i, {
                subtitle: status(i)
            });
            resultsMenu.section(1, {
                title: 'Got ' + statData.thermostats[i].name
            });
        },
        function(error) {
            console.log('failed to get Status for ' + statData.thermostats[i].name);
        }
    );
}

function getProgram(i) {
  //needed to unset the Away mode
        req = 'getjson.aspx?URL=http://' + statData.thermostats[i].ip + '/tstat/program/heat&r=' + Math.random();
          ajax({url: baseURL + req, type: 'json' },
          function(data) {
            getStatus(i);
           },
           function(error) {
            console.log('failed to get program for '+statData.thermostats[i].name);
           }
        );        
}

function setHome(i) {
      req = 'postjson.aspx?URL=http://' + statData.thermostats[i].ip;
    req += '/tstat&json={"tmode":1,"hold":0}&r=' + Math.random();

    ajax({url: baseURL + req, type: 'text' },
        function(data) {
            getProgram(i);
        },
        function(error) {
            console.log('failed to set Home for '+statData.thermostats[i].name);
        }
    );
}

function setAway(i) {
      req = 'postjson.aspx?URL=http://' + statData.thermostats[i].ip;
    req += '/tstat&json={"tmode":1,"t_heat":61,"hold":1}&r=' + Math.random();

    ajax({url: baseURL + req, type: 'text' },
        function(data) {
            getStatus(i);
        },
        function(error) {
            console.log('failed to set Away for '+statData.thermostats[i].name);
        }
    );
}

function setTherm(i) {
      req = 'postjson.aspx?URL=http://' + statData.thermostats[i].ip;
      if(statData.thermostats[i].tmode ==1)
        req += '/tstat&json={"tmode":1,"t_heat":' + statData.thermostats[i].t_heat;
      if(statData.thermostats[i].tmode ==2)
        req += '/tstat&json={"tmode":2,"t_cool":' + statData.thermostats[i].t_cool;
  req +=',"hold":' + statData.thermostats[i].hold + '}&r=' + Math.random();

    ajax({url: baseURL + req, type: 'text' },
        function(data) {
          if(statData.thermostats[i].tmode ==1)
            detailCard.body('Set to '+statData.thermostats[i].t_heat); 
          if(statData.thermostats[i].tmode ==2)
            detailCard.body('Set to '+statData.thermostats[i].t_cool); 
          setTimeout(function () { detailCard.hide(); },1000);
        },
        function(error) {
        if(statData.thermostats[i].tmode ==1)
            detailCard.body('failed to set temp to '+statData.thermostats[i].t_heat);
        if(statData.thermostats[i].tmode ==2)
            detailCard.body('failed to set temp to '+statData.thermostats[i].t_cool);
        }
    );
}

function getDoorStatus() {
 //can be had from the http server on the raspigarage
  //console.log('getting door status from ' + garageURL);
    ajax({ url: garageURL, type: 'json' },
        function(data) {
          doors = data.doors;
            resultsMenu.item(0, 0, { 
              title: doors[0].name + '    ' + doors[1].name,
              subtitle: (doors[0].status + '       ').substring(0,11) + doors[1].status 
            });
        },
        function(error) {
            console.log('failed to get garage door status');
        }
    );
}

function status(i) {
  var subTitle = statData.thermostats[i].temp + ' / ' + statData.thermostats[i].t_heat;
  if(statData.thermostats[i].tmode ==2)
    subTitle = statData.thermostats[i].temp + ' / ' + statData.thermostats[i].t_cool;
  subTitle += statData.thermostats[i].tstate>0 ? ' On' : '';
  subTitle += statData.thermostats[i].override ? ' Over' : '';
  subTitle += statData.thermostats[i].hold ? ' Hold' : '';
  return subTitle;
}

function getForecast() {
  //get weather data
 ajax({url: weatherURL, type: 'json'},
    function(data) {
        // load weather forecast items
      hasForecast = true;
      forecastItems = [];  
      for (var i = 0; i < 30; i++) {
            forecastItems.push({
                title: data.hourly_forecast[i].FCTTIME.civil + ' ' + data.hourly_forecast[i].temp.english + ' F',
              subtitle: data.hourly_forecast[i].condition == data.hourly_forecast[i].wx ? data.hourly_forecast[i].condition : data.hourly_forecast[i].wx + ', ' + data.hourly_forecast[i].condition
            });
        }
        // Show the forecast in the Menu
        resultsMenu.section(2, {
            title: 'Forecast ',
            items: forecastItems
        });
    },
    function(error) {
        // Failure!
      hasForecast = false;
      resultsMenu.section(2, {
            title: 'Forecast ',
            items: [{
                title: 'Error' ,
          subtitle:  'Cannot get Forecast'
            }]
        });
    }
  );
}

resultsMenu = new UI.Menu({
    sections: [{
      title: 'Garage',
        items: doorItems
    },{
      title: 'Thermostats',
        items: menuItems
    },{
      title: 'Outside',
        items: forecastItems
    },{
      title: 'Sensors',
        items: sensorItems
    },{
      title: version
    }]
});

// refresh data from actual stats. all on first call, then just the one we touched
resultsMenu.on('show', function() {
  if (firstTime) {
    firstTime = false;
    for (var i = 0; i < statData.thermostatcount; i++) {
        // ajax call to get new status, update menu
      getStatus(i);
    } 
  } else {
    getStatus(selected);
  }
  getDoorStatus();
  timeOut = setTimeout(function () { resultsMenu.hide(); },60000);
});

resultsMenu.on('select', function(e) {
  switch(e.sectionIndex) {
    case 0:
      doorCard.show();
      break;
    case 1:
      selected = e.itemIndex;
      detailCard.show();
      break;
    case 2:
      //get forecast ?
      if (hasForecast)
        break;
      resultsMenu.section(e.sectionIndex, {
            title: 'Getting Forecast ...'
        });
      getForecast();
      break;
  }
});

resultsMenu.on('longSelect', function(e) {
 
  Vibe.vibrate('short');
  timeOut = setTimeout(function () { resultsMenu.hide(); },60000);
 switch(e.sectionIndex) {
  // operate left garage door without confirmation  
    case 0:
     resultsMenu.item(0, 0, {title: '', subtitle: doors[0].status=='closed'?'Opening ':'Closing ' + doors[0].name + ' door'});
     req = 'setdooractionpebble.aspx?d=' + doors[0].port;
     ajax({url: baseURL + req, type: 'json' },
        function(data) {
          doors=data.doors;
          Vibe.vibrate('short');
          resultsMenu.item(0, 0, {  title: doors[0].name + '     ' + doors[1].name,
              subtitle: (doors[0].status + '       ').substring(0,11) + doors[1].status });
         },
        function(error) {
          resultsMenu.item(0, 0, { title: 'Failed to operate ' + doors[0].name + ' door'});  
        }
    ); 
    break;
      // toggle home/away for all thermostats
    case 1: 

      var i;
      if(( statData.thermostats[0].t_heat == 61) && statData.thermostats[0].hold ) {
        resultsMenu.section(1, { title: 'Setting Home'});
        for (i = 0; i < statData.thermostatcount; i++) {
          setHome(i);
        }    
      } else {
        resultsMenu.section(1, { title: 'Setting Away'});
        for (i = 0; i < statData.thermostatcount; i++) {
          setAway(i);
        }       
      }
    break;
 }
});

// Display the splash
splashCard.show();

//get initial list of thermostats and their current data from database
ajax({url: baseURL + 'tall.asp', type: 'json'},
    function(data) {
        statData = data;
        // load doors. ignoring count
        doors = data.doors;
        doorItems.push({  title: doors[0].name + '     ' + doors[1].name,
              subtitle: (doors[0].status + '       ').substring(0,11) + doors[1].status });
        // load thermostats
        for (var i = 0; i < statData.thermostatcount; i++) {
            menuItems.push({
                title: statData.thermostats[i].name,
              subtitle: status(i)
            });
        }
        //load current weather
        forecastItems.push({
          title: 'Temp: ' + statData.outside + 'F',
          subtitle: 'Humidity: ' + statData.humidity
        });
        // load sensor data
        for (i = 0; i < statData.sensorcount; i++) {
            sensorItems.push({
                title: statData.sensors[i].name + ' ' + statData.sensors[i].temp + 'F',
              subtitle: statData.sensors[i].humidity + '% ' + statData.sensors[i].date
            });
        }
      
        // Show the Menu, remove the splash
        resultsMenu.show();
        splashCard.hide();
    },
    function(error) {
        // Failure!
        splashCard.subtitle('Cannot connect to network');
    }
);
