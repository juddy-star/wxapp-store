module.exports = {
  namespace: true,
  state: {
    count: 345
  },
  getter: {
    meme(state, getter) {
      console.log(state, 'meme');
      console.log(getter.sdfsdf, 'meme');
    },
    nnn(state) {
      console.log(state, 'nnn');
      return '缤纷的色彩';
    }
  },
  mutation: {
    oooo(payload, {
      state,
      getter,
      commit
    } = {}) {
      console.log(payload, 'ooo');
      console.log(state, 'ooo');
      console.log(getter.meme, 'ooo');
      console.log(commit('bbbb', 4356), 'ooo');
    }
  },
  action: {
    vvv(payload, {
      state,
      getter,
      commit,
      dispatch
    } = {}) {
      console.log(state, 'vvv');
      console.log(getter, 'vvv');
      console.log(commit('oooo', 333), 'vvv');

      return new Promise((resolve) => {
        dispatch('uuu', 111).then(resolve);
      });
    },
    ccc(payload, {
      state,
      getter,
      commit
    } = {}) {
      console.log(state, 'ccc');
      console.log(getter, 'ccc');
      console.log(commit('oooo', 333), 'ccc');
      console.log(state, 'mmmmmmmmmmmmmmmmmm');
      return state;
    }
  }
}