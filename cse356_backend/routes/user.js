const express = require('express');
const nodemailer = require('nodemailer');
const User = require('../models/user-model');
const connections = require('../connections');

const router = express.Router();

async function duplicateCredentials(email) {
  //check if duplicate credentials already exist in database
  let user = await User.findOne({ email });
  if (user) return true;
  return false;
}

async function saveUser(email, password, name) {
  //save user into mongodb
  try {
    const newUser = new User({ email, name, password });
    return await newUser.save();
  } catch {
    return null;
  }
}

function makeid(length) {
  let result = '';
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function sendVerificationEmail(email) {
  //send verification email
  //1. generate verification key
  //2. save verification key in mongodb
  //3. send email with /verify?email=email&key=key
  let key = makeid(10);
  try {
    const user = await User.findOneAndUpdate({ email }, { key });
    if (!user) return;
    // Send Email
    let transporter = nodemailer.createTransport({
      host: '127.0.0.1',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log('transporter configuration done');

    let html_content = `http://iwomm.cse356.compas.cs.stonybrook.edu/users/verify?email=${encodeURIComponent(
      email
    )}&key=${key}`;

    let mailOptions = {
      from: 'root@iwomm.cse356.compas.cs.stonybrook.edu',
      to: email,
      subject: 'Verification of Milestone',
      text: 'Verify your email',
      html: html_content,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(info);
      }
    });
  } catch {
    console.log('There was an error sending email');
  }
}

async function verifyKey(email, key) {
  //verify the key to the email in db
  try {
    const user = await User.findOne({ email, key });
    if (!user) return false;
    user.emailVerified = true;
    await user.save();
    return true;
  } catch {
    return false;
  }
}

async function verifyPassword(email, password) {
  //verify if user exists with such email and password in db and if it is verified
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return null;
    }
    if (user.emailVerified === false) return null;
    return user;
  } catch {
    return null;
  }
}

router.post('/signup', async (req, res) => {
  let name = req.body.name;
  let password = req.body.password;
  let email = req.body.email;
  let status = 'OK';
  let statusCode = 200;
  let user;
  if (!name || !password || !email) {
    res.send({
      error: true,
      message: 'One or more input field is missing',
    });
    return;
  }
  if (await duplicateCredentials(email)) {
    status = 'ERROR';
    statusCode = 400;
    res.send({
      error: true,
      message: 'An account with the email already exist',
    });
    return;
  } else {
    user = await saveUser(email, password, name);
    if (user === null) {
      res.send({
        error: true,
        message: 'Database Error, Account creation unsuccessful',
      });
      return;
    }
    sendVerificationEmail(email);
  }
  res.send({ name: name, status: status });
});

router.post('/login', async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let status = 'OK';
  let statusCode = 200;
  const user = await verifyPassword(email, password);
  if (!user) {
    res.send({
      error: true,
      message: 'Invalid Credential',
    });
    return;
  } else {
    res.cookie('key', user.key, { httpOnly: true });
    req.session.key = user.key;
    req.session.name = user.name;
    // console.log(req.session);
    // console.log(req.session.id);
  }
  res.send({
    name: user.name,
  });
});

router.post('/logout', async (req, res) => {
  if (!req.cookies.key) {
    res.send();
  } else {
    res.clearCookie('key', { httpOnly: true });
    if (connections[req.session.id]) {
      connections[req.session.id].end();
      delete connections[req.session.id];
    }
    req.session.destroy(function (err) {
      console.log('Destroyed session');
    });
    res.send();
  }
});

router.get('/verify', async (req, res) => {
  let email = req.query.email;
  let key = req.query.key;
  let status = 'OK';
  let statusCode = 200;
  // console.log('email: ' + req.query.email);
  // console.log('key ' + req.query.key);
  if (!(await verifyKey(email, key))) {
    res.send({
      error: true,
      message: 'Invalid/Expired Verification Link',
    });
    return;
  }
  res.send();
});

module.exports = router;
