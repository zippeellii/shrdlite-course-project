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
        var plan = [];
        return plan;
    }
    function goalCheck(node) {
        return false;
    }
    function heuristic(node) {
        return 0;
    }
    function generateGraph(state) {
        return null;
    }
    function generateGraphHelper(state, visited) {
        return null;
    }
})(Planner || (Planner = {}));
