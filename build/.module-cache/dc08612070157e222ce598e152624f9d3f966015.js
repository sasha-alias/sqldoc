var React = require('react');
var Marked = require('marked');

var SqlDoc = React.createClass({displayName: "SqlDoc",

    render: function(){
        
        console.log(this.props.data);

        return React.createElement("div", null)
    }

});

module.exports = SqlDoc;
