var heuristicFunctions = new collections.Dictionary<string, Function>();
heuristicFunctions.setValue('inside', heuristicOnTopOf);
heuristicFunctions.setValue('above', heuristicAbove);
heuristicFunctions.setValue('under', heuristicUnder);
heuristicFunctions.setValue('leftof', heuristicLeftOf);
heuristicFunctions.setValue('rightof', heuristicRightOf);
heuristicFunctions.setValue('beside', heuristicBeside);
heuristicFunctions.setValue('ontop', heuristicOnTopOf);

/*Wrapper function for handling heuristic calculation, responsible for
sending the evaluation to the correct heuristic*/
function evalHeuristic(interpretation: Interpreter.DNFFormula, state : WorldState) : number {
    var totLength = Number.MAX_VALUE;
    for (let i = 0; i < interpretation.length; i++) {
        var length = 0;
        for (let j = 0; j < interpretation[i].length; j++) {
            let object1 = interpretation[i][j].args[0];
            let object2 = interpretation[i][j].args[1];
            let relation = interpretation[i][j].relation;
            length += heuristicFunctions.getValue(relation)(state, object1, object2);
        }
        //Overwrite if the new length is shorter
        totLength = length < totLength ? length : totLength;
    }
    //Handle the calling here
    return totLength;
}

//Heuristic if object1 should be onTopOf(inside) object2
function heuristicOnTopOf(state: WorldState, object1: string, object2: string){

}
//Heuristic if object1 should be above object2
function heuristicAbove(state: WorldState, object1: string, object2: string){

}
//Heuristic if object1 should be under object2
function heuristicUnder(state: WorldState, object1: string, object2: string){

}
//Heuristic if object1 should be to the left of object2
function heuristicLeftOf(state: WorldState, object1: string, object2: string){

}
//Heuristic if object1 should be to the right of object2
function heuristicRightOf(state: WorldState, object1: string, object2: string){

}
//Heuristic if object1 should be beside object2
function heuristicBeside(state: WorldState, object1: string, object2: string){

}
//Heuristic if the arm should hold object1
function heuristicHolding(state: WorldState, object1: string, object2: string){

}
//Horizontal distance from object1 to object2
function distance(state: WorldState, object1: string, object2: string){

}
