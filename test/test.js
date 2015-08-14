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
        //console.log(React.renderToStaticMarkup(doc));

    });

    it('multiple sql blocks', function(){
        var data = [{"query":"--- chart pie\nSELECT city, COUNT(*) FROM employees GROUP BY city\n","datasets":[{"nrecords":3,"fields":[{"name":"city","type":25},{"name":"count","type":20}],"data":[["London","245"],["Paris","153"],["New York","323"]],"cmdStatus":"SELECT 3","resultStatus":"PGRES_TUPLES_OK","resultErrorMessage":""}],"start_time":11782.757000000856,"duration":52.473},{"query":"--- chart line\nselect * from generate_series(1, 10)\n","datasets":[{"nrecords":10,"fields":[{"name":"generate_series","type":23}],"data":[["1"],["2"],["3"],["4"],["5"],["6"],["7"],["8"],["9"],["10"]],"cmdStatus":"SELECT 10","resultStatus":"PGRES_TUPLES_OK","resultErrorMessage":""}],"start_time":11836.935999999696,"duration":23.839}]
        var doc = React.createElement(SqlDoc, {data:data});
        //console.log(React.renderToStaticMarkup(doc));
    });

    it('check script output', function(){
        var data = [{"query":"--- chart pie\nSELECT city, COUNT(*) FROM employees GROUP BY city\n\n","datasets":[{"nrecords":3,"fields":[{"name":"city","type":25},{"name":"count","type":20}],"data":[["London","245"],["Paris","153"],["New York","323"]],"cmdStatus":"SELECT 3","resultStatus":"PGRES_TUPLES_OK","resultErrorMessage":""}],"start_time":2864.9700000023586,"duration":50.404}]
        var doc = React.createElement(SqlDoc, {data:data, output:"script"});
        console.log(React.renderToStaticMarkup(doc));

    });
});
