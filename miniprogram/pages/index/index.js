Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时执行
  },

  startGame() {
    // 跳转到游戏页面
    wx.navigateTo({
      url: '/pages/game/game'
    });
  }
});