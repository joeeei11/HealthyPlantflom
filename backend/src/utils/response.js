/**
 * 统一响应封装
 */

function success(res, data = null, message = 'success', code = 200) {
  return res.status(200).json({ code, data, message });
}

function fail(res, message = '请求失败', code = 400, data = null) {
  return res.status(code >= 500 ? 500 : code < 400 ? 400 : code).json({ code, data, message });
}

module.exports = { success, fail };
