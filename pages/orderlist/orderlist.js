// pages/orderlist/orderlist.js
var api = require('../../utils/api.js');
var app = getApp();
var sliderWidth = 48;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sid : '',
    tabs: ["待付款", "已完成"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    orderlist_url: '/storeweixin/applet/show?key=orderlist', 
    orderlist : []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });
    that.setData({
      sid: app.globalData.sid
    })
    that.getorderlist(1);
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
  // onShareAppMessage: function () {
  
  // },
  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
    if (e.currentTarget.id == 0){
      var ordertype = 1;
    }else{
      var ordertype = 5;
    }
    this.getorderlist(ordertype);
  },
  getorderlist : function(ordertype){
    var that = this;
    api.post({
      url: that.data.orderlist_url,
      data: {
        sid: that.data.sid,
        type: ordertype
      },
      success: data => {
        if (data.errcode == 0) {
          that.setData({
            orderlist: data.data,
          });
        } else {
          
        }
      },
      complete: function () {
        wx.hideLoading();
      }
    });
  }


})