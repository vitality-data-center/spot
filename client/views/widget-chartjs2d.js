var AmpersandView = require('ampersand-view');
var templates = require('../templates');
var Chart = require('chart.js');
var misval = require('../misval');

var MAX_BUBBLE_SIZE = 50;

// function destroyChart (view) {
//   // tear down existing stuff
//   if (view._chartjs) {
//     view._chartjs.destroy();
//     delete view._chartjs;
//   }
//
//   delete view._config;
// }

function normalizeGroupC (data) {
  var norm;
  var min = Number.MAX_VALUE;
  var max = -min;
  data.forEach(function (group) {
    var val = parseFloat(group.aa) || 0;
    if (val !== misval) {
      min = min <= val ? min : val;
      max = max >= val ? max : val;
    }
  });

  if (min < 0) {
    // bubble radius should always be positive,
    // so take abs, and normalize by largest of |min| and max
    min = Math.abs(min);
    max = max < min ? min : max;

    norm = function (v) {
      return Math.abs(v) / max;
    };
  } else if (max > 0 && min > 0) {
    // linear map v from [min, max] to [0,1]
    norm = function (v) {
      return (v - min) / max;
    };
  } else {
    norm = function (v) {
      return 1;
    };
  }
  return norm;
}

function initChart (view) {
  var filter = view.model.filter;
  var partition;

  // Configure plot
  view._config = view.model.chartjsConfig();
  var options = view._config.options;

  // configure x-axis
  partition = filter.partitions.get('1', 'rank');

  if (partition.isDatetime) {
    options.scales.xAxes[0].type = 'time';
  } else if (partition.isContinuous) {
    if (partition.groupLog) {
      options.scales.xAxes[0].type = 'logarithmic';
    } else {
      options.scales.xAxes[0].type = 'linear';
    }
  }

  // configure y-axis
  // NOTE: chartjs cannot do timescale on the y-axis..?
  partition = filter.partitions.get('2', 'rank');

  if (partition.isDatetime) {
    options.scales.yAxes[0].type = 'time';
  } else if (partition.isContinuous) {
    if (partition.groupLog) {
      options.scales.yAxes[0].type = 'logarithmic';
    } else {
      options.scales.yAxes[0].type = 'linear';
    }
  }

  // user interaction
  options.onClick = function (ev, elements) {
    if (!view.model.filter.isConfigured) {
      return;
    }

    var primary = filter.partitions.get('1', 'rank');
    var secondary = filter.partitions.get('2', 'rank');

    if (elements && elements[0]) {
      // get the clicked-on bubble
      var index = elements[0]._index;
      var point = view._config.data.datasets[0].data[index];

      // update selection on x-axis
      var groupx = primary.groups.models[point.i];
      primary.updateSelection(groupx);

      // update selection on y-axis
      var groupy = secondary.groups.models[point.j];
      secondary.updateSelection(groupy);
    } else {
      primary.updateSelection();
      secondary.updateSelection();
    }
    view.model.filter.updateDataFilter();
  };

  // force a square full size plot
  var size = view.el.offsetWidth;
  var ctx = view.queryByHook('chart-area').getContext('2d');
  ctx.canvas.width = size;
  ctx.canvas.height = size;

  // Create Chartjs object
  view._chartjs = new Chart(ctx, view._config);

  // In callbacks on the chart we will need the view, so store a reference
  view._chartjs._Ampersandview = view;
}

function updateBubbles (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var primary = filter.partitions.get('1', 'rank');
  var secondary = filter.partitions.get('2', 'rank');

  var xgroups = primary.groups;
  var ygroups = secondary.groups;

  // create lookup hashes
  var AtoI = {};
  var BtoJ = {};

  xgroups.forEach(function (xbin, i) {
    AtoI[xbin.value.toString()] = i;
  });
  ygroups.forEach(function (ybin, j) {
    BtoJ[ybin.value.toString()] = j;
  });

  // Define data structure for chartjs
  // Try to keep as much of the existing structure as possbile to prevent excessive animations
  chartData.datasets[0] = chartData.datasets[0] || {};
  chartData.datasets[0].data = chartData.datasets[0].data || [{}];

  var norm = normalizeGroupC(filter.data);

  // add data
  var d = 0;
  filter.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b)) {
      var val = parseInt(group.aa) || 0;
      if (val > 0) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];

        if (i === +i && j === +j) {
          chartData.datasets[0].data[d] = chartData.datasets[0].data[d] || {};
          chartData.datasets[0].data[d].x = xgroups.models[i].value;
          chartData.datasets[0].data[d].y = ygroups.models[j].value;

          // draw unselected bubbles with radius of 1
          if (xgroups.models[i].isSelected && ygroups.models[j].isSelected) {
            chartData.datasets[0].data[d].r = norm(val) * MAX_BUBBLE_SIZE;
          } else {
            chartData.datasets[0].data[d].r = 1;
          }

          // store group indexes for onClick callback
          chartData.datasets[0].data[d].i = i;
          chartData.datasets[0].data[d].j = j;
          d++;
        }
      }
    }
  });

  // highlight selected area
  if (primary.selected && primary.selected.length > 0) {
    chartData.datasets[1] = chartData.datasets[1] || {
      type: 'line',
      lineTension: 0
    };
    chartData.datasets[1].data = [
    { x: primary.selected[0], y: secondary.selected[0], r: 1 },
    { x: primary.selected[0], y: secondary.selected[1], r: 1 },
    { x: primary.selected[1], y: secondary.selected[1], r: 1 },
    { x: primary.selected[1], y: secondary.selected[0], r: 1 },
    { x: primary.selected[0], y: secondary.selected[0], r: 1 }
    ];
  } else {
    chartData.datasets.splice(1, 1);
  }

  // remove remaining (unused) points
  var cut = chartData.datasets[0].data.length - d;
  if (cut > 0) {
    chartData.datasets[0].data.splice(d, cut);
  }
}

module.exports = AmpersandView.extend({
  template: templates.includes.widgetcontent,
  renderContent: function () {
    var filter = this.model.filter;

    // redraw when the model indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // render data if available
    if (filter.isConfigured && filter.data) {
      this.update();
    }
  },

  update: function () {
    var filter = this.model.filter;

    if (filter.isConfigured && (!this._chartjs)) {
      initChart(this);
    }

    if (filter.isConfigured) {
      updateBubbles(this);
    }
    // Hand over to Chartjs for actual plotting
    this._chartjs.update();
  }
});
