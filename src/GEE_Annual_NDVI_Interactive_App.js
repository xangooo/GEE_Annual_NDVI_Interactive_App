// ======================================================
// 0. GLOBAL CONFIG
// ======================================================
var EXPORT_AVAILABILITY_THRESHOLD = 50; // percent
var START_YEAR = 2015;
var END_YEAR = 2025;

// ======================================================
// 1. LOAD DATASETS
// ======================================================
var table = ee.FeatureCollection("FAO/GAUL/2015/level0");
var ROI = table.filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
var geometry = ROI.geometry();

var NDVI = ee.ImageCollection("LANDSAT/COMPOSITES/C02/T1_L2_32DAY_NDVI")
  .select('NDVI')
  .filterDate(START_YEAR + '-01-01', END_YEAR + '-12-31');

// ======================================================
// 2. NDVI VISUALIZATION
// ======================================================
var ndviVis = {
  min: 0,
  max: 1,
  palette: [
    'ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163',
    '99b718', '74a901', '66a000', '529400', '3e8601',
    '207401', '056201', '004c00', '023b01',
    '012e01', '011d01', '011301'
  ]
};

// ======================================================
// 3. ANNUAL NDVI COLLECTION (2015–2025)
// ======================================================
var years = ee.List.sequence(START_YEAR, END_YEAR);

var annualNDVI = ee.ImageCollection.fromImages(
  years.map(function(y) {
    var img = NDVI
      .filter(ee.Filter.calendarRange(y, y, 'year'))
      .mean()
      .clip(geometry)
      .set('year', y)
      .set('system:time_start', ee.Date.fromYMD(y, 1, 1).millis());
    return img;
  })
);

// ======================================================
// 4. INITIAL YEAR
// ======================================================
var selectedYear = START_YEAR;
var initialNDVI = annualNDVI.filter(ee.Filter.eq('year', selectedYear)).first();
var currentNDVIImage = initialNDVI;

// ======================================================
// 5. CREATE UI MAP
// ======================================================
var mapPanel = ui.Map();
mapPanel.centerObject(ROI, 6);
mapPanel.style().set('cursor', 'crosshair');

var ndviLayer = ui.Map.Layer(initialNDVI, ndviVis, 'Annual NDVI');
var roiLayer = ui.Map.Layer(
  ROI.style({
    color: 'black',     // boundary line color
    width: 0.1,           // line thickness (adjust if needed)
    fillColor: '00000000' // fully transparent fill
  }),
  {},
  'Bangladesh Boundary'
);

var clickMarker = ui.Map.Layer(null, {color: 'white'}, 'Selected Pixel');

mapPanel.layers().set(0, ndviLayer);
mapPanel.layers().set(1, roiLayer);
mapPanel.layers().set(2, clickMarker);

// ======================================================
// 6. UI LABELS
// ======================================================
var exportStatusLabel = ui.Label('', {color: 'red', fontWeight: 'bold'});
var inspectLabel = ui.Label('Click on the map to inspect NDVI', {fontWeight: 'bold'});
var inspectValueLabel = ui.Label('');
var inspectClassLabel = ui.Label('', {fontWeight: 'bold'});
var inspectAvailabilityLabel = ui.Label('');
var pointChartPanel = ui.Panel();

// ======================================================
// 7. NDVI CLASS FUNCTION
// ======================================================
function classifyNDVI(ndvi) {
  if (ndvi < 0.2) return 'Bare soil / Built-up';
  if (ndvi < 0.4) return 'Sparse vegetation';
  if (ndvi < 0.6) return 'Moderate vegetation';
  return 'Dense vegetation';
}

// ======================================================
// 8. YEAR SELECTOR
// ======================================================
var yearSelect = ui.Select({
  items: years.getInfo().map(String),
  value: String(selectedYear),
  onChange: function(year) {

    selectedYear = parseInt(year, 10);

    var img = annualNDVI
      .filter(ee.Filter.eq('year', selectedYear))
      .first();

    ndviLayer.setEeObject(img);
    currentNDVIImage = img;
    exportButton.setDisabled(true);
    exportStatusLabel.setValue('');
  }
});

// ======================================================
// 9. EXPORT BUTTON
// ======================================================
var exportButton = ui.Button({
  label: 'Export Annual NDVI',
  disabled: true,
  style: {stretch: 'horizontal', fontWeight: 'bold'},
  onClick: function() {

    Export.image.toDrive({
      image: currentNDVIImage,
      description: 'Bangladesh_Annual_NDVI_' + selectedYear,
      folder: 'GEE_NDVI_Exports',
      fileNamePrefix: 'NDVI_Bangladesh_' + selectedYear,
      region: geometry,
      scale: 30,
      maxPixels: 1e13
    });

    exportStatusLabel.setValue('✅ Export created. Check Tasks tab.');
  }
});

// ======================================================
// 10. MAP CLICK HANDLER
// ======================================================
mapPanel.onClick(function(coords) {

  var point = ee.Geometry.Point([coords.lon, coords.lat]);
  clickMarker.setEeObject(point);

  var ndviAtPoint = currentNDVIImage.reduceRegion({
    reducer: ee.Reducer.first(),
    geometry: point,
    scale: 30,
    maxPixels: 1e13
  }).get('NDVI');

  ndviAtPoint.evaluate(function(value) {

    if (value === null || value === undefined) {
      inspectValueLabel.setValue('No NDVI data at this location');
      inspectClassLabel.setValue('');
      inspectAvailabilityLabel.setValue('');
      exportButton.setDisabled(true);
      return;
    }

    inspectValueLabel.setValue(
      'NDVI: ' + value.toFixed(3) +
      ' | Lon: ' + coords.lon.toFixed(4) +
      ', Lat: ' + coords.lat.toFixed(4)
    );

    inspectClassLabel.setValue('Class: ' + classifyNDVI(value));

    var color =
      value < 0.2 ? 'red' :
      value < 0.4 ? 'orange' :
      value < 0.6 ? 'yellow' : 'green';

    clickMarker.setVisParams({color: color});
  });

  var totalImages = NDVI
    .filter(ee.Filter.calendarRange(selectedYear, selectedYear, 'year'))
    .size()
    .max(1);

  var validImages = NDVI
    .filter(ee.Filter.calendarRange(selectedYear, selectedYear, 'year'))
    .map(function(img) {
      return img.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: point,
        scale: 30
      }).get('NDVI');
    })
    .filter(ee.Filter.notNull(['NDVI']))
    .size();

  validImages.divide(totalImages).multiply(100)
    .evaluate(function(pct) {

      if (pct === null || pct === undefined) {
        inspectAvailabilityLabel.setValue('Pixel availability: 0.0%');
        exportButton.setDisabled(true);
        return;
      }

      pct = Number(pct);

      inspectAvailabilityLabel.setValue(
        'Pixel availability: ' + pct.toFixed(1) + '%'
      );

      exportButton.setDisabled(pct < EXPORT_AVAILABILITY_THRESHOLD);
    });

  var pointChart = ui.Chart.image.series({
    imageCollection: NDVI.filter(
      ee.Filter.calendarRange(selectedYear, selectedYear, 'year')
    ),
    region: point,
    reducer: ee.Reducer.mean(),
    scale: 30,
    xProperty: 'system:time_start'
  }).setOptions({
    title: 'NDVI Time Series (' + selectedYear + ')',
    vAxis: {title: 'NDVI'},
    hAxis: {title: 'Date'},
    lineWidth: 2,
    pointSize: 3
  });

  pointChartPanel.clear();
  pointChartPanel.add(pointChart);
});

// ======================================================
// 11. ANNUAL NDVI CHART (2015–2025)
// ======================================================
var chart = ui.Chart.image.series({
  imageCollection: annualNDVI,
  region: geometry,
  reducer: ee.Reducer.mean(),
  scale: 1000,
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Annual Mean NDVI (2015–2025)',
  vAxis: {title: 'NDVI'},
  hAxis: {title: 'Year'},
  lineWidth: 2,
  pointSize: 4
});

// ======================================================
// 12. LEFT PANEL
// ======================================================
var leftPanel = ui.Panel({
  widgets: [
    ui.Label('Bangladesh Annual NDVI Dashboard', {
      fontSize: '20px',
      fontWeight: 'bold'
    }),
    ui.Label('Select Year'),
    yearSelect,
    exportButton,
    exportStatusLabel,
    inspectLabel,
    inspectValueLabel,
    inspectClassLabel,
    inspectAvailabilityLabel,
    pointChartPanel,
    chart
  ],
  style: {width: '420px', padding: '8px'}
});

// ======================================================
// 13. FINAL LAYOUT
// ======================================================
var mainPanel = ui.SplitPanel({
  firstPanel: leftPanel,
  secondPanel: mapPanel,
  orientation: 'horizontal',
  wipe: false
});

ui.root.clear();
ui.root.add(mainPanel);
