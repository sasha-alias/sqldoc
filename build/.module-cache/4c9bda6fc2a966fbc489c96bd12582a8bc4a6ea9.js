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
        for (var block_idx = 0; block_idx < this.props.data.length; block_idx++){
            duration += this.props.data[block_idx].duration;
            
            var renderer = this.getRenderer(this.props.data[block_idx].query);
            var datasets = this.props.data[block_idx].datasets.map(function(dataset, i){
                return renderer(dataset, i, self.props.data[block_idx].query);
            });

            var header = this.getHeader(this.props.data[block_idx].query);
            var footer = this.getFooter(this.props.data[block_idx].query);

            block = React.createElement("div", {key: "block_"+block_idx}, header, datasets, footer);
            blocks.push(block);
        }


        return (
            React.createElement("div", {className: "output-console"}, 
                React.createElement("div", {className: "duration-div"}, 
                React.createElement("table", {className: "duration-table"}, React.createElement("tr", null, 
                React.createElement("td", null, React.createElement("span", {className: "duration-word"}, "Time:"), " ", React.createElement("span", {className: "duration-number"}, duration), " ", React.createElement("span", {className: "duration-word"}, "ms")), 
                React.createElement("td", null, React.createElement("button", {type: "button", className: "btn btn-info", onClick: this.share}, "share"))
                ))
                ), 
                blocks
            )
        );

        return React.createElement("div", null)
    }

});

module.exports = SqlDoc;
