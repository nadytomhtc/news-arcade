const assert=require('node:assert/strict');const r=require('../games/stage-clear/rules.js');
for(const [time,want]of [[0,5],[10,5],[10.001,4],[20,4],[20.001,3],[30,3],[30.001,2],[45,2],[45.001,1],[60,1],[60.001,0]])assert.equal(r.stars(time,10),want,`time ${time}`);
for(let n=0;n<10;n++)assert.equal(r.stars(8,n),0);
console.log('Star thresholds and incomplete results passed');
