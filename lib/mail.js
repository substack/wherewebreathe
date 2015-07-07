var mailer = require('nodemailer');

module.exports = function send (params, cb) {
  var transport = mailer.createTransport("direct", {debug: true});
  transport.sendMail({
    from: "noreply@wherewebreathe.org",
    to: String(params.to).trim(),
    subject: params.subject,
    text: params.text
  }, done);

  function done (err, res) {
    if (err) console.error('email delivery error:', err);
    cb(err, res);
    transport.close();
  }
};
