export /**
 *判断是否是对象（狭义的对象）
 *
 * @param {*} [obj={}]
 * @returns
 */
const isObject = function (obj = '') {
  return Object.prototype.toString.call(obj) === '[object Object]';
}


export default {
  isObject
}