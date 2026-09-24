/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "pwa-512x512.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "pwa-192x192.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "index.html",
    "revision": "1c1e24d8bd9a1be8941d7ee8044a051e"
  }, {
    "url": "icon.svg",
    "revision": "9c2ab7725cb767ad1cc6acab0b5171bb"
  }, {
    "url": "icon.ico",
    "revision": "b6eae89b52e92a5200424e4b755842b1"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "app-icon.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "assets/purify.es-DedTAGkB.js",
    "revision": null
  }, {
    "url": "assets/index.es-Duwziv0d.js",
    "revision": null
  }, {
    "url": "assets/index-b2VRQlhN.js",
    "revision": null
  }, {
    "url": "assets/index-DJhmy3wU.css",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-QH1iLAAe.js",
    "revision": null
  }, {
    "url": "app-icon.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "icon.ico",
    "revision": "b6eae89b52e92a5200424e4b755842b1"
  }, {
    "url": "icon.svg",
    "revision": "9c2ab7725cb767ad1cc6acab0b5171bb"
  }, {
    "url": "pwa-192x192.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "pwa-512x512.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "406c85024e731978f16e78bcf639e208"
  }, {
    "url": "manifest.webmanifest",
    "revision": "7114f686e526e4e057ce3b2d7b995e9c"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
