// pages/orderdetail/orderdetail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderid : "",    //订单id
    orderlist: {
      id: 1,
      store: {
        id: 1,
        logo: "../../images/none.png",
        name: "门店名称"
      },
      orderstate: "待付款",
      orderprdlist: [
        { "name": "湘西外婆菜扣肉", "num": "1", "price": "26.00" },
        { "name": "罐罐红烩牛肉", "num": "10", "price": "132.00" }
      ],
      total_num: 11,
      total_fee: '1346.00'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  console.log(options)
    this.setData({
      orderid : options.id
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})