var UI = require('ui');
var ajax = require('ajax');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

var version = 'v1.07 20160406';
var baseURL = 'http://lbendlin.dyndns.info:8081/t/';
var resultsMenu ;
var menuItems = [];
var forecastItems = [];
var statData = [];
var selected = 0;
var statusLine;
var req;
var timeOut;
var firstTime = true;
var hasForecast = false;
var doorClosed = 1;

// Create a splashscreen with title and subtitle
var splashCard = new UI.Card({
    title: 'Thermostats',
    subtitle: 'Fetching status...'
});

var doorCard = new UI.Card({
    action: {
        //up: 'images/plus.png',
        select: 'IMAGES_CONFIRM_PNG'//,
        //down: 'images/minus.png'
    }
});
doorCard.on('show', function() {
  //clearTimeout(timeOut);
  statusLine = 'Door is ';
  statusLine += doorClosed ? 'closed.' : 'open.';
  doorCard.title(statusLine);
  statusLine = 'Select to ';
  statusLine += doorClosed ? 'open it.' : 'close it.';
  doorCard.subtitle(statusLine);
  timeOut = setTimeout(function () { doorCard.hide(); },60000);
});
doorCard.on('click', 'select', function() {
  //clearTimeout(timeOut);
  statusLine = doorClosed ? "Open" : "Clos";
  statusLine += 'ing door...';
  doorCard.title(statusLine);  
  doorCard.subtitle('');
  req = 'setdooractionpebble.aspx';
     ajax({url: baseURL + req, type: 'text' },
        function(data) {
          doorCard.title(data);
          Vibe.vibrate('short');
          doorClosed = data.indexOf('closed') != -1 ? 1 : 0;
          setTimeout(function () { doorCard.hide(); },5000);
        },
        function(error) {
            doorCard.body('failed to operate door');
        }
    ); 
  timeOut = setTimeout(function () { doorCard.hide(); },60000);
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
    statusLine = statData.thermostats[selected].tstate ? 'On ' : '';
    statusLine += statData.thermostats[selected].override ? 'Over ' : '';
    statusLine += statData.thermostats[selected].hold ? 'Hold' : '';
    detailCard.title(statData.thermostats[selected].name + ' ' + statData.thermostats[selected].temp);
    detailCard.subtitle('Target ' + statData.thermostats[selected].t_heat);
    // target temp, heating on, override, hold
    detailCard.body(statusLine + '\nOutside:' + statData.outside);
    timeOut = setTimeout(function () { detailCard.hide(); },60000);
});
detailCard.on('click', 'up', function() {
    // Up click detected!
  //clearTimeout(timeOut);
    statData.thermostats[selected].t_heat++;
    detailCard.subtitle('New target ' + statData.thermostats[selected].t_heat);
  timeOut = setTimeout(function () { detailCard.hide(); },60000);
});
detailCard.on('click', 'down', function() {
    // Down click detected!
  //clearTimeout(timeOut);
    statData.thermostats[selected].t_heat--;
    detailCard.subtitle('New target ' + statData.thermostats[selected].t_heat);
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
    ajax({
            url: baseURL + req,
            type: 'json'
        },
        function(data) {
            statData.thermostats[i].temp = data.temp;
            statData.thermostats[i].t_heat = data.t_heat;
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
  //console.log('Getting status for '+statData.thermostats[m].name);
        req = 'getjson.aspx?URL=http://' + statData.thermostats[i].ip + '/tstat/program/heat&r=' + Math.random();
          ajax({url: baseURL + req, type: 'json' },
          function(data) {
            //resultsMenu.section(1, { title: 'Set home '});
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
            console.log('failed to set Home for '+statData.thermostats[i].name);
        }
    );
}

function setTherm(i) {
      req = 'postjson.aspx?URL=http://' + statData.thermostats[i].ip;
    req += '/tstat&json={"tmode":1,"t_heat":' + statData.thermostats[i].t_heat;
  req +=',"hold":' + statData.thermostats[i].hold + '}&r=' + Math.random();

    ajax({url: baseURL + req, type: 'text' },
        function(data) {
          detailCard.body('Set to '+statData.thermostats[i].t_heat);  
          setTimeout(function () { detailCard.hide(); },1000);
        },
        function(error) {
            detailCard.body('failed to set temp to '+statData.thermostats[i].t_heat);
        }
    );
}

function getDoorStatus(i) {
    req = 'getdoorstatus.asp';
    ajax({
            url: baseURL + req,
            type: 'json'
        },
        function(data) {
          doorClosed = data.doorClosed;  
            resultsMenu.item(0, 0, {
                subtitle: doorClosed == 1 ? 'closed' : 'open'
            });
        },
        function(error) {
            console.log('failed to get garage door status');
        }
    );
}

function status(i) {
  var subTitle = statData.thermostats[i].temp + ' / ' + statData.thermostats[i].t_heat;
  subTitle += statData.thermostats[i].tstate ? ' On' : '';
  subTitle += statData.thermostats[i].override ? ' Over' : '';
  subTitle += statData.thermostats[i].hold ? ' Hold' : '';
  return subTitle;
}

function getForecast() {
  //get weather data
 ajax({url: 'http://api.wunderground.com/api/404d7aebd67c26ec/hourly/q/01721.json', type: 'json'},
    function(data) {
        // load weather forecast items
      hasForecast = true;
      forecastItems = [];  
      for (var i = 0; i < 20; i++) {
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
        items: [{
                title: 'Garage door is' ,
          subtitle: doorClosed == 1 ? 'closed' : 'open'
            }]
    },{
      title: 'Thermostats',
        items: menuItems
    },{
      title: 'Current Outside',
        items: forecastItems
    },{
      title: version,
    }]
});
// refresh data from actual stats. all on first call, then just the one we touched
resultsMenu.on('show', function() {
  if (firstTime) {
    firstTime = false;
    for (var i = 0; i < statData.count; i++) {
        // ajax call to get new status, update menu
      getStatus(i);
    } 
    getDoorStatus();
  } else {
    getStatus(selected);
    resultsMenu.item(0, 0, {
                subtitle: doorClosed == 1 ? 'closed' : 'open'
    });  
    //clearTimeout(timeOut);
  }
  // exit after 1 minute
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
      resultsMenu.section(2, {
            title: 'Getting Forecast ...'
        });
      getForecast();
      break;
  }
});
resultsMenu.on('longSelect', function(e) {
  // operate garage door without confirmation  
 
  Vibe.vibrate('short');
    timeOut = setTimeout(function () { resultsMenu.hide(); },60000);
 switch(e.sectionIndex) {
    case 0:
     resultsMenu.section(0, { title: 'Operating door'});
     req = 'setdooractionpebble.aspx';
     ajax({url: baseURL + req, type: 'text' },
        function(data) {
          Vibe.vibrate('short');
          doorClosed = data.indexOf('closed') != -1 ? 1 : 0;
          resultsMenu.section(0, { title: 'Garage door is'});
          resultsMenu.item(0, 0, {subtitle: doorClosed == 1 ? 'closed' : 'open' });  
         },
        function(error) {
          resultsMenu.item(0, 0, { subtitle: 'Failed to operate door'});  
         
        }
          
    ); 
           break;
      // toggle home/away for all thermostats
    case 1: 

  var i;
  if(( statData.thermostats[0].t_heat == 61) && statData.thermostats[0].hold ) {
    resultsMenu.section(1, { title: 'Setting Home'});
  for (i = 0; i < statData.count; i++) {
    setHome(i);
  }    
  } else {
    resultsMenu.section(1, { title: 'Setting Away'});
   for (i = 0; i < statData.count; i++) {
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
        // load menu items
        for (var i = 0; i < statData.count; i++) {
            menuItems.push({
                title: statData.thermostats[i].name,
              subtitle: status(i)
            });
        }
        forecastItems.push({
          title: 'Temp: ' + statData.outside + 'F'
        });
        // Show the Menu, hide the splash
        resultsMenu.show();
        splashCard.hide();
    },
    function(error) {
        // Failure!
        splashCard.subtitle('Cannot connect to thermostats');
    }
);

// Prepare the accelerometer
Accel.init();
// show garage screen when shaking watch
Accel.on('tap', function(e) {
  //console.log('Tap event on axis: ' + e.axis + ' and direction: ' + e.direction);
  doorCard.show();
});