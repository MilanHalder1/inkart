Promise.reject('error')
 .then(() => console.log('then'))
 .catch(e => {
 console.log('catch:', e);
 return 'recovered';
 })
 .then(v => console.log('after catch:', v));

// What logs?

// -------------
Promise.resolve('ok')
 .then(() => { throw new Error('oops'); })
 .catch(e => console.log('caught:', e.message))
 .catch(e => console.log('second catch:', e.message));

// Does the second .catch run?

// --------------------


Promise.reject('fail')
 .catch(e => {
 console.log('caught:', e);
 throw 'rethrown';
 })
 .then(() => console.log('then'))
 .catch(e => console.log('final catch:', e));
// What logs?
// --------------------------
Promise.resolve('data')
 .finally(() => {
 console.log('finally');
 return 'ignored';
 })
 .then(v => console.log('then:', v));



 //-----------------
 Promise.reject('err')
 .finally(() => {
 console.log('finally');
 return Promise.resolve('new value');
 })
 .then(v => console.log('then:', v))
 .catch(e => console.log('catch:', e));


// Does finally swallow the rejection??\
// ----------------

Promise.resolve()
 .then(() => {
 return Promise.reject('deep error');
 })
 .finally(() => console.log('finally'))
 .catch(e => console.log('catch:', e));

// Does finally run before catch? And does it receive the error?



// --- whats the logs ?
console.log('A');
setTimeout(function(){
 console.log('B');
}, 0);
console.log('C');

// ----------

console.log('start');

new Promise(resolve => {
 console.log('promise body');
 resolve();
}).then(() => console.log('then'));

console.log('end');


// ------------------------
setTimeout(() => console.log('timeout'), 0);

new Promise(resolve => resolve())
 .then(() => console.log('promise'));

console.log('sync');


// --------------------------

console.log('1');

setTimeout(() => {
 console.log('2');
 new Promise(r => r()).then(() =>
 console.log('3'));
}, 0);

setTimeout(() => console.log('4'), 0);

console.log('5');

// --------------------

async function foo() {
 console.log('foo start');
 await Promise.resolve();
 console.log('foo end');
}

console.log('before');
foo();
console.log('after');

//-----------------------
Promise.resolve()
 .then(() => {
 console.log('p1');
 return Promise.resolve();
 })
 .then(() => console.log('p2'));

Promise.resolve()
 .then(() => console.log('p3'))
 .then(() => console.log('p4'));