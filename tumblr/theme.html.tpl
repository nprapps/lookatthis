<!DOCTYPE html>
<html class="no-js">
    <head>
        <title>{Title}{block:SearchPage} ({lang:Search results for SearchQuery}){/block:SearchPage}{block:PermalinkPage}{block:PostSummary}  {PostSummary}{/block:PostSummary}{/block:PermalinkPage} : NPR</title>

        <meta charset="utf-8">
        <meta name="description" content="{block:IndexPage}{block:Description}{MetaDescription}{/block:Description}{/block:IndexPage}{block:PermalinkPage}{block:PostSummary}{PostSummary}{/block:PostSummary}{/block:PermalinkPage}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />

        <link rel="shortcut icon" href="http://www.npr.org/favicon.ico" />
        <link rel="alternate" type="application/rss+xml" title="RSS" href="{RSS}"/>

        <!-- Font loader -->
        <script src="//ajax.googleapis.com/ajax/libs/webfont/1.4.10/webfont.js"></script>
        <script>
            WebFont.load({
                 custom: {
                     families: [
                         'Gotham SSm:n4,n7'
                     ],
                     urls: [
                         'http://s.npr.org/templates/css/fonts/GothamSSm.css'
                     ]
                 },
                 timeout: 10000
             });
        </script>

        <script src="http://localhost:8000/js/lib/modernizr.js"></script>

        <!-- Project CSS -->
        <link rel="stylesheet" type="text/css" href="http://localhost:8000/less/app.less">

        <!-- GOOGLE ANALYTICS -->
        <!-- <script>
             (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
             (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
             m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
             })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

             ga('create', 'UA-5828686-63', 'tumblr.com');
             ga('send', 'pageview');
         </script> -->

        <meta name="twitter:card" content="summary">
        <meta property="og:title" content="{Title}" />
        <meta property="og:url" content="{{ copy.og_url }}" />
        <meta property="og:type" content="article" />
        <meta property="og:description" content="{{ copy.og_description }}" />
        <meta property="og:image" content="{{ S3_BASE_URL }}/img/{{ slug }}/og_image.png" />
        <meta property="og:site_name" content="NPR.org" />
        <meta property="fb:app_id" content="138837436154588" />

    </head>


    <!-- Index template -->
    {block:IndexPage}
    <body class="index-page">
        <div id="content" class="container">
            <div class="row">
                <header>
                    <h2 class="npr"><a href="http://npr.org"><img src="http://media.npr.org/chrome/news/nprlogo_138x46.gif" alt="NPR" /></a></h2>
                    <h1><a href="/">Look At This</a></h1>
                </header>

                <section class="posts-wrapper">

                    {block:TagPage}<h2 class="tag-header">{Tag}</h2>{/block:TagPage}

                    <div id="posts" class="posts">
                        <!-- START POSTS -->
                        {block:Posts}
                        <article class="post">

                            <h4 class="pubdate"><a href="{Permalink}" class="permalink">{block:Date}{Month} {DayOfMonth}, {Year}{/block:Date}</a></h4>

                            <div class="row">
                            {block:Text}
                                <a href="{Permalink}" class="permalink">
                                <h3>{Title}</h3>
                                </a>
                                <div class="text-wrapper">
                                    {Body}
                                </div>
                            {/block:Text}
                            {block:Photo}
                                    {LinkOpenTag}<img src="{PhotoURL-HighRes}" class="img-responsive" alt="{PhotoAlt}"/>{LinkCloseTag}
                                    {block:Caption}<div class="caption">{Caption}</div>{/block:Caption}
                            {/block:Photo}

                                <div class="post-meta">

                                    <p class="note-count"><a href="{Permalink}" class="permalink"><i class="icon icon-comment"></i> {NoteCountWithLabel}</a></p>
                                </div>
                            </div> <!-- end .row -->

                            {block:PostNotes}
                                <div class="post-notes">
                                    <h3>Notes</h3>
                                    {PostNotes}
                                </div>
                            {/block:PostNotes}
                        </article>
                        {/block:Posts}
                        <!-- END POSTS -->
                    </div>
                </section> <!-- #post-wrap -->

                <footer>
                    {block:Pagination}
                        <nav class="pagination">
                            <section class="buttons">
                                {block:PreviousPage}<a href="{PreviousPage}" class="left">{lang:Previous page}<span class="arrow"></span></a>{/block:PreviousPage}
                                {block:NextPage}<a href="{NextPage}" class="right">{lang:Next page}<span class="arrow"></span></a>{block:NextPage}
                            </section>
                            <section class="disabled buttons">
                                <li class="left"><span class="arrow"></span></li>
                                <li class="right"><span class="arrow"></span></li>
                            </section>
                            <section class="count">Page  {CurrentPage} / {TotalPages}</section>
                        </nav>
                    {/block:Pagination}
                </footer>
            </div>
        </div> <!-- #container -->


        <script src="http://localhost:8000/js/lib/jquery.js"></script>
        <script src="http://localhost:8000/js/lib/pym.js"></script>
        <script src="http://localhost:8000/js/app.js"></script>


        <script type="text/javascript">
            var Tumblelog = {};

            // AJAX
            Tumblelog.Ajax = (function(url, callbackFunction) {
                this.bindFunction = function (caller, object) {
                    return function() {
                        return caller.apply(object, [object]);
                    };
                };

                this.stateChange = function (object) {
                    if (this.request.readyState==4) {
                        this.callbackFunction(this.request.responseText);
                    }
                };

                this.getRequest = function() {
                    if (window.ActiveXObject)
                        return new ActiveXObject('Microsoft.XMLHTTP');
                    else if (window.XMLHttpRequest)
                        return new XMLHttpRequest();
                    return false;
                };

                this.postBody = (arguments[2] || "");
                this.callbackFunction=callbackFunction;
                this.url=url;
                this.request = this.getRequest();

                if(this.request) {
                    var req = this.request;
                    req.onreadystatechange = this.bindFunction(this.stateChange, this);

                    if (this.postBody!=="") {
                        req.open("POST", url, true);
                        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                        req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                        req.setRequestHeader('Connection', 'close');
                    } else {
                        req.open("GET", url, true);
                    }

                    req.send(this.postBody);
                }
            });

            // Infinite Scroll
            Tumblelog.Infinite = (function() {

                var _$window          = $(window);
                var _$posts           = $('#posts');
                var _trigger_post     = null;

                var _current_page     = {CurrentPage};
                var _total_pages      = {TotalPages};
                var _url              = document.location.href;
                var _infinite_timeout = null;
                var _is_loading       = false;
                var _posts_loaded     = false;

                var _Ajax = Tumblelog.Ajax;

                function init() {
                    set_trigger();
                    enable_scroll();
                }

                function set_trigger () {
                    var $all_posts = _$posts.find('article.post');

                    if (!_posts_loaded) {
                        _posts_loaded = $all_posts.length;
                    }

                    if (_posts_loaded >= 4) {
                        _trigger_post = _$posts.find('article.post:eq(' + ($all_posts.length - 4) + ')').get(0);
                    } else if (_posts_loaded >= 3) {
                        _trigger_post = _$posts.find('article.post:eq(' + ($all_posts.length - 3) + ')').get(0);
                    } else {
                        _trigger_post = _$posts.find('article.post:last').get(0);
                    }

                };

                function in_viewport (el) {
                    if (el == null) return;
                    var top = el.offsetTop;
                    var height = el.offsetHeight;

                    while (el.offsetParent) {
                        el = el.offsetParent;
                        top += el.offsetTop;
                    }

                    return (top < (window.pageYOffset + window.innerHeight));
                };

                function enable_scroll() {
                    $('#footer .pagination').hide();
                    _$window.scroll(function(){
                        clearTimeout(_infinite_timeout);
                        infinite_timeout = setTimeout(infinite_scroll, 100);
                    });
                }

                function disable_scroll() {
                    clearTimeout(_infinite_timeout);
                    $(window).unbind('scroll');
                }

                function infinite_scroll() {
                    if (_is_loading) return;

                    if (in_viewport(_trigger_post)) {
                        load_more_posts(); // w00t
                    }
                };

                function load_more_posts() {
                    if (_is_loading) return;
                    _is_loading = true;

                    // Build URL
                    if (_url.charAt(_url.length - 1) != '/') _url += '/';
                    if (_current_page === 1) _url += 'page/1';
                    _current_page++;
                    _url = _url.replace('page/' + (_current_page - 1), 'page/' + _current_page);

                    // Fetch
                    _Ajax(_url, function(data) {
                        var new_posts_html = data.split('<!-- START' + ' POSTS -->')[1].split('<!-- END' + ' POSTS -->')[0];
                        var $new_posts = $('#posts', data);
                        var new_post_div = '.page' + _current_page;
                        // Insert posts and update counters
                        $('#posts').append('<div class="page' + _current_page + '">' + new_posts_html + '</div>');
                        sizeVideoContainers(new_post_div);
                        $(new_post_div).fitVids({ customSelector: "video"});

                        _posts_loaded = $new_posts.find('article.post').length;

                        if ((_posts_loaded > 0) && (_current_page < _total_pages)) {
                            set_trigger();
                            _is_loading = false;
                        } else {
                            disable_scroll();
                        }
                    });

                    // Stats
                    {block:IfGoogleAnalyticsID}
                        if (typeof window._gaq != 'undefined') {
                            _gaq.push(['_trackPageview', _url]);
                        }
                    {/block:IfGoogleAnalyticsID}
                }

                return {
                    init: init
                };
            });

            $(function() {
                if ( !($.browser.msie && (parseInt($.browser.version, 10) < 9) ) ) {
                    var InfiniteScroll = new Tumblelog.Infinite;
                    InfiniteScroll.init();
                }
            });
        </script>

        <!-- CHARTBEAT -->
        <script type="text/javascript">
            var _sf_async_config={};
            /** CONFIGURATION START **/
            _sf_async_config.uid = 18888;
            _sf_async_config.domain = "npr.org";
            /** CONFIGURATION END **/
            (function(){
                function loadChartbeat() {
                    window._sf_endpt=(new Date()).getTime();
                    var e = document.createElement("script");
                    e.setAttribute("language", "javascript");
                    e.setAttribute("type", "text/javascript");
                    e.setAttribute("src",
                        (("https:" == document.location.protocol) ?
                         "https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/" :
                         "http://static.chartbeat.com/") +
                        "js/chartbeat.js");
                    document.body.appendChild(e);
                }
                var oldonload = window.onload;
                window.onload = (typeof window.onload != "function") ?
                    loadChartbeat : function() { oldonload(); loadChartbeat(); };
            })();
        </script>
    </body>
    {/block:IndexPage}

    <!-- Post template -->
    {block:PermalinkPage}
    <body class="permalink-page">
        <div id="post"></div>

        <div class="post-fixed-menu">
            <h2>You're looking at <a href="#">Fringe Photography</a></h2>

            <ul>
                <li class="button-menu"><a href="#" data-toggle="modal" data-target="#main-menu">Menu <i class="fa fa-th"></i></a></li>
                <li class="button-share"><a href="#">Share <i class="fa fa-share"></i></a></li>
            </ul>
        </div>
        
       <!-- Modal -->
        <div class="modal" id="main-menu" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-body">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                
                <div class="inner-menu">
                    <a href="#" class="npr-logo">
                        <img src="http://apps.npr.org/borderland/assets/img/npr-logo.png">
                    </a>
                    <h3><a href="/">Look At This</a></h3>
                    <h4>An awesome tagline</h4>
                    <ul>
                        <li><a href="#">View all stories</a></li>
                        <li><a href="#">Topics</a></li>
                        <li><a href="#">What's this about?</a></li>
                        <li><a href="#">Send us something weird</a></li>
                        <li><a href="#">Search</a></li>
                    </ul>
                    <div class="follow-us">
                        <p class="twitter">
                            <em><a href="#">@LookAtThisNPR</a></em> 
                            <a href="#">#looksGoodNPR</a>
                        </p>
                    </div><!--follow-us-->
                </div><!--inner-menu-->
                    
              </div>
            </div>
          </div>
        </div><!--modal-->


        <script src="http://localhost:8000/js/lib/jquery.js"></script>
        <script src="http://localhost:8000/js/lib/bootstrap.js"></script>
        <script src="http://localhost:8000/js/lib/pym.js"></script>
        <script src="http://localhost:8000/js/post.js"></script>
        

        <!-- CHARTBEAT -->
        <script type="text/javascript">
            var _sf_async_config={};
            /** CONFIGURATION START **/
            _sf_async_config.uid = 18888;
            _sf_async_config.domain = "npr.org";
            /** CONFIGURATION END **/
            (function(){
                function loadChartbeat() {
                    window._sf_endpt=(new Date()).getTime();
                    var e = document.createElement("script");
                    e.setAttribute("language", "javascript");
                    e.setAttribute("type", "text/javascript");
                    e.setAttribute("src",
                        (("https:" == document.location.protocol) ?
                         "https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/" :
                         "http://static.chartbeat.com/") +
                        "js/chartbeat.js");
                    document.body.appendChild(e);
                }
                var oldonload = window.onload;
                window.onload = (typeof window.onload != "function") ?
                    loadChartbeat : function() { oldonload(); loadChartbeat(); };
            })();
        </script>
    </body>
    {/block:PermalinkPage}
</html>