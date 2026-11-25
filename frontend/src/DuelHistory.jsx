import { use, useState } from "react";
import "./DuelHistory.css";

export default function DuelHistory() {
    const [username, setUsername] = useState("");
    const [duels, setDuels] = useState([]);
    const [error, setError] = useState("");
    const [searchedUsername, setSearchedUsername] = useState("");

    async function search() {
        //clear the previous search's error before starting a new one
        setError("");
        try {
            //query the past duel database
            const reply = await fetch(`/api/duel/history?username=${encodeURIComponent(username)}`);
            const entries = await reply.json();
            if(!reply.ok){
                setError(entries.error);
                setDuels([]);
                return;
            }
            setDuels(entries.duels);
            setSearchedUsername(username);

        } catch (err) {
            setError("server connection error");
            setDuels([]);
        }
    }


    return(
        <div>
            <h1>Duel History</h1>

            <input
                type="text"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
                placeholder="Enter Username Here..."
            />
            
            <button onClick={search}>Search</button>

            {error && <p>{error}</p>}
            {duels.map((record) => {
                let color;
                //if the searched user wins the match, then display green; lose then red; draw then gray
                //usernames are case-insensitive in the database, so compare them lowercased
                const searched = searchedUsername.toLowerCase();
                const winner = record.result === "player1" ? record.player1_username : record.player2_username;
                if(record.result === "draw"){
                    color = "lightgray";
                }
                else if(winner.toLowerCase() === searched){
                    color = "lightgreen";
                }
                else{
                    color = "salmon";
                }
                return(
                <div key={record.id} style={{backgroundColor:color}}>
                    {record.player1_username} ELO: {record.player1_old_elo + record.player1_rating_delta} vs. {record.player2_username} ELO: {record.player2_old_elo + record.player2_rating_delta}
                </div>
                )})}
        </div>
    );
}
