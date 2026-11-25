const USER_RE = /^[a-zA-Z0-9_]{3,30}$/;

function validateUsernameInfo({ username }) {
    if (typeof username !== 'string') {
        return "username is required";
    }
    if (!USER_RE.test(username)) {
        return "username does not have between 3-30 characters, or contains special characters";
    }
    return null;
}

function validDate(date){
    if(typeof date !== 'string || !/\d{4}-\d{2}-\d{2}$'.test(date)){
        return false;
    }
    return true;
}

export function validateHistorySearch({username,oppHandle,problemNum,startDate,endDate}){
    const nameError = validateUsernameInfo({username});
    if(nameError){
        return nameError;
    }
    if(oppHandle !== undefined && typeof oppHandle !== "string"){
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
            return "start date must be before end date";
        }
    }
}