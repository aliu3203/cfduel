function validDate(date){
    if(typeof date !== 'string || !/\d{4}-\d{2}-\d{2}$'.test(date)){
        return false;
    }
    return true;
}

export function validateHistorySearch({oppHandle,problemNum,startDate,endDate}){
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