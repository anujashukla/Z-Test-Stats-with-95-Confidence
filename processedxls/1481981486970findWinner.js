/* we can directly read TSV or CSV into the map of groupId to Ads. For now we assumed that we are reading the tsv or csv and inserting in araay and then
converting to required map */

var fullData =    [  { groupId: 1270395262,  adId: 9783790282,  clicks: 5,   impressions: 768 },
                     { groupId: 1270395262, adId: 36655885402, clicks: 7,  impressions: 762 },
                     { groupId: 1398184462,  adId: 4221004132,  clicks: 45,  impressions: 1181 },
                     { groupId: 1444035682,  adId: 9783863122,  clicks: 6,   impressions: 699 },
                     { groupId: 1444035682,  adId: 9783863242,  clicks: 27,  impressions: 5538 }
                ];


var groupIdObj = new Map();

for (var index = 0; index < fullData.length; index ++) {
    var tempAdObject = {adId: fullData[index].adId,  clicks: fullData[index].clicks,   impressions: fullData[index].impressions}
    if (groupIdObj.has(fullData[index].groupId)) {
        var tempData = groupIdObj.get(fullData[index].groupId);
        tempData.push(tempAdObject);
        groupIdObj.set(fullData[index].groupId, tempData);
    } else {
        var tempData = [];
        tempData.push(tempAdObject);
        groupIdObj.set(fullData[index].groupId, tempData);
    }
}

for (var key of groupIdObj.keys()) {
  decide_Winner_Loser(key, groupIdObj.get(key));
}


function decide_Winner_Loser(groupId, specificGroupAds) {
    if (specificGroupAds.length == 1) {
        // there is only one ad, mark it as winner
    } else {
        for (var upperIndex = 0; upperIndex < specificGroupAds.length; upperIndex++) {
            for (var innerIndex = upperIndex+1; innerIndex < specificGroupAds.length; innerIndex++) {
                statisticalComparison(specificGroupAds[upperIndex], specificGroupAds[innerIndex])
            }
        }
        // idhar file me write karegi for given groupid
    }
}


function statisticalComparison (advertise_First, advertise_Second) {
    /* Here we need to check whether the sample data is large enough to compare it for statistics. If not, then that ad will be marked as 'NO_RESULT'
     * and will not be compared with any other add 
     */
    
    /* ----------------------------------------------------------------------------------------------------------------------------------------------*/ 
    
    /* To check whether the data is large enough or not, In statistical world, different formulae are present like as follows:
     * n p(bar) >= 5
     * n p(bar) >= 10
     * n P(bar) >=15
     * p(bar) + 3 * Standard Deviation of P(bar) and p(bar) - 3 * Standard Deviation of P(bar) should lie between 0 and 1
     */
    
    /*-----------------------------------------------------------------------------------------------------------------------------------------------*/
    
    /* For this test data, by default we are not checking for sufficiency of data, but we are giving an option where user can change the cases
     * to use different methods for checking sufficiency, and we will be using the same method for calculating the results.
     */

    /* Here the portion will come if the user asked to use one of the above sufficiency checking method */

    // For first advertisement
    var x1_bar = advertise_First.clicks;
    var n1 = advertise_First.impressions;
    var p1_bar = (advertise_First.clicks / advertise_First.impressions);
    var q1_bar = (1 - p1_bar);

    var x2_bar = advertise_Second.clicks;
    var n2 = advertise_Second.impressions;
    var p2_bar = (advertise_Second.clicks / advertise_Second.impressions);
    var q2_bar = (1 - p2_bar);


    var standard_Deviation = (p1_bar * q1_bar) / n1 + (p2_bar * q2_bar) / n2;

    /* Z can be different for different confidence level. We are using 95% confidence level. So alpha will be 1 - 0.95 = 0.05.
     * alpha by 2 will be 0.025. So as the normal distribution curve will be divided into two halves. Considering one half as 0.5.
     * As 0.5 - 0.025 = 0.475. The Z score of 0.475 is 1.96 from standard tables.
     */
    var Z_alpha_by_2 = 1.96;

    // For p1_bar - p2_bar
    var lowLevel_p1_bar = (p1_bar - p2_bar) - Z_alpha_by_2 * standard_Deviation;
    var highLevel_p1_bar = (p1_bar - p2_bar) + Z_alpha_by_2 * standard_Deviation;

    if (lowLevel_p1_bar > 0 && highLevel_p1_bar > 0) {
        // we are 95% confident that advertise one is always successful than advertise two and advertise two is loser here
    } else if (lowLevel_p1_bar < 0 && highLevel_p1_bar < 0) {
        // we are 95% confident that advertise two is always successful than advertise one and advertise one is loser here
    } else {
        // Here we cannot conclude that which is better and hence NO_RESULT
    }
}