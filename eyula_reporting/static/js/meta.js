$(document).ready(function () {
    google.charts.load('current', { 'packages': ['corechart', 'line'] });

    function drawChart(data) {
        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn('datetime', 'Date');
        dataTable.addColumn('number', 'Total Spend');
        dataTable.addRows(data.series.map(function (item) {
            return [new Date(item.date), item.total_spend];
        }));

        var options = {
            title: 'Total Spend by date',
            hAxis: {
                title: 'Date'
            },

            vAxis: {
                title: 'Total Spend'
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById('line_chart'));
        chart.draw(dataTable, options);
    };

    function getAccounts(user_id,level){
        $.ajax({
            url: 'http://127.0.0.1:5555/meta/user-levels',
            type: 'POST',
            data: JSON.stringify({
                'userId': user_id,
                'levelType': level
            }),
            headers: {
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMSIsImV4cCI6MTY3OTczNTI1MH0.YCijsJ1y_MBlRSJJJGAEu0ahJ19S6aJDGtbpqEX-l_A',
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

    function getData(user_id,date_start, date_stop, account_select, level_select, get_account = false) {
        const level = level_select.val();
        if (get_account){
            getAccounts(user_id,level);
        }; 
        
        const account_id = account_select.val();
        let datas = [];
        var params = {
            "date_start": date_start,
            "date_stop": date_stop,
            "account_id": account_id,
            "fields": ["impressions", "clicks", "total_spend", "video_view"],
            "series": ["total_spend"],
            "actions": ["video_view"],
            "kpis": ["cpc", "ctr", "cpa", "cr"],
            "level": level
        };
        
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
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMSIsImV4cCI6MTY3OTczNTI1MH0.YCijsJ1y_MBlRSJJJGAEu0ahJ19S6aJDGtbpqEX-l_A',
                'Content-Type': 'application/json'
            },
            dataType: 'json',
            success: function (data) {
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

                drawChart(firstObj);
            }
        }).fail(function (resp) {
            console.log(resp);
        });
        return datas;
    };

    $(function() {
        $('input[name="daterange"]').daterangepicker({
            opens: 'left'
        }, function(start, end, label) {
            console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
        });
    });

    const userId = 1
    const accountSelect = $('#account_id');
    const levelSelect = $('#level');
    const today = new Date("2023-03-01");
    const oneWeekAgo = new Date();
    oneWeekAgo.setTime(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    //const bearer_token = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMSIsImV4cCI6MTY3OTY1NTAzM30._gpQNb9baxo41NUQK-mRQ9w0h8XkQWmcfRaBZTPHGH0'

    const dateStop = today.toISOString().substring(0, 10);
    const dateStart = oneWeekAgo.toISOString().substring(0, 10);


    // default executed when page loads
    getData(user_id = userId,
        date_start = dateStart,
        date_stop = dateStop,
        account_select = accountSelect,
        level_select = levelSelect,
        get_account = true
    );

    // when account selected get all select list values send as parameters in getData functions
    accountSelect.change(function () {
        // block page as 1 second while post request is being made
        $('section.loading').show();

        getData(user_id = userId,
            date_start = dateStart,
            date_stop = dateStop,
            account_select = accountSelect,
            level_select = levelSelect,
        );

        setTimeout(function () {
            $('section.loading').hide();
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
        );

        setTimeout(function (){
            $('section.loading').hide();
            var level = levelSelect.val()
            if (level != 'account'){
                const newRow = `
                <div class="row" id= 'select-level-row'>
                    <div class="col-6">
                        <div class="row">
                        <div class="col-4">
                            <h1 class="h4 mb-3">Select ${level}: </h1>
                        </div>
                        <div class="col-4">
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
                    console.log(element[levelId]);
                    var optStr = `<option>${element[levelName]}</option>`
                    var opt = $(optStr);
                    opt.val(element[levelId]);

                    $('#select-level').append(opt);

                });

            };
        }, 1500);
    });


    $('body').on('change','#select-level',function(e){
        $('section.loading').show();
        var account_id = accountSelect.val();
        var level = levelSelect.val();
        key = level + '_id';
        id = e.target.value;

        const foundObject = data.find(item => item[key] === id);
        console.log(foundObject);

        var params = {
            "date_start": date_start,
            "date_stop": date_stop,
            "account_id": account_id,
            "fields": ["impressions", "clicks", "total_spend", "video_view"],
            "series": ["total_spend"],
            "actions": ["video_view"],
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

        drawChart(foundObject);

        setTimeout(function () {
            $('section.loading').hide();
        }, 1000);

    });



});

