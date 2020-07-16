const validator = require("email-validator");
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
                status: "eroor",
                message: "This email is already exist, try login."
            })
        }
        
        const userOBJ = {
           email: req.body.email,
           password: req.body.password 
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
}

module.exports = main_handler