const assert = require('node:assert/strict');
module.exports = async function verifySync(boot) {
  const results=[],url='http://localhost:8787/sub/index.html';
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  const pending=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
  const choices=[{node_id:'garden',choice_id:'water',target_node_id:'pond'}];
  const remote=(updated_at='2030-01-01T00:00:00.000Z')=>({profile_id:'profile-a',story_id:'folktale-1',current_node_id:'pond',choices_made:choices,updated_at});
  const saved=(updatedAt,path=['garden'])=>JSON.stringify({storyId:'folktale-1',version:1,profileId:'profile-a',path,updatedAt});
  function setup({online=true,read=Promise.resolve({data:null,error:null}),write=Promise.resolve({error:null}),storage={},profileId='profile-a',clientMissing=false}={}) {
    const calls=[]; let w;
    const client={from(table){
      assert.equal(table,'story_progress');
      const query={
        select(columns){calls.push({type:'select',columns});return this;},
        eq(column,value){calls.push({type:'eq',column,value});return this;},
        order(column,options){calls.push({type:'order',column,options});return this;},
        limit(value){calls.push({type:'limit',value});return this;},
        maybeSingle(){return read;},
        upsert(row,options){
          // This assertion runs inside the client call, before its promise settles.
          const local=JSON.parse(w.localStorage.getItem('able-flow-progress'));
          assert.equal(local.path.at(-1),row.current_node_id);
          assert.deepEqual(JSON.parse(JSON.stringify(local.choicesMade)),JSON.parse(JSON.stringify(row.choices_made)));
          calls.push({type:'upsert',row:JSON.parse(JSON.stringify(row)),options:JSON.parse(JSON.stringify(options))});
          return typeof write==='function'?write():write;
        }
      };return query;
    }};
    const app=boot(url,storage,window=>{
      w=window;Object.defineProperty(w.navigator,'onLine',{configurable:true,value:online});
      w.ABLE_FLOW_CONFIG={supabaseClient:clientMissing?null:client,profileId};
    });
    return {app,calls};
  }
  for(const options of [{online:false},{clientMissing:true},{profileId:null}]) {
    const {app,calls}=setup(options); app.press();app.choose('choice-water');
    assert.equal(JSON.parse(app.w.localStorage.getItem('able-flow-progress')).path.at(-1),'pond');
    await flush();assert.equal(calls.length,0);assert.equal(app.d.body.dataset.scanState,'SCANNING');app.dom.window.close();
  }
  results.push('E: offline/unconfigured/missing-profile play saves locally and makes no Supabase calls');
  {
    const read=pending(),write=pending();const {app,calls}=setup({read:read.promise,write:write.promise});
    assert.equal(app.d.getElementById('node-title').textContent,'A place to pause');
    assert.equal(app.d.body.dataset.scanState,'READY');
    app.press();app.choose('choice-water');
    const first=JSON.parse(app.w.localStorage.getItem('able-flow-progress'));
    assert.ok(Number.isFinite(Date.parse(first.updatedAt)));assert.deepEqual(first.choicesMade,choices);
    assert.equal(calls.filter(call=>call.type==='upsert').length,1);
    assert.deepEqual(calls.find(call=>call.type==='upsert').options,{onConflict:'profile_id,story_id'});
    assert.equal(app.d.getElementById('progress').textContent,'Story complete');
    assert.equal(app.w.eval('scanIndex'),0);assert.equal(app.d.activeElement.id,'back');
    app.choose('back');app.choose('choice-shade');
    assert.equal(calls.filter(call=>call.type==='upsert').length,3,'Every choice/action fires without waiting for prior I/O');
    const current=JSON.parse(app.w.localStorage.getItem('able-flow-progress'));
    read.resolve({data:remote('2020-01-01T00:00:00.000Z'),error:null});write.resolve({error:null});
    await flush();assert.equal(app.w.localStorage.getItem('able-flow-progress'),JSON.stringify(current));
    assert.equal(app.d.getElementById('node-title').textContent,'Under the tree');
    assert.deepEqual(calls.filter(call=>call.type==='eq').map(call=>[call.column,call.value]),[['profile_id','profile-a'],['story_id','folktale-1']]);
    assert.equal(calls.filter(call=>call.type==='select').length,1);
    app.dom.window.close();
  }
  results.push('E: local write precedes upsert; hung requests never block render/scanning or later choices; startup read is profile/story filtered');
  {
    const {app,calls}=setup({read:Promise.resolve({data:remote(),error:null}),storage:{'able-flow-progress':saved('2020-01-01T00:00:00.000Z')}});
    await flush();const merged=JSON.parse(app.w.localStorage.getItem('able-flow-progress'));
    assert.equal(merged.updatedAt,'2030-01-01T00:00:00.000Z');assert.deepEqual(merged.path,['garden','pond']);
    assert.equal(app.d.getElementById('node-title').textContent,'By the water');
    assert.equal(app.d.body.dataset.scanState,'READY');assert.equal(app.d.activeElement.id,'scan');
    assert.equal(calls.filter(call=>call.type==='upsert').length,0,'A pull does not echo an upsert');app.dom.window.close();
  }
  results.push('E: newer remote progress merges to localStorage with its original timestamp and renders without losing focus');
  for(const stamp of ['2019-01-01T00:00:00.000Z','2020-01-01T00:00:00.000Z']) {
    const value=saved('2020-01-01T00:00:00.000Z');
    const {app}=setup({read:Promise.resolve({data:remote(stamp),error:null}),storage:{'able-flow-progress':value}});
    await flush();assert.equal(app.w.localStorage.getItem('able-flow-progress'),value);
    assert.equal(app.d.getElementById('node-title').textContent,'A place to pause');app.dom.window.close();
  }
  results.push('E: equal or older remote timestamps leave localStorage and the current node unchanged');
  for(const data of [{...remote(),profile_id:'other-profile'},{...remote(),story_id:'other-story'},{...remote(),updated_at:'broken'},{...remote(),current_node_id:'missing'},{...remote(),choices_made:[{node_id:'garden',choice_id:'shade',target_node_id:'pond'}]},null]) {
    const {app}=setup({read:Promise.resolve({data,error:null})});await flush();
    assert.equal(app.w.localStorage.getItem('able-flow-progress'),null);assert.equal(app.d.getElementById('node-title').textContent,'A place to pause');app.dom.window.close();
  }
  results.push('E: invalid/missing/wrong-profile/wrong-story remote records cannot corrupt local progress');
  for(const sdkError of [false,true]) {
    const {app}=setup({read:sdkError?Promise.resolve({data:null,error:new Error('SDK read error')}):Promise.reject(new Error('Network read error')),write:()=>sdkError?Promise.resolve({error:new Error('SDK write error')}):Promise.reject(new Error('Network write error'))});
    app.press();app.choose('choice-shade');await flush();
    assert.equal(app.d.getElementById('node-title').textContent,'Under the tree');
    assert.equal(app.d.activeElement.id,'back');assert.deepEqual(app.errors,[]);app.dom.window.close();
  }
  results.push('E: thrown network failures and returned SDK errors are caught without interrupting play');
  {
    const read=pending();const {app}=setup({read:read.promise});app.press();app.tick();
    read.resolve({data:remote(),error:null});await flush();
    assert.equal(app.d.body.dataset.scanState,'SCANNING');assert.equal(app.w.eval('scanIndex'),0);assert.equal(app.d.activeElement.id,'back');assert.equal(app.timers.size,1);
    assert.equal(app.d.querySelector('[aria-current="true"]'),app.d.activeElement);app.dom.window.close();
  }
  results.push('E: a newer startup pull during scanning restarts at index zero with one timer and aligned current/focus');
  return results;
};
