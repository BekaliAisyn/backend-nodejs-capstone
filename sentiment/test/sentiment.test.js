const {test}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const app=require('../index');
test('classifies positive and negative reviews',async()=>{const p=await request(app).post('/sentiment').send({sentence:'This is excellent and wonderful'}).expect(200);assert.equal(p.body.sentiment,'positive');assert.ok(p.body.sentimentScore>0);const n=await request(app).post('/sentiment').send({sentence:'This is terrible and horrible'}).expect(200);assert.equal(n.body.sentiment,'negative');assert.ok(n.body.sentimentScore<0);});
test('neutral text is neutral and invalid payload is rejected',async()=>{const r=await request(app).post('/sentiment').send({sentence:'The table is here'}).expect(200);assert.equal(r.body.sentiment,'neutral');await request(app).post('/sentiment').send({sentence:[]}).expect(400);await request(app).post('/sentiment').send({sentence:''}).expect(400);});
