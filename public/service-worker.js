var CACHE_NAME = 'my-site-cache-v1';

var urlsToCache = [
    '/',
    '/styles.css',
    '/index.js',
    '/index.html'
];


self.addEventListener('install', function (event) {
    console.log("service worker installing");
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener("fetch", function (event) {
    console.log("event: " + JSON.stringify(event));
    event.respondWith(
        fetch(event.request).catch(function () {
            console.log("event.request: " + JSON.stringify(event.request));
            return caches.match(event.request).then(function (response) {
                if (response) {
                    return response;
                } else if (event.request.headers.get("accept").includes("text/html")) {
                    return caches.match("/index.html");
                }
            });
        })
    );
});

self.addEventListener('sync', function(event) {
    if (event.tag == 'budgetSync') {
      event.waitUntil(
        // get info from indexeddb and send to mongo db  
        
        doSomeStuff());
    }
  });

