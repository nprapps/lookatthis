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

    $.getJSON(APP_CONFIG.S3_BASE_URL+'/posts_index.json', function(data) {
        for (var i=0; i<data.length; i++) {
            var post=data[i];
            if (post.slug==slug){
                break;
            }
        }


    })

    // pymParent = new pym.Parent('post', 'http://localhost:8000/posts/test/', {});
    pymParent = new pym.Parent('post', 'http://localhost:8000/posts/' + slug + '/', {});
}

$(onDocumentLoad);