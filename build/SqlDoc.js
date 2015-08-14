var React = require('react');
var Marked = require('marked');

var SqlDoc = React.createClass({displayName: "SqlDoc",

    getRenderer: function(query){
            if (query.match('^\\s*---\\s+chart\s*.*') != null){
                return this.renderChart;
            } else {
                return this.renderDataset;
            }
    },

    markdown: function(str){
        var renderer = new Marked.Renderer();
        renderer.link = function(href, title, text){
            return '<a href="#" onClick="openExternal(\''+href+'\');">'+text+'</a>'
        };
        return Marked(str, {renderer: renderer});
    },

    getHeader: function(query){
        var cut = query.replace(/^\s*---.*[\s\n]*/, ''); 
        var match = cut.match('^\s*/\\*\\*([\\s\\S]*?)\\*\\*/');
        if (match != null && match.length == 2){
            return React.createElement("div", {className: "markdown-block", dangerouslySetInnerHTML: {__html: this.markdown(match[1])}});
        } else {
            return null;
        }
    },

    getFooter: function(query){
        var idx = query.lastIndexOf('/**');
        var idx0 = query.indexOf('/**');
        var check = query.replace(/^\s*---.*[\s\n]*/, ''); 
        if (check.substr(0,3) == '/**' && idx == idx0){ // a single markdown passed, already generated as a header so pass by
            return null;
        }
        var cut = query.substr(idx);
        var match = cut.match('/\\*\\*([\\s\\S]*?)\\*\\*/[\\s\\r\\n]*$');
        if (match != null && match.length == 2){
            return React.createElement("div", {className: "markdown-block", dangerouslySetInnerHTML: {__html: this.markdown(match[1])}});
        } else {
            return null;
        }
    },

    render: function(){
        
        var self = this;
        var blocks = [];
        var duration = 0;

        // document blocks
        for (var block_idx = 0; block_idx < this.props.data.length; block_idx++){
            duration += this.props.data[block_idx].duration;
            
            var renderer = this.getRenderer(this.props.data[block_idx].query);
            var datasets = this.props.data[block_idx].datasets.map(function(dataset, i){
                return renderer(dataset, block_idx*1000+i, self.props.data[block_idx].query);
            });

            var header = this.getHeader(this.props.data[block_idx].query);
            var footer = this.getFooter(this.props.data[block_idx].query);

            block = React.createElement("div", {key: "block_"+block_idx}, header, datasets, footer);
            blocks.push(block);
        }

        // button bar
        if (this.props.buttonBar == true){
            var buttonBar = React.createElement("div", {className: "duration-div"}, 
                React.createElement("table", {className: "duration-table"}, 
                React.createElement("tr", null, 
                React.createElement("td", null, React.createElement("span", {className: "duration-word"}, "Time:"), " ", React.createElement("span", {className: "duration-number"}, duration), " ", React.createElement("span", {className: "duration-word"}, "ms")), 
                React.createElement("td", null, React.createElement("button", {type: "button", className: "btn btn-info", onClick: this.props.onShare}, "share"))
                )
                )
                );
        } else {
            var buttonBar = null;
        }

        // charts pre script
        var prescript = '<script>document.charts_data = {};</script>';
        var charts_prescript = React.createElement("div", {dangerouslySetInnerHTML: {__html: prescript}})
        

        return (
            React.createElement("div", {className: "output-console"}, 
                charts_prescript, 
                buttonBar, 
                blocks
            )
        );

        return React.createElement("div", null)
    },

    renderChart: function(dataset, i, query){

        var chart_type = query.match('^\\s*---\\s+chart\\s+([a-z\\-]*)')[1];
        if (chart_type == ''){
            chart_type = 'line';
        }
        var chart_id = 'chart_'+this.props.eventKey+'_'+i;

        var hidden_value = '<input id="data_'+chart_id+'" type="hidden" value="'+encodeURIComponent(JSON.stringify(dataset))+'"></input>';

        return(

            React.createElement("div", {"data-chart-id": chart_id, "data-chart-type": chart_type, dangerouslySetInnerHTML: {__html: hidden_value}})

        );
    },

    renderDataset: function(dataset, dataset_idx, query){

        if (dataset.resultStatus == 'PGRES_COMMAND_OK'){
            return React.createElement("div", {key: 'cmdres_'+i, className: "alert alert-success"}, dataset.cmdStatus);
        } else if (['PGRES_FATAL_ERROR', 'PGRES_BAD_RESPONSE'].indexOf(dataset.resultStatus) > -1) {
            return React.createElement("div", {key: 'err_'+i, className: "query-error alert alert-danger"}, dataset.resultErrorMessage.toString());
        } else if (dataset.resultStatus == 'PGRES_NONFATAL_ERROR') {
            return React.createElement("div", {key: 'err_'+i, className: "query-error alert alert-info"}, dataset.resultErrorMessage.toString());
        }

        var fields = dataset.fields;
        var rows = dataset.data;

        if (fields.length == 0){
            return null;
        }

        if (fields){
            var out_fields = fields.map(function(field, i){
                return (React.createElement("th", {key: 'field_'+i}, field.name));
            });
        };

        var out_rows = [];
        var omitted_count = 0;

        for (var i=0; i < rows.length; i++){
            if (i == 2000 && rows.length > 5000){
                var omitted_count = rows.length - 2000;
                var omitted_message = React.createElement("span", {className: "omitted-message"}, omitted_count, " rows were omitted from rendering to prevent long wating");
                break;
            }

            var row = rows[i];

            var out_cols = [];
            for (var j=0; j < row.length; j++){
                var val = row[j];
                out_cols.push(
                    React.createElement("td", {key: 'col_'+i+'_'+j}, 
                        val
                    )
                );
            }

            out_rows.push(
                React.createElement("tr", {key: 'row'+i}, 
                    React.createElement("td", {className: "rownum", key: 'rownum_'+i}, i+1), 
                    out_cols
                )
            );
        }

        if (omitted_count > 0){
            out_rows.push(
                React.createElement("tr", null, 
                    React.createElement("td", {colSpan: fields.length+1}, omitted_message)
                )
            );
        }

        if (dataset.nrecords == 1){
            rword = 'row';
        } else {
            rword = 'rows';
        }
        
        return (

            React.createElement("div", {key: 'dataset_'+dataset_idx}, 
                React.createElement("div", {className: "rows-count-div"}, 
                React.createElement("span", {className: "rows-count-bracket"}, "("), 
                React.createElement("span", {className: "rows-count-number"}, dataset.nrecords), " ", React.createElement("span", {className: "rows-count-word"}, rword), 
                React.createElement("span", {className: "rows-count-bracket"}, ")")
                ), 

                React.createElement("table", {key: 'dataset_'+dataset_idx, className: "table-resultset table table-hover"}, 
                React.createElement("thead", null, 
                    React.createElement("tr", null, 
                    React.createElement("th", {className: "rownum"}, "#"), 
                    out_fields
                    )
                ), 
                React.createElement("tbody", null, 
                out_rows
                )
                )
            )
        );
    },


});

module.exports = SqlDoc;
