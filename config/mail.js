const mail = require('nodemailer')

const transporter = mail.createTransport({
    host:'smtp.mailtrap.io',
    port:  2525,
    auth: {
        user: "a7517f24fdde39",
        pass: "999305890853c2"
    }
});
module.exports = transporter