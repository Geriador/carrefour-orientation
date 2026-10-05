/* Service worker : met l'application en cache pour un usage hors connexion.
   Stratégie « réseau d'abord, cache ensuite » sur la page, afin que les mises à jour
   soient prises en compte dès qu'une connexion est disponible. */
var CACHE = "carrefour-orientation-v1";
var FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icone-192.png", "./icone-512.png"];
var OPTIONNELS = ["./portes-ouvertes.json"];   // peut ne pas exister : son absence ne doit rien casser

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    // chaque fichier est mis en cache séparément : un fichier absent n'empêche pas l'installation
    return Promise.all(FICHIERS.concat(OPTIONNELS).map(function(f){
      return c.add(f).catch(function(){ return null; });
    }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(cles){
    return Promise.all(cles.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;   // carte, polices : on laisse passer
  e.respondWith(
    fetch(req).then(function(rep){
      var copie = rep.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copie); });
      return rep;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || caches.match("./index.html"); });
    })
  );
});
