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
      
      // function to collapse the panelZipcode
      $('#panelInfo').on('click', function (e) {
        //console.log('Event fired on #' + e.currentTarget.id);
        $("#panelZipcode").attr('class', 'panel collapse in');
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
      // Boston Zipcode Feature Service
      var urlBB = "http://services1.arcgis.com/qN3V93cYGMKQCOxL/arcgis/rest/services/bostonzip/FeatureServer/0";
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

      function retriveNeighborhoodSelection(event){
        x = x - 1
        if(x >= 0 && x < 4){
          console.log(x);
          //console.log(event.mapPoint);
          console.log(document.getElementById("housecounter").innerHTML.split(": "))
        
          document.getElementById("housecounter").innerHTML = "House Counter: " + x.toString();

          view.whenLayerView(bostonBoundaryLayer).then(function(layerView){
            var query = bostonBoundaryLayer.createQuery();

            query.geometry = event.mapPoint;  // obtained from a view click event
            query.spatialRelationship = "intersects";
            bostonBoundaryLayer.queryFeatures(query).then(function(result){
              //console.log(result.features[0].geometry);
              var graphicC = new Graphic(result.features[0].geometry, neighborhoodPolySymbol);
              neighborhoodPoly.add(graphicC);
              view.graphics.add(graphicC);
            });
          });  
        }
      }

      // function to remove a Neighborhood Selection Polygon
      $('#removepoly').on('click', function (e) {
        console.log('Event fired on #' + e.currentTarget.id);
        view.graphics.removeAll();
        x = 4;
        document.getElementById("housecounter").innerHTML = "House Counter: " + x.toString();

        //$("#panelZipcode").attr('class', 'panel collapse in');
      })
               
    });