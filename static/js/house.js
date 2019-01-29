// code by Giovanni Zambotti - 10 January 2018
// ESRI JS 4.10
require([
      "esri/Map",
      "esri/views/MapView",      
      "esri/widgets/Locate",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      //"esri/layers/MapImageLayer",
      //"esri/layers/TileLayer",
      "esri/renderers/SimpleRenderer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleLineSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/renderers/UniqueValueRenderer",
      "esri/Color",
      "esri/geometry/Extent",
      "esri/widgets/Popup",
      "esri/geometry/geometryEngine",
      "esri/geometry/SpatialReference",      
      "esri/geometry/Point",
      "esri/layers/support/LabelClass",

      // Bootstrap
      "bootstrap/Dropdown",
      "bootstrap/Collapse",
      "bootstrap/Modal",      

      // Calcite Maps
      "calcite-maps/calcitemaps-v0.3",

      "dojo/domReady!"
    ], //function(Map, MapView, FeatureLayer, GraphicsLayer,Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      //SimpleFillSymbol, UniqueValueRenderer) {
      function(Map, MapView, Locate, FeatureLayer, GraphicsLayer, Graphic, SimpleRenderer, SimpleMarkerSymbol, SimpleLineSymbol,
      SimpleFillSymbol, UniqueValueRenderer, Color, Extent, Popup, geometryEngine, SpatialReference, Point, LabelClass) { 
      
      calcite.init()  

      var nameNeighborList = [];
      var highlightSelect;
      let layerPoints;
      const myzoom = 12, lon = -71.05, lat = 42.32;

      const xMax = -7915458.81211143;
      const xMin = -7917751.9229597915;
      const yMax = 5217414.497463334;
      const yMin = 5216847.191394078;  
      // x keep the Neighborhood Counter
      var x = 4;
      var y = 0;

      const isMobile = {
          Android: function() {
              return navigator.userAgent.match(/Android/i);
          },
          BlackBerry: function() {
              return navigator.userAgent.match(/BlackBerry/i);
          },
          iOS: function() {
              return navigator.userAgent.match(/iPhone|iPad|iPod/i);
          },
          Opera: function() {
              return navigator.userAgent.match(/Opera Mini/i);
          },
          Windows: function() {
              return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
          },
          any: function() {
              return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
          }
      };

      if( isMobile.any() ) {
        myzoom = 16; 
        lon = -71.05; 
        lat = 42.32;
        xMax = -7916229.045165166; 
        xMin = -7917088.961733397;
        yMax = 5217530.483504136;
        yMin = 5216121.17579509;
      };

      const nparr = [];

      const neighbor = {"attributes":{
        sessionID:"",
        n0:"",
        n1:"",
        n2:"",
        n3:"",
        zipcode:"",
        lat:"",
        lon:""
      }};

      

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
      
      var userhash = hash(10);
      console.log(userhash)
      // function to collapse the panelZipcode
      $('#start').on('click', function (e) {
        //console.log('Event fired on #' + e.currentTarget.id);
        $("#panelNeighborhood").attr('class', 'panel collapse in');
      })
      
      // graphic polygons to hold the neighborhood selection and symbol
      var neighborhoodPoly = new GraphicsLayer();
      // style to display polygon zipcode
      var neighborhoodPolySymbol = {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [255, 0, 0, 0.25],
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [255, 0, 0, 0.5],
          width: "0px"
        }
      };
      // style to display polygon zipcode after selections
      var neighborhoodPolySymbolSelect = {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [255, 0, 0, 0],
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [255, 0, 0, 1],
          width: "1px"
        }
      };

      var bufferSymbol = {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [255, 0, 255, 0],
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [255, 0, 255, 1],
          width: "1px"
        }
      };

      // Create a symbol for drawing the point when list is selected
      var markerSymbol = {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        color: [0, 0, 250, .8],
        size: "40px",
        outline: { // autocasts as new SimpleLineSymbol()
          color: [255, 255, 0],
          width: 4
        }
      };

      var markerSymbolPoints = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          style: "circle",
          size: 28,
          color: [255, 255, 255, 1],
          outline: {
            width: 1,
            color: "#FF0055",
            style: "solid"
          }
        }
      };   

      var bostonBoundaryRenderer = new SimpleRenderer({
        symbol: new SimpleLineSymbol({
          type: "simple-line",  // autocasts as new SimpleLineSymbol()
          color: "black",
          width: "1px",
          style: "solid"
        })
      });

      var bostonPointRenderer = {
        type: "simple",  // autocasts as new SimpleRenderer()
        symbol: {
          type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
          size: 6,
          color: "red",
          outline: {  // autocasts as new SimpleLineSymbol()
            width: 1,
            color: "black"
          }
        }
      };
      
      // Boston Zipcode Feature Service
      var urlBB = "https://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/bostonzip/FeatureServer/0";
      // Boston Points Feature Service
      var urlBP = "https://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/point20wgs/FeatureServer/0";
           
      // create a Boston Boundary Future Layer
      var bostonBoundaryLayer = new FeatureLayer({
        url: urlBB,
        outFields: ["*"],
        visible: true,
        renderer: bostonBoundaryRenderer
      });
      
      // create a Boston Zipcode Point Future Layer        
      var bostonPointLayer = new FeatureLayer({
        url: urlBP,
        outFields: ["*"],
        visible: false,
        renderer: bostonPointRenderer
      });

      // create a map
      var map = new Map({
        basemap: "gray",
        layers: [bostonBoundaryLayer, bostonPointLayer]

      });
      // create a MapView
      var view = new MapView({
        container: "mapViewDiv",
        map: map,
        center: [lon, lat], /*-71.11607611178287, 42.37410778220068*/
        zoom: myzoom,        
        padding: {top: 50, bottom: 0}, 
        breakpoints: {xsmall: 768, small: 769, medium: 992, large: 1200}       
      });
      
      // Disables map rotation
      view.constraints = {rotationEnabled: false};
           
      // enble view click
      view.on("click", retriveNeighborhoodSelection);

      // 

      function retriveNeighborhoodSelection(event){
        x = x - 1
        console.log("x = " + x);
        if(x >= 0 && x < 4){
          
          //console.log(event.mapPoint);
          //console.log(document.getElementById("housecounter").innerHTML.split(": "))
          document.getElementById("housecounter").innerHTML = "Neighborhood Counter: " + x.toString();

          //view.whenLayerView(bostonBoundaryLayer).then(function(layerView){
          var query = bostonBoundaryLayer.createQuery();

          query.geometry = event.mapPoint;  // obtained from a view click event
          query.spatialRelationship = "intersects";
          bostonBoundaryLayer.queryFeatures(query).then(function(result){
            console.log(result.features[0].attributes.NAME, x);
             
            var graphicC = new Graphic(result.features[0].geometry, neighborhoodPolySymbol);
            neighborhoodPoly.add(graphicC);
            view.graphics.add(graphicC);
            nameNeighborList.push(result.features[0].attributes.NAME);
          });            
          if(x == 0){
            var s = document.getElementById('submitpoly')
            s.removeAttribute('disabled');
          }          
        }
        
        else if (y == 2){
          // retun a zipcode after a map click
          console.log("Step2: the x is: " + x + " and y is: " + y);           
          const point = {
            type: "point", // autocasts as new Point()
            longitude: event.mapPoint.longitude,
            latitude: event.mapPoint.latitude,
            spatialReference:{wkid: 4326}
          };

          console.log(event.mapPoint.latitude, event.mapPoint.longitude, point)
          view.graphics.removeAll();
          var query = bostonBoundaryLayer.createQuery();          
          query.geometry = point;          
          query.spatialRelationship = "intersects";  // this is the default
          query.returnGeometry = true;
          query.outFields = ["ZIP_CODE"];
          console.log(query)
          bostonBoundaryLayer.queryFeatures(query).then(function(response){
            //console.log(response)
            //console.log(result.features[0].geometry.extent);
            //view.goTo(response.features[0].geometry.extent);
            var graphicC = new Graphic(response.features[0].geometry, neighborhoodPolySymbolSelect);
            //neighborhoodPoly.add(graphicC);
            //view.graphics.add(graphicC);
            document.getElementById('zipcodetext').value = response.features[0].attributes.ZIP_CODE;
            neighbor.attributes.zipcode = response.features[0].attributes.ZIP_CODE;
            console.log(JSON.stringify(neighbor));
          });
          // to do select zipcode by event mapPoint          
          createBuffer(event.mapPoint.longitude, event.mapPoint.latitude).then(displayPoints);           
        }
      }

      // function to remove a Neighborhood Selection Polygon
      $('#removepoly').on('click', function (e) {
        console.log('Event fired on #' + e.currentTarget.id);
        view.graphics.removeAll();
        x = 4;
        document.getElementById("housecounter").innerHTML = "Neighborhood Counter: " + x.toString();
        nameNeighborList = [];
        // disable the submit button
        var s = document.getElementById('submitpoly')
        s.setAttribute('disabled', 'disabled')
      })

      // submit the zipcode
      $('#submitpoly').on('click', function (e) {
        console.log( "submitpoly....");        
        for (x in nameNeighborList) {
          console.log(nameNeighborList[x], x)
          if(x == 0){neighbor.attributes.n0 = nameNeighborList[x]}
          if(x == 1){neighbor.attributes.n1 = nameNeighborList[x]}
          if(x == 2){neighbor.attributes.n2 = nameNeighborList[x]}
          if(x == 3){neighbor.attributes.n3 = nameNeighborList[x]}
        }
        neighbor.attributes.sessionID = userhash;
        //console.log(neighbor);
        view.graphics.removeAll();
        x = -1;
        y = 2;
        $("#panelNeighborhood").attr('class', 'panel collapse out');
        $("#panelZipcode").attr('class', 'panel collapse in');
        // remove the zipcode boundary layer
        map.remove(bostonBoundaryLayer);
      }) 

      $('#zipcodetext').on('change', function (e) {
        //console.log('Event fired on #' + e.currentTarget.id, e);
        x = -1;
        y = 2;
        view.graphics.removeAll();
        var query = bostonBoundaryLayer.createQuery();
        query.where = "ZIP_CODE = '" + $(this).val() + "'";
        neighbor.attributes.zipcode = $(this).val();
        bostonBoundaryLayer.queryFeatures(query).then(function(result){
          //console.log(result.features[0].geometry.extent);
          //console.log(JSON.stringify(neighbor));
          view.goTo(result.features[0].geometry.extent);
          var graphicC = new Graphic(result.features[0].geometry, neighborhoodPolySymbolSelect);
          neighborhoodPoly.add(graphicC);
          //view.graphics.add(graphicC);
        });        
      })

      // push data to AGOL on button click
      $('#zipcodeid').on('click', function (e) {
        console.log(JSON.stringify(neighbor));
        /*$.post("receiver", JSON.stringify(neighbor), function(){});*/
        var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance 
        xmlhttp.open("POST", "/receiver");
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(neighbor));
        
        $("#panelZipcode").attr('class', 'panel collapse out');
        $("#panelPoints").attr('class', 'panel collapse in');
      })

      view.whenLayerView(bostonPointLayer).then(function(layerView) {
        console.log('ready!!!!!');
        var query = bostonPointLayer.createQuery();
        document.getElementById("plist").addEventListener("click",function(e) {
          // e.target is our targetted element.
          // try doing console.log(e.target.nodeName), it will result LI
          if(e.target && e.target.nodeName == "LI") {              
              const np = {"attributes":{
                sessionID:"",
                siteID:"",
                supportScale:"",
                proposalVote:"",
                money:""
              }};
              console.log(e.target.id.toString() + " was clicked");
              console.log($('input[name=framework]:checked').val())
              query.where = 'OBJECTID = ' + e.target.id;              
              bostonPointLayer.queryFeatures(query).then(function(result) {
                var point = {
                  type: "point", // autocasts as new Point()
                  longitude: result.features[0].geometry.longitude,
                  latitude: result.features[0].geometry.latitude
                };
                // Create a graphic and add the geometry and symbol to it
                var pointGraphic = new Graphic({
                  geometry: point,
                  symbol: markerSymbol
                });
                view.graphics.add(pointGraphic);
                var v = document.getElementById(e.target.id)
                v.style.backgroundColor = "yellow";
              });

              np.attributes.sessionID = userhash;
              np.attributes.siteID = e.target.id;
              np.attributes.supportScale = $('input[name=framework]:checked').val();
              np.attributes.proposalVote = 1;
              nparr.push(np)                    
              console.log(nparr)
            }
            
        });
      });
       
      // create a 0.75 miles buffer on map click
      function createBuffer(x,y){        
        var point = new Point(x, y, {"spatialReference":{"wkid":4326 }});    
        var pBuffer = geometryEngine.geodesicBuffer(point, 0.2, "miles", true);
        var bGraphic = new Graphic({
            geometry: pBuffer,
            symbol: {
            type: "simple-fill", // autocasts as new SimpleFillSymbol()
            outline: {
              width: 1,
              color: [0, 0, 255]
            },
            style: "none"
          }
        });
        view.goTo(pBuffer.extent)
        //view.graphics.removeAll();
        view.graphics.add(bGraphic);
        var query = bostonPointLayer.createQuery();

        query.geometry = pBuffer;  // obtained from a view click event
        query.spatialRelationship = "intersects";
        
        return bostonPointLayer.queryFeatures(query);         
      }

      // add Points within the buffer  
      function displayPoints(results) {
          // check if the layer already exist
          if (layerPoints != 'undefined'){
            map.remove(layerPoints);
            document.getElementById("plist").innerHTML = "";
          }
          
          layerPoints = new FeatureLayer({
             // create an instance of esri/layers/support/Field for each field object
             fields: [             
             {
               name: "OBJECTID",
               alias: "OBJECTID",
               type: "oid"
             }
             ],
             objectIdField: "OBJECTID",
             geometryType: "point",
             spatialReference: { wkid: 4326 },
             outFields: ["OBJECTID"],
             source: results.features,             
             renderer: markerSymbolPoints
          });
         
          const pointLabelClass = new LabelClass({
            labelExpressionInfo: { expression: "$feature.OBJECTID" },
            symbol: {
              type: "text",  // autocasts as new TextSymbol()
              color: "black",
              font: {
                size: 10,
                weight: "bold"
              },
              size: 8,
              haloSize: 10,
              haloColor: "white"
            }
          });
          pointLabelClass.labelPlacement = "center-center";
          layerPoints.labelingInfo = [ pointLabelClass ];
          map.add(layerPoints);
          results.features.forEach(myFunction);  

      }

      function myFunction(value) {
        //console.log(value.attributes)
        var node = document.createElement("li");
        node.setAttribute("id", value.attributes['OBJECTID']);
        node.classList.add("pslist");
        //var a = document.createElement('a');
        //node.setAttribute('href', "#");
        //node.appendChild(a);
        var textnode = document.createTextNode(value.attributes['OBJECTID']);
        node.appendChild(textnode);        
        document.getElementById("plist").appendChild(node);        
      }
      

      
      
      /*
      window.onload = function() {
        // setup the button click
        document.getElementById("theButton").onclick = function() {
          doWork()
        };
      }

      function doWork() {
        var d = new Date();  
        var home = [{"attributes": {"id": document.getElementsByName("id")[0].value, "name": document.getElementsByName("name")[0].value,"zipcode": document.getElementsByName("zipcode")[0].value,"date": d.getTime()}}]
        console.log(home)
        // ajax the JSON to the server
        /*$.post("receiver", JSON.stringify(home), function(){
    
      });*/
      
      /*
        var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance 
        xmlhttp.open("POST", "/receiver");
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(home));
        // stop link reloading the page
       event.preventDefault();
      }
      */ 
               
    });