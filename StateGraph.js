var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var StateEdge = (function (_super) {
    __extends(StateEdge, _super);
    function StateEdge() {
        _super.apply(this, arguments);
    }
    return StateEdge;
}(Edge));
var StateNode = (function () {
    function StateNode(state) {
        this.state = state;
    }
    StateNode.prototype.add = function (state) {
        return new StateNode(state);
    };
    StateNode.prototype.compareTo = function (other) {
        var isSame = true;
        for (var i = 0; i < other.state.stacks.length; i++) {
            for (var j = 0; j < other.state.stacks[i].length; j++) {
                if (!this.state.stacks[i][j] || this.state.stacks[i][j] != other.state.stacks[i][j]) {
                    isSame = false;
                }
            }
        }
        if (this.state.holding != other.state.holding) {
            isSame = false;
        }
        if (this.state.arm != other.state.arm) {
            isSame = false;
        }
        if (isSame) {
            return 0;
        }
        return 1;
    };
    StateNode.prototype.toString = function () {
        return JSON.stringify(this.state);
    };
    return StateNode;
}());
var StateGraph = (function () {
    function StateGraph() {
    }
    StateGraph.prototype.outgoingEdges = function (node) {
        var edges = [];
        var state = node.state;
        if (state.arm > 0) {
            var stateCpy = { stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined };
            for (var i = 0; i < state.stacks.length; i++) {
                stateCpy.stacks.push(state.stacks[i].slice());
            }
            stateCpy.holding = state.holding;
            stateCpy.arm = state.arm;
            stateCpy.objects = state.objects;
            stateCpy.examples = state.examples;
            var edge = new StateEdge();
            edge.from = node;
            stateCpy.arm--;
            edge.to = new StateNode(stateCpy);
            edge.cost = 1;
            edge.action = "l";
            edges.push(edge);
        }
        if (state.arm < state.stacks.length - 1) {
            var stateCpy = { stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined };
            for (var i = 0; i < state.stacks.length; i++) {
                stateCpy.stacks.push(state.stacks[i].slice());
            }
            stateCpy.holding = state.holding;
            stateCpy.arm = state.arm;
            stateCpy.objects = state.objects;
            stateCpy.examples = state.examples;
            var edge = new StateEdge();
            edge.from = node;
            stateCpy.arm++;
            edge.to = new StateNode(stateCpy);
            edge.cost = 1;
            edge.action = "r";
            edges.push(edge);
        }
        if (state.holding && checkOnTopOf(state.holding, state.stacks[state.arm][state.stacks[state.arm].length - 1] ?
            state.stacks[state.arm][state.stacks[state.arm].length - 1] : 'floor', state)) {
            var stateCpy = { stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined };
            for (var i = 0; i < state.stacks.length; i++) {
                stateCpy.stacks.push(state.stacks[i].slice());
            }
            stateCpy.holding = state.holding;
            stateCpy.arm = state.arm;
            stateCpy.objects = state.objects;
            stateCpy.examples = state.examples;
            var edge = new StateEdge();
            edge.from = node;
            stateCpy.stacks[stateCpy.arm].push(stateCpy.holding);
            stateCpy.holding = null;
            edge.to = new StateNode(stateCpy);
            edge.cost = 1;
            edge.action = "d";
            edges.push(edge);
        }
        if (!state.holding && state.stacks[state.arm].length != 0) {
            var stateCpy = { stacks: [], holding: undefined, arm: undefined, objects: undefined, examples: undefined };
            for (var i = 0; i < state.stacks.length; i++) {
                stateCpy.stacks.push(state.stacks[i].slice());
            }
            stateCpy.holding = state.holding;
            stateCpy.arm = state.arm;
            stateCpy.objects = state.objects;
            stateCpy.examples = state.examples;
            var edge = new StateEdge();
            edge.from = node;
            stateCpy.holding = stateCpy.stacks[stateCpy.arm][stateCpy.stacks[stateCpy.arm].length - 1];
            stateCpy.stacks[stateCpy.arm].splice(stateCpy.stacks[stateCpy.arm].length - 1, 1);
            edge.to = new StateNode(stateCpy);
            edge.cost = 1;
            edge.action = "p";
            edges.push(edge);
        }
        return edges;
    };
    StateGraph.prototype.compareNodes = function (a, b) {
        if (a == undefined || b == undefined) {
            return 1;
        }
        return a.compareTo(b);
    };
    StateGraph.prototype.toString = function (start, goal, path) {
        return "";
    };
    return StateGraph;
}());
