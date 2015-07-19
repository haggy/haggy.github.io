var API = (function(d3) {
  
  return {
    intervalTime: 50,
    deltaX: 0.1,
    selector: null,
    statsSelector: null,
    // Graphs margins
    margin: null,
    // Height and width calculated from parent elem
    height: 0,
    width: 0,
    // SVG ref
    svg: null,
    // x/y refs
    x: null,
    y: null,
    // x/y axis refs
    xAxis: null,
    yAxis: null,
    // Various configs for stats
    statsConfig: {},
    // Holds current X value
    currX: 0,
    // Holds current graph data
    data: [{x: 0, y: 0}],
    // Holds the current line ID
    lineId: null,
    // Array of line colors to cycle through
    lineColorIdx: 0,
    lineColors: [
      '#4682B4',
      '#f42704',
      '#822db1'
    ],
    // Reference to the speed slider component
    speedSlider: null,

    initGraph: function(selector) {
      var self = this;
      this.selector = selector;

      // Set the dimensions of the canvas / graph
      this.margin = {top: 30, right: 20, bottom: 30, left: 50};
      this.width = $(selector).outerWidth() - this.margin.left - this.margin.right;
      this.height = $(selector).outerHeight() - this.margin.top - this.margin.bottom;
      
      // Adds the svg canvas
      this.svg = d3.select(this.selector)
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")");
      
      // Set the ranges
      this.x = d3.scale.linear().range([0, this.width]);
      this.y = d3.scale.linear().range([this.height, 0]);

      // Define the axes
      this.xAxis = d3.svg.axis().scale(this.x)
        .orient("bottom").ticks(10);

      this.yAxis = d3.svg.axis().scale(this.y)
        .orient("left").ticks(10);
      
      // Define the line
      this.valueline = d3.svg.line()
        .x(function(d) {
          return self.x(d.x);
        })
        .y(function(d) {
          return self.y(d.y);
        });
      
      // Add the valueline path.
      this.newValueLine();

      // Add the X Axis
      this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(self.xAxis);

      // Add the Y Axis
      this.svg.append("g")
        .attr("class", "y axis")
        .call(self.yAxis);
      
      /*d3.select(this.selector)
        .on("mousemove.drag", self.mousemove())
        .on("touchmove.drag", self.mousemove())
        .on("mouseup.drag",   self.mouseup())
        .on("touchend.drag",  self.mouseup());*/
      $(function() {
        self.buttons = {
          run: $('#run-btn'),
          stop: $('#stop-btn'),
          resume: $('#resume-btn'),
          clearLines: $('#clear-lines-btn')
        };
        
        self.alerts = {
          warning: $('.alert-warning')
        };
        
        self.buttons.run.click(self.saveSettings.bind(self));
        self.buttons.stop.click(self.stop.bind(self));
        self.buttons.resume.click(self.resume.bind(self));
        self.buttons.clearLines.click(self.clearLines.bind(self));
        self.buttons.run.fadeIn();
        
        $('#deltax-input').val(self.deltaX);
      });
    },

    initSlider: function() {
      this.speedSlider = $('#speed-slider')
        .slider()
        .on('slideStop', this.onSpeedSliderSelect.bind(this))
        .data('slider');
    },

    onSpeedSliderSelect: function() {
      this.intervalTime = this.speedSlider.getValue() * 10;
    },
    
    newValueLine: function() {
      this.lineId = 'line-' + Date.now();
      this.svg.append("path")
        .attr("id", this.lineId)
        .attr("class", "line")
        .style("stroke", this.getNextLineColor())
        .attr("d", this.valueline(this.data));  
    },
    
    getNextLineColor: function() {
      var color = this.lineColors[this.lineColorIdx];
      this.lineColorIdx = 
        this.lineColorIdx === (this.lineColors.length - 1) ?
        0 
        :
        this.lineColorIdx + 1;

      return color;
    },
    
    clearLines: function() {
      this.svg.selectAll('.line').remove();  
    },
    
    initStats: function(statsSelector) {
      this.statsSelector = statsSelector;
      var width = $(this.statsSelector).outerWidth();
      var height = $(this.statsSelector).outerHeight();
      this.statsConfig.startX = 0;
      this.statsConfig.startY = 0;
      this.statsConfig.deltaY = 20;
      
      this.statsSvg = d3.select(this.statsSelector)
        .append("svg")
        .attr("class", "stats-canvas")
        .attr("width", width + this.margin.left + this.margin.right)
        .attr("height", height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")");
    },
    
    addNewPointToStats: function(point) {
      this.statsConfig.startY += this.statsConfig.deltaY;
      
      this.statsSvg
        .append("g")
        .attr("class", "point-stat")
        .attr("transform", "translate(" + this.statsConfig.startX + "," + this.statsConfig.startY + ")")
        .append("text")
        .text("(" + point.x + ", " + point.y + ")");
    },
    
    updateData: function(data) {
      var self = this;
      var extentX = d3.extent(self.data, function(d) {
        return d.x;
      });
      var extentY = d3.extent(self.data, function(d) {
        return d.y;
      });

      // Scale the range of the data
      var gapX = (extentX[1] - extentX[0]);
      var gapY = (extentY[1] - extentY[0]);
    console.log("Current ext: "); console.log(extentX); console.log(extentY);
      
      this.x.domain([extentX[0], extentX[1] + gapX]);
      
      var minY = extentY[0] - gapY;
      var maxY = extentY[1] + gapY;
      this.y.domain([minY, maxY]);

      // Select the section we want to apply our changes to
      var svg = d3.select(this.selector);

      // Make the changes
      svg.select("#" + self.lineId) // change the line
        .attr("d", self.valueline(self.data));
      svg.select(".x.axis") // change the x axis
        .call(self.xAxis);
      svg.select(".y.axis") // change the y axis
        .call(self.yAxis);
    },
    
    saveSettings: function() {
      var funcString = $('#function-input').val();
      if(funcString) {
        this.funcString = funcString;
      }
      
      this.deltaX = parseFloat($('#deltax-input').val());
      if(isNaN(this.deltaX)) {
        this.deltaX = 1;
        $('#deltax-input').val(this.deltaX);
      }
      
      this.data = [{x: 0, y: 0}];
      this.run();
    },
    
    clearLinesBeforeRun: function() {
      return $('#clear-lines-input').is(':checked');  
    },
    
    run: function() {
      if(this.clearLinesBeforeRun()) {
        this.clearLines();
      }
      
      this.newValueLine();
      this.clearMessages();
      this.stop();
      this.reset();
      this.interval = setInterval(this.loop.bind(this), this.intervalTime);
      this.buttons.run.hide();
      this.buttons.resume.hide();
      this.buttons.clearLines.hide();
      this.buttons.stop.fadeIn();
    },
    
    reset: function() {
      this.data = [];
      this.currX = 0;
    },
    
    resetUI: function() {
      this.buttons.stop.hide();
      this.buttons.resume.hide();
      this.buttons.run.fadeIn();
    },
    
    loop: function() {
      var self = this;

      var func = function(x) {
        return math.eval(self.funcString, {x: x})
      };
      
      self.currX += self.deltaX;
      try {
        var nextPoint = {
          x: self.currX,
          y: func(self.currX)
        };
      } catch(e) {
        self.stop();
        self.warning("Invalid function: " + e.message);
        self.resetUI();
        return;
      }

      if(!isFinite(nextPoint.y)) {
        self.data = [];
        self.newValueLine();
        return;
      }

      if(self.data.length === 40) {
        self.data.shift();
      }

      self.data.push(nextPoint);
      self.updateData(self.data);
    },
    
    stop: function() {
      clearInterval(this.interval);
      this.buttons.stop.hide();
      this.buttons.run.fadeIn();
      this.buttons.resume.fadeIn();
      this.buttons.clearLines.fadeIn();
    },
    
    resume: function() {
      this.interval = setInterval(this.loop.bind(this), this.intervalTime);
      this.buttons.run.hide();
      this.buttons.resume.hide();
      this.buttons.stop.fadeIn();
    },
    
    warning: function(msg) {
      this.alerts.warning.html(msg).fadeIn();
    },
    
    clearMessages: function() {
      for(alertType in this.alerts) {
        if(!this.alerts.hasOwnProperty(alertType)) {
          continue;
        }
        this.alerts[alertType]
          .hide()
          .html('');
      }
    }
    
  };
})(d3);

API.initGraph('#graph-canvas');

