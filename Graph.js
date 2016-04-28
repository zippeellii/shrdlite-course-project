var Edge = (function () {
    function Edge() {
    }
    return Edge;
}());
var SearchResult = (function () {
    function SearchResult() {
    }
    return SearchResult;
}());
function aStarSearch(graph, start, goal, heuristics, timeout) {
    var bestNode = start;
    var gCost = new collections.Dictionary();
    gCost.setValue(start, 0);
    var paths = new collections.Dictionary();
    paths.setValue(start, null);
    var f = function (a, b) {
        return gCost.getValue(b) + heuristics(b) - (gCost.getValue(a) + heuristics(a));
    };
    var frontier = new collections.PriorityQueue(f);
    frontier.add(start);
    while (!goal(bestNode)) {
        bestNode = frontier.dequeue();
        for (var _i = 0, _a = graph.outgoingEdges(bestNode); _i < _a.length; _i++) {
            var edge = _a[_i];
            var edgeCost = edge.cost;
            var gNew = gCost.getValue(edge.from) + edgeCost;
            if (gCost.containsKey(edge.to)) {
                var gOld = gCost.getValue(edge.to);
                if (gNew < gOld) {
                    gCost.setValue(edge.to, gNew);
                    paths.setValue(edge.to, edge.from);
                    frontier.enqueue(edge.to);
                }
            }
            else {
                gCost.setValue(edge.to, gNew);
                paths.setValue(edge.to, edge.from);
                frontier.enqueue(edge.to);
            }
            ;
        }
        ;
    }
    ;
    var bestPath = [];
    var cost = gCost.getValue(bestNode);
    while (bestNode != null) {
        bestPath.unshift(bestNode);
        bestNode = paths.getValue(bestNode);
    }
    var result = new SearchResult();
    result.path = bestPath;
    result.cost = cost;
    return result;
}
;
var GridNode = (function () {
    function GridNode(pos) {
        this.pos = pos;
    }
    GridNode.prototype.add = function (delta) {
        return new GridNode({
            x: this.pos.x + delta.x,
            y: this.pos.y + delta.y
        });
    };
    GridNode.prototype.compareTo = function (other) {
        return (this.pos.x - other.pos.x) || (this.pos.y - other.pos.y);
    };
    GridNode.prototype.toString = function () {
        return "(" + this.pos.x + "," + this.pos.y + ")";
    };
    return GridNode;
}());
var GridGraph = (function () {
    function GridGraph(size, obstacles) {
        this.size = size;
        this.walls = new collections.Set();
        for (var _i = 0, obstacles_1 = obstacles; _i < obstacles_1.length; _i++) {
            var pos = obstacles_1[_i];
            this.walls.add(new GridNode(pos));
        }
        for (var x = -1; x <= size.x; x++) {
            this.walls.add(new GridNode({ x: x, y: -1 }));
            this.walls.add(new GridNode({ x: x, y: size.y }));
        }
        for (var y = -1; y <= size.y; y++) {
            this.walls.add(new GridNode({ x: -1, y: y }));
            this.walls.add(new GridNode({ x: size.x, y: y }));
        }
    }
    GridGraph.prototype.outgoingEdges = function (node) {
        var outgoing = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (!(dx == 0 && dy == 0)) {
                    var next = node.add({ x: dx, y: dy });
                    if (!this.walls.contains(next)) {
                        outgoing.push({
                            from: node,
                            to: next,
                            cost: Math.sqrt(dx * dx + dy * dy)
                        });
                    }
                }
            }
        }
        return outgoing;
    };
    GridGraph.prototype.compareNodes = function (a, b) {
        return a.compareTo(b);
    };
    GridGraph.prototype.toString = function () {
        var borderRow = "+" + new Array(this.size.x + 1).join("--+");
        var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
        var str = "\n" + borderRow + "\n";
        for (var y = this.size.y - 1; y >= 0; y--) {
            str += "|";
            for (var x = 0; x < this.size.x; x++) {
                str += this.walls.contains(new GridNode({ x: x, y: y })) ? "## " : "   ";
            }
            str += "|\n";
            if (y > 0)
                str += betweenRow + "\n";
        }
        str += borderRow + "\n";
        return str;
    };
    return GridGraph;
}());
