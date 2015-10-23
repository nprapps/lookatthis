var GRAPHICS = (function() {
    var COLORS = {
        'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
        'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
        'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
        'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
        'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
    };

    var classify = function(str) {
        return str.toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    var makeTranslate = function(x, y) {
        var transform = d3.transform();

        transform.translate[0] = x;
        transform.translate[1] = y;

        return transform.toString();
    }

    // Global config
    var MOBILE_THRESHOLD = 500;

    // Global vars
    var isMobile = false;
    var graphicData = null;

    // D3 formatters
    var fmtYearAbbrev = d3.time.format('%y');
    var fmtYearFull = d3.time.format('%Y');

    var loadGraphic = function(graphicID) {
        graphicData = GRAPHICS_CONFIG[graphicID]['data'];
        if (!GRAPHICS_CONFIG[graphicID]['formatted']) {
            GRAPHICS_CONFIG[graphicID].format();
            GRAPHICS_CONFIG[graphicID]['formatted'] = true;
        }
        GRAPHICS_CONFIG[graphicID].render(graphicID);

        $(window).resize(function() {
            GRAPHICS_CONFIG[graphicID].render(graphicID);
        });
    }

    var formatCumulative = function() {
        graphicData.forEach(function(d) {
            d['date'] = d3.time.format('%Y').parse(d['date']);

            for (var key in d) {
                if (key != 'date') {
                    d[key] = +d[key];
                }
            }
        });
    }

    var renderCumulative = function(graphicID) {
        var containerWidth = $(window).width() * 0.8;

        if (containerWidth <= MOBILE_THRESHOLD) {
            isMobile = true;
        } else {
            isMobile = false;
        }

        var container = '#graphic-' + graphicID;

        $(container).empty();
        // Render the chart!
        renderLineChart({
            container: '#graphic-' + graphicID,
            width: containerWidth,
            data: graphicData
        });
    }

    var renderLineChart = function(config) {
        /*
         * Setup
         */
        var dateColumn = 'date';
        var valueColumn = 'amt';

        var aspectWidth = isMobile ? 4 : 16;
        var aspectHeight = isMobile ? 3 : 9;

        var margins = {
            top: 5,
            right: 20,
            bottom: 20,
            left: 90
        };

        var ticksX = 10;
        var ticksY = 10;
        var roundTicksFactor = 5;

        // Mobile
        if (isMobile) {
            ticksX = 5;
            ticksY = 5;
            margins['right'] = 25;
        }

        // Calculate actual chart dimensions
        var chartWidth = config['width'] - margins['left'] - margins['right'];
        var chartHeight = Math.ceil((config['width'] * aspectHeight) / aspectWidth) - margins['top'] - margins['bottom'];

        // Clear existing graphic (for redraw)
        var containerElement = d3.select(config['container']);
        containerElement.html('');

        var formattedData = {};

        /*
         * Restructure tabular data for easier charting.
         */
        for (var column in graphicData[0]) {
            if (column == dateColumn) {
                continue;
            }

            formattedData[column] = graphicData.map(function(d) {
                return {
                    'date': d[dateColumn],
                    'amt': d[column]
                };
    // filter out empty data. uncomment this if you have inconsistent data.
    //        }).filter(function(d) {
    //            return d['amt'].length > 0;
            });
        }

        /*
         * Create D3 scale objects.
         */
        var xScale = d3.time.scale()
            .domain(d3.extent(config['data'], function(d) {
                return d[dateColumn];
            }))
            .range([ 0, chartWidth ])

        var yScale = d3.scale.linear()
            .domain([ 0, d3.max(d3.entries(formattedData), function(c) {
                    return d3.max(c['value'], function(v) {
                        var n = v[valueColumn];
                        return Math.ceil(n / roundTicksFactor) * roundTicksFactor;
                    });
                })
            ])
            .range([ chartHeight, 0 ]);

        var colorScale = d3.scale.ordinal()
            .domain(d3.keys(config['data'][0]).filter(function(key) {
                return key !== dateColumn;
            }))
            .range([ COLORS['blue5'], COLORS['yellow3'], COLORS['blue3'], COLORS['orange3'], COLORS['teal3'] ]);

        /*
         * Render the HTML legend.
         */
        var legend = containerElement.append('ul')
            .attr('class', 'key')
            .selectAll('g')
                .data(d3.entries(formattedData))
            .enter().append('li')
                .attr('class', function(d, i) {
                    return 'key-item key-' + i + ' ' + classify(d['key']);
                });

        legend.append('b')
            .style('background-color', function(d) {
                return colorScale(d['key']);
            });

        legend.append('label')
            .text(function(d) {
                return d['key'];
            });

        /*
         * Create the root SVG element.
         */
        var chartWrapper = containerElement.append('div')
            .attr('class', 'graphic-wrapper');

        var chartElement = chartWrapper.append('svg')
            .attr('width', chartWidth + margins['left'] + margins['right'])
            .attr('height', chartHeight + margins['top'] + margins['bottom'])
            .append('g')
            .attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

        /*
         * Create D3 axes.
         */
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(ticksX)
            .tickFormat(function(d, i) {
                if (isMobile) {
                    return '\u2019' + fmtYearAbbrev(d);
                } else {
                    return fmtYearFull(d);
                }
            });

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient('left')
            .ticks(ticksY)
            .tickFormat(function(d) {
                return d + ' sq. km'
            });

        /*
         * Render axes to chart.
         */
        chartElement.append('g')
            .attr('class', 'x axis')
            .attr('transform', makeTranslate(0, chartHeight))
            .call(xAxis);

        chartElement.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        /*
         * Render highlights/tips.
         */
         tips = [
        ];

        chartElement.append('defs')
        .append('marker')
            .attr('id', 'arrow')
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('refX', 2)
            .attr('refY', 2)
            .attr('orient', 'auto')
            // .attr('markerUnits', 'strokeWidth')
            .append('path')
                .attr('d', 'M0,0 L0,4 L4,2 z')
                .attr('fill', '#999')

        chartElement.append('g')
            .attr('class', 'arrows')
            .selectAll('text')
            .data(tips)
            .enter().append('line')
                .attr('x1', function(d) {
                    return xScale(d['labelX']);
                })
                .attr('y1', function(d) {
                    return yScale(d['labelY']);
                })
                .attr('x2', function(d) {
                    return xScale(d['targetX']);
                })
                .attr('y2', function(d) {
                    return yScale(d['targetY']);
                })
                .attr('marker-end', 'url(#arrow)');

        chartElement.append('g')
            .attr('class', 'highlights')
            .selectAll('text')
            .data(tips)
            .enter().append('text')
                .attr('x', function(d) {
                    return xScale(d['labelX']);
                })
                .attr('y', function(d) {
                    var y = yScale(d['labelY']) - (isMobile ? 6 : 8);

                    if (d['display'] == 'below') {
                        y += isMobile ? 10 : 25;
                    }

                    return y;
                })
                .text(function(d) {
                    return d['text'];
                })
                .attr('text-anchor', function(d) {
                    return d['anchor'];
                })

        /*
         * Render lines to chart.
         */
        var line = d3.svg.line()
            .interpolate('monotone')
            .x(function(d) {
                return xScale(d[dateColumn]);
            })
            .y(function(d) {
                return yScale(d[valueColumn]);
            });

        chartElement.append('g')
            .attr('class', 'lines')
            .selectAll('path')
            .data(d3.entries(formattedData))
            .enter()
            .append('path')
                .attr('class', function(d, i) {
                    return 'line line-' + i + ' ' + classify(d['key']);
                })
                .attr('stroke', function(d) {
                    return colorScale(d['key']);
                })
                .attr('d', function(d) {
                    return line(d['value']);
                });

        /* Add 'curtain' rectangle to hide entire graph */
          var curtain = chartElement.append('rect')
            .attr('x', -1 * chartWidth)
            .attr('y', -1 * chartHeight)
            .attr('height', chartHeight)
            .attr('width', chartWidth)
            .attr('class', 'curtain')
            .attr('transform', 'rotate(180)')
            .style('fill', '#000000')

        var guideline = chartElement.append('line')
            .attr('stroke', '#333')
            .attr('stroke-width', 0)
            .attr('class', 'guide')
            .attr('x1', 1)
            .attr('y1', 1)
            .attr('x2', 1)
            .attr('y2', chartHeight)

          /* Create a shared transition for anything we're animating */
          var t = chartElement.transition()
            .delay(750)
            .duration(3000)
            .ease('linear')
            .each('end', function() {
              d3.select('line.guide')
                .transition()
                .style('opacity', 0)
                .remove()
            });

          t.select('rect.curtain')
            .attr('width', 0);


        /*
         * Render grid to chart.
         */
        var xAxisGrid = function() {
            return xAxis;
        }

        var yAxisGrid = function() {
            return yAxis;
        }

        chartElement.append('g')
            .attr('class', 'x grid')
            .attr('transform', makeTranslate(0, chartHeight))
            .call(xAxisGrid()
                .tickSize(-chartHeight, 0, 0)
                .tickFormat('')
            );

        chartElement.append('g')
            .attr('class', 'y grid')
            .call(yAxisGrid()
                .tickSize(-chartWidth, 0, 0)
                .tickFormat('')
            );
    }

    var GRAPHICS_CONFIG = {
        'deforestation-annual': {
            'data': COPY['deforestation-annual'],
            'format': formatCumulative,
            'render': renderCumulative,
            'formatted': false
        },
        'deforestation-cumulative': {
            'data': COPY['deforestation-cumulative'],
            'format': formatCumulative,
            'render': renderCumulative,
            'formatted': false
        }
    }

    return {
        'loadGraphic': loadGraphic
    }
}());