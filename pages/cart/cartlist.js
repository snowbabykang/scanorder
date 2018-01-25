// pages/cart/cartlist.js
var api = require('../../utils/api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sid: '',
    storeid: '',
    table_number: '',
    getprdlist_url: '/storeweixin/applet/show?key=shoppingshow',
    prdlist: [],
    showprdlist: true,   //是否有商品数据,用于切换是否有记录页面
    addCart_url: "storeweixin/applet/show?key=cartoperate",    //添加购物车
    delBtnWidth: 78,  //删除按钮宽度单位（rpx）
    total_num : 0,          //总数目
    total_fee : '0.00',     //总金额
    reduce_amount : ''     //优惠券金额
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    new app.WeToast();

    this.setData({
      sid: app.globalData.sid,
      table_number: app.globalData.table_number,
      storeid: app.globalData.store.id
    })
    wx.showLoading({
      title: '加载中',
    })
    this.getprdlist();
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
    wx.showLoading({
      title: '加载中',
    })
    this.getprdlist();
    //wx.stopPullDownRefresh();
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
  //获取购物车商品列表
  getprdlist: function () {
    var that = this;
    api.post({
      url: that.data.getprdlist_url,
      data: {
        sid: that.data.sid,
        table_number: that.data.table_number,
        store_id: that.data.storeid
      },
      success: data => {
        if (data.errcode == 0) {
          if (data.data && !!data.data) {
            that.setData({
              prdlist: data.data,
              showprdlist: true,
            })
            that.get_total_fee();
          } else {
            that.setData({
              showprdlist: false
            })
          };
        } else {
          that.wetoast.toast({
            title: '购物车加载失败',
            duration: 2000
          })
          return false;
        }
      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
  //优惠金额判断
  getDiff: function(money, reduce) {
    money = parseFloat(money.toFixed(2));   
    if(!reduce || !reduce.length) return 0;
    var diff = 0;
    for(var i = 0;i<reduce.length;i++){
      if (parseFloat(money) < parseFloat(reduce[i].fullcash)) {

      }else{
        diff = parseFloat(reduce[i].cash);
      }
    };
    return diff;
	},
  //获取购物车的总数目和总金额
  get_total_fee : function(){
    var that = this;
    var total_num = 0, total_fee = '0.00', diff= 0, prdlist = that.data.prdlist;
    for (var i in prdlist){
      var mylist = prdlist[i].prdList,
          activeInfos = prdlist[i].activeInfos;    
      var current_fee = "0.00";
      for (var i = 0; i < mylist.length; i++) {
        if (mylist[i].quantity > 0){
          var price = mylist[i].price,
            num = mylist[i].buy_num;
          total_num += num;
          current_fee = parseFloat(current_fee) + parseFloat(price * num);
          total_fee = parseFloat(total_fee) + parseFloat(price * num);
        }
      };
      if (activeInfos) {
        diff += that.getDiff(current_fee, activeInfos.content_arr);
      }     
    }
    if (diff) {
      diff = parseFloat(diff).toFixed(2);
      that.setData({ reduce_amount: diff })
    };
    total_fee = parseFloat(total_fee) - parseFloat(diff);
    total_fee = parseFloat(total_fee).toFixed(2);
    that.setData({
      total_num: total_num,
      total_fee: total_fee
    })
  },
  //加菜
  add_dish : function(){
    wx.navigateBack({
      url: '../prdlist/prdlist'
    })
  },
  //请求修改购物车数据
  //opt_type :  del删除，直接去掉这个商品 
  //prdindex : prdlist的数组下标
  updatecart: function (prdid, skuid, num, opt_type, prdindex) {
    var that = this;
    api.post({
      url: that.data.addCart_url,
      data: {
        sid: that.data.sid,
        prd_id: prdid,
        store_id: that.data.storeid,
        sku_id: skuid,
        num_value: num,
        table_number: that.data.table_number
      },
      success: data => {
        var errinfo = "";
        if (data.errcode == 0) {
          var myprdlist = that.data.prdlist[prdindex].prdList;
          if (opt_type == "del"){
            errinfo = "删除商品失败";
            that.removeItem(myprdlist, skuid);
          }else{
            errinfo = "修改商品失败";
            for (var i = 0; i < myprdlist.length;i++){
              if (myprdlist[i].skuid == skuid){
                if (opt_type == "add"){
                  myprdlist[i].buy_num++;
                }else{
                  myprdlist[i].buy_num--;
                }
              }
            }
          };
          that.setData({
            prdlist: that.data.prdlist
          })
          that.get_total_fee();
        } else {
          wx.showModal({
            content: errinfo,
            showCancel: false
          });
          return false;
        }
      }
    });
  },
  //删除商品
  modifyprd : function(e){
    var that = this,
      prdid = e.target.dataset.id,
      skuid = e.target.dataset.skuid,
      allnum = e.target.dataset.num,
      opt_type = e.target.dataset.type,
      prdindex = e.target.dataset.prd;
    if (opt_type == 'del'){
      var num = '-' + allnum;
    } else if (opt_type == 'add'){
      var num = 1;
    } else if (opt_type == 'minus') {
      var num = -1;
    }
    that.updatecart(prdid, skuid, num, opt_type, prdindex);
  },

  //移除商品列表中某一项
  attrIndexOf: function (list, target) {
    var i = 0, l = list.length;
    for (i = 0; i < l; i += 1) {
      if (list[i].skuid == target) {
        return i;
      }
    };
    return -1;
  },
  removeItem: function (ObjArr, target) {
    var pos = this.attrIndexOf(ObjArr, target);
    if (pos !== -1) {
      ObjArr.splice(pos, 1);
    };
  },
  //去结算
  confirmoder : function(){
    var that = this;
    if (that.data.showprdlist){
      var prdlist = that.data.prdlist,
        num_iid = "", num = "", sku_id = "";
      for (var i in prdlist){
        for (var j in prdlist[i].prdList) {
          var prdinfo = prdlist[i].prdList[j];
          if (prdinfo.quantity > 0){
            num_iid += prdinfo.id + ':';
            num += prdinfo.buy_num + ':';
            sku_id += prdinfo.skuid + ':';
          }
        }
      }
      num_iid = num_iid.substring(0, num_iid.length - 1);
      num = num.substring(0, num.length - 1);
      sku_id = sku_id.substring(0, sku_id.length - 1);
      wx.navigateTo({
        url: '../order/order?num_iid=' + num_iid + '&num=' + num + '&sku_id=' + sku_id
      })
    }
  },
  //手指刚放到屏幕触发
  touchS: function (e) {
    //判断是否只有一个触摸点
    if (e.touches.length == 1) {
      this.setData({
        //记录触摸起始位置的X坐标
        startX: e.touches[0].clientX
      });
    }
  },
  //触摸时触发，手指在屏幕上每移动一次，触发一次
  touchM: function (e) {
    var that = this;
    if (e.touches.length == 1) {
      //记录触摸点位置的X坐标
      var moveX = e.touches[0].clientX;
      //计算手指起始点的X坐标与当前触摸点的X坐标的差值
      var disX = that.data.startX - moveX;
      //delBtnWidth 为右侧按钮区域的宽度
      var delBtnWidth = that.data.delBtnWidth;
      var txtStyle = "";
      if (disX == 0 || disX < 0) {//如果移动距离小于等于0，文本层位置不变
        txtStyle = "left:0px";
      } else if (disX > 0) {//移动距离大于0，文本层left值等于手指移动距离
        txtStyle = "left:-" + disX + "px";
        if (disX >= delBtnWidth) {
          //控制手指移动距离最大值为删除按钮的宽度
          txtStyle = "left:-" + delBtnWidth + "px";
        }
      }
      //获取手指触摸的是哪一个item
      var prdindex = e.currentTarget.dataset.prd,
          index = e.currentTarget.dataset.index;
      var list = that.data.prdlist;
      //将拼接好的样式设置到当前item中
      list[prdindex]['prdList'][index].txtStyle = txtStyle;
      //更新列表的状态
      this.setData({
        prdlist: list
      });
    }
  },
  touchE: function (e) {
    var that = this
    if (e.changedTouches.length == 1) {
      //手指移动结束后触摸点位置的X坐标
      var endX = e.changedTouches[0].clientX;
      //触摸开始与结束，手指移动的距离
      var disX = that.data.startX - endX;
      var delBtnWidth = that.data.delBtnWidth;
      //如果距离小于删除按钮的1/2，不显示删除按钮
      var txtStyle = disX > delBtnWidth / 2 ? "left:-" + delBtnWidth + "px" : "left:0px";
      //获取手指触摸的是哪一项
      var prdindex = e.currentTarget.dataset.prd,
          index = e.currentTarget.dataset.index;
      var list = that.data.prdlist;
      list[prdindex]['prdList'][index].txtStyle = txtStyle;
      //更新列表的状态
      this.setData({
        prdlist: list
      });
    }
  }
})