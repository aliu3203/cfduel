import { useState } from "react";
import "./DuelHistory.css";

export default function DuelHistory({user}) {
    const [duels, setDuels] = useState([]);
    const [error, setError] = useState("");
    const [oppHandle, setOppHandle] = useState("");
    const [problemNum, setProblemNum] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [playedBefore, setPlayedBefore] = useState(false);
    const [searchedBefore, setSearchedBefore] = useState(false);

    async function search() {
        //clear the previous search's error before starting a new one
        setError("");
        setDuels([]);
        setSearchedBefore(false);

        try {
            //query the past duel database based on given filters
            const params = new URLSearchParams();
            if(oppHandle){
                params.set("oppHandle",oppHandle);
            }

            if(problemNum){
                params.set("problemNum",problemNum);
            }

            if(startDate){
                params.set("startDate",startDate);
            }

            if(endDate){
                params.set("endDate",endDate);
            }

            const reply = await fetch(`/api/duel/history?${params.toString()}`,{});
            const entries = await reply.json();

            if(!reply.ok){
                setError(entries.error || "search unsuccessful");
                return;
            }
            setDuels(entries.duels);
            setPlayedBefore(entries.playedBefore);
            setSearchedBefore(true);

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
                value={oppHandle}
                onChange={(e)=>setOppHandle(e.target.value)}
                placeholder="Enter Opponent Codeforces Handle Here"
            />


            <input
                type="text"
                value={problemNum}
                onChange={(e)=>setProblemNum(e.target.value)}
                placeholder="Enter Problem Number Here"
            />

            <label>
                Start Date:
                <input
                type="date"
                value={startDate}
                onChange={(e)=>setStartDate(e.target.value)}
            />
            </label>

            <label>
                End Date:
                <input
                type="date"
                value={endDate}
                onChange={(e)=>setEndDate(e.target.value)}
            />
            </label>
            
            <button onClick={search}>Search</button>

            {error && <p>{error}</p>}

            {searchedBefore && !playedBefore && (<p>No game has been played</p>)}

            {searchedBefore && playedBefore && duels.length === 0 && (<p>No duels found</p>)}

            {duels.map((record) => {
                let color;
                //if the searched user wins the match, then display green; lose then red; draw then gray
                //usernames are case-insensitive in the database, so compare them lowercased
                const searched = user.username.toLowerCase();
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

                const player1_ELO = record.player1_old_elo != null && record.player1_rating_delta != null ? record.player1_old_elo + record.player1_rating_delta : "N/A";
                const player2_ELO = record.player2_old_elo != null && record.player2_rating_delta != null ? record.player2_old_elo + record.player2_rating_delta : "N/A";
                return(
                <div key={record.id} style={{backgroundColor:color}}>
                    <p>{record.player1_username} ELO: {player1_ELO} vs. {record.player2_username} ELO: {player2_ELO}</p>
                    <p>Opponent: {record.cf_handle || "N/A"}</p>
                    <p>Problem: {record.problem_id || "N/A"}</p>
                    <p>Date: {record.ended_at ? new Date(record.ended_at).toLocaleString() : "N/A"}</p>

                </div>
                )})}
        </div>
    );
}
