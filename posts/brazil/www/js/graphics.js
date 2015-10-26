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
    var commaFormatter = d3.format(',');

    var loadGraphic = function(graphicID) {
        graphicData = GRAPHICS_CONFIG[graphicID]['data'];
        if (!GRAPHICS_CONFIG[graphicID]['formatted']) {
            GRAPHICS_CONFIG[graphicID].format(graphicID);
            GRAPHICS_CONFIG[graphicID]['formatted'] = true;
        }

        if (!GRAPHICS_CONFIG[graphicID]['skipRender']) {
            GRAPHICS_CONFIG[graphicID].render(graphicID);
        }

        $(window).resize(function() {
            GRAPHICS_CONFIG[graphicID].render(graphicID);
        });
    }

    var formatLineChart = function(graphicID) {
        graphicData.forEach(function(d) {
            d['date'] = d3.time.format('%Y').parse(d['date']);

            for (var key in d) {
                if (key != 'date') {
                    d[key] = +d[key];
                }
            }
        });
    }

    var renderLine = function(graphicID) {
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
            data: graphicData,
            config: GRAPHICS_CONFIG[graphicID]
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
            left: 100
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
                return commaFormatter(d) + config.config.unit
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

    /*
     * MAP MAP MAP
     */

    var EARTH_RADIUS = 6371000;

    /*
     * Convert degreest to radians.
     */
    var degToRad = function(degrees) {
        return degrees * Math.PI / 180;
    }

    /*
     * Convert radians to degrees.
     */
    var radToDeg = function(radians) {
        return radians * 180 / Math.PI;
    }

    /*
     * Convert kilometers to miles.
     */
    var kmToMiles = function(km) {
        return km * 0.621371;
    }

    /*
     * Convert miles to kilometers.
     */
    var milesToKm = function(miles) {
        return miles * 1.60934;
    }

    /*
     * Calculate the distance between two points.
     */
    var distance = function(a, b) {
         var lat1Rad = degToRad(a[1]), lng1Rad = degToRad(a[0]);
         var lat2Rad = degToRad(b[1]), lng2Rad = degToRad(b[0]);
         var latDelta = lat2Rad - lat1Rad;
         var lngDelta = lng2Rad - lng1Rad;

         var a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
                 Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                 Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
         var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
         var d = EARTH_RADIUS * c;

         return kmToMiles(d / 1000);
     };

    /*
     * Calculate an end point given a starting point, bearing and distance.
     * Adapted from http://www.movable-type.co.uk/scripts/latlong.html
     */
    var calculateDestinationPoint = function(lat, lon, distance, bearing) {
        var distanceFraction = distance / EARTH_RADIUS;
        var bearingRad = degToRad(bearing);

        var lat1Rad = degToRad(lat);
        var lng1Rad = degToRad(lon);

        var lat2Rad = Math.asin(
            Math.sin(lat1Rad) * Math.cos(distanceFraction) +
            Math.cos(lat1Rad) * Math.sin(distanceFraction) * Math.cos(bearingRad)
        );

        var lng2Rad = lng1Rad + Math.atan2(
            Math.sin(bearingRad) * Math.sin(distanceFraction) * Math.cos(lat1Rad),
            Math.cos(distanceFraction) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
        );

        lng2Rad = (lng2Rad + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180°

        return [radToDeg(lng2Rad), radToDeg(lat2Rad)];
    };

    /*
     * Calculate a scale bar, as follows:
     * - Select a starting pixel coordinate
     * - Convert coordinate to map space
     * - Calculate a fixed distance end coordinate *east* of the start coordinate
     * - Convert end coordinate back to pixel space
     * - Calculate geometric distance between start and end pixel coordinates.
     * - Set end coordinate's x value to start coordinate + distance. Y coords hold constant.
     */
    var calculateScaleBarEndPoint = function(projection, start, miles) {
        var startGeo = projection.invert(start);

        var meters = milesToKm(miles) * 1000;

        var endGeo = calculateDestinationPoint(startGeo[1], startGeo[0], meters, 90);
        var end = projection([endGeo[0], endGeo[1]])

        var distance = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));

        return [start[0] + distance, start[1]];
    }

    /*
     * Calculate an optimal scale bar length by taking a fraction of the distance
     * covered by the map.
     */
    var calculateOptimalScaleBarDistance = function(bbox, divisor) {
        var mapDistance = distance([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
        var fraction = mapDistance / divisor;
        var factor = Math.pow(10, Math.floor(Math.log10(fraction)));

        return scaleLength = Math.round(fraction / factor) * factor;
    }

    var LABEL_DEFAULTS = {
        'text-anchor': 'start',
        'dx': '6',
        'dy': '4'
    }

    var CITY_LABEL_ADJUSTMENTS = {
    }

    var COUNTRY_LABEL_ADJUSTMENTS = {
        'Brazil': { 'dx': 10, 'dy': 10 }
    }

    var geoData = null;

    var formatMapData = function(graphicID) {
        console.log(graphicData)
        d3.json(graphicData, function(error, data) {
            geoData = data;
            renderMap(graphicID);
        });
    }

    var renderMap = function(graphicID) {
        var containerWidth = $(window).width() * 0.8;

        if (containerWidth <= MOBILE_THRESHOLD) {
            isMobile = true;
        } else {
            isMobile = false;
        }

        var container = '#graphic-' + graphicID;
        $(container).empty();

        console.log(container);
        // Render the chart!
        renderLocatorMap({
            container: container,
            width: containerWidth,
            data: geoData,
            primaryCountry: 'Brazil'
        });
    }

    var renderLocatorMap = function(config) {
        /*
         * Setup
         */
        var aspectWidth = 1;
        var aspectHeight = 0.5;

        var bbox = config['data']['bbox'];
        var defaultScale = 480;
        var cityDotRadius = 3;

        // Calculate actual map dimensions
        var mapWidth = config['width'];
        var mapHeight = Math.ceil((config['width'] * aspectHeight) / aspectWidth);

        // Clear existing graphic (for redraw)
        var containerElement = d3.select(config['container']);
        containerElement.html('');

        var mapProjection = null;
        var path = null;
        var chartWrapper = null;
        var chartElement = null;

        /*
         * Extract topo data.
         */
        var mapData = {};

        for (var key in config['data']['objects']) {
            mapData[key] = topojson.feature(config['data'], config['data']['objects'][key]);
        }

        /*
         * Create the map projection.
         */
        var centroid = [((bbox[0] + bbox[2]) / 2), ((bbox[1] + bbox[3]) / 2)];
        var mapScale = (mapWidth / config.width) * defaultScale;
        var scaleFactor = mapWidth / config.width;

        projection = d3.geo.mercator()
            .center(centroid)
            .scale(mapScale)
            .translate([ mapWidth/2, mapHeight/2 ]);

        path = d3.geo.path()
            .projection(projection)
            .pointRadius(cityDotRadius * scaleFactor);

        /*
         * Create the root SVG element.
         */
        chartWrapper = containerElement.append('div')
            .attr('class', 'graphic-wrapper');

        chartElement = chartWrapper.append('svg')
            .attr('width', mapWidth)
            .attr('height', mapHeight)
            .append('g')

        /*
         * Create SVG filters.
         */
        var filters = chartElement.append('filters');

        var textFilter = filters.append('filter')
            .attr('id', 'textshadow');

        textFilter.append('feGaussianBlur')
            .attr('in', 'SourceGraphic')
            .attr('result', 'blurOut')
            .attr('stdDeviation', '.25');

        var landFilter = filters.append('filter')
            .attr('id', 'landshadow');

        landFilter.append('feGaussianBlur')
            .attr('in', 'SourceGraphic')
            .attr('result', 'blurOut')
            .attr('stdDeviation', '10');


        /*
         * Render countries.
         */
        // Land shadow
        chartElement.append('path')
            .attr('class', 'landmass')
            .datum(mapData['countries'])
            .attr('filter', 'url(#landshadow)')
            .attr('d', path);

        /*
         * Render amazon.
         */
        chartElement.append('g')
            .attr('class', 'amazon')
            .selectAll('path')
                .data(mapData['amazon']['features'])
            .enter().append('path')
                .attr('d', path);


        chartElement.append('g')
            .attr('class', 'states')
            .selectAll('path')
                .data(mapData['states']['features'])
            .enter().append('path')
                .attr('d', path)
                .attr('class', function(d) {
                    var c = 'state';
                    c += ' ' + classify(d['properties']['name']);
                    return c;
                });

        // Land outlines
        chartElement.append('g')
            .attr('class', 'countries')
            .selectAll('path')
                .data(mapData['countries']['features'])
            .enter().append('path')
                .attr('class', function(d) {
                    return classify(d['id']);
                })
                .attr('d', path);


        // Highlight primary country
        var primaryCountryClass = classify(config['primaryCountry']);

        d3.select('.countries path.' + primaryCountryClass)
            .moveToFront()
            .classed('primary ' + primaryCountryClass, true);

        /*
         * Render rivers.
         */
        chartElement.append('g')
            .attr('class', 'rivers')
            .selectAll('path')
                .data(mapData['rivers']['features'])
            .enter().append('path')
                .attr('d', path);

        /*
         * Render primary cities.
         */
        chartElement.append('g')
            .attr('class', 'cities primary')
            .selectAll('path')
                .data(mapData['cities']['features'])
            .enter().append('path')
                .attr('d', path)
                .attr('class', function(d) {
                    var c = 'place';

                    c += ' ' + classify(d['properties']['city']);
                    c += ' ' + classify(d['properties']['featurecla']);
                    c += ' scalerank-' + d['properties']['scalerank'];

                    return c;
                });

        /*
         * Apply adjustments to label positioning.
         */
        var positionLabel = function(adjustments, id, attribute) {
            if (adjustments[id]) {
                if (adjustments[id][attribute]) {
                    return adjustments[id][attribute];
                } else {
                    return LABEL_DEFAULTS[attribute];
                }
            } else {
                return LABEL_DEFAULTS[attribute];
            }
        }

        /*
         * Render country labels.
         */
        chartElement.append('g')
            .attr('class', 'country-labels')
            .selectAll('.label')
                .data(mapData['countries']['features'])
            .enter().append('text')
                .attr('class', function(d) {
                    return 'label ' + classify(d['id']);
                })
                .attr('transform', function(d) {
                    return 'translate(' + path.centroid(d) + ')';
                })
                .attr('text-anchor', function(d) {
                    return positionLabel(COUNTRY_LABEL_ADJUSTMENTS, d['id'], 'text-anchor');
                })
                .attr('dx', function(d) {
                    return positionLabel(COUNTRY_LABEL_ADJUSTMENTS, d['id'], 'dx');
                })
                .attr('dy', function(d) {
                    return positionLabel(COUNTRY_LABEL_ADJUSTMENTS, d['id'], 'dy');
                })
                .text(function(d) {
                    return d['properties']['country'];
                });

        // Highlight primary country
        var primaryCountryClass = classify(config['primaryCountry']);

        d3.select('.country-labels text.' + primaryCountryClass)
            .classed('label primary ' + primaryCountryClass, true);

        /*
         * Render city labels.
         */
        var layers = [
            'city-labels shadow',
            'city-labels',
            'city-labels shadow primary',
            'city-labels primary'
        ];

        layers.forEach(function(layer) {
            var data = [];

            if (layer == 'city-labels shadow' || layer == 'city-labels') {
                // data = mapData['neighbors']['features'];
            } else {
                data = mapData['cities']['features'];
            }

            chartElement.append('g')
                .attr('class', layer)
                .selectAll('.label')
                    .data(data)
                .enter().append('text')
                    .attr('class', function(d) {
                        var c = 'label';

                        c += ' ' + classify(d['properties']['city']);
                        c += ' ' + classify(d['properties']['featurecla']);
                        c += ' scalerank-' + d['properties']['scalerank'];

                        return c;
                    })
                    .attr('transform', function(d) {
                        return 'translate(' + projection(d['geometry']['coordinates']) + ')';
                    })
                    .attr('style', function(d) {
                        return 'text-anchor: ' + positionLabel(CITY_LABEL_ADJUSTMENTS, d['properties']['city'], 'text-anchor');
                    })
                    .attr('dx', function(d) {
                        return positionLabel(CITY_LABEL_ADJUSTMENTS, d['properties']['city'], 'dx');
                    })
                    .attr('dy', function(d) {
                        return positionLabel(CITY_LABEL_ADJUSTMENTS, d['properties']['city'], 'dy');
                    })
                    .text(function(d) {
                        return d['properties']['city'];
                    });
        });

        d3.selectAll('.shadow')
            .attr('filter', 'url(#textshadow)');

        var legend = containerElement.append('ul')
            .attr('class', 'key')

        legend.append('b')
            .style('background-color', '#EAAA61');

        legend.append('label')
            .text('Amazon Basin');

        /*
         * Render a scale bar.
         */
        var scaleBarDistance = calculateOptimalScaleBarDistance(bbox, 10);
        var scaleBarStart = [10, mapHeight - 20];
        var scaleBarEnd = calculateScaleBarEndPoint(projection, scaleBarStart, scaleBarDistance);

        chartElement.append('g')
            .attr('class', 'scale-bar')
            .append('line')
            .attr('x1', scaleBarStart[0])
            .attr('y1', scaleBarStart[1])
            .attr('x2', scaleBarEnd[0])
            .attr('y2', scaleBarEnd[1]);

        d3.select('.scale-bar')
            .append('text')
            .attr('x', scaleBarEnd[0] + 5)
            .attr('y', scaleBarEnd[1] + 3)
            .text(scaleBarDistance + ' miles');
    }

    /*
     * Move a set of D3 elements to the front of the canvas.
     */
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };


    var GRAPHICS_CONFIG = {
        'deforestation-annual': {
            'data': COPY['deforestation-annual'],
            'format': formatLineChart,
            'render': renderLine,
            'formatted': false,
            'unit': ' sq. km'
        },
        'deforestation-cumulative': {
            'data': COPY['deforestation-cumulative'],
            'format': formatLineChart,
            'render': renderLine,
            'formatted': false,
            'unit': ' sq. km'
        },
        'gdp': {
            'data': COPY['gdp'],
            'format': formatLineChart,
            'render': renderLine,
            'formatted': false,
            'unit': '%'
        },
        'locator-map': {
            'data': 'data/geodata.json',
            'format': formatMapData,
            'render': renderMap,
            'formatted': false,
            'skipRender': true
        }
    }

    return {
        'loadGraphic': loadGraphic
    }
}());