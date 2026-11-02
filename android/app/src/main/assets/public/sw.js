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
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "index.html",
    "revision": "acf4b81e9cb5810f9961437ba601b4fa"
  }, {
    "url": "assets/index-DNCg7LKY.css",
    "revision": null
  }, {
    "url": "assets/index-BS4Hhv1B.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c7ccce47ab6952477d9f5c1f9e193b6d"
  }, {
    "url": "icon.svg",
    "revision": "c883c520ff392b596525de0002271b38"
  }, {
    "url": "manifest.json",
    "revision": "28ed5afa9cbc9ff164c7e7ef516a7467"
  }, {
    "url": "manifest.webmanifest",
    "revision": "28ed5afa9cbc9ff164c7e7ef516a7467"
  }, {
    "url": "pwa-192x192.png",
    "revision": "93f14c7fe2bf04e83e8995b16bccd615"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9a86565bf31bbcedc8257351b8c4cfb7"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "ad4ed8c1bd2df5a14d66925826134e7f"
  }, {
    "url": "manifest.json",
    "revision": "b2d54d650fa252a9d2e03473891e746e"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
