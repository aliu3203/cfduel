import { useState } from "react";

function UsernameBox() {
    return (
        <label>
            Username: 
            <input> 

            </input>
        </label>
    );
}

function PasswordBox() {
    return (
        <label> Password:
            <input>

            </input>
        </label>

    );
}

function LoginButton() {
    function handleClick(){
        alert("login")
    };

    return (<button onClick={handleClick}>
        Login
    </button>);
}

export default function LoginPage() {
    return (
        <form>
            <UsernameBox />
            <PasswordBox />
            <LoginButton />
        </form>
    );
}