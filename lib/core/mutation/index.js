import { isObject } from '../utils/index';

/**
 *Mutation同步更新数据层方法
 *
 * @export
 * @class Mutation
 */
export default class Mutation {
  /**
   *Creates an instance of Mutation.
   * @param {*} { root = {}, options = {} }
   * @memberof Mutation
   */
  constructor({ root = {}, options = {} }) {
    this.root = root;
    this.options = options;
    this.defineProperty();
  }
  /**
   *定义变量
   *
   * @memberof Mutation
   */
  defineProperty() {
    this.interFaceMutations = {}; 
  }
  /**
   *执行入口
   *
   * @returns
   * @memberof Mutation
   */
  run() {
    return this.commit.bind(this);
  }
  /**
   *注册mutation数据
   *
   * @param {*} [mutationData={}]
   * @param {string} [spaceKey='']
   * @memberof Mutation
   */
  register(mutationData = {}, spaceKey = '') {
     // 根据spaceKey解析存储的mutation
    this.saveInterFaceMutation(mutationData, spaceKey);
  }
  /**
   *mutation数据以接口形式展示
   *
   * @param {*} [mutationData={}]
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Mutation
   */
  saveInterFaceMutation(mutationData = {}, spaceKey = '') {
    if (!isObject(mutationData)) throw new Error('mutation必须是对象');

    // 如果需要注册的mutation是空的，返回
    if (Object.keys(mutationData).length === 0) return;

    // 存储getter方法
    Object.keys(mutationData).forEach((key) => {
      const data = mutationData[key];

      if (typeof data !== 'function') throw new Error(`${key}必须是一个函数`);

      // 如果之前存在这个key，抛出错误
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;
      if (Object.keys(this.interFaceMutations).some(methodKey => methodKey === generKey)) {
        throw new Error(`Duplicate key with ${generKey}`);
      } 

      this.interFaceMutations[generKey] = data;
    });
  }
  /**
   *emit触发相应的mutation函数
   *
   * @param {string} [generKey='']
   * @param {string} [payload='']
   * @returns
   * @memberof Mutation
   */
  commit(generKey = '', payload = '') {
    if (!generKey) throw new Error('commit的第一个参数不能为空');

    const lastIndexOfSignal = generKey.lastIndexOf('/');
    const spaceKey = lastIndexOfSignal > -1 ? generKey.slice(0, lastIndexOfSignal) : '';

    const { stateIns, getterIns } = this.root;

    const currentState = stateIns.getCurrentState(spaceKey);
    const currentGetter = getterIns.getCurrentGetter(spaceKey);

    return this.interFaceMutations[generKey].call(this.root, payload, { state: currentState, getter: currentGetter, commit: this.getCurrentCommit(spaceKey) });    
  }
  /**
   *触发当前生命周期的mutation函数
   *
   * @param {string} [spaceKey='']
   * @returns
   * @memberof Mutation
   */
  getCurrentCommit(spaceKey = '') {
    return (key = '', payload = '') => {
      const generKey = spaceKey ? `${spaceKey}/${key}` : key;

      this.commit(generKey, payload);
    };
  }
}