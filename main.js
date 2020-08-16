var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

closer.onclick = function() {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

var nlscMatrixIds = new Array(21);
for (var i=0; i<21; ++i) {
  nlscMatrixIds[i] = i;
}

var styleLines = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(86,113,228,0.7)',
      width: 3
  })
});

var styleAreas = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,64,0,0.7)',
      width: 3
  }),
  fill: new ol.style.Fill({
      color: 'rgba(0,64,0,0.3)',
  })
});
var pointStyle = new ol.style.Style({
  image: new ol.style.RegularShape({
    fill: new ol.style.Fill({
      color: [255, 255, 0, 0.7]
    }),
    stroke: new ol.style.Stroke({
      color: [0, 0, 0, 0.7]
    }),
    points: 5,
    radius: 15,
    radius2: 7,
    angle: 0,
  })
});

var vectorAreas = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'polygons.json',
    format: new ol.format.GeoJSON()
  }),
  style:styleAreas
});

var placeSource = new ol.source.Vector({
  
});
var vectorPoints = new ol.layer.Vector({
  source: placeSource,
  style: pointStyle
});

var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'PHOTO_MIX',
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.5
});


var appView = new ol.View({
  center: ol.proj.fromLonLat([120.20345985889435, 22.994906062625773]),
  zoom: 14
});

var map = new ol.Map({
  layers: [baseLayer, vectorAreas, vectorPoints],
  overlays: [popup],
  target: 'map',
  view: appView
});

map.addControl(sidebar);

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
        console.log(error.message);
      });

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var geolocationCentered = false;
geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  if(coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
    if(false === geolocationCentered) {
      map.getView().setCenter(coordinates);
      geolocationCentered = true;
    }
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

map.on('singleclick', function(evt) {
  var sideBarOpened = false;
  $('#sidebar-main-block').html('');
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    var p = feature.getProperties();
    var message = '';
    if(p.LCODE_C1) {
      message += '<h2>潛力用地</h2>';
      message += '<table class="table table-dark table-bordered">';
      message += '<tr><td>行政區</td><td>' + p.county + p.town + '</td></tr>';
      message += '<tr><td>土地所有人</td><td>' + p.land_onwer + '</td></tr>';
      message += '<tr><td>管理單位</td><td>' + p.land_manger + '</td></tr>';
      message += '</table>';
    } else if(p.no) {
      message += '<h2>指標基地</h2>';
      message += '<table class="table table-dark table-bordered">';
      message += '<tr><td>縣市</td><td>' + places[p.no].county + '</td></tr>';
      message += '<tr><td>名稱</td><td>' + places[p.no].name + '</td></tr>';
      message += '<tr><td colspan="2">'
      if(places[p.no].media != '') {
        message += '<a href="' + places[p.no].media + '" target="_blank" class="btn btn-success btn-block">相簿 與 討論區</a>';
      }
      if(places[p.no].url != '') {
        message += '<a href="' + places[p.no].url + '" target="_blank" class="btn btn-success btn-block">個案頁面連結</a>';
      }
      message += '</td></tr>';
      message += '<tr><td>行動類型</td><td>' + places[p.no].action + '</td></tr>';
      message += '<tr><td>介紹</td><td>' + places[p.no].description + '</td></tr>';
      message += '<tr><td>鄉鎮市區</td><td>' + places[p.no].area + '</td></tr>';
      message += '<tr><td>所有權單位</td><td>' + places[p.no].owner + '</td></tr>';
      message += '<tr><td>管理單位</td><td>' + places[p.no].manager + '</td></tr>';
      message += '<tr><td>參考綠化案例</td><td>' + places[p.no].study + '</td></tr>';
      message += '<tr><td>苗圃</td><td>' + places[p.no].contact + '</td></tr>';
      message += '<tr><td>面積</td><td>' + places[p.no].shape_area + '</td></tr>';
      message += '<tr><td>再種植面積</td><td>' + places[p.no].add_area + '</td></tr>';
      message += '</table>';
    }
    $('#sidebar-main-block').append(message);
    sidebar.open('home');
  });
});

var places = {};
Papa.parse('places.csv', {
  download: true,
  step: function(r) {
    if(r.data[0] != 'no' && r.data[9] != '' && r.data[10] != '') {
      var feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(r.data[10]), parseFloat(r.data[9])]))
      });
      feature.setProperties({
        no: r.data[0]
      });
      places[r.data[0]] = {
        county: r.data[1], //縣市
        name: r.data[2], //命名
        media: r.data[7], //相簿 與 討論區
        action: r.data[15], //行動類型
        description: r.data[18], //介紹
        area: r.data[20], //鄉鎮區
        owner: r.data[21], //所有權單位
        manager: r.data[22], //管理單位
        study: r.data[28], //參考綠化案例
        contact: r.data[29], //苗圃
        url: r.data[31], //個案頁面連結
        shape_area: r.data[35], //面積
        add_area: r.data[38] //評估可再種植之面積
      };
      placeSource.addFeature(feature);
    }
  }
})

var emptyStyle = new ol.style.Style({ image: '' });