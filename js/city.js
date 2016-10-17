/*Code by Giovanni Zambotti - 09/30/2016*/
var map, searchWidgetNav, searchWidgetPanel, activeView, tbHighCity, tbMidCity, tbLowCity;
var tbHighZip, tbMidZip, tbLowZip;
var sessionCity = {};
var sessionZip = {};
var sessionSurvey = {};

Date.prototype.IsoNum = function (n) {
    var tzoffset = this.getTimezoneOffset() * 60000; //offset in milliseconds
    var localISOTime = (new Date(this - tzoffset)).toISOString().slice(0,-1);
    return localISOTime.replace(/[-T:\.Z]/g, "").substring(0,n || 20); // YYYYMMDD
};

var timeX = new Date();
var time = timeX.IsoNum(14);
// generate time
var hash = function(s){    
    if (typeof(s) == "number" && s === parseInt(s, 10)){
        s = Array(s + 1).join("x");
    }
    return s.replace(/x/g, function(){
        var n = Math.round(Math.random() * 61) + 48;
        n = n > 57 ? (n + 7 > 90 ? n + 13 : n + 7) : n;
        return String.fromCharCode(n);
    });
};
var require;
var userhash = hash(10);
require([
  // ArcGIS
  "esri/map",  
  "esri/toolbars/draw",
  "esri/dijit/Search",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/Polygon",
  "esri/geometry/Point",
  "esri/geometry/Extent",
  "esri/geometry/geometryEngine",
  "esri/SpatialReference",
  "esri/geometry/Circle",
  // style
  "esri/graphic",
  "esri/layers/GraphicsLayer", 
  "esri/symbols/SimpleMarkerSymbol", 
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/renderers/SimpleRenderer",             
  "esri/Color",
  "dojo/on",
  // Bootstrap
  "bootstrap/Collapse", 
  "bootstrap/Dropdown",
  "bootstrap/Tab",
  "bootstrap/Alert",
  // Calcite Maps
  "calcite-maps/calcitemaps",
  
  "dojo/domReady!"
], function(Map, Draw, Search, webMercatorUtils, Polygon, Point, Extent, geometryEngine, SpatialReference, Circle, Graphic, GraphicsLayer, 
  SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, SimpleRenderer, Color, on) {
  
  var zipcode = "", rPolygon, circle, homeX, homeY, zPolygon, zPolygonZip, gBufferCut;
  // Map 
  map = new Map("mapViewDiv", {
    basemap: "gray",
    center: [-71.05, 42.32], // lon, lat
    zoom: 12
  });
    
  var symbolBostonBoundary = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([5,5, 5]),2));
  var jsonBostonBoundary = "http://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/bostonboundaryzip/FeatureServer/0/query?where=1+%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=&units=esriSRUnit_Meter&outFields=&returnGeometry=true&returnCentroid=false&multipatchOption=&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pjson";
  
  $.ajax({      
    type: "GET",
    dataType:'json',
    url: jsonBostonBoundary,
    success: function(data){  
      //console.log(data.features[0].geometry.rings.length);
      rPolygon = new Polygon(new esri.SpatialReference({wkid:4326}));            
      $.each(data.features[0].geometry.rings, function(i, item) {
        rPolygon.addRing(item)
      });
      rPolygonZip = new GraphicsLayer({ id: "zipcodePoly"});          
      rPolygonZip.add(new Graphic(rPolygon, symbolBostonBoundary));
      map.addLayer(rPolygonZip);      
    }
  });
  
  // Search
  searchDivNav = createSearchWidget("searchNavDiv");
  searchWidgetPanel = createSearchWidget("searchPanelDiv");

  function createSearchWidget(parentId) {
    var search = new Search({
            map: map,
            enableHighlight: false
            }, parentId);
    search.startup();
    return search;
  }

  map.on("load", initToolbarCity);

  $('#panelInfo').on('click', function (e) {
    //console.log('Event fired on #' + e.currentTarget.id);
    $("#panelZipcode").attr('class', 'panel collapse in');
  })

  

  // close the info panel
  $('#zipcodeid').on('click', function () {
    $("#panelZipcode").attr('class', 'panel collapse');
    //$("#panelSurvey").attr('class', 'panel collapse in');
    $("#panelCity").attr('class', 'panel collapse in');
  });
  // run the getCityUnitsData function
  $('#unitsubmit').on('click', getCityUnitsData);
  // run the getZipUnitsData function
  $('#nbhunitsubmit').on('click', getZipUnitsData);
  // run the getSurveryData function
  $('#survysubmit').on('click', getSurveyData);
  
  var svgHigh = "M0,1108h256V0H0V1108z  M160,64h64v64h-64V64z M160,192h64v64h-64V192z M160,320h64v64h-64V320z M160,448h64v64h-64V448z M160,576h64v64h-64V576z M160,704h64v64h-64V704z M160,832h64v64h-64V832z M160,960h64v64h-64V960z M32,64h64v64H32V64z M32,192 h64v64H32V192z M32,320h64v64H32V320z M32,448h64v64h-64V448z M32,576h64v64h-64V576z M32,704h64v64h-64V704z M32,832h64v64h-64V832z M32,960h64v64h-64V960z";
  var svgMid = "M0,262h160V0H0V262z M108,44h32v32h-32V64z M108,114h32v32h-32V64z M108,184h32v32h-32V64z M60,44h32v32h-32V64z M60,114h32v32h-32V64z M60,184h32v32h-32V64z  M12,44h32v32H12V44z M12,114h32v32H12V44z M12,184h32v32H12V44z";
  var svgLow = "M0,276h630V0H0V256z M30,34h64v64H32V64z M30,172h64v64H32V192z M130,34h64v64h-64V34z M130,172h64v64h-64V192z M230,34h64v64h-64V34z M230,172h64v64h-64V192z M330,34h64v64h-64V34z M330,172h64v64h-64V192z M430,34h64v64h-64V34z M430,172h64v64h-64V192z M530,34h64v64h-64V34z M530,172h64v64h-64V192z";

  // create a maker for house high rise
  var markerSymbolHigh = new SimpleMarkerSymbol();
  markerSymbolHigh.setPath(svgHigh);
  markerSymbolHigh.setSize("54");        
  markerSymbolHigh.setColor(new Color("000"));
  // create a maker for house mid rise
  var markerSymbolMid = new SimpleMarkerSymbol();
  markerSymbolMid.setPath(svgMid);
  markerSymbolMid.setSize("28");
  markerSymbolMid.setColor(new Color("#000"))

  var markerSymbolLow = new SimpleMarkerSymbol();
  markerSymbolLow.setPath(svgLow);
  markerSymbolLow.setSize("34");
  markerSymbolLow.setColor(new Color("#000"));
          
  function initToolbarCity() {
    tbHighCity = new Draw(map);                    
    tbHighCity.setMarkerSymbol(markerSymbolHigh);
    tbHighCity.on("draw-complete", addHouseHighCity);
    
    tbMidCity = new Draw(map);          
    tbMidCity.setMarkerSymbol(markerSymbolMid);
    tbMidCity.on("draw-complete", addHouseMidCity);
    
    tbLowCity = new Draw(map);          
    tbLowCity.setMarkerSymbol(markerSymbolLow);
    tbLowCity.on("draw-complete", addHouseLowCity);

    // event delegation so a click handler is not
    // needed for each individual button
    //on(document.getElementById("info"), "click", function(evt) {
    $('#infoCity').on('click', function(evt){     
      //console.log(evt.target)                  
      if ( evt.target.id === "info" ) {
        return;
      }
      if(evt.target.value === 'househigh'){        
        map.disableMapNavigation();
        tbHighCity.activate('point');
        tbMidCity.deactivate();
        tbLowCity.deactivate();        
      }  
      else if (evt.target.value === 'housemid'){
        map.disableMapNavigation();
        tbMidCity.activate('point');
        tbHighCity.deactivate();
        tbLowCity.deactivate();                            
      }
      else if (evt.target.value === 'houselow'){
        map.disableMapNavigation();
        tbLowCity.activate('point');
        tbMidCity.deactivate();
        tbHighCity.deactivate();              
      }
      else{
        console.log(evt.target.value);
      }            
    });

    // remove the house clicked and change units count
    map.graphics.on("click", function(e){
      //get the associated node info when the graphic is clicked
      enableButtons();            
      var selected = e.graphic;
      var node = e.graphic.getDojoShape().getNode();
      map.graphics.remove(selected);
      var units = Number(document.getElementById("countunit").innerText);
      if(units > 0 && units < 720){
        document.getElementById("countunit").innerText = Number(document.getElementById("countunit").innerText) - 120;
      }
      else{
        return;
      }
    }); 
  }

  // function that alert if the unit locetion is out of the boundary
  function executeAlert(newmessage, time) {
    if($(".alert").length > 0){
      for (var i = $(".alert").length - 1; i >= 0; i--) {
        $(".alert")[i].remove();
      };
    }    
    var bootstrap_alert = function() {};
    bootstrap_alert.info = function(message) {
          $('#alert_placeholder').append('<div class="alert alert-info alert-dismissable"><span class="loc">'+message+'</span></div>')

          $(".alert-dismissable").fadeTo(time, 500).slideUp(500, function(){
            //$(".alert-dismissable").alert('close');
            console.log("");
          }); 
    }        
    return bootstrap_alert.info(newmessage);
  }

  function addHouseHighCity(evt) {
    //deactivate the toolbar and clear existing graphics
    //executeQueryTask(evt.geometry.x, evt.geometry.y)
    tbHighCity.deactivate(); 
    map.enableMapNavigation(); 
    var geoValues = webMercatorUtils.xyToLngLat(evt.geometry.x, evt.geometry.y);
    var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }})
    rPolygon.contains(point);
    if(rPolygon.contains(point) == false){executeAlert("Wrong location! Place your unit within the Boston city boundary.", 1500);}
    else{         
      map.graphics.add(new Graphic(evt.geometry, markerSymbolHigh));
      houseArray(geoValues[0], geoValues[1], "high");
      addToCounterUnit();
      totalUnits();  
    }    
  }

  function addHouseMidCity(evt) {
    //deactivate the toolbar and clear existing graphics 
    tbMidCity.deactivate(); 
    map.enableMapNavigation();    
    var geoValues = webMercatorUtils.xyToLngLat(evt.geometry.x,evt.geometry.y);          
    var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }})
    rPolygon.contains(point);
    if(rPolygon.contains(point) == false){executeAlert("Wrong location! Place your unit within the Boston city boundary.", 1500);}
    else{
      map.graphics.add(new Graphic(evt.geometry, markerSymbolMid));
      houseArray(geoValues[0], geoValues[1], "mid");
      addToCounterUnit();
      totalUnits();
    }
  }

  function addHouseLowCity(evt) {
    //deactivate the toolbar and clear existing graphics 
    tbLowCity.deactivate(); 
    map.enableMapNavigation();    
    var geoValues = webMercatorUtils.xyToLngLat(evt.geometry.x,evt.geometry.y);
    var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }})
    rPolygon.contains(point);
    if(rPolygon.contains(point) == false){executeAlert("Wrong location! Place your unit within the Boston city boundary.", 1500);}
    else{
      map.graphics.add(new Graphic(evt.geometry, markerSymbolLow));
      houseArray(geoValues[0], geoValues[1], "low");
      addToCounterUnit();
      totalUnits();
    }
  }

  // add attributes to house svg element  
  function setAttributes(el, options) {
    Object.keys(options).forEach(function(attr) {
      el.setAttribute(attr, options[attr]);
    })
  }

  function houseArray(lat, lng, housecolor){
    var myhousearr = document.getElementById("mapViewDiv_graphics_layer");
    var arr = myhousearr.getElementsByTagName("path");
    setAttributes(arr[arr.length -1], {"x":lng.toString(), "y":lat.toString(), "type": housecolor});
  } 

  // add to counter
  function addToCounterUnit(){          
    document.getElementById("countunit").innerText = Number(document.getElementById("countunit").innerText) + 120;
    document.getElementById("countunitzip").innerText = Number(document.getElementById("countunitzip").innerText) + 120;
  }
  
  // disable buttons
  function disableButtons(){
    var housebuttons = document.getElementsByClassName("round-button-circle");
    for (var y = 0; y < housebuttons.length; y++) {housebuttons[y].disabled = true;}
    document.getElementById("unitsubmit").disabled = false;
    document.getElementById("nbhunitsubmit").disabled = false;     
  }

  // enable buttons
  function enableButtons(){
    var housebuttons = document.getElementsByClassName("round-button-circle");
    for (var y = 0; y < housebuttons.length; y++) {housebuttons[y].disabled = false;}
    document.getElementById("unitsubmit").disabled = true;
    document.getElementById("nbhunitsubmit").disabled = true;
  }

  function totalUnits(){    
    var totUnit = Number(document.getElementById("countunit").innerText);
    console.log(totUnit);
    if(totUnit >= 600){disableButtons();}
    else{enableButtons();}    
  }

  function totalUnitsZip(){    
    var totUnit = Number(document.getElementById("countunitzip").innerText);
    console.log(totUnit);
    if(totUnit >= 600){disableButtons();}
    else{enableButtons();}    
  }

  // get the city unit data and send them to a server
  function getCityUnitsData(){
    map.removeLayer(rPolygonZip);
    
    var arrHouse = [];
    var svgCityUnitObject = document.getElementById("mapViewDiv_graphics_layer");
    var svgUnits = svgCityUnitObject.getElementsByTagName("path");
    for (var i = 0; i < svgUnits.length; i++) {      
      arrHouse.push({"x":svgUnits[i].getAttribute("x"), "y":svgUnits[i].getAttribute("y"), "type":svgUnits[i].getAttribute("type")})            
    }

    sessionCity.timestamp = time;            
    sessionCity.sessionid = time + "_"+ userhash;
    sessionCity.zip = String(document.getElementById("zipcodetext").value);
    sessionCity.geo = arrHouse;
        
    var cityJsonString = JSON.stringify(sessionCity);
    console.log(cityJsonString)
    $.post("js/submit.php", { cityJsonString: cityJsonString }, function(data){ 
        // show the response
        //window.open(data);
        console.log("data city submitted correctly");
         
    }).fail(function() { 
        // just in case posting your form failed
        console.log( "Posting failed." ); 

  });
    

    document.getElementById("countunitzip").innerText = 0;
    zicodeZoomExtent(sessionCity.zip);
    createBuffer();
    disableButtons();
    
    document.getElementById("nbhunitsubmit").disabled = true;
    $("#panelCity").attr('class', 'panel collapse');
    $("#panelNeighborhood").attr('class', 'panel collapse in');
  }

  // the zipcode units start here
  // function to zoom to zipcode extent query zipcode extent

  // style zipcode line
  var zipSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 3));
   
  function zicodeZoomExtent(zipcode, urlzip){
    //var zipcode = '02136';
    var zipcodeExtent = "https://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/bostonzip/FeatureServer/0/query?where=ZIP_CODE+%3D+%27" + zipcode + "%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=&units=esriSRUnit_Meter&outFields=ZIP_CODE&returnGeometry=true&returnCentroid=true&multipatchOption=&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pjson";
    $.ajax({      
      type: "GET",
      dataType:'json',
      url: zipcodeExtent,
      success: function(data){          
        //var zipcodeNewExtent = new Extent(data.extent.xmin, data.extent.ymin, data.extent.xmax, data.extent.ymax, new SpatialReference({ wkid:4326 }) );
        //map.setExtent(zipcodeNewExtent);
        zPolygon = new Polygon(new esri.SpatialReference({wkid:4326}));            
        
        $.each(data.features[0].geometry.rings, function(i, item) {
          zPolygon.addRing(item)
        });
        zPolygonZip = new GraphicsLayer({ id: "zipcodePoly"});          
        zPolygonZip.add(new Graphic(zPolygon, zipSymbol));
        map.addLayer(zPolygonZip);
        map.centerAndZoom([data.features[0].centroid.x,data.features[0].centroid.y],14);
        homeX = data.features[0].centroid.x;
        homeY = data.features[0].centroid.y;
        map.disableDoubleClickZoom();        
      }
    });  
  }

  function createBuffer(){
    // set up buffer style  
    map.graphics.clear();

    var bufferSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(
      SimpleLineSymbol.STYLE_SHORTDASHDOTDOT, new Color([5,5, 5]), 3), new Color([20,20,20,0.1]));
    
    map.on("click", function(evt){      
      if(circle == null){
        var geoValues = webMercatorUtils.xyToLngLat(evt.mapPoint.x,evt.mapPoint.y);
        var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }});
        if(zPolygon.contains(point) == false){
          executeAlert("Wrong location! Place your location within the Zipcode boundary", 1500);
        }
        else{                
          circle = new Circle({
            center: geoValues,
            geodesic: true,
            radius: 0.75,
            radiusUnit: "esriMiles"            
          });
          var gBuffer = new GraphicsLayer({ id: "gBuffer"});          
          gBuffer.add(new Graphic(circle, bufferSymbol));          
          //var gIntersect = geometryEngine.intersect(zPolygonZip.graphics[0].geometry, gBuffer.graphics[0].geometry)
          var gIntersect = geometryEngine.intersect(rPolygonZip.graphics[0].geometry, gBuffer.graphics[0].geometry)
          gBufferCut = new GraphicsLayer({ id: "gBufferCut"});          
          gBufferCut.add(new Graphic(gIntersect, bufferSymbol));
          map.addLayer(gBufferCut);
          gPolygonBuffer = new Polygon(new esri.SpatialReference({wkid:4326}));            
          $.each(gBufferCut.graphics[0].geometry.rings, function(i, item) {
            gPolygonBuffer.addRing(item)
          });
          initToolbarZipcode();
          enableButtons();
          map.removeLayer(zPolygonZip);         
        }  
      }
      else{
        console.log(circle);        
      }      
    });    
  }

  function initToolbarZipcode() {    
    tbHighZip = new Draw(map);                    
    tbHighZip.setMarkerSymbol(markerSymbolHigh);
    tbHighZip.on("draw-complete", addHouseHighZip);
    
    tbMidZip = new Draw(map);          
    tbMidZip.setMarkerSymbol(markerSymbolMid);
    tbMidZip.on("draw-complete", addHouseMidZip);
    
    tbLowZip = new Draw(map);          
    tbLowZip.setMarkerSymbol(markerSymbolLow);
    tbLowZip.on("draw-complete", addHouseLowZip);

    // event delegation so a click handler is not
    // needed for each individual button
    //on(document.getElementById("info"), "click", function(evt) {
    $('#infoNeighborhood').on('click', function(evt){    
                  
      if ( evt.target.id === "info" ) {
        return;
      }
      if(evt.target.value === 'househigh'){
        map.disableMapNavigation();
        tbHighZip.activate('point');
        tbMidZip.deactivate();
        tbLowZip.deactivate();
        
      }  
      else if (evt.target.value === 'housemid'){
        map.disableMapNavigation();
        tbMidZip.activate('point');
        tbHighZip.deactivate();
        tbLowZip.deactivate();                            
      }
      else if (evt.target.value === 'houselow'){
        map.disableMapNavigation();
        tbLowZip.activate('point');
        tbMidZip.deactivate();
        tbHighZip.deactivate();              
      }
      else{
        console.log(evt.target);
      }            
    });

    // remove the house clicked and change units count
    map.graphics.on("click", function(e){
      //get the associated node info when the graphic is clicked
      console.log(e.graphic)
      enableButtons();            
      var selected = e.graphic;
      
      //var node = e.graphic.getDojoShape().getNode();
      map.graphics.remove(selected);
      var units = Number(document.getElementById("countunitzip").innerText);
      console.log(units)
      if(units > 0 && units < 720){
        document.getElementById("countunitzip").innerText = Number(document.getElementById("countunitzip").innerText) - 120;
      }
      else{
        return;
      }
    }); 
  }

  function addHouseHighZip(evt) {
    //deactivate the toolbar and clear existing graphics    
    tbHighZip.deactivate(); 
    map.enableMapNavigation(); 
    var geoValues = webMercatorUtils.xyToLngLat(evt.geometry.x, evt.geometry.y);
    var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }})
    if(gPolygonBuffer.contains(point) == false){executeAlert("Wrong location! Place your unit within the Buffer zone!", 1500);}
    else{         
      map.graphics.add(new Graphic(evt.geometry, markerSymbolHigh));
      houseArray(geoValues[0], geoValues[1], "high");
      addToCounterUnit();
      totalUnitsZip();  
    }    
  }

  function addHouseMidZip(evt) {
    //deactivate the toolbar and clear existing graphics 
    tbMidZip.deactivate(); 
    map.enableMapNavigation();    
    var geoValues = webMercatorUtils.xyToLngLat(evt.geometry.x,evt.geometry.y);          
    var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }})
    if(gPolygonBuffer.contains(point) == false){executeAlert("Wrong location! Place your unit within the Buffer zone!", 1500);}
    else{
      map.graphics.add(new Graphic(evt.geometry, markerSymbolMid));
      houseArray(geoValues[0], geoValues[1], "mid");
      addToCounterUnit();
      totalUnitsZip();
    }
  }

  function addHouseLowZip(evt) {
    //deactivate the toolbar and clear existing graphics 
    tbLowZip.deactivate(); 
    map.enableMapNavigation();    
    var geoValues = webMercatorUtils.xyToLngLat(evt.geometry.x,evt.geometry.y);
    var point = new Point(geoValues[0], geoValues[1], {"spatialReference":{"wkid":4326 }})
    if(gPolygonBuffer.contains(point) == false){executeAlert("Wrong location! Place your unit within the Buffer zone!", 1500);}
    else{
      map.graphics.add(new Graphic(evt.geometry, markerSymbolLow));
      houseArray(geoValues[0], geoValues[1], "low");
      addToCounterUnit();
      totalUnitsZip();
    }
  }

  // submit zipcode units
  function getZipUnitsData(){     
    var arrHouse = [];
    var svgCityUnitObject = document.getElementById("mapViewDiv_graphics_layer");
    var svgUnits = svgCityUnitObject.getElementsByTagName("path");
    for (var i = 0; i < svgUnits.length; i++) {      
      arrHouse.push({"x":svgUnits[i].getAttribute("x"), "y":svgUnits[i].getAttribute("y"), "type":svgUnits[i].getAttribute("type")})            
    }

    sessionZip.timestamp = time;            
    sessionZip.sessionid = time + "_"+ userhash;
    sessionZip.zip = String(document.getElementById("zipcodetext").value);
    sessionZip.homeX = homeX;
    sessionZip.homeY = homeY
    sessionZip.geo = arrHouse;
        
    var zipJsonString = JSON.stringify(sessionZip);
    console.log(zipJsonString)
    $.post("js/submit_2.php", { zipJsonString: zipJsonString }, function(data){ 
        // show the response
        //window.open(data);
        console.log("data city submitted correctly");
         
    }).fail(function() { 
        // just in case posting your form failed
        alert( "Posting failed." ); 

    });
    $("#panelNeighborhood").attr('class', 'panel collapse');
    $("#panelSurvey").attr('class', 'panel collapse in');
  }

  // get the survey data
  function getSurveyData(){    
    sessionSurvey.sessionid = time + "_"+ userhash;
    sessionSurvey.q1 = String($("#q1 option:selected").html());
    sessionSurvey.q2 = String($("#q2 option:selected").html());
    sessionSurvey.q3 = Number($("#q3").val());
    sessionSurvey.q4 = Number($("#q4").val());
    sessionSurvey.q5 = String($("#q5 option:selected").html());
    sessionSurvey.q6 = String($("#q6 option:selected").html());
    sessionSurvey.q7 = String($("#q7 option:selected").html());
    sessionSurvey.q8 = String($("#q8 option:selected").html());
    sessionSurvey.q9 = Number($("#q9").val());
    sessionSurvey.q10 = String($("#q10 option:selected").html());
    sessionSurvey.q11 = String($("#q11 option:selected").html());
        
    var surveyJsonString = JSON.stringify(sessionSurvey);
    console.log(surveyJsonString)
    $.post("js/submit_3.php", { surveyJsonString: surveyJsonString }, function(data){ 
        // show the response
        //window.open(data);
        console.log("survey data submitted correctly");

         
    }).fail(function() {console.log( "Posting failed." ); })
    $("#panelSurvey").attr('class', 'panel collapse');
    executeAlert("Thank you for your collaboration!", 5000);
  };

});// dojo