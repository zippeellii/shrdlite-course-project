var StateNode = (function () {
    function StateNode(state) {
        this.state = state;
    }
    StateNode.prototype.add = function (state) {
        return new StateNode(state);
    };
    StateNode.prototype.compareTo = function (other) {
        return 1;
    };
    StateNode.prototype.toString = function () {
        return "(" + ")";
    };
    return StateNode;
}());
var StateGraph = (function () {
    function StateGraph() {
    }
    StateGraph.prototype.outgoingEdges = function (node) {
        return [];
    };
    StateGraph.prototype.compareNodes = function (a, b) {
        return a.compareTo(b);
    };
    StateGraph.prototype.toString = function (start, goal, path) {
        return "";
    };
    return StateGraph;
}());
