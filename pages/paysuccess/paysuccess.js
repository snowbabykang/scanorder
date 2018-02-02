// pages/paysuccess/paysuccess.js
var api = require('../../utils/api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sid: '',
    table_number: '',
    orderid : '',   
    getinfo_url: '/storeweixin/applet/show?key=paysuccesss',
    total_fee : '',   //支付总金额
    pay_type : ''     //支付类型
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    this.setData({
      sid: app.globalData.sid,
      table_number: app.globalData.table_number,
      orderid: options.tid || '1981559000566002417'
    })
    this.getinfobytid();
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
  
  },
  //获取页面展示信息
  getinfobytid : function(){
    var that = this;
    api.post({
      url: that.data.getinfo_url,
      data: {
        sid: that.data.sid,
        table_number: that.data.table_number,
        tid: that.data.orderid
      },
      success: data => {
        if (data.errcode == 0) {
          console.log(data);
          that.setData({
            total_fee: data.data.order_info.payment,
            pay_type: data.data.orderPayTypeChinese
          });
        } else {
          
        }
      }
    });
  }
})