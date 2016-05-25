///<reference path="World.ts"/>
///<reference path="Interpreter.ts"/>
///<reference path="Graph.ts"/>
///<reference path="StateGraph.ts"/>
///<reference path="RelationFunctions.ts"/>
///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>
///<reference path="Heuristic.ts"/>

/**
* Planner module
*
* The goal of the Planner module is to take the interpetation(s)
* produced by the Interpreter module and to plan a sequence of actions
* for the robot to put the world into a state compatible with the
* user's command, i.e. to achieve what the user wanted.
*
* The planner should use your A* search implementation to find a plan.
*/
module Planner {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
     * Top-level driver for the Planner. Calls `planInterpretation` for each given interpretation generated by the Interpreter.
     * @param interpretations List of possible interpretations.
     * @param currentState The current state of the world.
     * @returns Augments Interpreter.InterpretationResult with a plan represented by a list of strings.
     */
    export function plan(interpretations : Interpreter.InterpretationResult[], currentState : WorldState) : PlannerResult[] {
        var errors : Error[] = [];
        var plans : PlannerResult[] = [];
        interpretations.forEach((interpretation) => {
            try {
                var result : PlannerResult = <PlannerResult>interpretation;
                result.plan = planInterpretation(result.interpretation, currentState);
                if (result.plan.length == 0) {
                    result.plan.push("That is already true!");
                }
                plans.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (plans.length) {
            return plans;
        } else {
          console.log('Throwing error');
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface PlannerResult extends Interpreter.InterpretationResult {
        plan : string[];
    }

    export function stringify(result : PlannerResult) : string {
        return result.plan.join(", ");
    }

    //////////////////////////////////////////////////////////////////////
    // private functions

    /**
     * The core planner function. The code here is just a template;
     * you should rewrite this function entirely. In this template,
     * the code produces a dummy plan which is not connected to the
     * argument `interpretation`, but your version of the function
     * should be such that the resulting plan depends on
     * `interpretation`.
     *
     *
     * @param interpretation The logical interpretation of the user's desired goal. The plan needs to be such that by executing it, the world is put into a state that satisfies this goal.
     * @param state The current world state.
     * @returns Basically, a plan is a
     * stack of strings, which are either system utterances that
     * explain what the robot is doing (e.g. "Moving left") or actual
     * actions for the robot to perform, encoded as "l", "r", "p", or
     * "d". The code shows how to build a plan. Each step of the plan can
     * be added using the `push` method.
     */
    function planInterpretation(interpretation : Interpreter.DNFFormula, state : WorldState) : string[] {

        var graph = new StateGraph();
        var startNode = new StateNode(state);
        console.log('Start state: ' + startNode);
        var isGoal = function (node : StateNode) : boolean { // Goal-checking function
            for (let i = 0; i < interpretation.length; i++) {
                var fulfillsAll = true;
                for (let j = 0; j < interpretation[i].length; j++) {
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
          var heuristic = function (node : StateNode) : number { // Heuristics function
              return evalHeuristic(interpretation, node.state);
          };
        var result = aStarSearch<StateNode>(graph, startNode, isGoal, heuristic, 10000);
        return generatePlanFromResult(startNode, result, graph);
    }

    function generatePlanFromResult (startNode : StateNode, result : SearchResult<StateNode>, graph : StateGraph) : string[] {
        var plan : string[] = [];
        result.path.unshift(startNode);
        for (let i = 0; i < result.path.length; i++) {
            var edges = graph.outgoingEdges(result.path[i]);
            var pathNode = result.path[i+1];
            for (let j = 0; j < edges.length; j++) {
                if (graph.compareNodes(pathNode, edges[j].to)  == 0) {
                    plan.push(edges[j].action);
                }
            }
        }
        return plan;
    }

    function interpretationAccepted (interpretation : Interpreter.Literal, node : StateNode) : boolean {
        if (interpretation.args[1]) {
            var objects : string[][] = [];
            var secondArg : string[][] = [];
            var tmp : string[] = [];
            tmp.push(interpretation.args[1]);
            secondArg.push(tmp);
            if (interpretation.relation == "leftof") {
                objects = getObjectsLeftOf(secondArg, node.state);
            } else if (interpretation.relation == "rightof") {
                objects = getObjectsRightOf(secondArg, node.state);
            } else if (interpretation.relation == "inside") {
                objects = getObjectsInside(secondArg, node.state);
            } else if (interpretation.relation == "ontop") {
                objects = getObjectsOntop(secondArg, node.state);
            } else if (interpretation.relation == "under") {
                objects = getObjectsUnder(secondArg, node.state);
            } else if (interpretation.relation == "beside") {
                objects = getObjectsBeside(secondArg, node.state);
            } else if (interpretation.relation == "above") {
                objects = getObjectsAbove(secondArg, node.state);
            }
            if (objects[0] && objects[0].indexOf(interpretation.args[0]) > -1) {
                return true;
            } else {
                return false;
            }
        } else {
            return node.state.holding == interpretation.args[0];
        }
    }
}
