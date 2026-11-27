function validDate(date){
    if(typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)){
        return false;
    }
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function validateHistorySearch({oppUsername,problemNum,startDate,endDate}){
    if(oppUsername !== undefined && typeof oppUsername !== "string"){
        return "invalid opponent handle";
    }
    if(problemNum !== undefined && typeof problemNum !== "string"){
        return "invalid problem number";
    }
    const SDexist = startDate !== undefined && startDate !== '';
    const EDexist = endDate !== undefined && endDate !== '';
    if(SDexist !== EDexist){
        return "both start date and end date need to be specified";
    }
    if(SDexist){
        if(!validDate(startDate) || !validDate(endDate)){
            return "invalid date format";
        }
        if(startDate > endDate){
            return "start date must not be after end date";
        }
    }
    return null;
}
