var Node = function(rn, text){
    var self = this;
    this.rn = rn;
    this.text = text;
    this.parent_node = null;
    this.cost = null;
    this.deducted_cost = null;
    this.time = null;
    this.deducted_time = null;

    this.parseParam = function(pattern){
            var val = self.text.match(pattern);
            if (val && val.length > 0){
                val = val[1].split('..');
                if (val && val.length == 2){
                    return val;
                }
            }
            return null;
    };

    this.parseText = function(){
        self.cost = self.parseParam(/cost=([^\s]*)/);
        self.deducted_cost = (self.cost ? self.cost[1] : null);
        self.time = self.parseParam(/actual time=([^\s]*)/);
        self.deducted_time = (self.time ? self.time[1] : null);
        var level = self.text.match(/^[\s]*->/);
        if (self.rn == 0){ // root node
            self.level = 0;
        } else if (level != null && level.length > 0){ // plan node
            self.level = (level[0].length)-2;
        } else { // details node
            self.level = self.text.match(/^[\s]*/)[0].length;
        }
    };

    this.setParent = function(parent_node){
        self.parent_node = parent_node;
        if (parent_node != null && self.cost != null){
            self.parent_node.deductCost(self.cost[1]);
        }
        if (parent_node != null && self.time != null){
            self.parent_node.deductTime(self.time[1]);
        }
    };

    this.deductCost = function(cost){
        self.deducted_cost = self.deducted_cost - cost;
    };

    this.deductTime = function(time){
        self.deducted_time = self.deducted_time - time;
    };

    self.parseText();
    return self;
}

var PGPlanMixin = function (records){
    var nodes = [];
    var current_parrent = 0;

    var getParent = function(node){
        var ret = null;
        nodes.forEach(function(item){
            if (item.level < node.level){
                ret = item;
            }
        });
        return ret;
    }

    // build tree
    records.forEach(function(record, rn){
        var node = new Node(rn, record[0]);
        var parent_node = getParent(node);
        node.setParent(parent_node);
        nodes.push(node);
    });

    // calculate exclusive cost/time for each node
    nodes.forEach(function(node, idx){
        records[idx].cost = node.cost;
        records[idx].deducted_cost = node.deducted_cost;
        records[idx].time = node.time;
        records[idx].deducted_time = node.deducted_time;
    });

    // calculate cost/time percentage for each node
    var summary_record = records[0];
    console.log(summary_record);
    var total_cost = summary_record.cost ? summary_record.cost[1] : null;
    var total_time = summary_record.time ? summary_record.time[1] : null;

    records.forEach(function(record, idx){
        var deducted_cost = record.deducted_cost ? record.deducted_cost : null;
        var deducted_time = record.deducted_time ? record.deducted_time: null;

        var inclusive_cost_percentage = record.cost ? record.cost[1]/total_cost*100 : null;
        var inclusive_time_percentage = record.time ? record.time[1]/total_time*100 : null;
        var cost_percentage = deducted_cost ? deducted_cost/total_cost*100 : null;
        var time_percentage = deducted_time ? deducted_time/total_time*100 : null;

        record.cost_percentage = cost_percentage;
        record.inclusive_cost_percentage = inclusive_cost_percentage;
        record.time_percentage = time_percentage;
        record.inclusive_time_percentage = inclusive_time_percentage;

    });

    return records;

}

//var plan = [
//  ["Nested Loop  (cost=1.15..2.69 rows=1 width=345) (actual time=0.066..0.067 rows=1 loops=1)"]
//, ["  ->  Hash Join  (cost=1.02..2.41 rows=1 width=281) (actual time=0.060..0.060 rows=1 loops=1)"]
//, ["        Hash Cond: (s.usesysid = u.oid)"]
//, ["        ->  Function Scan on pg_stat_get_activity s  (cost=0.00..1.00 rows=100 width=217) (actual time=0.041..0.041 rows=1 loops=1)"]
//, ["        ->  Hash  (cost=1.01..1.01 rows=1 width=68) (actual time=0.007..0.007 rows=2 loops=1)"]
//, ["              Buckets: 1024  Batches: 1  Memory Usage: 1kB"]
//, ["              ->  Seq Scan on pg_authid u  (cost=0.00..1.01 rows=1 width=68) (actual time=0.005..0.006 rows=2 loops=1)"]
//, ["  ->  Index Scan using pg_database_oid_index on pg_database d  (cost=0.13..0.27 rows=1 width=68) (actual time=0.004..0.004 rows=1 loops=1)"]
//, ["        Index Cond: (oid = s.datid)"]
//, ["Planning time: 0.368 ms"]
//, ["Execution time: 0.144 ms"]
//];
//
//Plan(plan);

module.exports = PGPlanMixin;
