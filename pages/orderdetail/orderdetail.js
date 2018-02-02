// pages/orderdetail/orderdetail.js
var api = require('../../utils/api.js');
var pay = require('../../utils/pay.js');
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderid : "",    //订单id
    getorderinfo_url: '/storeweixin/applet/show?key=orderdetail',
    orderinfo: "",
    err_msg : '',   //错误信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    that.setData({
      sid: app.globalData.sid,
      orderid : options.tid
    })
   that.getorderinfo();
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
  //获取订单详情
  getorderinfo : function(){
    var that = this;
    api.post({
      url: that.data.getorderinfo_url,
      data: {
        sid: that.data.sid,
        tid: that.data.orderid
      },
      success: data => {
        if (data.errcode == 0) {
          that.setData({
            orderinfo: data.data,
          });
        } else {
          that.setData({
            err_msg: data.errmsg,
          });
        }
      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
  //去支付
  payorder: function () {
    var that = this;
    pay.pre_payorder(that.data.orderid, that.data.sid);
  }

})