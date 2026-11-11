// QA only: npm install --prefix <temporary directory> jsdom
// Set NODE_PATH to that directory's node_modules, then: node tests/verify.cjs A
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM, requestInterceptor, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const milestone = process.argv[2] || 'A';
const results = [];
function check(name, fn) { fn(); results.push(name); }
function boot(url = 'file:///able-flow/index.html', saved = {}, prepare = () => {}) {
  const requests = [], errors = [], timers = new Map();
  let next = 0;
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', resources: { interceptors: [requestInterceptor(request => {
      requests.push(request.url); return Response.error();
    })] }, virtualConsole: console,
    beforeParse(w) {
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.setTimeout = fn => { timers.set(++next, fn); return next; };
      w.clearTimeout = id => timers.delete(id);
      w.setInterval = (fn, ms) => { timers.set(++next, {fn, ms}); return next; };
      w.clearInterval = id => timers.delete(id);
      w.fetch = () => { requests.push('fetch'); return Promise.reject(new Error('Offline')); };
      if (url.startsWith('http')) for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, value);
      prepare(w);
    }
  });
  const w = dom.window, d = w.document;
  const key = (key, type = 'keydown', repeat = false) => d.dispatchEvent(new w.KeyboardEvent(type, { key, repeat, bubbles: true, cancelable: true }));
  return { w, d, dom, requests, errors, timers,
    press(value = ' ') { key(value); key(value, 'keyup'); }, key,
    tick() { const entry = timers.entries().next().value; assert.ok(entry, 'Expected a scan timer'); entry[1].fn(); },
    choose(id) { for (let i = 0; i < 30 && d.activeElement.id !== id; i++) this.tick(); assert.equal(d.activeElement.id, id); this.press(); }
  };
}
check('A: inline JavaScript parses; no external runtime resources', () => {
  new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
  assert.doesNotMatch(html, /<script[^>]+src=|<img\b|@import|url\(\s*['"]?https?:/i);
});
for (const url of ['file:///able-flow/index.html', 'http://localhost:8787/sub/index.html']) {
  const app = boot(url);
  check(`A: ${url.split(':')[0]} loads with networking unavailable`, () => {
    assert.deepEqual(app.errors, []); assert.deepEqual(app.requests, []);
    assert.equal(app.d.body.dataset.scanState, 'READY'); assert.equal(app.d.activeElement.id, 'scan');
  });
  check('A: Space starts scanning, wraps through every enabled control, and pauses', () => {
    app.press(); assert.equal(app.d.body.dataset.scanState, 'SCANNING');
    const seen = new Set();
    const enabled = [...app.d.querySelectorAll('[data-scan]')].filter(el => !el.disabled && !el.hidden && !el.closest("[hidden]"));
    for (let i = 0; i < enabled.length; i++) { seen.add(app.d.activeElement.id); app.tick(); }
    assert.equal(seen.size, enabled.length);
    app.choose('scan'); assert.equal(app.d.body.dataset.scanState, 'PAUSED'); assert.equal(app.timers.size, 0);
  });
  check('A: Enter resumes; held/repeated keys cannot select twice; Tab pauses', () => {
    app.press('Enter'); const focused = app.d.activeElement;
    app.key(' ', 'keydown', true); assert.equal(app.d.activeElement, focused);
    app.key(' ', 'keyup'); app.key('Tab'); assert.equal(app.d.body.dataset.scanState, 'PAUSED');
    app.d.getElementById('speed').focus(); app.key(' '); const text = app.d.activeElement.textContent;
    app.key(' '); assert.equal(app.d.activeElement.textContent, text); app.key(' ', 'keyup');
  });
  check('A: background suspension stops timers and returns focus to Resume', () => {
    app.d.getElementById('scan').focus(); app.press();
    Object.defineProperty(app.d, 'hidden', { configurable: true, value: true });
    app.d.dispatchEvent(new app.w.Event('visibilitychange'));
    assert.equal(app.d.body.dataset.scanState, 'SUSPENDED'); assert.equal(app.timers.size, 0);
    assert.equal(app.d.activeElement.id, 'scan');
  });
  check('A: high-contrast toggle applies white/black text (21:1)', () => {
    const high = html.match(/body\.contrast\{([^}]+)\}/)[1];
    assert.match(high, /--bg:#000/); assert.match(high, /--text:#fff/); assert.match(high, /--muted:#fff/);
    app.d.getElementById('contrast').focus(); app.press(); assert.ok(app.d.body.classList.contains('contrast'));
    assert.equal(app.d.getElementById('contrast').getAttribute('aria-pressed'), 'true');
  });
  app.dom.window.close();
}
if (milestone >= 'B') {
  check('Seed: first launch renders the checked-in folktale without fetching external content', () => {
    const seed=JSON.parse(fs.readFileSync(path.join(root,'seed/stories/folktale-1.json'),'utf8'));
    const app=boot();
    assert.deepEqual(JSON.parse(app.w.eval('JSON.stringify(story)')),seed);
    assert.equal(seed.storyId,'folktale-1');
    assert.equal(app.d.getElementById('progress').textContent,seed.title);
    assert.equal(app.d.getElementById('node-text').textContent,seed.nodes[seed.startNodeId].text);
    assert.ok(app.d.querySelectorAll('#choices button').length>0);
    assert.deepEqual(app.requests,[]);assert.deepEqual(app.errors,[]);app.dom.window.close();
  });
  for (const url of ['file:///able-flow/index.html', 'http://localhost:8787/sub/index.html']) {
    for (const branch of ['water', 'shade']) {
      const app = boot(url);
      check(`B: Space-only ${branch} branch, index-zero restart, ending, Back and replay (${url.split(':')[0]})`, () => {
        assert.equal(app.d.querySelectorAll('#choices button').length, 2);
        app.press(); app.choose(`choice-${branch}`);
        assert.equal(app.d.getElementById('progress').textContent, 'Story complete');
        assert.equal(app.d.body.dataset.scanState, 'SCANNING');
        assert.equal(app.w.eval('scanIndex'), 0); assert.equal(app.d.activeElement.id, 'back');
        app.choose('back');
        assert.equal(app.d.querySelectorAll('#choices button').length, 2);
        app.choose(`choice-${branch}`); app.choose('restart');
        assert.equal(app.d.querySelectorAll('#choices button').length, 2);
        assert.equal(app.d.activeElement.id, 'choice-water');
        assert.deepEqual(app.requests, []); assert.deepEqual(app.errors, []);
      });
      app.dom.window.close();
    }
  }
  check('B: invalid destinations, unreachable nodes and non-terminating stories rejected', () => {
    const app = boot();
    const data = app.w.eval('JSON.stringify(story)');
    const validate = value => app.w.eval(`validateStory(${JSON.stringify(value)})`);
    const broken = JSON.parse(data); broken.nodes.garden.choices[0].targetNodeId = 'missing';
    assert.throws(() => validate(broken), /Invalid story/);
    const unreachable = JSON.parse(data); unreachable.nodes.extra = { ...unreachable.nodes.tree, id: 'extra' };
    assert.throws(() => validate(unreachable), /unreachable/);
    const loop = JSON.parse(data); loop.nodes.pond.ending = false; loop.nodes.pond.choices = [{id:'loop',text:'Loop',targetNodeId:'pond'}];
    assert.throws(() => validate(loop), /no route/); app.dom.window.close();
  });
  check('B: valid progress resumes; corrupt/version-mismatched/invalid paths reset safely', () => {
    const progress = path => JSON.stringify({storyId:'folktale-1',version:1,path});
    for (const [value, expected] of [[progress(['garden','pond']),'By the water'],['{broken','A place to pause'],[progress(['garden','pond','tree']),'A place to pause'],[progress(['missing']),'A place to pause'],[JSON.stringify({storyId:'folktale-1',version:0,path:['garden','pond']}),'A place to pause']]) {
      const app = boot('http://localhost:8787/sub/index.html', {'able-flow-progress':value});
      assert.equal(app.d.getElementById('node-title').textContent, expected); assert.deepEqual(app.errors, []); app.dom.window.close();
    }
  });
  check('B: manual navigation stays paused; Space can pause a restarted loop', () => {
    const app = boot(); app.key('Tab'); app.d.getElementById('choice-water').focus(); app.press();
    assert.equal(app.d.body.dataset.scanState, 'PAUSED'); assert.equal(app.timers.size, 0);
    app.d.getElementById('scan').focus(); app.press(); app.choose('restart');
    app.choose('scan'); assert.equal(app.d.body.dataset.scanState, 'PAUSED'); assert.equal(app.timers.size, 0);
    app.dom.window.close();
  });
}
if (milestone >= 'C') {
  check('C: scannable profile-scoped preferences hide draft gloss by default and persist symbol/gloss choices', () => {
    const app=boot('http://localhost:8787/sub/index.html');
    assert.equal(app.d.querySelectorAll('#choices .gloss').length,0);
    assert.equal(app.d.getElementById('node-gloss').textContent,'');
    app.press();app.choose('symbols');
    assert.ok(app.d.body.classList.contains('hide-symbols'));
    assert.equal(app.d.getElementById('choice-water').getAttribute('aria-label'),'Listen to the water');
    app.choose('gloss');assert.equal(app.d.getElementById('node-gloss').hidden,false);
    assert.equal(app.d.querySelectorAll('#choices .gloss').length,2);
    const key=app.w.eval('settingsKey'),saved=app.w.localStorage.getItem(key);app.dom.window.close();
    const reload=boot('http://localhost:8787/sub/index.html',{[key]:saved});
    assert.ok(reload.d.body.classList.contains('hide-symbols'));assert.equal(reload.d.getElementById('node-gloss').hidden,false);reload.dom.window.close();
  });
  check('C: node and choice AAC slots render local inline SVG with accessible text', () => {
    const app = boot();
    assert.equal(app.d.querySelectorAll('#node-icon svg, #choices svg').length, 3);
    for (const svg of app.d.querySelectorAll('svg')) {
      assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
      assert.equal(svg.getAttribute('aria-hidden'), 'true'); assert.ok(svg.querySelector('path'));
      assert.equal(svg.querySelectorAll('image,use').length, 0); assert.equal(svg.getAttribute('stroke'), 'currentColor');
    }
    assert.equal(app.d.getElementById('choice-water').getAttribute('aria-label'), 'Listen to the water');
    assert.equal(app.d.getElementById('choice-water').getAttribute('aria-describedby'), null);
    assert.equal(app.d.getElementById('node-gloss').hidden,true);
    app.d.getElementById('gloss').click();
    assert.equal(app.d.getElementById('choice-water').getAttribute('aria-describedby'),'gloss-water');
    assert.equal(app.d.getElementById('node-gloss').hidden, false);
    assert.match(app.d.getElementById('node-gloss').textContent, /not a verified translation/);
    app.press(); app.choose('choice-shade'); assert.equal(app.d.querySelectorAll('#node-icon svg').length, 1);
    assert.match(app.d.getElementById('node-gloss').textContent, /TREE SHADE REST/);
    assert.deepEqual(app.requests, []); assert.deepEqual(app.errors, []); app.dom.window.close();
  });
  check('C: absent gloss hides its slot; unknown references rejected; factory has local fallback', () => {
    const app = boot();
    app.w.eval("story.nodes.garden.sslGloss=null;renderNode()"); assert.equal(app.d.getElementById('node-gloss').hidden, true);
    assert.throws(() => app.w.eval("story.nodes.garden.aacIconRef='missing';validateStory(story)"), /symbol/);
    assert.ok(app.w.eval("renderIcon('missing').querySelector('path')"));
    app.dom.window.close();
  });
}
check('Scan: interval attribute controls one timer; every tick keeps focus/current/outline aligned', () => {
  const app = boot(); app.d.body.dataset.scanInterval = '3500'; app.press();
  const ordered = [...app.d.querySelectorAll('[data-scan]')].filter(el => !el.disabled && !el.hidden && !el.closest("[hidden]"));
  for (let i = 0; i < ordered.length * 3; i++) {
    assert.equal(app.timers.size, 1); assert.equal([...app.timers.values()][0].ms, 3500);
    assert.equal(app.w.eval('scanIndex'), i % ordered.length);
    assert.equal(app.d.activeElement, ordered[i % ordered.length]);
    assert.equal(app.d.querySelectorAll('[aria-current="true"]').length, 1);
    assert.equal(app.d.querySelector('[aria-current="true"]'), app.d.activeElement);
    assert.ok(app.d.activeElement.classList.contains('scan-focus')); app.tick();
  }
  app.choose('speed'); assert.equal(app.w.eval('scanIndex'), 0); assert.equal(app.timers.size, 1);
  assert.equal([...app.timers.values()][0].ms, 1000); app.choose('scan');
  assert.equal(app.timers.size, 0); assert.equal(app.d.activeElement.id, 'scan');
  app.dom.window.close();
});
check('Scan: clear before render, stale callback ignored, held switch freezes index zero', () => {
  const app = boot(); app.press(); const stale = [...app.timers.values()][0].fn;
  const choices=app.d.getElementById('choices'), replace=choices.replaceChildren;
  choices.replaceChildren=function(...args) {
    assert.equal(app.timers.size, 0, 'Old interval is cleared before removing choices');
    assert.equal(app.d.activeElement.id, 'scan', 'Focus is parked on a connected control during rendering');
    return replace.apply(this,args);
  };
  app.d.getElementById('choices').addEventListener('click', () => {
    // Action has completed bubbling from the button: only the replacement loop exists.
    assert.equal(app.timers.size, 1); assert.equal(app.w.eval('scanIndex'), 0);
  }, {once:true});
  app.key(' '); assert.equal(app.d.getElementById('progress').textContent, 'Story complete');
  assert.equal(app.d.activeElement.id, 'back'); assert.equal(app.timers.size, 1);
  stale(); app.tick(); app.key(' ', 'keydown', true);
  assert.equal(app.w.eval('scanIndex'), 0); assert.equal(app.d.activeElement.id, 'back');
  app.key(' ', 'keyup'); app.tick(); assert.equal(app.w.eval('scanIndex'), 1);
  app.dom.window.close();
});
check('Scan: invalid timing falls back; repeated starts leave exactly one interval', () => {
  const app = boot();
  for (const value of ['', '0', '-1', 'no', 'Infinity', '2147483648']) {
    app.d.body.dataset.scanInterval=value; app.w.eval('startScan();startScan()');
    assert.equal(app.timers.size, 1); assert.equal([...app.timers.values()][0].ms, 2000);
  }
  app.dom.window.close();
});
async function finish() {
  if (milestone >= 'D') {
    check('D: manifest uses local relative scope, start URL and valid 192/512 PNG icons', () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
      assert.equal(manifest.display, 'standalone'); assert.equal(manifest.scope, './'); assert.equal(manifest.start_url, './index.html');
      for (const [i,size] of [192,512].entries()) {
        const icon = manifest.icons[i]; assert.equal(icon.sizes, `${size}x${size}`);
        const buffer = fs.readFileSync(path.join(root, icon.src));
        assert.equal(buffer.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
        assert.equal(buffer.readUInt32BE(16), size); assert.equal(buffer.readUInt32BE(20), size);
      }
    });
    const registrations = [], messages = [], listeners = {};
    const worker = {postMessage(message) {messages.push(message);}};
    const app = boot('http://localhost:8787/sub/index.html', {}, w => {
      Object.defineProperty(w.navigator, 'serviceWorker', {value:{controller:{},ready:Promise.resolve({}),
        async register(...args) {registrations.push(args); return {waiting:worker,addEventListener(){}};},
        addEventListener(type, listener) {listeners[type]=listener;}
      }});
    });
    await new Promise(resolve => setImmediate(resolve));
    check('D: guarded relative registration; waiting update is scan-reachable and saves before activation', () => {
      assert.equal(registrations[0][0], './sw.js'); assert.equal(registrations[0][1].scope, './');
      assert.equal(app.d.getElementById('update').hidden, false);
      app.press(); app.choose('update');
      assert.equal(messages[0].type, 'ACTIVATE_UPDATE');
      assert.ok(app.w.localStorage.getItem(app.w.eval('progressKey'))); assert.equal(app.d.body.dataset.scanState, 'PAUSED');
      assert.equal(typeof listeners.controllerchange, 'function'); assert.deepEqual(app.errors, []);
    });
    check('D: install prompt becomes scan-reachable when supported', () => {
      const event = new app.w.Event('beforeinstallprompt', {cancelable:true});
      event.prompt = async () => {}; event.userChoice = Promise.resolve({outcome:'dismissed'});
      app.w.dispatchEvent(event); assert.equal(event.defaultPrevented, true); assert.equal(app.d.getElementById('install').hidden, false);
      app.press(); app.choose('install'); assert.equal(app.d.body.dataset.scanState, 'PAUSED');
    });
    await new Promise(resolve => setImmediate(resolve)); app.dom.window.close();
    let attempts = 0;
    const file = boot('file:///able-flow/index.html', {}, w => Object.defineProperty(w.navigator, 'serviceWorker', {value:{register(){attempts++;}}}));
    check('D: direct-file mode skips worker registration', () => {assert.equal(attempts, 0);assert.match(file.d.getElementById('install-status').textContent, /Direct-file/);});
    file.dom.window.close();
    const failed = boot('http://localhost:8787/sub/index.html', {}, w => Object.defineProperty(w.navigator, 'serviceWorker', {value:{async register(){throw new Error('Offline');}}}));
    await new Promise(resolve => setImmediate(resolve));
    check('D: registration failure leaves Space-only storytelling usable', () => {failed.press();failed.choose('choice-water');assert.equal(failed.d.getElementById('progress').textContent,'Story complete');assert.deepEqual(failed.errors, []);});
    failed.dom.window.close();
    results.push(await require('./worker.cjs')(root));
  }
  if (milestone >= 'E') results.push(...await require('./sync.cjs')(boot));
  console.log(results.join('\n'));
  console.log(`Milestone ${milestone}: ${results.length} checks passed. DOM simulation does not verify browser installation, DevTools Offline, or visual layout.`);
}
finish().catch(error => {console.error(error); process.exitCode = 1;});
