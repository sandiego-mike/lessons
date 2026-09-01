(function(){
'use strict';
if(typeof Element==='undefined')return;
const proto=Element.prototype;
const desc=Object.getOwnPropertyDescriptor(proto,'innerHTML');
if(!desc||typeof desc.set!=='function'||typeof desc.get!=='function')return;
const BAD=/oninput="saved\["([^"]+)"\]=this\.value;save\(\)"/g;
function sanitize(value){
  if(typeof value!=='string'||!value.includes('oninput="saved["'))return value;
  return value.replace(BAD,'data-guide-try-key="$1"');
}
Object.defineProperty(proto,'innerHTML',{
  configurable:desc.configurable,
  enumerable:desc.enumerable,
  get(){return desc.get.call(this)},
  set(value){return desc.set.call(this,sanitize(value))}
});
const insert=proto.insertAdjacentHTML;
if(typeof insert==='function')proto.insertAdjacentHTML=function(position,text){return insert.call(this,position,sanitize(text))};
globalThis.__sanitizeLegacyMathHtml=sanitize;
})();
