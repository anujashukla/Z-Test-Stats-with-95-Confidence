/* we can directly read TSV or CSV into the map of groupId to Ads. For now we assumed that we are reading the tsv or csv and inserting in araay and then
converting to required map */

// Global variables
var globalResult;
var fullData;
var sufficiencyVariable;

// Initialize the header for the result to be displayed on page
var outpurString = 'groupId &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
                   'adId &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                   'status &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                   'remark';
outpurString = outpurString + '<br>'

// If user asks to display the result, show the result
$('#showHere').click(function(){
    document.getElementById('result').innerHTML = outpurString;
    $('#result').show();
})


// Check if user has selected the sufficiency condition
function processData(data, condition) {
    // Switch condition
    switch (condition) {
        case 'none':
            // No condition
            sufficiencyVariable = 0;
            break;
        case 'five':
            // nP(bar) > 5
            sufficiencyVariable = 5;
            break;
        case 'ten':
            // nP(bar) > 10
            sufficiencyVariable = 10;
            break;
        case 'fifteen':
            // nP(bar) > 15
            sufficiencyVariable = 15;
            break;
        case 'interval':
            // nP(bar) * SE falls between 0 and 1  
            sufficiencyVariable = -1;
            break;
        default:
            // do nothing
            break;
    }

    // Actual data we got from the uploded file (xls / xlsx / csv / tsv)
    fullData  =  data;

    // Resultant map
    globalResult = new Map();

    var groupIdObj = new Map();

    // Create a map with group id as the key and all the ads in array of objects as value
    for (var index = 0; index < fullData.length; index ++) {
        // Create the temporary object and insert the ad data
        var tempAdObject = {adId: fullData[index].adId,  clicks: fullData[index].clicks,   impressions: fullData[index].impressions}

        if (groupIdObj.has(fullData[index].groupId)) {
            // if group id is present in the map, get the value for that group id and push the new ad object. Set the value again to tha map
            var tempData = groupIdObj.get(fullData[index].groupId);
            tempData.push(tempAdObject);
            groupIdObj.set(fullData[index].groupId, tempData);
        } else {
            // If group id is not present in the map, set the group id with the give ad object
            var tempData = [];
            tempData.push(tempAdObject);
            groupIdObj.set(fullData[index].groupId, tempData);
        }
    }

    // For each group send all the ads of that group to compare
    for (var key of groupIdObj.keys()) {
      decide_Winner_Loser(key, groupIdObj.get(key));
    }

    // Array List to store a result to be send to server to write into a file
    var outputList = [];
    
    /* Create list. We will traverse the actual data being given to us
     * And get the result values from the map and create the the list
     */
    for (var index = 0; index < fullData.length; index ++) {
        // Get the ad object from the resultant map
        var adResult = globalResult.get(fullData[index].adId);

        // initialize an empty object
        var outputRow = {};

        // Get the data to be written in above initialized object from the resultant map
        var groupId = fullData[index].groupId;
        var adId = fullData[index].adId;

        // Variables to track status (WINNER, LOSER, NO_RESULT) and Remark (NO_COMPETITOR, INSUFFICIENT_SAMPLE_DATA)
        var status;
        var remark;

        if(adResult.groupSize == 1) {
            // If only 1 ad in the group
            status = 'NO_RESULT';
            remark = 'NO_COMPETITOR'
        } else if(adResult.sufficiency == 'insufficient') {
            // if sample data is insufficient
            status = 'NO_RESULT';
            remark = 'INSUFFICIENT_SAMPLE_DATA';
        } else if(adResult.winCounter == adResult.groupSize-1) {
            // if ad is Winner
            status = "WINNER";
            remark = '';
        } else if(adResult.loseCounter >= Math.ceil(adResult.groupSize / 2)) {
            // if ad is loser
            status = 'LOSER';
            remark = '';
        } else {
            // if there is no result after comparing the two ad
            status = 'NO_RESULT';
            remark = '';
        }

        // Set the data to output row
        outputRow = {groupId, adId, status, remark};

        // Create the string of the data at the same time, in case user opt to display the data instead of downloading the file
        outpurString = outpurString + 
                       '<br>' + groupId + 
                       '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + adId + 
                       '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + status +
                       '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + remark;

        // Push to the Array list which we will send to server to write to a file                       
        outputList.push(outputRow);


    }

    // Set the data to be sent to write in the output file
    var data = {result: outputList}

    // POST request for writing a file
    $.ajax({
      type: "POST",
      url: '/writeToFile',
      data: data,
      success: success
    });

    // The file is successfully written.
    function success () {
        // Show the download as well as display button to the user
        $('#resultButton').show();
        $('#showHere').show();
    }
}


function decide_Winner_Loser(groupId, specificGroupAds) {
    if (specificGroupAds.length == 1) {
        // there is only one ad, mark it as winner
        setGlobalNoResult(specificGroupAds[0].adId, specificGroupAds[0].adId, 1);
    } else {
        for (var upperIndex = 0; upperIndex < specificGroupAds.length; upperIndex++) {
            for (var innerIndex = upperIndex+1; innerIndex < specificGroupAds.length; innerIndex++) {
                statisticalComparison(specificGroupAds[upperIndex], specificGroupAds[innerIndex], specificGroupAds.length)
            }
        }
    }
}


function statisticalComparison (advertise_First, advertise_Second, groupSize) {
    /* Here we need to check whether the sample data is large enough to compare it for statistics. If not, then that ad will be marked as 'NO_RESULT'
     * and will not be compared with any other add 
     */
    
    /* ----------------------------------------------------------------------------------------------------------------------------------------------*/ 
    
    /* To check whether the data is large enough or not for two-proportiona-Z-test, In statistical world, different formulae are present
     like as follows:
     * n p(bar) >= 5
     * n p(bar) >= 10
     * n P(bar) >=15
     * p(bar) + 3 * Standard Error of P(bar) and p(bar) - 3 * Standard Error of P(bar) should lie between 0 and 1
     */
    
    /*-----------------------------------------------------------------------------------------------------------------------------------------------*/
    
    /* For this test data, by default we are not checking for sufficiency of data, but we are giving an option where user can change the cases
     * to use different methods for checking sufficiency, and we will be using the same method for calculating the results.
     */

    /*
        x = number of clicks
        n = number of impressions
        p = clicks per impression (success rate)
        q = 1 - p (failure rate) 
    */
    
    //For first advertisement
    var x1_bar = advertise_First.clicks;
    var n1 = advertise_First.impressions;
    var p1_bar = (advertise_First.clicks / advertise_First.impressions).toPrecision(10);
    var q1_bar = (1 - p1_bar);

    //For second advertisement
    var x2_bar = advertise_Second.clicks;
    var n2 = advertise_Second.impressions;
    var p2_bar = (advertise_Second.clicks / advertise_Second.impressions).toPrecision(10);
    var q2_bar = (1 - p2_bar);

    // Standard Error
    var standard_Error = ((p1_bar * q1_bar) / n1 + (p2_bar * q2_bar) / n2).toPrecision(10);
    standard_Error = Math.sqrt(standard_Error);

    // checking sufficiency for two-proportional-Z-test
    // Initialize boolean as sample data is sufficient
    var areAdsSufficient = true;
    if (sufficiencyVariable == -1) {
        // If last sufficiency condition is selected i.e. nP(bar) * SD falls between 0 and 1
        // Standard Deviation
        var standard_Deviation_P1 = Math.sqrt(p1_bar * q1_bar / n1);
        var standard_Deviation_P2 = Math.sqrt(p2_bar * q2_bar / n2);

        var p1_Condition = p1_bar + 3 * standard_Deviation_P1 >= 0 && p1_bar + 3 * standard_Deviation_P1 <=1 &&
                           p1_bar - 3 * standard_Deviation_P1 >= 0 && p1_bar - 3 * standard_Deviation_P1 <=1;

        var p2_Condition = p2_bar + 3 * standard_Deviation_P2 >= 0 && p2_bar + 3 * standard_Deviation_P2 <=1 &&
                           p2_bar - 3 * standard_Deviation_P2 >= 0 && p2_bar - 3 * standard_Deviation_P2 <=1;

        areAdsSufficient = checkSufficiencyCondition(p1_Condition,
                                                    advertise_First,
                                                    p2_Condition,
                                                    advertise_Second,
                                                    groupSize)
    } else if (sufficiencyVariable != 0) {
        // For all other sufficiency conditions except none i.e No Condition case
        areAdsSufficient = checkSufficiencyCondition((n1 * p1_bar >= sufficiencyVariable && n1 * q1_bar >= sufficiencyVariable),
                                                    advertise_First,
                                                    (n2 * p2_bar >= sufficiencyVariable && n2 * q2_bar >= sufficiencyVariable),
                                                    advertise_Second,
                                                    groupSize);
    }

    // If sample data for both the ads are sufficient or there is not condition selected
    if (areAdsSufficient || sufficiencyVariable == 0) {
        /* Z can be different for different confidence level. We are using 95% confidence level.
         * So alpha will be 1 - 0.95 = 0.05.
         * alpha by 2 will be 0.05 / 2 = 0.025. 
         * So as the normal distribution curve will be divided into two halves. 
         * Considering one half as 0.5, we get 0.5 - 0.025 = 0.475
         * The Z score of 0.475 is 1.96 from standard tables.
         */

        var Z_alpha_by_2 = 1.96;

        // lower level of confidence level
        var lowLevel = ((p1_bar - p2_bar) - Z_alpha_by_2 * standard_Error).toPrecision(10);

        // higher level of confidence level
        var highLevel = ((p1_bar - p2_bar) + Z_alpha_by_2 * standard_Error).toPrecision(10);

        if (lowLevel > 0 && highLevel > 0) {
           // we are 95% confident that advertise one is always successful than advertise two and advertise two is loser here
           setGlobalResult (advertise_First.adId, advertise_Second.adId, groupSize);
        } else if (lowLevel < 0 && highLevel < 0) {
            // we are 95% confident that advertise two is always successful than advertise one and advertise one is loser here
            setGlobalResult (advertise_Second.adId, advertise_First.adId, groupSize)
        } else {
            // Here we cannot conclude that which is better and hence NO_RESULT
            setGlobalNoResult(advertise_First.adId, advertise_Second.adId, groupSize);
        }
    }
}

// Sufficiency Condition for two-proportiona-Z-test
function checkSufficiencyCondition (ad1Sufficiency, ad1, ad2Sufficiency, ad2, groupSize) {
    // If both ads have sufficent sample data, return tru for further calculations
    if (ad1Sufficiency && ad2Sufficiency)
        return true;
    else {
        // If any of the ad has insufficient sample data, increase the NO_Result Counter for both
        setGlobalNoResult(ad1.adId, ad2.adId, groupSize);

        if (!ad1Sufficiency) {
            // If ad1 has insufficient, mark it as insufficient in the result map
            var tempResult = globalResult.get(ad1.adId);
            tempResult.sufficiency = 'insufficient';
            globalResult.set(ad1.adId, tempResult);
        }
        if (!ad2Sufficiency) {
            // If ad2 has insufficient, mark it as insufficient in the result map
            var tempResult = globalResult.get(ad2.adId);
            tempResult.sufficiency = 'insufficient';
            globalResult.set(ad2.adId, tempResult);
        }
    }
}

// Set the resultant map for two ads with some result
function setGlobalResult (winnerId, loserId, groupSize) {
    // variables
    var tempResultForWinner;
    var tempResultForLoser;

    if(globalResult.has(winnerId)) {
        // If winner ad id is present in the map, get the value from map and increase the winner counter for winner ad id
        tempResultForWinner = globalResult.get(winnerId);
        tempResultForWinner.winCounter ++;
        globalResult.set(winnerId, tempResultForWinner);
    } else {
        // If winner ad id is not present in the map,create a new value object for winner ad id with winner counter as 1
        tempResultForWinner = {winCounter: 1, loseCounter: 0, noResultCounter: 0, groupSize: groupSize};
        globalResult.set(winnerId, tempResultForWinner);
    }

    if(globalResult.has(loserId)) {
        // If loser ad id is present in the map, get the value from map and increase the loser counter for loser ad id
        tempResultForLoser = globalResult.get(loserId);
        tempResultForLoser.loseCounter ++;
        globalResult.set(loserId, tempResultForLoser);
    } else {
        // If loaser ad id is not present in the map,create a new value object for loser ad id with loser counter as 1
        tempResultForLoser = {winCounter: 0, loseCounter: 1, noResultCounter: 0, groupSize: groupSize};
        globalResult.set(loserId, tempResultForLoser);
    }
}

// Set the resultant map for two ads with no result
function setGlobalNoResult (noWinnerId1, noWinnerId2, groupSize) {
    // variables
    var tempResultForAd1;
    var tempResultForAd2;

    // For first ad
    if(globalResult.has(noWinnerId1)) {
        // If ad id is present in the map, get the value from map and increase the No Result counter for ad id
        tempResultForAd1 = globalResult.get(noWinnerId1);
        tempResultForAd1.noResultCounter ++;
        globalResult.set(noWinnerId1, tempResultForAd1);
    } else {
        // If ad id is not present in the map,create a new value object for ad id with No Result counter as id
        tempResultForAd1 = {winCounter: 0, loseCounter: 0, noResultCounter: 1, groupSize: groupSize};
        globalResult.set(noWinnerId1, tempResultForAd1);
    }

    // If this function is called with only one ad (in case the group has only 1 ad), just increment the No Result counter for the ad and return
    if (noWinnerId1 == noWinnerId2)
        return;

    // For second ad
    if(globalResult.has(noWinnerId2)) {
        // If ad id is present in the map, get the value from map and increase the No Result counter for ad id
        tempResultForAd2 = globalResult.get(noWinnerId2);
        tempResultForAd2.loseCounter ++;
        globalResult.set(noWinnerId2, tempResultForAd2);
    } else {
        // If winner ad id is not present in the map,create a new value object for winner ad id with winner counter as 1
        tempResultForAd2 = {winCounter: 0, loseCounter: 0, noResultCounter: 1, groupSize: groupSize};
        globalResult.set(noWinnerId2, tempResultForAd2);
    }
}