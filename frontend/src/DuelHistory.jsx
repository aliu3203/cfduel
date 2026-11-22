import { use, useState } from "react";
import "./DuelHistory.css";

export default function DuelHistory() {
    const [username, setUsername] = useState("");
    const [duels, setDuels] = useState([]);
    const [error, setError] = useState("");

    async function search(username) {
        try {
            //query the past duel database
            const reply = await fetch(`/duels/history?username=${encodeURIComponent(username)}`);
            const entries = await reply.json();
            if(!reply.ok){
                setError(entries.error);
                return;
            }
            setDuels(entries.duels);
            
        } catch (err) {
            setError("server connection error");
        }
    }


    return(
        <div>
            <h1>Duel History</h1>

            <input
                type="text"
                value={username}
                onChange={(set)=>setUsername}
                placeholder="Enter Username Here..."
            />
            
            <button onClick={search}>Search</button>

            {error && <p>{error}</p>}
            {duels.map((record) => {
                let color;
                //if the searched user wins the match, then display green; lose then red; draw then gray
                if(record.result === "draw"){
                    color = "lightgray";
                }
                else if((record.result === "player1" && record.player1_username === username) || (record.result === "player2" && record.player2_username === username)){
                    color = "lightgreen";
                }
                else{
                    color = "lightred";
                }
                return(
                <div key={record.id} style={{backgroundColor:color}}>
                    {record.player1_username} ELO: {player1_old_elo + player1_rating_delta} vs. {record.player2_username} ELO: {player2_old_elo + player2_rating_delta}
                </div>
                )})}
        </div>
    );
}