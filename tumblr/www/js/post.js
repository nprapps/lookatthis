var $window = null;
var $document = null;
var $iframe = null;
var $post = null;
var $menu = null;

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
    $iframe.attr('width', '100%');
    $iframe.attr('height', '100%');
    $iframe.attr('scrolling', 'no');
    $iframe.attr('marginheight', '0');
    $iframe.attr('frameborder', '0');

    // Append the iframe to our element.
    $post.append($iframe);

    window.addEventListener('message', receiveMessage, false);
}

var receiveMessage = function(e) {
    if (e.data == 'handshake') {
        getIndex();
    }
}

var getIndex = function() {

        // $.ajax({
        //     url: APP_CONFIG.S3_BASE_URL + '/posts_index.json',
        //     async: true,
        //     dataType: 'jsonp',
        //     jsonp: false,
        //     jsonpCallback:'dataHandler',
        //     success:function(data) {
        //         var next_post = null;
        //         var post_index = null;
        //         for (var i = 0; i < data.length; i++) {
        //             var post = data[i];
        //             if (post.slug == slug) {
        //                 post_index = i;
        //                 break;
        //             }
        //         }

        //         var post_data = {};

        //         if (post_index !== null && post_index !== 0) {
        //             post_data = data[post_index - 1];
        //         }

        //         $iframe[0].contentWindow.postMessage('post-' + JSON.stringify(post_data), APP_CONFIG.S3_BASE_URL);

        //     }
        // });

};

$(onDocumentLoad);