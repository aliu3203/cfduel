const USER_RE = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister( {username, email, password} ){
    if(typeof username !== 'string'){
        return "username is required";
    }
    if(typeof email !== 'string'){
        return "email is required";
    }
    if(typeof password !== 'string'){
        return "password is required";
    }

    if(!USER_RE.test(username)){
        return "username does not have between 3-30 characters, or contains special characters";
    }
    if(email.length > 250 || !EMAIL_RE.test(email)){
        return "invalid email";
    }
    if(password.length > 72 || password.length < 8){
        return "invalid password (must be between 8 or 72 characters)";
    }
    return null;
}


module.exports = {validateRegister};
