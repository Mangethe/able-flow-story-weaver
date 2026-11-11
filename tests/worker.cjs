const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
module.exports = async function verifyWorker(root) {
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const scope = 'http://localhost:8787/sub/';
  const stores = new Map();
  let online = true, skipped = 0, claimed = 0;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(urls) {
          if (!online) throw new Error('Offline');
          const entries = urls.map(url => {
            assert.ok(url.startsWith(scope), 'Precache stays in app scope');
            const filename = path.join(root, url.slice(scope.length));
            return [url, new Response(fs.readFileSync(filename))];
          });
          for (const [url, response] of entries) store.set(url, response);
        },
        async match(url) { return store.get(String(url))?.clone(); }
      };
    }
  };
  function worker(version = 'v1') {
    const handlers = {};
    const self = { registration: { scope }, clients: { async claim() { claimed++; } }, async skipWaiting() { skipped++; }, addEventListener(type, fn) { handlers[type] = fn; } };
    vm.runInNewContext(source.replace(/const VERSION='[^']+'/, `const VERSION='${version}'`), {
      self, caches, URL, Response,
      fetch: async () => { if (!online) throw new Error('Offline'); return new Response('network'); }
    });
    return {
      async lifecycle(type, data) { let pending; handlers[type]({data, waitUntil(promise) { pending = promise; }}); await pending; },
      async request(url, method = 'GET', mode = 'navigate') { let pending; handlers.fetch({ request: {url,method,mode}, respondWith(promise) { pending = promise; } }); return pending ? await pending : null; }
    };
  }
  const current = worker();
  await current.lifecycle('install'); assert.equal(skipped, 0, 'Never activate an update automatically');
  const ownName = [...stores.keys()][0]; assert.equal(stores.get(ownName).size, 4);
  stores.set('another-app:v1', new Map());
  stores.set('able-flow:other-scope:v1', new Map());
  await current.lifecycle('activate'); assert.equal(claimed, 1);
  online = false;
  for (const suffix of ['', 'index.html', 'index.html?resume=1']) {
    const response = await current.request(scope + suffix);
    assert.equal(response.status, 200); assert.match(await response.text(), /Your story, your choice/);
  }
  for (const asset of ['manifest.json', 'icons/icon-192.png', 'icons/icon-512.png']) assert.equal((await current.request(scope + asset, 'GET', 'cors')).status, 200);
  assert.equal(await current.request('https://other.example/index.html'), null);
  assert.equal(await current.request(scope + 'index.html', 'POST'), null);
  assert.equal(await current.request(scope + 'unrelated.json', 'GET', 'cors'), null);
  assert.equal(await current.request(scope + 'other-app/'), null);
  const replacement = worker('v2');
  await assert.rejects(replacement.lifecycle('install'), /Offline/);
  assert.ok(stores.has(ownName), 'Failed replacement keeps working cache');
  assert.equal((await current.request(scope)).status, 200);
  online = true; await replacement.lifecycle('install');
  assert.equal(skipped, 0); await replacement.lifecycle('message', {type:'ACTIVATE_UPDATE'}); assert.equal(skipped, 1);
  await replacement.lifecycle('activate');
  assert.equal(stores.has(ownName), false); assert.ok(stores.has('another-app:v1')); assert.ok(stores.has('able-flow:other-scope:v1'));
  online = false; assert.equal((await replacement.request(scope)).status, 200);
  const active = [...stores.keys()].find(name => name.endsWith(':v2'));
  stores.get(active).delete(scope + 'index.html');
  assert.equal((await replacement.request(scope)).status, 503);
  return 'D: precache, offline reload/assets, subdirectory scope, failed install, controlled update and scoped cache cleanup pass';
};
