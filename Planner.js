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
        var startNode = new StateNode();
        var result = aStarSearch(graph, startNode, function (node) {
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
        }, function (node) {
            return 1;
        }, 99999);
        return generatePlanFromResult(result, graph);
    }
    function generatePlanFromResult(result, graph) {
        var plan = [];
        for (var i = 0; i < result.path.length - 1; i++) {
            var edges = graph.outgoingEdges(result.path[i]);
            for (var j = 0; j < edges.length; j++) {
                if (graph.compareNodes(result.path[i + 1], edges[j].to)) {
                    plan.push(edges[j].action);
                }
            }
        }
        return plan;
    }
    function interpretationAccepted(interpretation, node) {
        if (interpretation.relation) {
            var objects = [];
            var secondArg = [];
            var tmp = [];
            tmp.push(interpretation.args[1]);
            secondArg.push(tmp);
            if (interpretation.relation == "leftof") {
                objects = getObjectsLeftOf(secondArg, node.state);
            }
            else if (node.relation == "rightof") {
                objects = getObjectsRightOf(secondArg, node.state);
            }
            else if (node.relation == "inside") {
                objects = getObjectsInside(secondArg, node.state);
            }
            else if (node.relation == "ontop") {
                objects = getObjectsOntop(secondArg, node.state);
            }
            else if (node.realtion == "under") {
                objects = getObjectsUnder(secondArg, node.state);
            }
            else if (node.relation == "beside") {
                objects = getObjectsBeside(secondArg, node.state);
            }
            else if (node.relation == "above") {
                objects = getObjectsAbove(secondArg, node.state);
            }
            if (objects[0].contains(interpretation.args[0])) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return node.state.holding() == interpretation.args[0];
        }
    }
})(Planner || (Planner = {}));
