module.exports = {
  showTips(msg, time) {
    wx.showToast({
      title: msg,
      image: '../../images/warning.png',
      duration: time
    })
  },
  hideTips(){
    
  }
}