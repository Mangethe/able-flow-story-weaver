const assert=require('node:assert/strict');
module.exports=async function verifySync(boot){
  const results=[],url='http://localhost:8787/sub/index.html',flush=()=>new Promise(resolve=>setImmediate(resolve));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
  const water=[{node_id:'garden',choice_id:'water',target_node_id:'pond'}];
  const row=(revision=1)=>({profile_id:'profile-a',story_id:'folktale-1',story_version:1,current_node_id:'pond',choices_made:water,revision,updated_at:'1900-01-01T00:00:00Z',last_mutation_id:null});
  function service(initial=null){
    let current=initial&&clone(initial);return {get row(){return current;},save(p){
      if(current?.last_mutation_id===p.p_mutation_id)return {status:'saved',progress:clone(current)};
      if((current?.revision||0)!==p.p_expected_revision)return {status:'conflict',progress:current&&clone(current)};
      current={...row((current?.revision||0)+1),story_version:p.p_story_version,current_node_id:p.p_current_node_id,choices_made:clone(p.p_choices_made),last_mutation_id:p.p_mutation_id};return {status:'saved',progress:clone(current)};
    }};
  }
  function setup({server=service(),online=true,profileId='profile-a',localProfileId,clientMissing=false,storage={},read,write}={}){
    const calls=[];let window;
    const client={from(table){assert.equal(table,'story_progress');const q={select(){return q;},eq(column,value){calls.push({type:'filter',column,value});return q;},maybeSingle(){calls.push({type:'read'});return read?read():Promise.resolve({data:server.row&&clone(server.row),error:null});}};return q;},rpc(name,params){
      assert.equal(name,'save_story_progress');assert.equal(params.p_story_version,1);assert.equal(params.profile_id,undefined);
      const local=JSON.parse(window.localStorage.getItem(window.eval('progressKey')));
      assert.equal(local.sync.pending,true);assert.equal(local.sync.inFlight.mutationId,params.p_mutation_id);
      calls.push({type:'write',params:clone(params)});return write?write(params):Promise.resolve({data:server.save(params),error:null});
    }};
    const app=boot(url,storage,w=>{window=w;Object.defineProperty(w.navigator,'onLine',{configurable:true,value:online});w.ABLE_FLOW_CONFIG={supabaseClient:clientMissing?null:client,profileId,localProfileId};});
    return {app,calls,server,key:()=>app.w.eval('progressKey'),saved:()=>JSON.parse(app.w.localStorage.getItem(app.w.eval('progressKey'))),reconnect(){Object.defineProperty(app.w.navigator,'onLine',{configurable:true,value:true});app.w.dispatchEvent(new app.w.Event('online'));}};
  }
  for(const options of [{online:false},{clientMissing:true},{profileId:null}]){
    const t=setup(options);t.app.press();t.app.choose('choice-water');assert.equal(t.saved().path.at(-1),'pond');assert.equal(t.saved().sync.pending,true);assert.equal(t.calls.length,0);t.app.dom.window.close();
  }
  results.push('E: offline/unconfigured choices save scoped pending progress before network calls');
  {
    const held=deferred(),server=service();let first=true;
    const t=setup({server,write:p=>{if(first){first=false;return held.promise.then(()=>({data:server.save(p),error:null}));}return Promise.resolve({data:server.save(p),error:null});}});await flush();
    t.app.press();t.app.choose('choice-water');t.app.choose('back');t.app.choose('choice-shade');
    assert.equal(t.calls.filter(c=>c.type==='write').length,1);assert.equal(t.saved().path.at(-1),'tree');assert.equal(t.app.d.activeElement.id,'back');assert.equal(t.app.timers.size,1);
    held.resolve();await flush();assert.equal(t.calls.filter(c=>c.type==='write').length,2);assert.equal(server.row.current_node_id,'tree');assert.equal(server.row.revision,2);assert.equal(t.saved().sync.pending,false);t.app.dom.window.close();
  }
  results.push('E: one active cloud save, immediate rendering and coalesced latest pending snapshot');
  {
    const t=setup({online:false});t.app.press();t.app.choose('choice-water');const key=t.key(),snapshot=t.app.w.localStorage.getItem(key);t.app.dom.window.close();
    const reload=setup({online:false,server:t.server,storage:{[key]:snapshot}});assert.equal(reload.app.d.getElementById('node-title').textContent,'By the water');reload.reconnect();await flush();
    assert.equal(t.server.row.current_node_id,'pond');assert.equal(reload.saved().sync.pending,false);assert.ok(reload.calls.some(c=>c.type==='filter'&&c.column==='story_version'));reload.app.dom.window.close();
  }
  results.push('E: offline pending state survives reload and retries on reconnect with story version');
  {
    const server=service();let fail=true;const t=setup({server,write:p=>{const data=server.save(p);if(fail){fail=false;return Promise.reject(new Error('Lost acknowledgement'));}return Promise.resolve({data,error:null});}});await flush();t.app.press();t.app.choose('choice-water');await flush();
    assert.equal(server.row.revision,1);const key=t.key(),snapshot=t.app.w.localStorage.getItem(key),id=t.saved().sync.inFlight.mutationId;t.app.dom.window.close();
    const reload=setup({server,storage:{[key]:snapshot}});await flush();assert.equal(server.row.revision,1);assert.equal(reload.calls.find(c=>c.type==='write').params.p_mutation_id,id);assert.equal(reload.saved().sync.pending,false);reload.app.dom.window.close();
  }
  results.push('E: ambiguous attempts retry their persisted mutation ID idempotently after reload');
  {
    const server=service(row(7)),t=setup({server,online:false});t.app.press();t.app.choose('choice-shade');t.reconnect();await flush();
    assert.equal(t.app.d.getElementById('node-title').textContent,'Under the tree');assert.equal(t.app.d.getElementById('sync-conflict').hidden,false);assert.equal(t.calls.filter(c=>c.type==='write').length,0);
    t.app.choose('keep-local');await flush();assert.equal(server.row.revision,8);assert.equal(server.row.current_node_id,'tree');assert.equal(t.saved().sync.pending,false);t.app.dom.window.close();
  }
  results.push('E: conflicts preserve local work until scannable Keep this device explicitly rebases');
  {
    const server=service(row(5)),t=setup({server,online:false});t.app.press();t.app.choose('choice-shade');t.reconnect();await flush();t.app.choose('use-cloud');
    assert.equal(t.saved().path.at(-1),'pond');assert.equal(t.saved().sync.pending,false);assert.equal(JSON.parse(t.app.w.localStorage.getItem(t.key()+':conflict-backup')).path.at(-1),'tree');assert.equal(t.app.d.activeElement.id,'back');t.app.dom.window.close();
  }
  results.push('E: Use cloud preserves an unsynced branch in a scoped conflict backup');
  {
    const server=service(row()),a=setup({server}),b=setup({server});await flush();a.app.press();a.app.choose('back');a.app.choose('choice-shade');await flush();b.app.press();b.app.choose('back');await flush();
    assert.equal(server.row.current_node_id,'tree');assert.ok(b.saved().sync.conflict);assert.equal(b.saved().sync.pending,true);a.app.dom.window.close();b.app.dom.window.close();
  }
  results.push('E: colliding clients cannot silently overwrite a newer revision');
  {
    const key='able-flow-progress:auth%3Aprofile-a:folktale-1:v1',record={storyId:'folktale-1',version:1,profileId:'profile-a',profileScope:'auth:profile-a',path:['garden','pond'],choicesMade:water,sync:{revision:9,sequence:1,pending:false,inFlight:null,conflict:null},updatedAt:'2999-01-01T00:00:00Z'};
    const t=setup({server:service(row(10)),storage:{[key]:JSON.stringify(record)}});await flush();assert.equal(t.saved().sync.revision,10);t.app.dom.window.close();
    for(const profileId of ['profile-b',null]){const other=setup({profileId,online:false,storage:{[key]:JSON.stringify(record),'able-flow-progress':JSON.stringify(record)}});assert.equal(other.app.d.getElementById('node-title').textContent,'A place to pause');assert.notEqual(other.key(),key);other.app.dom.window.close();}
    const version=setup({online:false,storage:{[key.replace(':v1',':v2')]:JSON.stringify({...record,version:2})}});assert.equal(version.app.d.getElementById('node-title').textContent,'A place to pause');version.app.dom.window.close();
  }
  results.push('E: device clock skew is ignored and local keys isolate profiles and story versions');
  for(const bad of [{...row(),story_version:2},{...row(),profile_id:'another'},{...row(),revision:-1},{...row(),current_node_id:'missing'}]){
    const t=setup({server:service(bad)});await flush();assert.equal(t.app.d.getElementById('node-title').textContent,'A place to pause');assert.equal(t.calls.filter(c=>c.type==='write').length,0);t.app.dom.window.close();
  }
  results.push('E: incompatible or corrupt remote records cannot replace local progress');
  {
    let fail=true;const t=setup({write:p=>fail?Promise.resolve({error:new Error('SDK error')}):Promise.resolve({data:t.server.save(p),error:null})});await flush();t.app.press();t.app.choose('choice-water');await flush();assert.equal(t.saved().sync.pending,true);assert.ok(t.saved().sync.inFlight);assert.deepEqual(t.app.errors,[]);fail=false;t.reconnect();await flush();assert.equal(t.saved().sync.pending,false);t.app.dom.window.close();
  }
  results.push('E: failures retain pending work for reconnect without interrupting scanning');
  {
    const held=deferred(),t=setup({read:()=>held.promise});t.app.press();t.app.choose('choice-shade');
    assert.equal(t.calls.filter(c=>c.type==='write').length,0);held.resolve({data:row(4),error:null});await flush();
    assert.equal(t.saved().path.at(-1),'tree');assert.ok(t.saved().sync.conflict);assert.equal(t.calls.filter(c=>c.type==='write').length,0);t.app.dom.window.close();
    const a=setup({profileId:null,localProfileId:'class-a',online:false}),b=setup({profileId:null,localProfileId:'class-b',online:false});assert.notEqual(a.key(),b.key());a.app.dom.window.close();b.app.dom.window.close();
  }
  results.push('E: a delayed startup read cannot erase a new choice; unauthenticated local profile scopes are separate');
  return results;
};
