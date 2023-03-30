$(document).ready(function () {
    const token = localStorage.getItem('token');

    if (!token) {
      // Redirect the user to the login page
      window.location.href = 'http://localhost:5555/login';
      return;
      
    google.charts.load('current', { 'packages': ['corechart', 'line','geochart']});

    function drawLineChart(data,series_field = 'total_spend') {

        var dataTable = new google.visualization.DataTable();
        var words = series_field.split('_');
        var capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)); 
        var fieldText = capitalizedWords.join(' ');

        dataTable.addColumn('datetime', 'Date');
        dataTable.addColumn('number', fieldText);
        dataTable.addRows(data.series.map(function (item) {
            return [new Date(item.date), item[series_field]];
        }));

        var options = {
            title: fieldText + ' by date',
            hAxis: {
                title: 'Date'
            },
            vAxis: {
                title: fieldText
            }
        };

        if ($('#line_chart').is(":hidden")){
            $('#line_chart').show();
        }

        var chart = new google.visualization.LineChart(document.getElementById('line_chart'));
        chart.draw(dataTable, options);
    };

    function drawRegionsMap(data){
        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn('string','Country');
        dataTable.addColumn('number','Population');
        dataTable.addRows(data);

        var options = {};

        var chart = new google.visualization.GeoChart(document.getElementById('regions_div'));

        chart.draw(dataTable, options);

    }


    function getAccounts(user_id,level){

        $.ajax({
            url: 'http://127.0.0.1:5555/meta/user-levels',
            type: 'POST',
            data: JSON.stringify({
                'userId': user_id,
                'levelType': level
            }),
            headers: {

                'Authorization': 'Bearer ' + token,

                'Content-Type':'application/json'
            },
            dataType: 'json',
            async:false,
            success: function(response){
                response.forEach(element => {
                    if (element.account_id){

                        var option = $('<option>');
                        let levelId = Object.values(element)[0];
                        let levelName = Object.values(element)[1];
                        option.val(levelId);
                        option.text(levelName);

                        $('#account_id').append(option);
                    }
                });
            }
        }).fail(function(err){
            console.log(err);
        });
    };

    function getData(user_id,date_start, date_stop, account_select, level_select,actions_select, get_account = false) {
        const level = level_select.val();

        if (get_account){
            getAccounts(user_id,level);
        }; 

        const account_id = account_select.val();
        const action_type = actions_select.val();

        let datas = [];
        var params = {
            "date_start": date_start,
            "date_stop": date_stop,
            "account_id": account_id,
            "fields": ["impressions", "clicks", "total_spend", action_type],
            "series": ["total_spend"],
            "actions": [action_type],
            "kpis": ["cpc", "ctr", "cpa", "cr"],
            "level": level
        };
        /*
        if(account_id == "default") {
            var params = {
                "date_start":'2023-02-28',
                "date_stop":'2023-03-03',
                "account_id":"525510428828068",
                "fields":["impressions","clicks","total_spend","video_view"],
                "series":["total_spend"],
                "actions":["video_view"],
                "kpis":["cpc","ctr","cpa","cr"],
                "level": level
            };
        };

        


        
        $.ajax({    
            url: "http://127.0.0.1:5555/meta/report",
            type: 'POST',
            data: JSON.stringify(params),
            headers: {

                'Authorization': 'Bearer ' + token,

                'Content-Type': 'application/json'
            },
            dataType: 'json',
            success: function (data) {
                if (data.length == 0){
                    $('#impressions').text('');
                    $('#spendings').text('');
                    $('#clicks').text('');
                    $('#conversions').text('');
                    $('#cpc').text('');
                    $('#cpa').text('');
                    $('#cr').text('');
                    $('#ctr').text('');

                    $('#line_chart').hide();

                    alert('No Data available in given dates'); 

                }else {
                    firstObj = data[0];

                    data.forEach(element => {
                        datas.push(element);
                    });
                    $('#impressions').text(firstObj.impressions_sum);
                    $('#spendings').text(firstObj.total_spend_sum);
                    $('#clicks').text(firstObj.clicks_sum);
                    $('#conversions').text(firstObj[params['actions'][0] + '_sum']);
                    $('#cpc').text(firstObj.cpc);
                    $('#cpa').text(firstObj['cpa_' + params['actions'][0]]);
                    $('#cr').text(firstObj['cr_' + params['actions'][0]]);
                    $('#ctr').text(firstObj.ctr);
    
                    drawLineChart(firstObj);
                }
            }
        }).fail(function (resp) {
            console.log(resp);
        });

        return datas;
    };

    function getCountryData(date_start, date_stop, account_select,level_select,series='total_spend'){
        const level = level_select.val();
        const account_id = account_select.val();

        var datas = [];
        var params = {
            "date_start": date_start,
            "date_stop": date_stop,
            "account_id": account_id,
            "series": [series],
            "breakdowns": ['country'],
            "level": level
        };

        $.ajax({
            url: "http://127.0.0.1:5555/meta/report",
            type: 'POST',
            data: JSON.stringify(params),
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            dataType: 'json',
            success: function(data){
                firstObj = data[0].series;
                data.forEach(element => {
                    datas.push(element);
                });

                var result = firstObj.reduce(function(accumulator, currentValue){
                    if (typeof accumulator[currentValue.country] === 'undefined') {
                        accumulator[currentValue.country] = 0;
                      }
                    accumulator[currentValue.country] += currentValue[series];
                    return accumulator;
                },{});

                result = Object.entries(result).map(([key, value]) => [key, value]);

                drawRegionsMap(data = result);
                
            }
        }).fail(function(err){
            console.log(err);
        });
        
        return datas
    };

    const userId = 1
    const accountSelect = $('#account_id');
    const levelSelect = $('#level');
    const actionsSelect = $('#actions');
    const xAxisSelect = $('#x_axis');
    const breakdownSelect = $('#breakdownSelect');
    
    const today = new Date('2023-03-01');
    const oneWeekAgo = new Date();
    oneWeekAgo.setTime(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    var dateStop = today.toISOString().substring(0, 10);
    var dateStart = oneWeekAgo.toISOString().substring(0, 10);

    // default executed when page loads
    getData(user_id = userId,
        date_start = dateStart,
        date_stop = dateStop,
        account_select = accountSelect,
        level_select = levelSelect,
        actions_select = actionsSelect,
        get_account = true
    );

    setTimeout(function(){
        getCountryData(date_start = dateStart, date_stop=date_stop, account_select = accountSelect, level_select = levelSelect);
    },1000);

    $(function () {
        $('input[name="daterange"]').daterangepicker({
            opens: 'left',
            startDate: oneWeekAgo,
            endDate: today,
            showDropdowns: false,
            locale: {
                format: 'DD/MM/YYYY'
            } 
        },
            function (start, end, label) {
                $('section.loading').show();
                dateStart = start.toISOString().substring(0, 10);
                dateStop = end.toISOString().substring(0, 10);

                getData(user_id = userId,
                    date_start = dateStart,
                    date_stop = dateStop,
                    account_select = accountSelect,
                    level_select = levelSelect,
                    actions_select = actionsSelect,
                );

            
            setTimeout(function () {
                $('section.loading').hide();
                getCountryData(date_start = dateStart, date_stop=date_stop, account_select = accountSelect, level_select = levelSelect);
            }, 1000);

            }
        );
    });


    // when account selected get all select list values send as parameters in getData functions
    accountSelect.change(function () {
        // block page as 1 second while post request is being made
        $('section.loading').show();

        getData(user_id = userId,
            date_start = dateStart,
            date_stop = dateStop,
            account_select = accountSelect,
            level_select = levelSelect,
            actions_select = actionsSelect,
        );

        setTimeout(function () {
            $('section.loading').hide();
            getCountryData(date_start = dateStart, date_stop=date_stop, account_select = accountSelect, level_select = levelSelect,series='impressions');
        }, 1000);

    });


    levelSelect.change(function () {
        // block page as 1 second while post request is being made
        $('section.loading').show();
        $('#select-level-row').remove();

        data = getData(user_id = userId,
            date_start = dateStart,
            date_stop = dateStop,
            account_select = accountSelect,
            level_select = levelSelect,
            actions_select = actionsSelect,
        );

        setTimeout(function (){
            $('section.loading').hide();
            var level = levelSelect.val();
            if (level != 'account'){
                const newRow = `
                <div class="row" id= 'select-level-row'>
                    <div class="col-6">
                        <div class="row">
                        <div class="col-3">
                            <h1 class="h4 mb-3">Select ${level}: </h1>
                        </div>
                        <div class="col-3">
                            <select class="form-select mb-3" id="select-level">
                            </select>
                        </div>
                    </div>
                </div>
                `
                $('.container-fluid.p-0').prepend(newRow);
                levelName = level + '_name'
                levelId = level + '_id'
                data.forEach(element => {
                    var optStr = `<option>${element[levelName]}</option>`
                    var opt = $(optStr);
                    opt.val(element[levelId]);

                    $('#select-level').append(opt);

                });

            };
        
            countryData = getCountryData(date_start = dateStart, date_stop=date_stop, account_select = accountSelect, level_select = levelSelect)
        }, 1500);
    });


    $('body').on('change','#select-level', function(e){
        $('section.loading').show();
        var account_id = accountSelect.val();
        var level = levelSelect.val();
        var action_type = actionsSelect.val();
        var axis = xAxisSelect.val();
        key = level + '_id';
        id = e.target.value;

        var foundObject = data.find(item => item[key] === id);
        var foundCountryObject = countryData.find(item => item[key] === id).series;

        console.log(foundCountryObject);

        foundCountryObject = foundCountryObject.reduce(function(accumulator, currentValue){
            if (typeof accumulator[currentValue.country] === 'undefined') {
                accumulator[currentValue.country] = 0;
              }
            accumulator[currentValue.country] += currentValue.total_spend;
            return accumulator;
        },{});

        foundCountryObject = Object.entries(foundCountryObject).map(([key, value]) => [key, value]);

        var params = {
            "date_start": dateStart,
            "date_stop": dateStop,
            "account_id": account_id,
            "fields": ["impressions", "clicks", "total_spend", action_type],
            "series": ["total_spend"],
            "actions": [action_type],
            "kpis": ["cpc", "ctr", "cpa", "cr"],
            "level": level
        };

        $('#impressions').text(foundObject.impressions_sum);
        $('#spendings').text(foundObject.total_spend_sum);
        $('#clicks').text(foundObject.clicks_sum);
        $('#conversions').text(foundObject[params['actions'][0] + '_sum']);
        $('#cpc').text(foundObject.cpc);
        $('#cpa').text(foundObject['cpa_' + params['actions'][0]]);
        $('#cr').text(foundObject['cr_' + params['actions'][0]]);
        $('#ctr').text(foundObject.ctr);

        drawLineChart(foundObject);
        drawRegionsMap(foundCountryObject);

        setTimeout(function () {
            $('section.loading').hide();
        }, 1000);

    });

    actionsSelect.change(function(){
        $('section.loading').show();

        getData(user_id = userId,
            date_start = dateStart,
            date_stop = dateStop,
            account_select = accountSelect,
            level_select = levelSelect,
            actions_select = actionsSelect,
            axis_select = xAxisSelect
        );

        setTimeout(function () {
            $('section.loading').hide();
        }, 1000);

    });

    xAxisSelect.change(function (){
        $('section.loading').show();

        var account_id = accountSelect.val();
        var series_field = xAxisSelect.val();
        var level = levelSelect.val();

        var params = {
            "date_start": dateStart,
            "date_stop": dateStop,
            "account_id": account_id,
            "series": [series_field],
            "level": level
        };

        $.ajax({
            url: "http://127.0.0.1:5555/meta/report",
            type: 'POST',
            data: JSON.stringify(params),
            headers: {

                'Authorization': 'Bearer ' + token,

                'Content-Type': 'application/json'
            },
            dataType: 'json',
            success: function(data){
                if ($('#select-level').length){
                    let key = level + '_id';
                    let id = $('#select-level').val();
                    let foundObject = data.find(item => item[key] === id);

                    drawLineChart(foundObject,series_field=series_field);

                }else {
                    let firstObj = data[0];

                    drawLineChart(firstObj,series_field=series_field);
                }
            }
        }).fail(function(err) {
            console.log(err);
        });

    setTimeout(function () {
        $('section.loading').hide();
    }, 1000);

    });


    breakdownSelect.change(function(){
        $('section.loading').show();
        var accountId = accountSelect.val();
        var breakdownVal = breakdownSelect.val();
        var level = levelSelect.val();

        var params = {
            "date_start": dateStart,
            "date_stop": dateStop,
            "account_id": accountId,
            "series": [breakdownVal],
            "breakdowns": ['country'],
            "level": level
        };

        console.log(params);

        $.ajax({
            url: "http://127.0.0.1:5555/meta/report",
            type: 'POST',
            data: JSON.stringify(params),
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            dataType: 'json',
            success: function(data){
                if ($('#select-level').length){
                    let key = level + '_id';
                    let id = $('#select-level').val();
                    
                    var foundCountryObject = data.find(item => item[key] === id).series;
            
                    foundCountryObject = foundCountryObject.reduce(function(accumulator, currentValue){
                        if (typeof accumulator[currentValue.country] === 'undefined') {
                            accumulator[currentValue.country] = 0;
                          }
                        accumulator[currentValue.country] += currentValue[breakdownVal];
                        return accumulator;
                    },{});
            
                    foundCountryObject = Object.entries(foundCountryObject).map(([key, value]) => [key, value]);

                    drawRegionsMap(data = foundCountryObject);

                }else {
                    let firstObj = data[0].series;

                    var result = firstObj.reduce(function(accumulator, currentValue){
                        if (typeof accumulator[currentValue.country] === 'undefined') {
                            accumulator[currentValue.country] = 0;
                          }
                        accumulator[currentValue.country] += currentValue[breakdownVal];
                        return accumulator;
                    },{});
    
                    result = Object.entries(result).map(([key, value]) => [key, value]);
    
                    drawRegionsMap(data = result);

                }

            }
        }).fail(function(err) {
            console.log(err);
        });

        setTimeout(function () {
            $('section.loading').hide();
        }, 1000);

    });

});





