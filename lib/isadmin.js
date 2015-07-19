module.exports = function (role) {
  return /^(su|admin|facilitator)$/.test(role);
};
