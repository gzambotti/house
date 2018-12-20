// code by Giovanni Zambotti - 20 July 2017
// update to ESRI JS 4.6 - 12 April 2018
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

      // Bootstrap
      "bootstrap/Dropdown",
      "bootstrap/Collapse",      

      // Calcite Maps
      "calcite-maps/calcitemaps-v0.3",

      "dojo/domReady!"
    ], //function(Map, MapView, FeatureLayer, GraphicsLayer,Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      //SimpleFillSymbol, UniqueValueRenderer) {
      function(Map, MapView, Locate, FeatureLayer, GraphicsLayer, Graphic, SimpleRenderer, SimpleMarkerSymbol, SimpleLineSymbol,
      SimpleFillSymbol, UniqueValueRenderer, Color, Extent, Popup) { 
      var foo = [];
      var myzoom = 12, lon = -71.05, lat = 42.32;

      var xMax = -7915458.81211143;
      var xMin = -7917751.9229597915;
      var yMax = 5217414.497463334;
      var yMin = 5216847.191394078;      

      var isMobile = {
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

      var neighbor = {"attributes":{
        sessionID:"",
        n0:"",
        n1:"",
        n2:"",
        n3:"",
        zipcode:""
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
      
      // function to collapse the panelZipcode
      $('#panelInfo').on('click', function (e) {
        //console.log('Event fired on #' + e.currentTarget.id);
        $("#panelNeighborhood").attr('class', 'panel collapse in');
      })
      // graphic polygons to hold the neighborhood selection and symbol
      var neighborhoodPoly = new GraphicsLayer();
      var neighborhoodPolySymbol = {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [255, 0, 0, 0.25],
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [255, 0, 0, 0.5],
          width: "0px"
        }
      };

      var neighborhoodPolySymbol1 = {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: [255, 0, 0, 0],
        outline: {  // autocasts as new SimpleLineSymbol()
          color: [255, 0, 0, 1],
          width: "1px"
        }
      };
      // Boston Zipcode Feature Service
      var urlBB = "https://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/bostonzip/FeatureServer/0";
      //var jsonBostonBoundary = "https://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/bostonboundaryzip/FeatureServer/0/query?where=1+%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=&units=esriSRUnit_Meter&returnGeodetic=false&outFields=&returnGeometry=true&returnCentroid=false&multipatchOption=none&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson"
            
      var bostonBoundaryRenderer = new SimpleRenderer({
        symbol: new SimpleLineSymbol({
          type: "simple-line",  // autocasts as new SimpleLineSymbol()
          color: "black",
          width: "1px",
          style: "solid"
        })
      });
      // create a Boston Boundary Fature Layer
      var bostonBoundaryLayer = new FeatureLayer({
        url: urlBB,
        outFields: ["*"],
        visible: true,
        renderer: bostonBoundaryRenderer
      });        
      // create a map
      var map = new Map({
        basemap: "gray",
        layers: [bostonBoundaryLayer]

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

      
      // x keep the House Counter
      var x = 4;
      var y = 0;
      
      // 

      function retriveNeighborhoodSelection(event){
        x = x - 1
        console.log(x);
        if(x >= 0 && x < 4){
          
          //console.log(event.mapPoint);
          //console.log(document.getElementById("housecounter").innerHTML.split(": "))
        
          document.getElementById("housecounter").innerHTML = "House Counter: " + x.toString();

          //view.whenLayerView(bostonBoundaryLayer).then(function(layerView){
            var query = bostonBoundaryLayer.createQuery();

            query.geometry = event.mapPoint;  // obtained from a view click event
            query.spatialRelationship = "intersects";
            bostonBoundaryLayer.queryFeatures(query).then(function(result){
              console.log(result.features[0].attributes.NAME, x);
             
              var graphicC = new Graphic(result.features[0].geometry, neighborhoodPolySymbol);
              neighborhoodPoly.add(graphicC);
              view.graphics.add(graphicC);
              foo.push(result.features[0].attributes.NAME);
            });
            
          //});
           
        }
        
        else if (y = 2 ){
          console.log(x); 
          console.log(event.mapPoint.latitude)
          
          //foo1() 
        }
      }

      // function to remove a Neighborhood Selection Polygon
      $('#removepoly').on('click', function (e) {
        console.log('Event fired on #' + e.currentTarget.id);
        view.graphics.removeAll();
        x = 4;
        document.getElementById("housecounter").innerHTML = "House Counter: " + x.toString();
        foo = [];
        //$("#panelZipcode").attr('class', 'panel collapse in');
      })

      //function to submit zipcode
      
      $('#submitpoly').on('click', function (e) {
        console.log(foo);
        x = 0;
        y = 2;
        for (x in foo) {
          console.log(foo[x], x)
          if(x == 0){neighbor.attributes.n0 = foo[x]}
          if(x == 1){neighbor.attributes.n1 = foo[x]}
          if(x == 2){neighbor.attributes.n2 = foo[x]}
          if(x == 3){neighbor.attributes.n3 = foo[x]}
        }
        neighbor.sessionID = userhash;
        console.log(neighbor);
        view.graphics.removeAll();
        y = 2;
        $("#panelNeighborhood").attr('class', 'panel collapse out');
        $("#panelZipcode").attr('class', 'panel collapse in');
        map.remove(bostonBoundaryLayer);
      }) 

      $('#zipcodetext').on('change', function (e) {
        //console.log('Event fired on #' + e.currentTarget.id, e);
        x = 0;
        y = 2;
        view.graphics.removeAll();
        var query = bostonBoundaryLayer.createQuery();
        query.where = "ZIP_CODE = '" + $(this).val() + "'";
        bostonBoundaryLayer.queryFeatures(query).then(function(result){
          console.log(result.features[0].geometry.extent);
          view.goTo(result.features[0].geometry.extent);
          var graphicC = new Graphic(result.features[0].geometry, neighborhoodPolySymbol1);
          neighborhoodPoly.add(graphicC);
          view.graphics.add(graphicC);
        });
        
      })

      function foo1(event){
          //console.log(event.mapPoint)
          view.center = [-112, 38];  // Sets the center point of the view at a specified lon/lat
          view.zoom = 13;
        }


               
    });