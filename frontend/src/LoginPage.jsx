import { useState } from "react";

function UsernameBox({name, setName}) {
    return (
        <label>
            Username: 
            <input value={name} onChange={(x) => setName(x.target.value)}/>
        </label>
    );
}

function PasswordBox({pass, setPass}) {
    return (
        <label> Password:
            <input type="password" value={pass} onChange={(x) => setPass(x.target.value)}/>
        </label>

    );
}

function LoginButton() {
    return <button type="submit">Login</button>
}

export default function LoginPage() {
    const [username, setUser] = useState("")
    const [password, setPassword] = useState("")

    function handleLogin(e){
        e.preventDefault()
        //this has to be connected to backend
    }

    return (
        <form>
            <UsernameBox name={username} setName={setUser}/>
            <PasswordBox pass={password} setPass={setPassword}/>
            <LoginButton />
        </form>
    );
}