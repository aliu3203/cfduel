import { useState } from "react";
import "./Login.css";

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

    async function handleLogin(e){
        e.preventDefault()
        //this has to be connected to backend
        /*
        try{
            const response = await fetch("a url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({username,password})
                }
            );

            const data = await response.json();

            if(response.ok){
                alert("login successful");
            } else{
                alert(data.message || "login failed");
            }
        } catch(error){
            alert("server cannot be connected");
        }
         */
    }

    return (
        <form className="login" onSubmit={handleLogin}>
            <UsernameBox name={username} setName={setUser}/>
            <PasswordBox pass={password} setPass={setPassword}/>
            <LoginButton />
        </form>
    );
}