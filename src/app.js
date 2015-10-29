var UI = require('ui');
var ajax = require('ajax');
//var Vector2 = require('vector2');
//var Accel = require('ui/accel');
//var Vibe = require('ui/vibe');

var resultsMenu ;
var menuItems = [];
var statData = [];
var baseURL = 'http://lbendlin.dyndns.info:8081/t/';
var selected = 0;
var statusLine;
var req;
var timeOut;

// Create a splashscreen with title and subtitle
var splashCard = new UI.Card({
    title: 'Thermostats',
    subtitle: 'Fetching status...'
});

var detailCard = new UI.Card({
    action: {
        up: 'images/plus.png',
        select: 'images/confirm.png',
        down: 'images/minus.png'
    }
});
detailCard.on('show', function() {
  clearTimeout(timeOut);
    statusLine = statData.thermostats[selected].tstate ? 'On ' : '';
    statusLine += statData.thermostats[selected].override ? 'Over ' : '';
    statusLine += statData.thermostats[selected].hold ? 'Hold' : '';
    detailCard.title(statData.thermostats[selected].name);
    detailCard.subtitle(statData.thermostats[selected].temp);
    // target temp, heating on, override, hold
    detailCard.body('Target:' + statData.thermostats[selected].t_heat + '\n' + statusLine + '\nOutside:' + statData.outside);
});
detailCard.on('click', 'up', function() {
    // Up click detected!
    statData.thermostats[selected].t_heat++;
    detailCard.body('Target:' + statData.thermostats[selected].t_heat + '\n' + statusLine + '\nOutside:' + statData.outside);
});
detailCard.on('click', 'down', function() {
    // Down click detected!
    statData.thermostats[selected].t_heat--;
    detailCard.body('Target:' + statData.thermostats[selected].t_heat + '\n' + statusLine + '\nOutside:' + statData.outside);
});
detailCard.on('click', 'select', function() {
  setTherm(selected) ; 
});
// toggle hold
detailCard.on('longClick', 'select', function() {
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
            resultsMenu.item(0, i, {
                subtitle: status(i)
            });
            resultsMenu.section(0, {
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
            //resultsMenu.section(0, { title: 'Set home '});
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

function status(i) {
  var subTitle = statData.thermostats[i].temp + ' / ' + statData.thermostats[i].t_heat;
  subTitle += statData.thermostats[i].tstate ? 'On ' : '';
  subTitle += statData.thermostats[i].override ? 'Over ' : '';
  subTitle += statData.thermostats[i].hold ? 'Hold' : '';
  return subTitle;
}

resultsMenu = new UI.Menu({
    sections: [{
      title: 'Thermostats',
        items: menuItems
    }]
});
// refresh data from actual stats. all or just the one we touched?
resultsMenu.on('show', function() {
    //for (var j = 0; j < statData.count; j++) {
        // ajax call to get new status, update menu
    //  getStatus(j);
    //}
  getStatus(selected);
  // exit after 2 minutes
  timeOut = setTimeout(function () { resultsMenu.hide(); },120000);
});
resultsMenu.on('select', function(e) {
    selected = e.itemIndex;
    detailCard.show();
});
resultsMenu.on('longSelect', function(e) {
    // toggle home/away for all
  var i;
  if(( statData.thermostats[0].t_heat == 61) && statData.thermostats[0].hold ) {
    resultsMenu.section(0, { title: 'Setting Home'});
  for (i = 0; i < statData.count; i++) {
    setHome(i);
  }    
  } else {
    resultsMenu.section(0, { title: 'Setting Away'});
   for (i = 0; i < statData.count; i++) {
    setAway(i);
  }       
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
//Accel.init();
// Notify the user
//Vibe.vibrate('short');