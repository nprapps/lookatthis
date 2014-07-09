var $window = null;
var $document = null;

if (!window.slug) {
    var slug = document.location.href.split('/')[5];
}
var pymParent = null;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $window = $(window);
    $document = $(document);

    pymParent = new pym.Parent('post', 'http://localhost:8000/posts/' + slug + '/', {});

    pymParent.on('handshake', getIndex);
}

var getIndex = function() {
    $.getJSON(APP_CONFIG.S3_BASE_URL + '/posts_index.json', function(data) {
        console.log(data);
        var next_post = null;
        var post_index = null;
        for (var i = 0; i < data.length; i++) {
            var post = data[i];
            if (post.slug == slug) {
                post_index = i;
                break;
            }
        }

        var post_data = {
            next_post: null
        }

        if (post_index !== null && post_index !== data.length - 1) {
            post_data['next_post'] = data[post_index + 1];
        }

        pymParent.sendMessageToChild('post', JSON.stringify(post_data));

    });
};

$(onDocumentLoad);