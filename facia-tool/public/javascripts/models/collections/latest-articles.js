/* global _: true */
define([
    'modules/vars',
    'utils/query-params',
    'utils/url-abs-path',
    'models/collections/article',
    'modules/auto-complete',
    'modules/cache',
    'modules/authed-ajax',
    'knockout'
], function (
    vars,
    queryParams,
    urlAbsPath,
    Article,
    autoComplete,
    cache,
    authedAjax,
    ko
) {
    return function(options) {

        var self = this,
            deBounced,
            opts = options || {},
            counter = 0,
            container = document.querySelector('.latest-articles');

        this.articles   = ko.observableArray();

        this.term       = ko.observable(queryParams().q || '');
        this.suggestions= ko.observableArray();

        this.filter     = ko.observable();
        this.filterType = ko.observable();
        this.filterTypes= ko.observableArray(_.values(opts.filterTypes) || []);

        this.page       = ko.observable(1);

        this.isTermAnItem = function() {
            return (self.term() || '').match(/\//);
        };

        this.term.subscribe(function(){
            self.search();
        });

        this.setFilter = function(item) {
            self.filter(item && item.id ? item.id : item);
            self.suggestions.removeAll();
            self.search();
        };

        this.clearFilter = function() {
            self.filter('');
            self.suggestions.removeAll();
        };

        this.setSection = function(str) {
            self.filterType(opts.filterTypes.section);
            self.setFilter(str);
            self.clearTerm();
        };

        this.clearTerm = function() {
            self.term('');
        };

        this.autoComplete = function() {
            autoComplete({
                query:    self.filter(),
                path:    (self.filterType() || {}).path
            })
            .progress(self.suggestions)
            .then(self.suggestions);
        };

        // Grab articles from Content Api
        this.search = function(opts) {
            var count = counter += 1;

            opts = opts || {};

            clearTimeout(deBounced);
            deBounced = setTimeout(function(){

                var url, propName;

                if (!opts.noFlushFirst) {
                    self.flush('searching...');
                }

                // If term contains slashes, assume it's an article id (and first convert it to a path)
                if (self.isTermAnItem()) {
                    self.term(urlAbsPath(self.term()));
                    url = vars.CONST.apiSearchBase + '/' + self.term() + '?show-fields=all&format=json';
                    propName = 'content';
                } else {
                    url  = vars.CONST.apiSearchBase + '/search?show-fields=all&format=json';
                    url += '&page-size=' + (vars.CONST.searchPageSize || 25);
                    url += '&page=' + self.page();
                    url += self.term() ? '&q=' + encodeURIComponent(self.term()) : '';
                    url += '&' + self.filterType().param + '=' + encodeURIComponent(self.filter());
                    propName = 'results';
                }

                authedAjax.request({
                    url: url
                }).then(function(data) {
                    var rawArticles = data.response && data.response[propName] ? data.response[propName] : [];

                    if (count !== counter) { return; }

                    self.flush(rawArticles.length === 0 ? '...sorry, no articles were found.' : '');

                    ([].concat(rawArticles)).forEach(function(article, index){
                        article.index = index;
                        article.uneditable = true;
                        self.articles.push(new Article(article));
                        cache.put('contentApi', article.id, article);
                    });
                });
            }, 300);

            return true; // ensure default click happens on all the bindings
        };

        this.flush = function(message) {
            self.articles.removeAll();
            // clean up any dragged-in articles
            container.innerHTML = message || '';
        };

        this.refresh = function() {
            self.page(1);
            self.search();
        };

        this.pageNext = function() {
            self.page(self.page() + 1);
            self.search();
        };

        this.pagePrev = function() {
            self.page(_.max([1, self.page() - 1]));
            self.search();
        };

        this.startPoller = function() {
            setInterval(function(){
                if (self.page() === 1) {
                    self.search({noFlushFirst: true});
                }
            }, vars.CONST.latestArticlesPollMs || 60000);

            this.startPoller = function() {}; // make idempotent
        };

    };
});


