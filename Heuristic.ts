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
function distance(state: WorldState, object1: string, object2: string) : number {
    var indexFrom = -1;
    var indexTo = -1;
    for (let i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i].indexOf(object1) > -1) {
            indexFrom = i;
        }
        if (state.stacks[i].indexOf(object2) > -1) {
            indexTo = i;
        }
    }
    if (indexFrom > -1 && indexTo > -1) {
        var result = indexTo - indexFrom;
         if (result > 0) {
             return result * -1;
         }
         return result;
    }
    return -1;
}
