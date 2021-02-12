// Watchlist Dropdown
watchlistButton = document.querySelector('#stock-watchlist-btn');

// toggle dropdown
watchlistButton.addEventListener('click', function(event) {
  event.stopPropagation();
  event.preventDefault();
  watchlistButton.classList.toggle('is-active');
});

var treeMapDataGenerator = function() {
  // starting data array according to the treemap-data-format
  var dataArr = [['Ticker', 'Parent', 'Market Cap (USD)', 'marketCap:Employees ratio'],
               ['Watchlisted Stocks',null,0,0]];

  // Pull data from Localstorage
    watchList = localStorage.getItem('stock-list')
    watchList = JSON.parse(watchList);
    if (!(jQuery.isEmptyObject(watchList))) {

        // Formatting Data
        // myRow = [ticker, empty, marketCap, numEmployees-to-marketCap]
        // See https://developers.google.com/chart/interactive/docs/gallery/treemap#data-format for details
        for (x in watchList) {
          if(parseInt(watchList[x].employees)==0){var ratio = 0}else{var ratio = parseInt(watchList[x].marketCap)/parseInt(watchList[x].employees)}
          
          dataArr.push([watchList[x].tickerName,'Watchlisted Stocks',parseInt(watchList[x].marketCap), parseInt(ratio)])
        }
        return [dataArr, false]
        
    } else{
      // if localstorage is empty, clear out the chart element and return false
      $('#mkt-cap-vis-chart').html('')
      var dataArr = 
      [['Ticker', 'Parent', 'Market Cap (USD)', 'marketCap:Employees ratio'],
      ['Gdaddy', null, 0, 0],
      ['Mosaically arranged Stocks will show up here','Gdaddy',50,1000000],
      ['Not Alphabetical', 'Mosaically arranged Stocks will show up here', 5, 700000],
      ['Arranged', 'Mosaically arranged Stocks will show up here', 4, 1600000],
      ['Stonks', 'Mosaically arranged Stocks will show up here',5, 1005000],
      ['Placeholder', 'Mosaically arranged Stocks will show up here', 6, 2000000],
      ['Stocks', 'Mosaically arranged Stocks will show up here', 5, 50000],
      ['Charting', 'Mosaically arranged Stocks will show up here', 4, 250000],
      ['Dashboards', 'Mosaically arranged Stocks will show up here', 3, 105810],
      ['Mosaic', 'Mosaically arranged Stocks will show up here', 8, 1958101]]

      var options = {
        highlightOnMouseOver: true,
        maxDepth: 1,
        maxPostDepth: 2,
        minHighlightColor: '#8c6bb1',
        midHighlightColor: '#9ebcda',
        maxHighlightColor: '#edf8fb',
        height: 500,

        headerColor: '#f5f5f5',
        minColor: '#ff3860',
        maxColor: '#00d1b2',
        headerHeight: 0,
        fontColor: '#363636',
        title: 'Placeholder',
        titleTextStyle: {color:'#363636', fontSize: '24'}
      };
      

      return [dataArr,options];
    }
}

// Once the treemap package has been loaded, draw a graph from localstorage
google.charts.load('current', {'packages':['treemap']});
google.charts.setOnLoadCallback(visualizeMarketCap);

// Draw treemap
function visualizeMarketCap() {

  // Make a new Treemap object at chart container
  tree = new google.visualization.TreeMap(document.getElementById('mkt-cap-vis-chart'));

  // tooltip HTML
  function showFullTooltip(row, size, value) {
    var empToMktRatio;
    if (data.getValue(row, 3) == 0 ){empToMktRatio = ' Failed to load employee data'}
    else {empToMktRatio = " $"+magnitudeIterate(data.getValue(row, 3),0)}

    return '<div style="background:hsl(0, 0%, 100%); padding:1rem;">' +
    '<b>Ticker:</b> ' + data.getValue(row, 0) + '<br>'+
    '<b>Market Cap:</b> '+magnitudeIterate(size, 0) + '<br>' +
    '<b>Market Cap to Employees ratio:</b>'+ empToMktRatio + ' per employee</div>';
  }

  // pull updated data from localstorage
  var dataToDraw = treeMapDataGenerator();
  // Visual flair options
  var options =  {    
    highlightOnMouseOver: true,
    maxDepth: 1,
    maxPostDepth: 2,
    minHighlightColor: '#8c6bb1',
    midHighlightColor: '#9ebcda',
    maxHighlightColor: '#edf8fb',
    height: 500,

    headerColor: '#f5f5f5',
    minColor: '#ff3860',
    maxColor: '#00d1b2',
    headerHeight: 0,
    fontColor: '#363636',
    title: 'Market Cap Visualization',
    titleTextStyle: {color:'#363636', fontSize: '24'},

    // showToolTip function (hover effects)
    // https://developers.google.com/chart/interactive/docs/gallery/treemap#tooltips
    showTooltips: true,
    generateTooltip: showFullTooltip
  };

  // Use placeholder Options if provided
  if (dataToDraw[1]) {options=dataToDraw[1]}
  else {  
    // If not using placeholder tree:s
    // Disable clicking to go further down in the 'tree'
  google.visualization.events.addListener(tree, 'select', function () {
    tree.setSelection([]);
  });}

  // Convert the data into a format usable by google visualization
  var data = google.visualization.arrayToDataTable(dataToDraw[0]);


  // draw the data with options
  tree.draw(data, options)

  }