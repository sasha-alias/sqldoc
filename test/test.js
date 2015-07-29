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

        console.log(React.renderToStaticMarkup(doc));
    });

    it('', function(){

        var data = [{"query":"select 1","datasets":[{"nrecords":1,"fields":[{"name":"?column?","type":23}],"data":[["1"]],"cmdStatus":"SELECT 1","resultStatus":"PGRES_TUPLES_OK","resultErrorMessage":""}],"start_time":4289.00099999737,"duration":9047.297}];

        var doc = React.createElement(SqlDoc, {data:data});

        console.log(React.renderToStaticMarkup(doc));

    });
});
