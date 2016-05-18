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
        var startNode = new StateNode(state);
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
        };
        var heuristic = function (node) {
            return null;
        };
        var result = aStarSearch(graph, startNode, isGoal, heuristic, 10);
        return generatePlanFromResult(result);
    }
    function generatePlanFromResult(result) {
        return [];
    }
    function interpretationAccepted(interpretation, node) {
        return false;
    }
})(Planner || (Planner = {}));
