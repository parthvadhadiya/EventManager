const validator = require("email-validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const TestBugger = require('test-bugger');
const testBugger = new TestBugger({'fileName': __filename});
const db = require('./../helper/db')

function isValidate(body){
    return !body.email.trim() == '' && validator.validate(body.email) &&
    !body.password.trim() == '' && body.password.length >= 5
}

function isEmailExist(users, email){
    return new Promise((res, rej)=>{
        users.findOne({ email }).then((doc) => {
            (doc) ? res(true) : res(false)
        })    
    })
}

function authenticateUser(users, body){
    const {email, password} = body
    return new Promise((resolve)=>{
        users.findOne({email}).then((doc)=>{
            bcrypt.compare(password, doc.password, function(err, res) {
                if(res) {
                    resolve (true)
                } else {
                    resolve(false)
                } 
              });
        })
    })
}

function getjwtToken(user){
    return new Promise((res, rej)=>{
        jwt.sign({user:user}, "thisissecret" ,(err, token)=>{
            if(err){
                rej(true)
            }else{
                res(token)
            }
        })
    })   
}

class main_handler{
    alive(req, res){
        res.send("API is running")
    }
    async signup(req, res){
        if(!isValidate(req.body)){
            return res.status(440).json({
                    status: "error",
                    message: "email and password is not valide. please try again....!"
                })
        }
        const users = db.get("user")
        if(await isEmailExist(users, req.body.email)){
            return res.status(440).json({
                status: "error",
                message: "This email is already exist, try login."
            })
        }
        
        const userOBJ = {
           email: req.body.email,
           password:  bcrypt.hashSync(req.body.password, 10) 
        }
        
        users.
            insert(userOBJ).
            catch(err => {
                return res.status(440).json({
                    status: "error",
                    message: "Database did't found"
                })
            })
        res.status(200).send({
            status: "succ",
            message: "You have created a new account"   
        })
    }

    async login(req, res){
        const users = db.get("user")
        if(!(await isEmailExist(users, req.body.email) && await authenticateUser(users, req.body))){
            return res.status(400).send({
                status: "error",
                message: "wrong email or password."   
            })
        }
        let user = {
            email: req.body.email,
            password: req.body.password
        }
        let token
        try {
            token = await getjwtToken(user)
        } catch (error) {
            testBugger.errorLog("Error in generating tokens 🎢 ")
            testBugger.errorLog(error)
        }
        if(token){
            return res.status(200).send({
                status: "succ",
                message: "you are logedin. 💛 ",
                token: token   
            })    
        }
        res.status(200).send({
            status: "error",
            message: "authentication token error 🚒 ",  
        })    
    }
}

module.exports = main_handler