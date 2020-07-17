'use strict'

const validator = require('email-validator');
const bcrypt = require('bcrypt');
const TestBugger = require('test-bugger');
const testBugger = new TestBugger({fileName: __filename});
const db = require('./../helper/db');
const jwt = require('jsonwebtoken');

function isValidate(body){
  return !body.email.trim() == '' && validator.validate(body.email) &&
    !body.password.trim() == '' && body.password.length >= 5;
}

function isEmailExist(users, email){
  return new Promise((res, rej) => {
    users.findOne({ email }).then((doc) => {
      (doc) ? res(true) : res(false);
    });
  });
}

function authenticateUser(users, body){
  const {email, password} = body;
  return new Promise((resolve) => {
    users.findOne({email}).then((doc) => {
      bcrypt.compare(password, doc.password, function(err, res) {
        if (res) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  });
}

function getjwtToken(user){
  return new Promise((res, rej) => {
    jwt.sign({user: user}, 'thisissecret', {expiresIn: '1d'}, (err, token) => {
      if (err){
        rej(true);
      } else {
        res(token);
      }
    });
  });
}

function authenticateToken(token){
  return new Promise((res, rej) => {
    jwt.verify(token, 'thisissecret', async(err, authdata) => {
      if (err){
        rej(err);
      } else {
        res(authdata);
      }
    });
  });
}

class main_handler{
  alive(req, res){
    res.send('API is running');
  }
  async signup(req, res){
    if (!isValidate(req.body)){
      return res.status(440).json({
        status: 'error',
        message: 'email and password is not valide. please try again....!',
      });
    }
    const users = db.get('user');
    if (await isEmailExist(users, req.body.email)){
      return res.status(440).json({
        status: 'error',
        message: 'This email is already exist, try login.',
      });
    }

    const userOBJ = {
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    };

    users
      .insert(userOBJ)
      .catch(err => {
          testBugger.warningLog(err)
        return res.status(440).json({
          status: 'error',
          message: "Database did't found",
        });
      });
    res.status(200).send({
      status: 'succ',
      message: 'You have created a new account',
    });
  }

  async login(req, res){
    const users = db.get('user');
    if (!(await isEmailExist(users, req.body.email) && 
        await authenticateUser(users, req.body))){
      return res.status(400).send({
        status: 'error',
        message: 'wrong email or password.',
      });
    }
    let user = {
      email: req.body.email,
      password: req.body.password,
    };

    let token;
    try {
      token = await getjwtToken(user);
    } catch (error) {
      testBugger.errorLog('Error in generating tokens 🎢 ');
      testBugger.errorLog(error);
    }
    if (token){
      return res.status(200).send({
        status: 'succ',
        message: 'you are logedin. 💛 ',
        token: token,
      });
    }
    res.status(400).send({
      status: 'error',
      message: 'authentication token error 🚒 ',
    });
  }

  async logout(req, res){
    let authData;
    try {
      authData = await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    if (authData){
      res.status(200).send({
        status: 'succ',
        message: 'remove session and token on front end side 🚒 ',
      });
    }
  }
  async profileEdit(req, res){
    let authData;
    try {
      authData = await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    let {firstname, lastname, gender, dob} = req.body;
    try {
      firstname = firstname.toString();
      lastname = lastname.toString();
      gender = gender.toString();
      dob = dob.toString();
    } catch (e){
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'Please provide valid input 🚒 ',
      });
    }

    const users = db.get('user');
    const email = authData.user.email;
    users.findOneAndUpdate({email}, 
        { $set: { firstname, lastname, gender, dob} })
      .then((updatedDoc) => {
        return res.status(200).send({
          status: 'succ',
          message: 'profile updated 💠 ',
          updatedDoc: updatedDoc,
        });
      });
  }
  async createEvent(req, res){
    let authData;
    try {
      authData = await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    let {title, description, date, time, place, maximum} = req.body;
    if (!title || !description || !date || !time || !place || !maximum){
      return res.status(400).send({
        status: 'error',
        message: 'Please provide all input 🚒 ',
      });
    }
    try {
      title = title.toString();
      description = title.toString();
      date = title.toString();
      time = title.toString();
      place = title.toString();
      maximum = parseInt(maximum);
    } catch (e){
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'Please provide valid input🚒 ',
      });
    }

    const events = db.get('events');
    const email = authData.user.email;
    const eventOBJ = {
      user: email, title, 
      description, date, time, 
      place, maximum, participates: 0,
    };
    events
      .insert(eventOBJ)
      .catch(err => {
          testBugger.warningLog(err)
        return res.status(440).json({
          status: 'error',
          message: "Database did't found",
        });
      });
    res.status(200).send({
      status: 'succ',
      message: 'You have created a new event',
    });
  }
  async getEvent(req, res){
    
    try {
      await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    const events = db.get('events');
    let output;
    try {
      output = await events.find();
    } catch (e){
      testBugger.errorLog('Error in getting data 🙉 ');
      testBugger.errorLog(e);
      return res.status(440).json({
        status: 'error',
        message: "Database did't found",
      });
    }

    res.status(200).json({
      status: 'succ',
      message: 'All events',
      data: output,
    });
  }
  async joinEvent(req, res){
    let authData;
    try {
      authData = await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    const email = authData.user.email;
    let eventId = req.query.event;
    if (!eventId){
      return res.status(440).json({
        status: 'error',
        message: "event id doesn't found",
      });
    }
    const users = db.get('user');
    try {
      await users.update({email}, { $push: { events: eventId} });
    } catch (e){
      testBugger.errorLog(e);
    }
    const events = db.get('events');
    try {
      await events.update({_id: eventId}, { $inc: { participates: 1 }});
    } catch (e){
      testBugger.errorLog(e);
    }
    try {
      await events.update({_id: eventId}, { $push: { parti: email} });
    } catch (e){
      testBugger.errorLog(e);
    }
    return res.status(200).json({
      status: 'succ',
      message: 'you joind event',
    });
  }

  async leaveEvent(req, res){
    let authData;
    try {
      authData = await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    const email = authData.user.email;
    let eventId = req.query.event;
    if (!eventId){
      return res.status(440).json({
        status: 'error',
        message: "event id doesn't found",
      });
    }
    const users = db.get('user');
    try {
      await users.update({email}, { $pull: { events: eventId} }, { multi: true });
    } catch (e){
      testBugger.errorLog(e);
    }
    const events = db.get('events');
    try {
      await events.update({_id: eventId}, { $inc: { participates: -1 }});
    } catch (e){
      testBugger.errorLog(e);
    }
    try {
      await events.update({_id: eventId}, { $pull: { parti: email}}, { multi: true });
    } catch (e){
      testBugger.errorLog(e);
    }
    return res.status(200).json({
      status: 'succ',
      message: 'you leaved event',
    });
  }
  async getParticipants(req, res){
    try {
      await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    let eventId = req.query.event;
    if (!eventId){
      return res.status(440).json({
        status: 'error',
        message: "event id doesn't found",
      });
    }
    const events = db.get('events');
    let output = await events.findOne({_id: eventId});
    res.status(200).json({
      status: 'succ',
      message: 'Participants of the event',
      participates: output['parti'],
    });
  }
  async getCreator(req, res){
    try {
      await authenticateToken(req.token);
    } catch (e){
      testBugger.errorLog('Error in auth');
      testBugger.errorLog(e);
      return res.status(400).send({
        status: 'error',
        message: 'authentication token error 🚒 ',
      });
    }
    let eventId = req.query.event;
    if (!eventId){
      return res.status(440).json({
        status: 'error',
        message: "event id doesn't found",
      });
    }
    const events = db.get('events');
    let output = await events.findOne({_id: eventId});
    const email = output.user;
    const user = db.get('user');
    output = await user.findOne({email});
    delete output._id;
    delete output.email;
    delete output.password;
    res.status(200).json({
      status: 'succ',
      message: 'creator of the events',
      user: output,
    });
  }
}

module.exports = main_handler;
