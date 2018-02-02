// pages/order/order.js
var api = require('../../utils/api.js');
var pay = require('../../utils/pay.js');   //预下单调取微信支付
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showTopTips : false,
    sid: '',
    table_number: '',
    storeinfo : '',
    getorderinfo_url: '/storeweixin/applet/show?key=shoppingConfirm',
    getorderinfo_params: '',     //购物车提交需要的参数
    is_orderinfo : true,    //是否正常获取商品数据
    err_msg : "",     //失败原因
    orderprdlist :[],    //商品数据
    showcoupon : false,    //是否展示选择优惠券弹层
    couponlist : "",    //优惠券列表
    def_couponinfo: {         //默认优惠券
      key: '0',
      text: '不使用优惠券',
      money: 0,
      FullReduce: 0,
      checked : false
    },    
    now_couponinfo : {},    //选中的优惠券列表
    balance : {
      value : '0',checked : false,money : "0.00"
    },
    payItems: [
      { name: '微信安全支付', value: 'wx', checked: true},
      // { name: '现金支付', value: 'cash' }
    ],
    total_num : '',    //商品总数目
    total_fee : '',    //商品总金额
    active_fee : '',    //实际付款
    total_diff : '0.00',    //商品满减总额
    before_coupon_pay : '',    //商品总金额-商品满减总额
    payorder_url: '/storeweixin/applet/show?key=placeOrder',     //生成订单链接
    is_payorder : false,     //是否已经生成订单（增加该字段主要处理调取微信支付失败的处理，避免重复下单）
    payorder_id : "",        //如果已经生成订单，就存储订单id，下次预下单时使用
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    new app.WeToast();
    
    this.setData({
      sid: app.globalData.sid,
      table_number: app.globalData.table_number,
      storeinfo: app.globalData.store,
      //getorderinfo_params: 'num_iid=526937:548622:526936&num=2:1:2&sku_id=1513133103:1513220290:1513069782',
      getorderinfo_params: 'num_iid=' + options.num_iid + '&num=' + options.num + '&sku_id=' + options.sku_id
    })
    wx.showLoading({
      title: '加载中',
    })
    this.getorderinfo();
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
  //获取订单页基本信息
  getorderinfo : function(){
    var that = this;
    api.post({
      url: that.data.getorderinfo_url +'&'+ that.data.getorderinfo_params,
      data: {
        sid: that.data.sid,
        table_number: that.data.table_number,
        store_id: that.data.storeinfo.id
      },
      success: data => {
        if (data.errcode == 0) {
          var couponlist = data.data.CouponsInfo;
          if (couponlist) couponlist.unshift(that.data.def_couponinfo);
          that.setData({
            is_orderinfo : true,
            couponlist: couponlist,
            orderprdlist: data.data.sellerInfoPrd,
            total_diff : data.data.total_diff,
            total_num : data.data.count
          });
          that.getbeforecoupon_pay();
          that.changeCoupon();
        } else {
          that.setData({
            is_orderinfo: false,
            err_msg : data.errmsg
          })
        }
      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
  //获取使用优惠券前的总金额    商品总金额-满减金额
  getbeforecoupon_pay : function(){
    var that = this,pay = "0.00";
    for (var i = 0; i < that.data.orderprdlist.length; i++) {
      var price = that.data.orderprdlist[i].price,
          num = that.data.orderprdlist[i].num;
      pay = parseFloat(pay) + parseFloat(price * num);
    }
    that.setData({
      total_fee: parseFloat(pay).toFixed(2)
    })
    pay -= that.data.total_diff;
    that.setData({
      before_coupon_pay: parseFloat(pay).toFixed(2),
      active_fee: parseFloat(pay).toFixed(2)
    })
  },
  //优惠券改变
  changeCoupon: function () {
    var that = this;
    if (!that.data.couponlist) return false;
    that.getBestCoupon();
    that.getactivefee();
  },
  //验证优惠券是否可用
  isUsefulCoupon: function (data, pay) {
    var that = this;
    pay = parseFloat(pay).toFixed(2);
    return pay >= parseFloat(data.FullReduce) && pay > parseFloat(data.money);
  },
  //获取默认选中优惠最大的优惠券   给优惠券添加checked字段，增加默认优惠券项
  getBestCoupon: function (){
    var that = this;
    var now = that.data.now_couponinfo,
        pay = that.data.before_coupon_pay;
    if (now && now.key !== '0' && that.isUsefulCoupon(now, pay)) return now;
    now = '';
    for (var i = 0; i < that.data.couponlist.length;i++){
      var e = that.data.couponlist[i];
      e.checked = false;
      if (e.key != '0' && that.isUsefulCoupon(e, pay)) {
        if (!now || parseFloat(e.money) > parseFloat(now.money)){
          now = e;
          e.checked = true;
        }
      }
    };
    that.setData({
      couponlist: that.data.couponlist,
      now_couponinfo: now || that.data.def_couponinfo
    })
  },
  //切换优惠券
  showcouponModal : function(){
    if (this.data.couponlist && this.data.couponlist.length > 0){
      this.setData({
        showcoupon: true
      })
    }else{
      this.wetoast.toast({
        title: '暂无优惠券',
        duration: 2000
      })
    }
  },
  hidecouponModal : function(){
    this.setData({
      showcoupon: false
    })
  },
  //获取实际付款金额    商品总金额-满减金额-优惠券金额
  getactivefee: function (){
    var that = this, pay = that.data.before_coupon_pay;
    pay -= that.data.now_couponinfo.money;
    pay = parseFloat(pay).toFixed(2);
    that.setData({
      active_fee: pay
    })
  },
  //选择优惠券
  selectcoupon : function(e){
    var that = this;
    var val = e.detail.value, now = "";
    for (var i = 0; i < that.data.couponlist.length; i++) {
      var e = that.data.couponlist[i];
      e.checked = false;
      if (e.key == val) {
        now = e;
        e.checked = true;
      }
    };
    that.setData({
      couponlist: that.data.couponlist,
      now_couponinfo: now
    });
    that.getactivefee();
    that.hidecouponModal();
  },
  //是否使用余额
  balanceChange : function(e){
    var balance = this.data.balance, values = e.detail.value;
    balance.value = balance.value == '1' ? '0' : '1';
    balance.checked = !balance.checked;
    this.setData({
      balance: balance
    });
  },
  //切换支付方式
  paytypeChange : function(e){
    var payItems = this.data.payItems;
    for (var i = 0, len = payItems.length; i < len; ++i) {
      payItems[i].checked = payItems[i].value == e.detail.value;
    }
    this.setData({
      payItems: payItems
    });
  },
  //去支付
  payorder:function(){
    var that = this;
    if (that.data.is_payorder){   //已下单，直接预下单
     // that.pre_payorder(that.data.payorder_id);
      pay.pre_payorder(that.data.payorder_id,that.data.sid);
    }else{
      wx.showLoading({
        title: '生成订单中...',
      })
      var CouponsId = that.data.now_couponinfo.key ? that.data.now_couponinfo.key : "";
      api.post({
        url: that.data.payorder_url+'&' + that.data.getorderinfo_params,
        data: {
          sid: that.data.sid,
          table_number: that.data.table_number,
          store_id: that.data.storeinfo.id,
          CouponsId: CouponsId,
          balance:0,
          pay_type: "zfb"
        },
        success: data => {
          if (data.errcode == 0) {
            var orderid = data.order_id;
            console.log("订单ID--"+orderid);
            //that.pre_payorder(orderid);
            pay.pre_payorder(orderid, that.data.sid);
            that.setData({
              is_payorder: true,
              payorder_id: orderid
            });
          } else {    //生成订单失败，再重新生成订单
            wx.showModal({
              title: '提示',
              content: data.errmsg,
              showCancel: false,
              success: function (res) {
                that.setData({
                  is_payorder: false,
                  payorder_id : ""
                });
              }
            })
          }
        }
      });
    }
  }
  
})