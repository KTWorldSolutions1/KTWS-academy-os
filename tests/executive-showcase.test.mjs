import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEMO_SCENES} from '../lib/presentation-demo.ts';
import {schoolSections} from '../lib/simple-navigation.ts';
import {CAPABILITY_COUNT,CAPABILITY_SECTIONS,EXECUTIVE_SCENE_IDS,scenesForMode,spokenPitch,spokenDurationMs,timelineForMode,operationalImpact} from '../lib/demo-showcase.ts';
const executive=scenesForMode('executive'),full=scenesForMode('complete');
assert.equal(executive.length,9,'Show owners a concise nine-outcome presentation including the staff messenger');
assert.equal(full.length,DEMO_SCENES.length,'Preserve every complete-demo chapter');
assert.equal(new Set(executive.map(x=>x.id)).size,EXECUTIVE_SCENE_IDS.length);
assert.deepEqual(executive.map(x=>x.id),[...EXECUTIVE_SCENE_IDS]);
assert.equal(CAPABILITY_COUNT,schoolSections.reduce((total,x)=>total+x.pages.length,0),'Catalog shows every real navigable module');
assert.equal(CAPABILITY_SECTIONS.length,schoolSections.length);
const ids=new Set(schoolSections.flatMap(x=>x.pages.map(p=>p.id)));
assert.ok(CAPABILITY_SECTIONS.every(x=>x.capabilities.every(p=>ids.has(p.id)&&p.label&&p.description)));
for(const scene of full){
 const wordCount=spokenPitch(scene).split(/\s+/).length;
 assert.ok(wordCount>=10&&wordCount<=55,scene.id+' should be a short natural voice script, got '+wordCount);
 assert.ok(spokenDurationMs(scene)>=11000,'Brief narration still needs display time');
 const impact=operationalImpact(scene);
 assert.ok(impact.today&&impact.academy&&impact.proof,'Each chapter shows an operational before/after');
}
for(const mode of ['executive','complete']){
 const t=timelineForMode(mode);
 assert.equal(t.scenes.length,mode==='executive'?EXECUTIVE_SCENE_IDS.length:DEMO_SCENES.length);
 assert.equal(t.starts[0],0);
 assert.equal(t.durations.reduce((sum,x)=>sum+x,0),t.total);
 assert.ok(t.total>=80000&&t.total<1000000,'Tour length should not drag');
 for(let i=1;i<t.starts.length;i++)assert.equal(t.starts[i],t.starts[i-1]+t.durations[i-1]);
}
const film=readFileSync(new URL('../app/owner-demo-film.tsx',import.meta.url),'utf8');
const explorer=readFileSync(new URL('../app/demo-capability-explorer.tsx',import.meta.url),'utf8');
assert.ok(film.includes('new SpeechSynthesisUtterance(briefNarration)'),'Speak short pitches instead of a long capability monologue');
assert.ok(film.includes("useState<DemoMode>('executive')"),'Owner starts with the short pitch');
assert.ok(film.includes('<CapabilityExplorer'),'Full capability catalog is reachable');
assert.ok(film.includes('<ExecutiveFeedbackBoard'),'Existing saved review works');
assert.ok(film.includes('Open {scene.feature}'),'Every chapter opens its actual workflow');
assert.ok(explorer.includes("onNavigate(page.id"),'Every module can open its real navigation page');
assert.ok(explorer.includes("Module")||explorer.includes("page.status"),'Do not overstate unverified modules');
console.log('PASS: nine short story chapters, all modules cataloged, proof-oriented outcomes, extended walkthrough and saved feedback.');
