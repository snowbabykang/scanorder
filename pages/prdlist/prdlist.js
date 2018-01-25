var api = require('../../utils/api.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sid: '',
    table_number: '',
    store: {
      id: '',
      logo: "../../images/none.png",
      name: ""
    },
    getstoreinfo_url: '/storeweixin/applet/show?key=storeinfo',   //获取门店信息
    getclassfiy_url: '/storeweixin/applet/show?key=classify',
    getprdlist_url: '/storeweixin/applet/show?key=prdlist',
    classfiys: [],
    cur_classfiy: {},
    prdlist: [],
    showprdlist: true,   //是否有商品数据,用于切换是否有记录页面
    getprdinfo_url: '/storeweixin/applet/show?key=prdinfo',   //点击加入购物车，获取商品信息
    prdData: {},    //商品sku信息
    cur_prdid: "",     //当前商品id
    buyData_obj: {},    //商品购买信息，商品列表展示购买数目
    buyData_arr: [],    //商品购买信息，购物车列表展示数据
    addCart_url: "storeweixin/applet/show?key=cartoperate",    //添加购物车
    cartNum: 0,       //购物车数目(个人小购物车数目)
    showfooter: false,        //是否展示加入购物车商品列表
    showskubox: false,        //是否展示多sku选择框
    cur_sku_arr: { prdid: "", content: {} },          //当前选中的sku数组
    cur_sku_info: '',             //当前选中的sku信息，用于弹层展示
    cur_addsku_num: 1,       //当前要添加到购物车的sku数目
    total_fee: '0.00',   //购物车总金额
    removeCart_url: '/storeweixin/applet/show?key=emptyshopping',   //清空购物车
    repeatCart_url: '/storeweixin/applet/show?key=whethershopping'   //判断是否重复添加
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    new app.WeToast();

    var that = this;
    console.log(options);
    if (options.type && options.type == "wxscan"){   //小程序扫码
      app.globalData.sid = options.sid;
      app.globalData.store.id = options.store_id;
      app.globalData.table_number = options.qrc_id;
    } else if(options.q){
      var codelink = decodeURIComponent(options.q);
          codelink = codelink.split("?")[1];
      var arr = codelink.split("&");
      for(var i = 0 ; i < arr.length;i++){
        var obj = arr[i].split("=");
        if (obj[0] == 'sid') { app.globalData.sid = obj[1];}
        if (obj[0] == 'store_id') { app.globalData.store.id = obj[1];}
        if (obj[0] == 'qrc_id') { app.globalData.table_number = obj[1];}
      }
    }
    that.setData({
      sid: app.globalData.sid,
      table_number: app.globalData.table_number,
      store: { id: app.globalData.store.id, logo: "", name: "" }
    })
    //订单判断跳转
    wx.showLoading({
      title: '加载中',
    })
    this.getstoreinfo();
    this.getclassfiyslist();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var that = this;
    var buyData_obj = wx.getStorageSync('buyData_obj') ? wx.getStorageSync('buyData_obj') : {}
    if (buyData_obj) {
      var data = that.regroup_cartdata(buyData_obj);
      that.setData({
        buyData_obj: data.buyData_obj,
        buyData_arr: data.buyData_arr,
        total_fee: data.total_fee,
        cartNum: data.total_num
      });
    }
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
    return {
      title: '扫码点餐',
      path: '/pages/prdlist/prdlist'
    }
  },
  //获取门店信息
  getstoreinfo: function () {
    var that = this;
    api.post({
      url: that.data.getstoreinfo_url,
      data: {
        sid: that.data.sid,
        store_id: that.data.store.id,
      },
      success: data => {
        if (data.errcode == 0) {
          app.globalData.store.logo = data.data.logo;
          app.globalData.store.name = data.data.name;
          that.setData({
            store: {
              id: data.data.id,
              logo: data.data.logo,
              name: data.data.name
            }
          })
        } else {
          that.wetoast.toast({
            title: '获取门店信息失败',
            duration: 2000
          })
          return false;
        }
      },
    });
  },
  //获取分类列表
  getclassfiyslist: function () {
    var that = this;
    api.post({
      url: that.data.getclassfiy_url,//请求地址
      data: {//发送给后台的数据
        sid: that.data.sid,
        store_id: that.data.store.id,
      },
      success: data => {
        if (data.errcode == 0) {
          that.setData({
            classfiys: data.data,
            cur_classfiy: { catid: data.data[0].id, name: data.data[0].listname, index: 0 }
          })
          this.getprdlist(data.data[0].id);
        } else {
          that.wetoast.toast({
            title: data.errmsg,
            duration: 2000
          })
          return false;
        }
      },
    });
  },
  //获取分类下商品列表
  getprdlist: function (cid) {
    var that = this;
    if (!cid && cid !== 0) return false;
    api.post({
      url: that.data.getprdlist_url,
      data: {
        sid: that.data.sid,
        store_id: that.data.store.id,
        cats_id: cid
      },
      success: data => {
        if (data.errcode == 0) {
          if (data.data && !!data.data.count && data.data.count > 0) {
            that.setData({
              prdlist: data.data.list,
              showprdlist: true
            })
          } else {
            that.setData({
              showprdlist: false
            })
          };
        } else {
          that.wetoast.toast({
            title: '商品加载失败',
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
  //滚动加载到底部自动加载下一个分类
  prdScrollLower: function () {
    var that = this;
    /*
    //自动加载下一个分类，滑动跳转太快
    var index = that.data.cur_classfiy.index + 1;
    if (that.data.classfiys[index]){
      var cid = that.data.classfiys[index].id;
      that.setData({
        cur_classfiy: {
          catid: that.data.classfiys[index].id,
          name: that.data.classfiys[index].listname,
          index: index
        },
        prdlist: [],
      })
      that.getprdlist(cid);
    }
    */
  },
  //切换分类
  changeclassifyprd: function (event) {
    this.setData({
      cur_classfiy: {
        catid: event.currentTarget.dataset.cid,
        name: event.currentTarget.dataset.name,
        index: event.currentTarget.dataset.index
      },
      prdlist: [],
    })
    wx.showLoading({
      title: '加载中',
    })
    this.getprdlist(event.currentTarget.dataset.cid);
  },
  //添加去除购物车商品，获取商品信息
  change_cart: function (event) {
    var that = this,
      carttype = event.target.dataset.type,
      is_cart = event.target.dataset.iscart,      //直接在购物车修改数目，多sku商品不需要弹层修改
      skuid = event.target.dataset.skuid,
      prdid = event.target.dataset.prdid;
    if (!prdid) {
      that.wetoast.toast({
        title: '没有商品id',
        duration: 2000
      })
      return false;
    };
    that.setData({ cur_prdid: prdid });
    //已加载数据不再加载
    if (that.data.prdData[prdid]) {
      that.getBuyData(prdid, carttype, is_cart, skuid);
      return false;
    }
    api.post({
      url: that.data.getprdinfo_url,
      data: {
        sid: that.data.sid,
        prdid: prdid,
      },
      success: data => {
        if (data.errcode == 0) {
          data.data.is_sku = JSON.parse(data.data.is_sku);
          that.data.prdData[prdid] = data.data;
          that.setData({
            prdData: that.data.prdData
          });
          that.getBuyData(prdid, carttype, is_cart, skuid);
        }
      }
    });
  },
  //处理购物车的数据
  getBuyData: function (prdid, carttype, is_cart, skuid) {
    var that = this;
    var data = that.data.prdData[prdid], error;
    console.log(data);
    if (data.unsale == "unsale") error = '对不起，该商品已下架';
    else if (data.prd_num == 0) error = '对不起，该商品已售罄';
    if (error) {
      wx.showModal({
        title: '提示',
        content: error,
        showCancel: false
      });
      return false;
    };
    if (data.is_sku) {
      var is_moresku = data.is_sku.length ? true : false;
    };
    if (carttype == "remove") {
      if (is_moresku) {     //如果是多sku，需要弹层修改数目
        if (is_cart == '1') {     //直接在购物车列表增加数目
          that.updatecart(prdid, skuid, -1, carttype, is_moresku);
        } else {
          wx.showModal({
            title: '提示',
            content: '多规格商品请到购物车中删除哦',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                that.setData({ showfooter: true });
              }
            }
          });
        }
      } else {
        that.updatecart(prdid, data.is_sku.sku_id, -1, carttype, is_moresku);
      }
    } else {
      //单sku的时候直接获取数据
      if (!is_moresku) {
        console.log('单sku');
        that.updatecart(prdid, data.is_sku.sku_id, 1, carttype, is_moresku);
      } else {     //多sku
        console.log('多sku---' + prdid);
        if (!that.data.prdData[prdid].is_sku_obj) {   //如果数据没转换，才转换
          that.data.prdData[prdid] = that.mapSkuData(that.data.prdData[prdid]);
        };
        if (is_cart == '1') {     //直接在购物车列表增加数目
          that.updatecart(prdid, skuid, 1, carttype, is_moresku, '1');
        } else {       //需要弹层选择sku
          that.setData({
            showskubox: true,
            prdData: that.data.prdData,
            cur_sku_arr: { prdid: prdid, content: {} },
            cur_sku_info: '',
            cur_addsku_num: 1
          });
          that.init_skuchecked(prdid);
        };
      }
    };
  },
  //请求修改购物车数据
  /*
    * carttype :    add=>新增      remove=>减去
    * is_moresku :  true=>多sku    false=>单sku
    * is_cart :     '1'=>在购物车列表操作    '0'=>在商品列表操作
  */
  updatecart: function (prdid, skuid, num, carttype, is_moresku, is_cart) {
    var that = this;
    console.log("1111");
    //判断是否重复添加到购物车
    api.post({
      url: that.data.repeatCart_url,
      data: {
        sid: that.data.sid,
        prd_id: prdid,
        store_id: that.data.store.id,
        sku_id: skuid,
        table_number: that.data.table_number
      },
      success: data => {
        if (data.errcode == 1) {
          wx.showModal({
            content: '购物车已经有这个商品，是否确定添加？',
            success: function (res) {
              if (res.confirm) {
                console.log('用户点击确定')
                that.request_cart(prdid, skuid, num, carttype, is_moresku, is_cart);
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          });
        } else {  //没有重复的
          that.request_cart(prdid, skuid, num, carttype, is_moresku, is_cart);
        }
      }
    });

  },
  request_cart: function (prdid, skuid, num, carttype, is_moresku, is_cart) {
    var that = this;
    api.post({
      url: that.data.addCart_url,
      data: {
        sid: that.data.sid,
        prd_id: prdid,
        store_id: that.data.store.id,
        sku_id: skuid,
        num_value: num,
        table_number: that.data.table_number
      },
      success: data => {
        if (data.errcode == 0) {
          if (carttype == "remove") {
            that.reduce_cart(prdid, skuid, is_moresku);
          } else {
            var prdData = that.data.prdData[prdid];
            if (!is_moresku) {    //单sku 
              that.add_cart(prdid);
            } else {      //多sku
              that.add_sku_cart(prdid, skuid, num, is_cart);
            }
          };
        } else {
          wx.showModal({
            title: '提示',
            content: '购物车操作失败',
            showCancel: false
          });
          return false;
        }
      }
    });
  },
  //减去购物车数目
  reduce_cart: function (prdid, skuid, is_moresku) {
    var that = this;
    if (is_moresku) {    //多sku，对应的sku的数目也要减去
      that.data.buyData_obj[prdid].sku_arr[skuid].num--;
    };
    that.data.buyData_obj[prdid].num--;
    if (that.data.buyData_obj[prdid].num <= 0) {
      delete that.data.buyData_obj[prdid];
    }
    that.setcartData(that.data.buyData_obj);
  },
  //单sku添加购物车数目
  add_cart: function (prdid) {
    var that = this,
      prdData = that.data.prdData[prdid];
    if (that.data.buyData_obj[prdid]) {
      that.data.buyData_obj[prdid].num++;
    } else {
      that.data.buyData_obj[prdid] = {
        title: prdData.title,
        price: prdData.price,
        prd_num: prdData.prd_num,
        num_iid: prdData.num_iid,
        skuid: prdData.is_sku.sku_id,
        num: 1
      }
    };
    that.setcartData(that.data.buyData_obj);
  },
  //多sku添加购物车数目
  add_sku_cart: function (prdid, skuid, num, is_cart) {
    var that = this,
      prdData = that.data.prdData[prdid],
      cur_sku_info = that.data.cur_sku_info;
    if (is_cart == '1') {    //购物车列表直接添加数目
      that.data.buyData_obj[prdid].sku_arr[skuid].num += num;
      that.data.buyData_obj[prdid].num += num;
    } else {    //弹层添加购物车
      //前端更改购物车列表数据
      if (!that.data.buyData_obj[prdid]) {
        that.data.buyData_obj[prdid] = {
          title: prdData.title,
          is_moresku: true,
          sku_arr: {},
          num: 0,
        };
      };
      if (that.data.buyData_obj[prdid].sku_arr[cur_sku_info.sku_id]) {
        var before_skunum = that.data.buyData_obj[prdid].sku_arr[cur_sku_info.sku_id].num;
      } else {
        var before_skunum = 0;
      }
      that.data.buyData_obj[prdid].sku_arr[cur_sku_info.sku_id] = {
        title: prdData.title,
        price: cur_sku_info.price,
        prd_num: cur_sku_info.quantity,
        num_iid: prdData.num_iid,
        skuid: cur_sku_info.sku_id,
        num: before_skunum + that.data.cur_addsku_num,
        sku_alias: that.data.cur_sku_arr.content,//获取当前sku属性id和名字
      }
      that.data.buyData_obj[prdid].num += that.data.cur_addsku_num;   //多sku商品购买总数目
      that.hideskubox();
    };
    that.setcartData(that.data.buyData_obj);
  },
  //隐藏选择sku弹层
  hideskubox: function () {
    this.setData({
      showskubox: false,
    });
  },
  //展示底部
  showfooternav: function () {
    var that = this;
    that.setData({
      showfooter: !that.data.showfooter,
    });
  },
  //给购物车数组赋值
  setcartData: function (buyData_obj) {
    var that = this;
    var data = that.regroup_cartdata(buyData_obj);
    that.setData({
      buyData_obj: data.buyData_obj,
      buyData_arr: data.buyData_arr,
      total_fee: data.total_fee,
      cartNum: data.total_num
    });
    wx.setStorage({ key: "buyData_obj", data: data.buyData_obj });
  },
  //根据buyData_obj数据重组buyData_arr，total_fee，total_num
  regroup_cartdata: function (buyData_obj) {
    var that = this;
    var buyData_arr = [];
    for (var i in buyData_obj) {
      if (buyData_obj[i].is_moresku) {
        for (var j in buyData_obj[i].sku_arr) {
          buyData_arr.unshift(buyData_obj[i].sku_arr[j]);
        }
      } else {
        buyData_arr.unshift(buyData_obj[i]);
      }
    }
    var total_fee = "0.00", total_num = 0;
    for (var i = 0; i < buyData_arr.length; i++) {
      var price = buyData_arr[i].price,
        num = buyData_arr[i].num;
      total_num += num;
      total_fee = parseFloat(total_fee) + parseFloat(price * num);
    }
    total_fee = parseFloat(total_fee).toFixed(2);
    var data = {
      buyData_obj: buyData_obj,
      buyData_arr: buyData_arr,
      total_fee: total_fee,
      total_num: total_num
    };
    return data;
  },
  //遍历sku数据
  mapSkuData: function (data) {
    var that = this;
    var propertie = [];
    //汇总sku分类
    data.propertie1 && propertie.push(data.propertie1);
    data.propertie2 && propertie.push(data.propertie2);
    data.propertie3 && propertie.push(data.propertie3);
    //获取每条sku数据
    var alias = {};
    data.sku_dif_arr.map(function (e) {
      var s = (e.c_id && 'c_') || (e.s_id && 's_') || (e.sku_c1_id && 'sku_c1_'),
        id = e[s + 'id'] && (e[s + 'typeid'] + ':' + e[s + 'id']);
      if (id) alias[id] = {},
        alias[id].typename = e[s + 'typename'],
        alias[id].val = e[s + 'name'] || e[s + 'num'],
        alias[id].num = 0;
    });
    //更新sku别名
    data.property_alias.map(function (e) {
      alias[e.property] && (alias[e.property]['val'] = e.val);
    });
    var newData = {};
    data.is_sku.map(function (e) {
      newData[e.properties] = {};
      newData[e.properties].price = e.price || '暂无产品报价';
      newData[e.properties].props_img = e.props_img || '';
      newData[e.properties].quantity = e.quantity || 0;
      newData[e.properties].sku_id = e.sku_id || 0;
      e.properties.split(';').map(function (t) {
        alias[t] && (alias[t].num += parseInt(e.quantity, 10));
      });
    })
    data.is_sku_obj = newData;
    data.property_alias_obj = alias;
    data.propertie_arr = propertie;
    return data;
  },
  //初始化sku的选中，默认选中第一个
  init_skuchecked: function (prdid) {
    var that = this,
      prdData = that.data.prdData[prdid],
      propertie = that.data.prdData[prdid].propertie_arr,
      alias = that.data.prdData[prdid].property_alias_obj;
    //sku默认选中
    propertie.map(function (e, j) {
      j++;
      var index = 1;
      for (var i in alias) {
        if (alias[i].typename == e) {
          if (index == 1) {
            alias[i].checked = true;
            that.data.cur_sku_arr.content['sku' + j] = { "val": i, "name": alias[i].val };
          } else {
            alias[i].checked = false;
          }
          index++;
        }
      }
    });
    that.setData({
      prdData: that.data.prdData,
      cur_sku_arr: that.data.cur_sku_arr
    });
    that.get_cur_sku_info(prdid);
  },
  //多sku选择时展示当前库存金额
  skuChange: function (e) {
    var that = this,
      val = e.detail.value,
      propertie = e.target.dataset.propertie,
      name = e.target.dataset.name,
      prdid = e.target.dataset.prdid,
      prdData = that.data.prdData[prdid],
      alias = that.data.prdData[prdid].property_alias_obj;
    //切换radio选项
    for (var i in alias) {
      if (name == alias[i].typename) {
        if (i == val) {
          alias[i].checked = true;
        } else {
          alias[i].checked = false;
        }
      }
    }
    that.setData({ prdData: that.data.prdData });
    if (prdid == that.data.cur_sku_arr.prdid) {
      that.data.cur_sku_arr.content[propertie] = { "val": val, "name": prdData.property_alias_obj[val].val };
      that.setData({ cur_sku_arr: that.data.cur_sku_arr });
    }
    that.get_cur_sku_info(prdid);
  },
  //根据选中状态获取cur_sku_info数据
  get_cur_sku_info: function (prdid) {
    var that = this,
      prdData = that.data.prdData[prdid];
    var cur_sku = "";
    if (that.data.cur_sku_arr.content['sku1']) cur_sku += that.data.cur_sku_arr.content['sku1'].val + ";";
    if (that.data.cur_sku_arr.content['sku2']) cur_sku += that.data.cur_sku_arr.content['sku2'].val + ";";
    if (that.data.cur_sku_arr.content['sku3']) cur_sku += that.data.cur_sku_arr.content['sku3'].val + ";";
    cur_sku = cur_sku.substring(0, cur_sku.length - 1);
    var sku_obj = prdData.is_sku_obj;
    var cur_sku_info = sku_obj[cur_sku] ? sku_obj[cur_sku] : '';
    that.setData({ cur_sku_info: cur_sku_info });
  },
  //选择多sku时增删sku数目
  change_skunum: function (e) {
    var that = this,
      chnagetype = e.target.dataset.type;
    if (chnagetype == "add") {
      that.data.cur_addsku_num++;
    } else if (chnagetype == "remove" && that.data.cur_addsku_num > 1) {
      that.data.cur_addsku_num--;
    }
    that.setData({
      cur_addsku_num: that.data.cur_addsku_num
    });
  },
  //多sku添加到购物车
  addsku: function (e) {
    var that = this,
      prdid = e.target.dataset.prdid,
      data = that.data.prdData[prdid];
    if (!that.data.cur_sku_info) {
      that.wetoast.toast({
        title: '请选择商品规格',
        image: '../../images/warning.png',
        duration: 2000
      })
      return false;
    }
    //后端操作添加到购物车
    that.updatecart(prdid, that.data.cur_sku_info.sku_id, that.data.cur_addsku_num, 'add', true, '0');
  },
  //清空购物车
  removeBuyData: function () {
    var that = this;
    var prd_arr = [], buyData_arr = that.data.buyData_arr;
    for (var i = 0; i < buyData_arr.length; i++) {
      var obj = {
        prd_id: buyData_arr[i].num_iid,
        sku_id: buyData_arr[i].skuid,
        num_value: '-' + buyData_arr[i].num
      };
      prd_arr.push(obj);
    };
    //ajax请求
    api.post({
      url: that.data.removeCart_url,
      data: {
        sid: that.data.sid,
        store_id: that.data.store.id,
        table_number: that.data.table_number,
        prd: JSON.stringify(prd_arr)
      },
      success: data => {
        if (data.errcode == 0) {
          that.emptydata();
          that.setData({ showfooter: false });
        } else {
          wx.showModal({
            title: '提示',
            content: '清空购物车失败',
            showCancel: false
          });
          return false;
        }
      }
    });
  },
  emptydata: function () {
    wx.removeStorageSync('buyData_obj');
    this.setData({
      buyData_obj: {},
      buyData_arr: [],
      total_fee: '0.00',
      cartNum: 0
    });
  },
  confirmoder: function () {
    var that = this;
    that.emptydata();
    wx.navigateTo({
      url: '../cart/cartlist'
    })
    /*
    if (that.data.buyData_arr.length){
      that.emptydata();
      wx.navigateTo({
        url: '../cart/cartlist'
      })
    }else{
      that.wetoast.toast({
        title: '请添加菜品',
        image: '../../images/warning.png',
        duration: 2000
      })
    }
    */
  }
})