'use strict'
const express = require('express');
var bodyParser = require('body-parser');
// var {servicePort} = require('./config/project.config')
const Handler = require('./handler/main_handler');
const handler = new Handler();
const app = express();

app.use(bodyParser.urlencoded(
  {extended: true},
));
app.use(bodyParser.json());


function verifyToken(req, res, next){
  const reqHeaders = req.headers['authorization'];
  if (typeof reqHeaders !== 'undefined'){
    const bearer = reqHeaders.split(' ')[1];
    req.token = bearer;
    next();
  } else {
    res.sendStatus(403);
  }
}

app.get('/api', handler.alive);
app.post('/api/signup', handler.signup);
app.post('/api/login', handler.login);
app.get('/api/logout', verifyToken, handler.logout);
app.post('/api/edit_profile', verifyToken, handler.profileEdit);

app.post('/api/create_event', verifyToken, handler.createEvent);
app.get('/api/get_event', verifyToken, handler.getEvent);
app.get('/api/join_event', verifyToken, handler.joinEvent);
app.get('/api/leave_event', verifyToken, handler.leaveEvent);
app.get('/api/get_participants', verifyToken, handler.getParticipants);
app.get('/api/get_creator', verifyToken, handler.getCreator);
// app.post('/api/edit', verifyToken,  handler.editUser)


app.listen(4000, () => {
  console.log(`Server is running ${4000}`);
});
