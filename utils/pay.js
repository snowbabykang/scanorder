var api = require('api.js');
var app = getApp();

module.exports = {
  pre_payorder_url: '/storeweixin/applet/show?key=appletpay',     //预下单链接
  //预下单
  pre_payorder: function (tid,sid) {
    var that = this;
    api.post({
      url: that.pre_payorder_url,
      data: {
        sid: sid,
        tid: tid
      },
      success: data => {
        console.log("预下单调用成功");
        console.log(data);
        wx.hideLoading();
        if (data.errcode == 0) {
          that.wxpayrequest(data.pay_data, tid);  //调用微信支付
        } else {      //预下单失败，提示并跳转到订单详情页，展示待支付订单
          wx.showModal({
            title: '提示',
            content: data.errmsg,
            showCancel: false,
            success: function (res) {
              //已经知道当前是否下单，则不跳转，直接从新预下单
              // wx.navigateTo({
              //   url: '../orderdetail/orderdetail?tid='+tid
              // })
            }
          })
        }
      }
    });
  },
  //调用微信支付
  wxpayrequest: function (data, tid) {
    wx.requestPayment({
      'timeStamp': data.timeStamp,
      'nonceStr': data.nonceStr,
      'package': data.package,
      'signType': 'MD5',
      'paySign': data.paySign,
      'success': function (res) {
        console.log("成功调取微信支付");
        console.log(res);
        if (res.errMsg == 'requestPayment:ok') {
          wx.redirectTo({
            url: '../paysuccess/paysuccess?tid=' + tid
          })
        } else {
          wx.showModal({
            content: '支付异常',
            showCancel: false,
            success: function () {
              wx.redirectTo({
                url: '../orderdetail/orderdetail?tid=' + tid
              })
            }
          })
        }
      },
      'fail': function (res) {
        console.log("失败调取微信支付");
        console.log(res);
        let errmsg = res.errMsg
        if (errmsg == 'requestPayment:fail cancel') {
          wx.showModal({
            content: '您已取消支付',
            showCancel: false,
            success: function () {
              wx.redirectTo({
                url: '../prdlist/prdlist',
              })
            }
          })
        } else {    //微信自己有提示，所以增加是否下单字段，可以让客户从新点击微信买单按钮又不会从新生成订单

          // wx.showModal({
          //   title: '出错啦',
          //   content: res.errMsg,
          //   showCancel: false,
          //   success: function (res) {
          //     wx.navigateTo({
          //       url: '../orderdetail/orderdetail?tid=' + tid
          //     })
          //   }
          // })
        };
      },
    })
  }
};
