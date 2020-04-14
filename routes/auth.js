const express = require("express");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");

const router = new express.Router();



/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function (req, res, next) {
    // authenticate 
    try {
        const { username, password } = req.body;
        if (await User.authenticate(username, password)) {
            //  give a token
            let payload = { username };  // come back here if OBJ is not working out
            let token = jwt.sign(payload, SECRET_KEY);
            //  update user.last_login in users
            await User.updateLoginTimestamp(username);
            // return token
            return res.json({ token });
        }else{
          throw new ExpressError("This is our error code we wrote Invalid User/Password", 400);
        }
    } 
    catch (err) {
        return next(err);
    }
});



/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

// Started to render a front-end, not currently functional

router.get('/register', function(reg, res, next) {

  return res.render("/templates/register.html")

}) 

router.post('/register', async function (req, res, next) {
    try {
        // const { username, password, first_name, last_name, phone} = req.body;
        // let user = await User.register(username, password, first_name, last_name, phone);
        let user = await User.register(req.body);
        //  give a token
        let payload = { username: user.username };
        let token = jwt.sign(payload, SECRET_KEY);
        return res.json({ token });
    }
    catch (err) {
        return next(err);
    }
});

module.exports = router;