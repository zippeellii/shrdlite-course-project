var Planner;
(function (Planner) {
    function plan(interpretations, currentState) {
        var errors = [];
        var plans = [];
        interpretations.forEach(function (interpretation) {
            try {
                var result = interpretation;
                result.plan = planInterpretation(result.interpretation, currentState);
                if (result.plan.length == 0) {
                    result.plan.push("That is already true!");
                }
                plans.push(result);
            }
            catch (err) {
                errors.push(err);
            }
        });
        if (plans.length) {
            return plans;
        }
        else {
            console.log('Throwing error');
            throw errors[0];
        }
    }
    Planner.plan = plan;
    function stringify(result) {
        return result.plan.join(", ");
    }
    Planner.stringify = stringify;
    function planInterpretation(interpretation, state) {
        var graph = new StateGraph();
        var startNode = new StateNode(state);
        console.log('Start state: ' + startNode);
        var isGoal = function (node) {
            for (var i = 0; i < interpretation.length; i++) {
                var fulfillsAll = true;
                for (var j = 0; j < interpretation[i].length; j++) {
                    if (!interpretationAccepted(interpretation[i][j], node)) {
                        fulfillsAll = false;
                    }
                }
                if (fulfillsAll) {
                    return true;
                }
            }
            return false;
        };
        var heuristic = function (node) {
            return 0;
        };
        var result = aStarSearch(graph, startNode, isGoal, heuristic, 1000);
        return generatePlanFromResult(startNode, result, graph);
    }
    function generatePlanFromResult(startNode, result, graph) {
        var plan = [];
        result.path.unshift(startNode);
        for (var i = 0; i < result.path.length; i++) {
            var edges = graph.outgoingEdges(result.path[i]);
            var pathNode = result.path[i + 1];
            for (var j = 0; j < edges.length; j++) {
                if (graph.compareNodes(pathNode, edges[j].to) == 0) {
                    plan.push(edges[j].action);
                }
            }
        }
        return plan;
    }
    function interpretationAccepted(interpretation, node) {
        if (interpretation.args[1]) {
            var objects = [];
            var secondArg = [];
            var tmp = [];
            tmp.push(interpretation.args[1]);
            secondArg.push(tmp);
            if (interpretation.relation == "leftof") {
                objects = getObjectsLeftOf(secondArg, node.state);
            }
            else if (interpretation.relation == "rightof") {
                objects = getObjectsRightOf(secondArg, node.state);
            }
            else if (interpretation.relation == "inside") {
                objects = getObjectsInside(secondArg, node.state);
            }
            else if (interpretation.relation == "ontop") {
                objects = getObjectsOntop(secondArg, node.state);
            }
            else if (interpretation.relation == "under") {
                objects = getObjectsUnder(secondArg, node.state);
            }
            else if (interpretation.relation == "beside") {
                objects = getObjectsBeside(secondArg, node.state);
            }
            else if (interpretation.relation == "above") {
                objects = getObjectsAbove(secondArg, node.state);
            }
            if (objects[0] && objects[0].indexOf(interpretation.args[0]) > -1) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return node.state.holding == interpretation.args[0];
        }
    }
})(Planner || (Planner = {}));
