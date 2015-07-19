var API = (function(d3) {
  
  return {
    intervalTime: 200,
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
        $('#run-btn').click(self.saveSettings.bind(self));
        $('#stop-btn').click(self.stop.bind(self));
        $('#resume-btn').click(self.resume.bind(self));
      });
    },
    
    newValueLine: function() {
      this.lineId = 'line-' + Date.now();
      this.svg.append("path")
        .attr("id", this.lineId)
        .attr("class", "line")
        .attr("d", this.valueline(this.data));  
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
      
      //this.x = d3.scale.linear().domain(extentX);
      //this.y = d3.scale.linear().range(extentY);

      // Scale the range of the data
      var headingX = (extentX[1] - extentX[0]);
      var headingY = (extentY[1] - extentY[0]);
    console.log("Current ext: "); console.log(extentX); console.log(extentY);
      
      this.x.domain([extentX[0], extentX[1] + headingX]);
      this.y.domain(extentY);

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
      
      this.data = [{x: 0, y: 0}];
      this.run();
    },
    
    run: function() {
      this.stop();
      this.reset();
      this.interval = setInterval(this.loop.bind(this), this.intervalTime);
    },
    
    reset: function() {
      this.data = [];
      this.currX = 0;
    },
    
    loop: function() {
      var self = this;
      var func = function(x) {
        return math.eval(self.funcString, {x: x})
      };
      
      var nextPoint = {
        x: ++self.currX,
        y: func(self.currX)
      };

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
    },
    
    resume: function() {
      this.interval = setInterval(this.loop.bind(this), this.intervalTime);
    }
    
  };
})(d3);

API.initGraph('#graph-canvas');

