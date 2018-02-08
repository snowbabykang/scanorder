var app = getApp();

//var host = "https://www.mymzl.com/youwuku_frame/www/index.php";
var host = "http://192.168.0.211/youwuku_frame/www/index.php";

var tryingLogin = false;

module.exports = {
  HOST: host,
  API_ROOT: host,
  API_VERSION: '1.0.0',
  post(options) {
    options.method = 'GET';
    this.request(options);
  },
  get(options) {
    options.method = 'GET';
    this.request(options);
  },
  delete(options) {
    options.method = 'DELETE';
    this.request(options);
  },
  put(options) {
    options.method = 'PUT';
    this.request(options);
  },
  request(options) {
    var apiRoot = this.API_ROOT;
    var sessionkey = '';
    try {
      sessionkey = wx.getStorageSync('sessionkey')
    } catch (e) {
      // Do something when catch error
    }
    var requireLogin = false;

    wx.checkSession({
      success: function (res) {
        requireLogin = false;
      },
      fail: function () {
        requireLogin = true;
      }
    })

    wx.request({
      url: apiRoot + options.url,
      data: options.data,
      method: options.method ? options.method : 'POST',
      header: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'SessionKey': sessionkey,
        'Device-Type': 'wxapp',
        'Api-Version': this.API_VERSION
      },
      success: res => {
        var data = res.data;
        if (data.errcode == 10000 || requireLogin) {
          wx.hideLoading();
          if (!tryingLogin) {
            tryingLogin = true;
            var hasGetUserInfo = wx.getStorageSync('hasGetUserInfo');
            if (hasGetUserInfo) {
              wx.showToast({
                title: '正在重新登录',
                icon: 'success',
                duration: 1000
              });
              setTimeout(() => {
                this.login();
              }, 1000);
            } else {
              this.login();
            }
          }
        } else {
          options.success(data);
        }
      },
      fail: function (res) {
        if (options.fail) {
          options.fail(res)
        }
      },
      complete: options.complete ? options.complete : null
    });
  },
  login: function () {
    var that = this;
    wx.login({
      success: loginRes => {
        if (loginRes.code) {
          wx.getUserInfo({
            withCredentials: true,
            success: res => {
              console.log(res);
              wx.setStorageSync('hasGetUserInfo', '1');
              that.analysisCode(loginRes.code, res.encryptedData, res.iv);
            },
            fail: (res) => {
              console.log(res);
              tryingLogin = false;
              if (res.errMsg == "getUserInfo:cancel" || res.errMsg == "getUserInfo:fail auth deny") {
                that.re_author(loginRes.code);
              }
            }
          });
        } else {
          tryingLogin = false;
        }
      },
      fail: () => {
        tryingLogin = false;
      }
    });
  },
  //解析code
  analysisCode: function (code, encryptedData, iv){
    var that = this;
    wx.request({
      url: host + '/ywkuser/applet/author',
      data: {
        code: code,
        sid: app.globalData.sid
      },
      success: function (res) {
        if (res.data.errcode == 0) {
          var sessionkey = res.data.data.sessionKey;
          try {
            wx.setStorageSync('sessionkey', sessionkey);
          } catch (e) { };
          that.updateapplet(sessionkey, encryptedData, iv);
          wx.showToast({
            title: '登录成功!',
            icon: 'success',
            duration: 1000
          });
          setTimeout(function () {
            wx.redirectTo({
              url: '/pages/prdlist/prdlist',
            });
          }, 1000);

        }
      },
      complete: () => {
        tryingLogin = false;
      }
    })
  },
  //后端存储用户信息
  updateapplet: function (sessionkey,encryptedData, iv){
    wx.request({
      url: host + '/ywkuser/applet/update',
      data: {
        sid: app.globalData.sid,
        sessionKey: sessionkey,
        encryptedData: encryptedData,
        iv: iv,
      },
      success: function (data) {
        if (data.data.errcode == 0) {
          
        }
      }
    })
  },
  //获取用户信息失败，重新提示授权
  re_author: function (code){
    var that = this;
    wx.showModal({
      title: '提示',
      content: '授权登录失败，部分功能将不能使用，是否重新登录？',
      showCancel: true,
      cancelText: "否",
      confirmText: "是",
      success: function (res) {
        if (res.confirm) {
          if (wx.openSetting) {//当前微信的版本 ，是否支持openSetting
            wx.openSetting({
              success: (res) => {
                if (res.authSetting["scope.userInfo"]) {//如果用户重新同意了授权登录
                  console.log("用户重新同意了授权登录");
                  wx.getUserInfo({//跟上面的wx.getUserInfo  sucess处理逻辑一样
                    success: function (res) {
                      wx.setStorageSync('hasGetUserInfo', '1');
                      that.analysisCode(code, res.encryptedData, res.iv);
                    }
                  })
                } else {//用户还是拒绝
                  tryingLogin = false;
                }
              },
              fail: function () {//调用失败，授权登录不成功
                tryingLogin = false;
              }
            })
          } else {
            tryingLogin = false;
          }
        }
      }
    })
  }
};
