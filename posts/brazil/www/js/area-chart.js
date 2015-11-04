var formatAreaChart = function(graphicID) {
        graphicData.forEach(function(d) {
            if (typeof(d['date']) !== 'object') {
                d['date'] = d3.time.format('%Y').parse(d['date']);
            }

            for (var key in d) {
                if (key != 'date') {
                    d[key] = +d[key];
                }
            }
        });
    }

    var renderArea = function(graphicID) {
        var containerWidth = $(window).width() * 0.7;
        if (containerWidth <= MOBILE_THRESHOLD) {
            isMobile = true;
        } else {
            isMobile = false;
        }

        var container = '#graphic-' + graphicID;

        $(container).empty();
        // Render the chart!
        renderAreaChart({
            container: '#graphic-' + graphicID,
            width: containerWidth,
            data: graphicData,
            config: GRAPHICS_CONFIG[graphicID]
        });
    }


    var renderAreaChart = function(config) {
        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            chartWidth = 960 - margin.left - margin.right,
            chartHeight = 500 - margin.top - margin.bottom;

        var formatPercent = d3.format(".0%");

        var x = d3.time.scale()
            .range([0, chartWidth]);

        var y = d3.scale.linear()
            .range([chartHeight, 0]);

        var color = d3.scale.ordinal()
            .domain(d3.keys(config['data'][0]).filter(function(key) {
                return key !== 'date';
            }))
            .range([ '#ffcc33', COLORS['blue5'], COLORS['blue3'], COLORS['orange3'], COLORS['teal3'] ]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(formatPercent);

        var area = d3.svg.area()
            .x(function(d) { return x(d.date); })
            .y0(function(d) { return y(d.y0); })
            .y1(function(d) { return y(d.y0 + d.y); });

        var containerElement = d3.select(config['container']);
        containerElement.html('');

        var chartWrapper = containerElement.append('div')
            .attr('class', 'graphic-wrapper');

        var chartElement = chartWrapper.append('svg')
            .attr('width', chartWidth + margin['left'] + margin['right'])
            .attr('height', chartHeight + margin['top'] + margin['bottom'])
            .append('g')
            .attr('transform', 'translate(' + margin['left'] + ',' + margin['top'] + ')');


        var stack = d3.layout.stack()
            .values(function(d) { return d.values; });

        var stacked = stack(color.domain().map(function(name) {
            return {
                name: name,
                values: graphicData.map(function(d) {
                    return {date: d.date, y: d[name]};
                })
            };
        }));

        x.domain(d3.extent(graphicData, function(d) { return d.date; }));

        var deforestation = chartElement.selectAll(".deforestation")
            .data(stacked)
            .enter().append("g")
                .attr("class", "deforestation");

        deforestation.append("path")
            .attr("class", "area")
            .attr("d", function(d) { return area(d.values); })
            .style("fill", function(d) { return color(d.name); });

        deforestation.append("text")
            .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.y0 + d.value.y / 2) + ")"; })
            .attr("x", -6)
            .attr("dy", ".35em")
            .text(function(d) { return d.name; });

        chartElement.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(xAxis);

        chartElement.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    }
