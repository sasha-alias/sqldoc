var assert = require('assert');
var React = require('react');
var SqlDoc = require('../sqldoc');

describe('SqlDoc:', function(){
    it('single plain block', function(){

        var dataset = {
            nrecords: 1, 
            fields: ['column1'], 
            data: [[1]], 
            cmdStatus: 'SELECT 1',
            resultStatus: 'PGRES_TUPLES_OK',
            resultErrorMessage: null,
        };

        var block = {
            query: 'select 1',
            datasets: [dataset],
        };

        var data = [block];

        var doc = React.createElement(SqlDoc, {data:data});

        //console.log(React.renderToStaticMarkup(doc));
    });

    it('', function(){

        var data = [{"query":"select 1","datasets":[{"nrecords":1,"fields":[{"name":"?column?","type":23}],"data":[["1"]],"cmdStatus":"SELECT 1","resultStatus":"PGRES_TUPLES_OK","resultErrorMessage":""}],"start_time":4289.00099999737,"duration":9047.297}];


        var doc = React.createElement(SqlDoc, {data:data});

        //console.log(React.renderToStaticMarkup(doc));

    });

    it('check chart', function(){
        var data = [{"query":"--- chart pie\nSELECT city, COUNT(*) FROM employees GROUP BY city\n\n","datasets":[{"nrecords":3,"fields":[{"name":"city","type":25},{"name":"count","type":20}],"data":[["London","245"],["Paris","153"],["New York","323"]],"cmdStatus":"SELECT 3","resultStatus":"PGRES_TUPLES_OK","resultErrorMessage":""}],"start_time":2864.9700000023586,"duration":50.404}]
        var doc = React.createElement(SqlDoc, {data:data});
        console.log(React.renderToStaticMarkup(doc));

    });
});
