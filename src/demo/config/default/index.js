module.exports = {
  state: {
    count: 123,
    takeaway: {
      ooo: 444
    }
  },
  getter: {
    takeaway(state) {
      return state.count;
    }
  },
  mutation: {

  },
  action: {}
}