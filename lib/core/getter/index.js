import { isObject } from '../utils/index';

/**
 *getter流
 *
 * @export
 * @class Getter
 */
export default class Getter {
  /**
   *Creates an instance of Getter.
   * @param {*} { root = {}, options = {} }
   * @memberof Getter
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof Getter
   */
  defineProperty() {
    this.privateMethods = {};

    this.interfaceMethods = {};
  }
  /**
   *对外暴露的统一接口
   *
   * @returns
   * @memberof Getter
   */
  run() {
    return this.interfaceMethods;
  }
  /**
   *
   *注册getter方法
   *
   * @param {*} [getterData={}]
   * @param {string} [spaceKey='']
   * @memberof Getter
   */
  register(getterData = {}, spaceKey = '') {
    // 根据spaceKey解析存储的getter
    this.savePrivateMethod(getterData, spaceKey);
    // 存储getter
    this.saveInterfaceMethod(getterData, spaceKey);
  }
  /**
   *
   *getter以私有形式存在
   *
   * @param {*} [getterData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Getter
   */
  savePrivateMethod(getterData = {}, spaceKey = '') {
    // 如果需要注册的getter是空的，返回
    if (Object.keys(getterData).length === 0) return;

    const { stateIns } = this.root;
    const currentState = stateIns.getCurrentState(spaceKey);

    Object.keys(getterData).forEach((key) => {
      const data = getterData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      if (!isObject(this.privateMethods[spaceKey])) {
        this.privateMethods[spaceKey] = {};
      }

      if (Object.keys(this.privateMethods[spaceKey]).some(methodKey => methodKey === key)) {
        throw new Error(`Duplicate key with ${key}`);
      } 

      Object.defineProperty(this.privateMethods[spaceKey], key, {
        get: () => {
          return data.call(this.root, currentState, this.getCurrentGetter(spaceKey));
        }
      });
    });
  }
  /**
   *getter以接口形式存在
   *
   * @param {*} [getterData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Getter
   */
  saveInterfaceMethod(getterData = {}, spaceKey = '') {
    if (!isObject(getterData)) throw new Error('getter必须是对象');

    // 如果需要注册的getter是空的，返回
    if (Object.keys(getterData).length === 0) return;

    const { stateIns } = this.root;
    const currentState = stateIns.getCurrentState(spaceKey);

    // 存储getter方法
    Object.keys(getterData).forEach((key) => {
      const data = getterData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      // 如果之前存在这个key，抛出错误
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;
      if (Object.keys(this.interfaceMethods).some(methodKey => methodKey === generKey)) {
        throw new Error(`Duplicate key with ${generKey}`);
      } 

      Object.defineProperty(this.interfaceMethods, generKey, {
        get: () => {
          return data.call(this.root, currentState, this.getCurrentGetter(spaceKey));
        }
      });
    });
  }

  /**
   *得到当前命名空间下的getter
   *
   * @param {string} [spaceKey='']
   * @memberof Getter
   */
  getCurrentGetter(spaceKey = '') {
    return this.privateMethods[spaceKey];
  }
}