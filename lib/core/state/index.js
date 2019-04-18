import { isObject } from '../utils/index';

/**
 *state数据集合
 *
 * @export
 * @class State
 */
export default class State {
  /**
   *Creates an instance of State.
   * @param {*} { root = {}, options = {} }
   * @memberof State
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof State
   */
  defineProperty() {
    this.illegalKey = 'nested';

    this.stateData = {
      nested: {}
    };

    this.interfaceData = {};
  }
  /**
   *对外暴露的统一接口
   *
   * @returns
   * @memberof State
   */
  run() {
    return this.interfaceData;
  }
  register(stateData = {}, spaceKey = '') {
    // 存储state
    this.saveStateData(stateData, spaceKey);
    // 更新state接口数据
    this.updateInterfaceData(stateData, spaceKey);
  }
  /**
   *存储state数据
   *
   * @param {*} [stateData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof State
   */
  saveStateData(stateData = {}, spaceKey = '') {
    if (!isObject(stateData)) throw new Error('state必须是对象');

    // 如果需要注册的state是空的，返回
    if (Object.keys(stateData).length === 0) return;
    // 如果根数据中有核心敏感字段，返回
    if (!spaceKey && Object.keys(stateData).some(key => key === this.illegalKey)) throw new Error('nested为敏感字段');

    // 初始化命名空间的数据域
    if (spaceKey) {
      const { [spaceKey]: spaceData = '' } = this.stateData.nested;
      // 确保spaceData是对象
      if (!isObject(spaceData)) {
        this.stateData.nested[spaceKey] = {}; 
      }
    }
    // 根据命名空间获得数据域
    const stateField = spaceKey ? this.stateData.nested[spaceKey] : this.stateData;
    // 存储state数据
    Object.keys(stateData).forEach((key) => {
      const data = stateData[key];
      
      stateField[key] = data;
    });
  }
  /**
   *更新state数据接口
   *
   * @param {*} [stateData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof State
   */
  updateInterfaceData(stateData = {}, spaceKey = '') {
    // 如果需要注册的state是空的，返回
    if (Object.keys(stateData).length === 0) return;
    
    // 如果命名空间spaceKey存在,并且没有被定义过
    if (spaceKey) {
      if (isObject(this.interfaceData[spaceKey])) return;

      Object.defineProperty(this.interfaceData, spaceKey, {
        get: () => {
          return this.stateData.nested[spaceKey];
        },
        set: (value) => {
          this.stateData.nested[spaceKey] = value;
        }
      });
      return;
    }
    // 如果命名空间spaceKey不存在（根数据）
    Object.keys(stateData).forEach((key) => {
      if (this.interfaceData[key]) return;

      Object.defineProperty(this.interfaceData, key, {
        get: () => {
          // 优先返回命名空间的值
          if (Object.keys(this.stateData.nested).some(nestedKey => nestedKey === key)) {
            return this.stateData.nested[key];
          }
          if (Object.keys(this.stateData).some(globalKey => globalKey === key)) {
            return this.stateData[key];
          }
          throw new Error(`没有找到${key}`);
        }
      });
    });
  }
  /**
   *获得当前的state
   *
   * @param {string} [key='']
   * @param {string} [spaceKey='']
   * @memberof State
   */
  getCurrentState(spaceKey = '') {
    return spaceKey ? this.stateData.nested[spaceKey] : this.stateData;
  }
}