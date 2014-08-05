var $window = null;
var $document = null;
var $iframe = null;
var $post = null;
var $menu = null;

var MESSAGE_DELIMITER = ';';

if (!window.slug) {
    var slug = document.location.href.split('/')[5];
}
/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $window = $(window);
    $document = $(document);

    $iframe = $('<iframe/>');
    $post = $('#post');
    $menu = $('.post-fixed-menu');

    $iframe.attr('src', APP_CONFIG.S3_BASE_URL + '/posts/' + slug)

    // Set some attributes to this proto-iframe.
    $iframe.attr('width', $window.width());
    $iframe.attr('height', $window.height());
    $iframe.attr('scrolling', 'no');
    $iframe.attr('marginheight', '0');
    $iframe.attr('frameborder', '0');

    // Append the iframe to our element.
    $post.append($iframe);

    // focus on the iframe so that keyboard nav works
    $iframe.focus();

    window.addEventListener('message', onReceiveMessage, false);
    $window.on('resize', onWindowResize);
}

var onWindowResize = function(){
    $iframe.attr('width', $window.width());
    $iframe.attr('height', $window.height());
}


var onTrackEventMessage = function(args) {
    args.splice(0, 0, '_trackEvent');

    _gaq.push(args);
}

var messageHandlers = {
    'trackEvent': onTrackEventMessage
}

var onReceiveMessage = function(e) {
    var bits = e.data.split(MESSAGE_DELIMITER);

    var signature = bits[0];

    if (signature != 'lookatthis') {
        return;
    }

    var event = bits[1];
    var args = bits.slice(2);

    messageHandlers[event](args);
}

$(onDocumentLoad);
