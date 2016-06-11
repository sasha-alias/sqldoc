var React = require('react');
var Marked = require('marked');
var $ = require('jquery');

var SqlDoc = React.createClass({

    getInitialState: function(){
        this.floating_dsid = null;
        this.tables_headers = {};
        return null;
    },

    componentDidMount: function(){
        React.findDOMNode(this).addEventListener('scroll', this.scrollHandler);
    },

    componentWillUnmount: function(){
        React.findDOMNode(this).removeEventListener('scroll', this.scrollHandler);
    },

    getRenderer: function(query){
        if (this.props.output == 'script'){
            return this.renderTable;
        } else {
            if (query.match('^\\s*---\\s+chart\s*.*') != null){
                return this.renderChart;
            } else if (query.match('^\\s*---\\s+csv\s*.*') != null){
                return this.renderCsv;
            } else if (query.match('^\\s*---\\s+hidden\s*.*') != null){
                return this.renderHidden;
            }
            else {
                return this.renderTable;
            }
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
            return <div className="markdown-block" dangerouslySetInnerHTML={{__html: this.markdown(match[1]) }} />;
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
            return <div className="markdown-block" dangerouslySetInnerHTML={{__html: this.markdown(match[1]) }} />;
        } else {
            return null;
        }
    },

    getBlockQuery: function(query){
        if (typeof(this.props.showQuery) == 'undefined' || this.props.showQuery == false){
            return null;
        }
        return <div className="query-block"><pre>{query}</pre></div>;
    },

    render: function(){

        try {

            var self = this;
            var blocks = [];
            var duration = 0;

            // floating columns header
            var floating_cols_header = <div id={"floating-cols-header-"+this.props.eventKey} className="floating-cols-header">header</div>

            // document blocks
            this.rendered_records = {};
            for (var block_idx = 0; block_idx < this.props.data.length; block_idx++){

                duration += this.props.data[block_idx].duration;

                var renderer = this.getRenderer(this.props.data[block_idx].query);
                var datasets = this.props.data[block_idx].datasets.map(function(dataset, i){
                    var dsid = self.dsid(block_idx, i);
                    self.rendered_records[dsid] = 0;
                    return renderer(block_idx, dataset, i, self.props.data[block_idx].query);
                });

                var header = this.getHeader(this.props.data[block_idx].query);
                var footer = this.getFooter(this.props.data[block_idx].query);
                var block_query = this.getBlockQuery(this.props.data[block_idx].query);

                block = <div key={"block_"+block_idx}>{block_query}{header}{datasets}{footer}</div>;
                blocks.push(block);
            }

            // button bar
            if (this.props.buttonBar == true){
                var buttonBar = <div className="duration-div">
                    <table className="duration-table">
                    <tr>
                    <td><span className="duration-word">Time:</span> <span className="duration-number">{duration}</span> <span className="duration-word">ms</span></td>
                    <td><button type="button" className="btn btn-info" onClick={this.props.onShare}>share</button></td>
                    </tr>
                    </table>
                    </div>;
            } else {
                var buttonBar = null;
            }


            return (
                <div className="output-console">
                    {floating_cols_header}
                    {buttonBar}
                    {blocks}
                </div>
            );

            return <div/>

        } catch (err){
            return (

                <div className="error alert alert-danger">
                    SQLTABS ERROR. Please report the issue at <b>https://github.com/sasha-alias/sqltabs/issues</b> :<br/>
                    <pre>
                    {err.stack}
                    </pre>
                </div>
            );
        }
    },

    dsid: function(block_idx, dataset_idx){
        return this.props.eventKey+"_"+block_idx+"_"+dataset_idx;
    },

    renderChart: function(block_idx, dataset, dataset_idx, query){
        var dsid = this.dsid(block_idx, dataset_idx);

        if (['PGRES_FATAL_ERROR', 'PGRES_BAD_RESPONSE'].indexOf(dataset.resultStatus) > -1) {
            return <div key={'err_'+dataset_idx} className="query-error alert alert-danger">{dataset.resultErrorMessage.toString()}</div>;
        }

        var chart_type = query.match('^\\s*---\\s+chart\\s+([a-z\\-]*)\\s');
        if (chart_type != null && chart_type.length > 0){
            chart_type = chart_type[1];
        } else {
            chart_type = 'line';
        }
        var chart_args = query.match('^\\s*---\\s+chart\\s+[a-z\\-]*\\s*(.*)\\n');
        if (chart_args != null && chart_args.length > 0){
            chart_args = chart_args[1];
        } else {
            chart_args = '';
        };

        var chart_id = 'chart_'+dsid;

        var hidden_value = '<input id="data_'+chart_id+'" type="hidden" value="'+encodeURIComponent(JSON.stringify(dataset))+'"></input>';

        return(

            <div
                data-chart-id={chart_id}
                data-chart-type={chart_type}
                data-chart-args={chart_args}
                dangerouslySetInnerHTML={{__html: hidden_value}} />

        );
    },

    limit_ref: function(dsid){
        return "limit_"+dsid;
    },

    limit_item: function(dsid){
        return $("#"+this.limit_ref(dsid));
    },

    renderRecord: function(block_idx, dataset_idx, record_idx){
        fields = [<td key={'col_rownum_'+this.props.eventKey+'_'+dataset_idx+'_'+record_idx}>{record_idx+1}</td>];
        var row = this.props.data[block_idx].datasets[dataset_idx].data[record_idx];
        for (var column_idx=0; column_idx < row.length; column_idx++){
            var val = row[column_idx];
            fields.push(
                <td key={'col_'+this.props.eventKey+'_'+dataset_idx+'_'+record_idx+'_'+column_idx}>
                    {val}
                </td>
            );
        }
        return <tr key={'row_'+this.props.eventKey+'_'+dataset_idx+'_'+record_idx}>{fields}</tr>;
    },

    renderStaticRecord: function(block_idx, dataset_idx, record_idx){
        // generating text html is much faster than using react
        fields = '<td>'+(record_idx+1)+'</td>';
        var row = this.props.data[block_idx].datasets[dataset_idx].data[record_idx];
        for (var column_idx=0; column_idx < row.length; column_idx++){
            var val = row[column_idx];
            if (val != null){
                val = val.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            }
            fields += '<td>'+val+'</td>';
        }
        return '<tr>'+fields+'</tr>';
    },

    renderTable: function(block_idx, dataset, dataset_idx, query){

        var dsid = this.dsid(block_idx, dataset_idx);

        if (dataset.resultStatus == 'PGRES_COMMAND_OK'){
            return <div key={'cmdres_'+dsid} className="alert alert-success">{dataset.cmdStatus}</div>;
        } else if (['PGRES_FATAL_ERROR', 'PGRES_BAD_RESPONSE'].indexOf(dataset.resultStatus) > -1) {
            return <div key={'err_'+dsid} className="query-error alert alert-danger">{dataset.resultErrorMessage.toString()}</div>;
        } else if (dataset.resultStatus == 'PGRES_NONFATAL_ERROR') {
            return <div key={'err_'+dsid} className="query-error alert alert-info">{dataset.resultErrorMessage.toString()}</div>;
        }

        var fields = dataset.fields;
        var rows = dataset.data;

        if (fields.length == 0){
            return null;
        }

        if (fields){
            var out_fields = fields.map(function(field, i){
                return (<th key={'field_'+i}>{field.name}</th>);
            });
            out_fields.unshift(<th>#</th>);

            var floating_fields = fields.map(function(field, i){
                return (<div className="floating-field" key={'field_'+i}>{field.name}</div>);
            });
            floating_fields.unshift(<div className="floating-field">#</div>);
            this.tables_headers[dsid] = floating_fields;
        };

        var out_rows = "";
        var omitted_count = 0;
        if (this.props.buttonBar){
            var limit = Math.min(100, rows.length-this.rendered_records[dsid]); // render only 1st 100 records, the rest render on scroll
        } else {
            var limit = rows.length; // render all
        }

        for (var i=this.rendered_records[dsid]; i <= limit; i++){

            if (i == limit){
                if (i<rows.length){
                    var omitted_count = rows.length - this.rendered_records[dsid] + 1;
                    var omitted_message = '<span id="'+this.limit_ref(dsid)+'" class="omitted-message">'+omitted_count+' more </span>';
                }
                break;
            }

            var row = this.renderStaticRecord(block_idx, dataset_idx, i);
            this.rendered_records[dsid] = this.rendered_records[dsid] + 1;

            out_rows += row;
        }

        if (omitted_count > 0){
            out_rows += '<tr><td colSpan="'+fields.length+1+'">'+omitted_message+'</td></tr>';
        }

        if (dataset.nrecords == 1){
            rword = 'row';
        } else {
            rword = 'rows';
        }

        return (

            <div key={'dataset_'+dsid}>
                <div className="rows-count-div">
                <span className="rows-count-bracket">(</span>
                <span className="rows-count-number">{dataset.nrecords}</span> <span className="rows-count-word">{rword}</span>
                <span className="rows-count-bracket">)</span>
                </div>

                <table id ={'dataset_'+dsid} className="table-resultset table table-hover">
                <thead>
                    <tr id={"theader_"+dsid}>
                    {out_fields}
                    </tr>
                </thead>
                <tfoot>
                    <tr id={"tfooter_"+dsid}><td></td></tr>
                </tfoot>
                <tbody dangerouslySetInnerHTML={{__html: out_rows}}>
                </tbody>
                </table>
            </div>
        );
    },

    renderCsv: function(block_idx, dataset, dataset_idx, query){
        var dsid = this.dsid(block_idx, dataset_idx);

        var out_fields = [];
        if (dataset.fields){
            var out_fields = dataset.fields.map(function(field, i){
                var ret = [];
                ret.push(<span className="csv-field" key={"field_"+dsid+"_"+i}>{'"'+field.name+'"'}</span>);
                if (i < dataset.fields.length-1){
                    ret.push(<span className="csv-separator">,</span>);
                }
                return ret;
            });
        }
        out_fields.push(<br/>);

        var csv = "";

        for (var i=0; i<dataset.data.length; i++){
            var row = "";
            for (var j=0; j<dataset.data[i].length; j++){
                var val = dataset.data[i][j];
                if (val == null){
                    row += '<span class="csv-value">NULL</span>';
                } else {
                    row += '<span class="csv-value">"' + val.replace('"', '""') + '"</span>';
                }
                if (j != dataset.data[i].length-1){
                    row += '<span class="csv-separator">,</span>';
                }
            }
            row += "<br/>";
            csv += row;
        }

        if (dataset.nrecords == 1){
            rword = 'row';
        } else {
            rword = 'rows';
        }

        return (
        <div key={'dataset_'+dsid}>
            <div className="rows-count-div">
            <span className="rows-count-bracket">(</span>
            <span className="rows-count-number">{dataset.nrecords}</span> <span className="rows-count-word">{rword}</span>
            <span className="rows-count-bracket">)</span>
            </div>
            <div className="csv-fields-div">
            {out_fields}
            </div>
            <div className="csv-div" dangerouslySetInnerHTML={{__html: csv}}></div>
        </div>);
    },

    renderHidden: function(block_idx, dataset, dataset_idx, query){
        return null;
    },

    scrollHandler: function(e){
        var container = $(React.findDOMNode(this));
        for (var block_idx=0; block_idx < this.props.data.length; block_idx++){
            for (var dataset_idx=0; dataset_idx < this.props.data[block_idx].datasets.length; dataset_idx++){

                var dsid = this.dsid(block_idx, dataset_idx);


                // hide/show floating header
                var theader = $("#theader_"+dsid);
                var tfooter = $("#tfooter_"+dsid);
                if (typeof(theader.offset()) == 'undefined'){ // skip nontable blocks
                    continue;
                }
                var theader_offset = theader.offset().top - container.offset().top + theader.height();
                var tfooter_offset = tfooter.offset().top - container.offset().top;

                if (theader_offset < 0 && tfooter_offset > 0){
                    this.floating_dsid = dsid;
                    this.showFloatingHeader(dsid, theader.offset().left);
                } else {
                    if (dsid == this.floating_dsid){
                        this.hideFloatingHeader(dsid);
                    }
                }

                // render more records if needed
                var rendered = this.rendered_records[dsid];
                var len = this.props.data[block_idx].datasets[dataset_idx].data.length;
                if (rendered == len){
                    continue;
                }

                var limit_item = this.limit_item(dsid);

                if (typeof(limit_item) != 'undefined' && typeof(container) != 'undefined'){

                    var offset = limit_item.offset().top - container.offset().top - container.height();
                    if (offset < 0){
                        this.renderNext(block_idx, dataset_idx);
                    }
                }

            }
        }
    },

    renderNext: function(block_idx, dataset_idx){
        var dsid = this.dsid(block_idx, dataset_idx);
        var rendered = this.rendered_records[dsid];
        var len = this.props.data[block_idx].datasets[dataset_idx].data.length;
        var limit = Math.min(rendered+500, len);
        var limit_item = this.limit_item(dsid);

        if (rendered == len){
            return;
        }

        var insert_html = '';
        for (var i = rendered; i<limit; i++){
            this.rendered_records[dsid] = this.rendered_records[dsid] + 1;

            var row_html = this.renderStaticRecord(block_idx, dataset_idx, i);

            insert_html += row_html;
        }

        if (insert_html != ''){
            limit_item.closest('TR').before(insert_html);
        }

        if (this.rendered_records[dsid] == len){
            limit_item.remove();
        } else {
            var rest = len-this.rendered_records[dsid];
            limit_item.text(rest+' more');
        }
    },

    floatingHeader: function(){
        return $('#floating-cols-header-'+this.props.eventKey);
    },

    showFloatingHeader: function(dsid, left){
        var self = this;
        this.floatingHeader().show().offset({
            left: left
        });
        var header_cols = (<div className="floating-header-table">
            {this.tables_headers[dsid]}
            </div>);

        this.floatingHeader().html(React.renderToStaticMarkup(header_cols));

        this.floatingHeader().css({width: $('#dataset_'+dsid).width()});

        // get width of each column
        widths = [];
        $('#dataset_'+dsid+' th').each(function(){
            widths.push($(this).outerWidth());
        });

        // set width of floating column
        $('#floating-cols-header-'+this.props.eventKey+' .floating-field').each(function(i){
            $(this).css({width: widths[i]});
        });

        $(".output-console").bind('resize', function(e) {
            self.showFloatingHeader(dsid, left);
        });

    },

    hideFloatingHeader: function(dsid){
        this.floatingHeader().hide();
    },

    adjustFloatingHeader: function(){
        console.log(this.floatingHeader().is(':visible'));
    }


});

module.exports = SqlDoc;
